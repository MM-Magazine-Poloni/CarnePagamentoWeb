"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import QRCode from "react-qr-code"
import type { Installment, InstallmentStatus } from "../lib/types"
import { apiService } from "../services/frontend/apiService"
import PaymentResultScreen from "./PaymentResultScreen"
import { supabase } from "../lib/supabaseClient"

export default function PaymentScreen({
    installment,
    onBack,
    onGoHome,
    onStatusChange
}: {
    installment: Installment
    onBack: () => void
    onGoHome?: () => void
    onStatusChange: (newStatus: InstallmentStatus, installment: Installment) => void
}) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
        }
    }, [installment])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [brCode, setBrCode] = useState<string>("")
    const [chargeId, setChargeId] = useState<string>("")
    const [copied, setCopied] = useState(false)
    const [paid, setPaid] = useState(false)
    const [showResult, setShowResult] = useState(false)
    const [simulating, setSimulating] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const createdRef = useRef(false)

    const totalAmount = installment.amount + (installment.fine_amount || 0)

    const chargeBody = useMemo(() => ({
        installmentId: installment.id,
        amount: totalAmount,
        clicod: installment.clicod,
        pvenum: installment.pcrnot,
        index: installment.index
    }), [installment.id, totalAmount, installment.clicod, installment.pcrnot, installment.index])

    const dueFormatted = new Date(installment.due_date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric"
    })

    // --- Criar cobrança PIX ao montar o componente ---
    // O backend verifica se já existe cobrança pendente para esta parcela
    // e reutiliza caso exista, evitando duplicidade entre dispositivos.
    useEffect(() => {
        if (createdRef.current) return
        createdRef.current = true

        async function createPixCharge() {
            setLoading(true)
            setError(null)
            try {
                if (!chargeBody.clicod || !chargeBody.pvenum) {
                    setError("Dados inválidos para gerar cobrança.")
                    setLoading(false)
                    return
                }
                const data = await apiService.createCharge(chargeBody as {
                    installmentId: string
                    amount: number
                    clicod: number
                    pvenum: number
                    index: number
                })

                if (!data.brCode) {
                    setError("QR Code PIX não retornado pela API.")
                    setLoading(false)
                    return
                }

                const newChargeId = data.chargeId || ""
                setBrCode(data.brCode)
                setChargeId(newChargeId)
                setLoading(false)
                startPixPolling(newChargeId)
            } catch (err: any) {
                // Parcela já paga (409) — exibir tela de sucesso diretamente
                if (err.alreadyPaid) {
                    confirmPaymentUI()
                    setLoading(false)
                    return
                }
                setError(err.message || "Erro ao criar cobrança Pix.")
                setLoading(false)
            }
        }
        createPixCharge()
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [chargeBody])

    // --- Atualiza a UI quando o pagamento é confirmado ---
    // Chamado tanto pelo polling quanto pelo Supabase Realtime.
    // Limpa o polling e exibe a tela de sucesso.
    function confirmPaymentUI() {
        if (timerRef.current) clearInterval(timerRef.current)
        setPaid(true)
        setTimeout(() => setShowResult(true), 1500)
        onStatusChange("pago", installment)
    }

    // --- Chama mark-paid e depois atualiza a UI ---
    // Usado pelo polling como fallback caso o webhook não tenha disparado,
    // garantindo que PAGAMENTOS, NVENDA e FCRECEBER sejam atualizados.
    async function markAsPaid(providerChargeId: string) {
        try {
            const res = await fetch("/api/abacatepay/mark-paid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chargeId: providerChargeId,
                    pvenum: installment.pcrnot || null,
                    npeseq: installment.index || null,
                    clicod: installment.clicod || null,
                    amount: installment.amount || null
                })
            })
            const data = await res.json()
            if (!res.ok) {
                console.error("Erro mark-paid:", data.error)
            } else {
                console.log("mark-paid sucesso:", data)
            }
        } catch (err) {
            console.error("Erro ao chamar mark-paid:", err)
        }
        confirmPaymentUI()
    }

    // --- Polling PIX (fallback para quando o Realtime não alcançar) ---
    async function checkPixStatus(pixId: string): Promise<boolean> {
        try {
            const res = await fetch(`/api/abacatepay/check-status?id=${encodeURIComponent(pixId)}`)
            if (!res.ok) return false
            const data = await res.json()
            return data.status === "PAID"
        } catch {
            return false
        }
    }

    function startPixPolling(pixId: string) {
        if (!pixId) return
        timerRef.current = setInterval(async () => {
            const isPaid = await checkPixStatus(pixId)
            if (isPaid) {
                if (timerRef.current) clearInterval(timerRef.current)
                await markAsPaid(pixId)
            }
        }, 10000)
    }

    // --- Supabase Realtime: escuta PAGAMENTOS para esta parcela ──────────────
    // Quando o webhook confirmar o pagamento e atualizar PAGAMENTOS,
    // o evento chega aqui instantaneamente em todos os dispositivos conectados.
    // O polling acima é mantido como fallback.
    useEffect(() => {
        const clicod = installment.clicod
        const pvenum = installment.pcrnot
        const fcrpar = installment.index

        if (!clicod || !pvenum || !fcrpar) return

        const channel = supabase
            .channel(`pagamento-${pvenum}-${fcrpar}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "PAGAMENTOS",
                    // Filtra por CLICOD no servidor; PCRNOT e FCRPAR são
                    // verificados abaixo para garantir que é esta parcela.
                    filter: `CLICOD=eq.${clicod}`
                },
                (payload: any) => {
                    const row = payload.new
                    if (Number(row.PCRNOT) !== Number(pvenum)) return
                    if (Number(row.FCRPAR) !== Number(fcrpar)) return
                    if (row.STATUS !== "paid" && row.STATUS !== "processed") return

                    console.log("[Realtime] Pagamento confirmado:", row)
                    // Webhook já atualizou as tabelas — apenas atualizar a UI
                    confirmPaymentUI()
                }
            )
            .subscribe()

        // Cleanup: remover channel ao desmontar o componente
        return () => {
            supabase.removeChannel(channel)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [installment.clicod, installment.pcrnot, installment.index])

    // --- Simular pagamento (somente DEV) ---
    async function handleSimulate() {
        if (!chargeId || simulating) return
        setSimulating(true)
        try {
            const res = await fetch("/api/abacatepay/simulate-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chargeId })
            })
            if (!res.ok) {
                console.error("Falha ao simular:", await res.text())
                setSimulating(false)
                return
            }
            if (timerRef.current) clearInterval(timerRef.current)
            await markAsPaid(chargeId)
        } catch (err) {
            console.error("Erro ao simular:", err)
        } finally {
            setSimulating(false)
        }
    }

    async function handleCopy() {
        await navigator.clipboard.writeText(brCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
    }

    if (showResult) {
        return (
            <PaymentResultScreen
                success={paid}
                installment={installment}
                onClose={onBack}
                onGoHome={onGoHome}
                errorMsg={error || undefined}
            />
        )
    }

    return (
        <div ref={scrollContainerRef} className="payment-screen animate__animated animate__fadeIn">
            {/* Header */}
            <div className="payment-screen-header">
                <button className="detail-back-btn" onClick={onBack}>
                    <i className="bi bi-chevron-left"></i>
                </button>
                <h5 className="detail-title">Pagamento PIX</h5>
                <div style={{ width: 40 }}></div>
            </div>

            {/* Installment Summary Card */}
            <div className="payment-summary-card">
                <div className="payment-summary-inner">
                    <div>
                        <div className="payment-summary-label">
                            PARCELA {String(installment.index).padStart(2, "0")}/{String(installment.count).padStart(2, "0")}
                        </div>
                        <div className="payment-summary-value">
                            <span className="payment-summary-currency">R$</span>
                            {" "}
                            {Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 }).format(totalAmount)}
                        </div>
                        <div className="payment-summary-due">
                            <i className="bi bi-calendar3 me-1"></i>
                            Vencimento: {dueFormatted}
                        </div>
                        {installment.product_name && (
                            <div className="payment-summary-product mt-1" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                                <i className="bi bi-box-seam me-1"></i>
                                {installment.product_name}
                            </div>
                        )}
                    </div>
                    <div className="payment-summary-icon">
                        <i className="bi bi-receipt-cutoff"></i>
                    </div>
                </div>
            </div>

            {/* PIX Content */}
            <div className="payment-tab-content">
                {paid ? (
                    <div className="payment-success-box">
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "3rem" }}></i>
                        <h5 className="fw-bold mt-3 text-success">Pagamento Confirmado!</h5>
                        <p className="text-muted small">Seu pagamento foi processado com sucesso.</p>
                    </div>
                ) : loading ? (
                    <div className="payment-loading-box">
                        <div className="spinner-border text-danger" role="status">
                            <span className="visually-hidden">Gerando...</span>
                        </div>
                        <p className="text-muted small mt-3">Gerando QR Code PIX...</p>
                    </div>
                ) : error ? (
                    <div className="payment-error-box">
                        <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: "2rem" }}></i>
                        <p className="text-muted small mt-2">{error}</p>
                    </div>
                ) : (
                    <>
                        <p className="payment-instruction-text">
                            Escaneie o QR Code ou copie a chave PIX abaixo para pagar instantaneamente.
                        </p>

                        <div className="payment-qr-container">
                            <div className="payment-qr-badge">PIX</div>
                            <div className="payment-qr-box">
                                <QRCode value={brCode || " "} size={180} />
                            </div>
                            <div className="payment-qr-watermark">PIX • MM Pay</div>
                        </div>

                        <div className="payment-copy-section">
                            <div className="payment-copy-label">PIX COPIA E COLA</div>
                            <div className="payment-copy-field">
                                <span className="payment-copy-text">{brCode.slice(0, 32)}...</span>
                                <button className="payment-copy-icon" onClick={handleCopy}>
                                    <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                                </button>
                            </div>
                        </div>

                        <button className="payment-copy-btn" onClick={handleCopy}>
                            <i className={`bi ${copied ? 'bi-check-circle-fill' : 'bi-clipboard-check'} me-2`}></i>
                            {copied ? "Código Copiado!" : "Copiar Código PIX"}
                        </button>

                        <div className="text-center mt-2">
                            <div className="d-flex align-items-center justify-content-center gap-2">
                                <div className="spinner-grow spinner-grow-sm text-success" role="status">
                                    <span className="visually-hidden">Aguardando...</span>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>
                                    Aguardando confirmação do pagamento...
                                </span>
                            </div>
                        </div>

                        {chargeId && (
                            <button
                                className="payment-simulate-btn"
                                onClick={handleSimulate}
                                disabled={simulating}
                            >
                                <i className={`bi ${simulating ? 'bi-hourglass-split' : 'bi-lightning-charge-fill'} me-2`}></i>
                                {simulating ? 'Simulando...' : 'Simular Pagamento (DEV)'}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Secure Footer */}
            <div className="payment-secure-footer">
                <i className="bi bi-shield-lock-fill me-1 text-success"></i>
                TRANSAÇÃO SEGURA CRIPTOGRAFADA POR MM PAY
            </div>
        </div>
    )
}
