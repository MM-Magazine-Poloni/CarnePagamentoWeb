"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import QRCode from "react-qr-code"
import type { Installment, InstallmentStatus } from "../lib/types"
import { apiService } from "../services/frontend/apiService"
import PaymentResultScreen from "./PaymentResultScreen"

type PaymentTab = "pix" | "boleto"

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

    const [activeTab, setActiveTab] = useState<PaymentTab>("pix")

    // --- PIX state ---
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

    // --- Boleto state ---
    const [boletoLoading, setBoletoLoading] = useState(false)
    const [boletoError, setBoletoError] = useState<string | null>(null)
    const [digitableLine, setDigitableLine] = useState<string>("")
    const [boletoUrl, setBoletoUrl] = useState<string>("")
    const [boletoCopied, setBoletoCopied] = useState(false)
    const [boletoPaid, setBoletoPaid] = useState(false)
    const boletoCreatedRef = useRef(false)
    const boletoTimerRef = useRef<NodeJS.Timeout | null>(null)

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

    // --- PIX: create charge on mount ---
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
                setError(err.message || "Erro ao criar cobrança Pix.")
                setLoading(false)
            }
        }
        createPixCharge()
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [chargeBody])

    // --- Boleto: create charge when tab is first activated ---
    useEffect(() => {
        if (activeTab !== "boleto") return
        if (boletoCreatedRef.current) return
        boletoCreatedRef.current = true

        async function createBoletoCharge() {
            setBoletoLoading(true)
            setBoletoError(null)
            try {
                if (!chargeBody.clicod || !chargeBody.pvenum) {
                    setBoletoError("Dados inválidos para gerar boleto.")
                    setBoletoLoading(false)
                    return
                }
                const data = await apiService.createBoleto(chargeBody as {
                    installmentId: string
                    amount: number
                    clicod: number
                    pvenum: number
                    index: number
                })

                if (!data.boletoId) {
                    setBoletoError("Boleto não retornado pela API.")
                    setBoletoLoading(false)
                    return
                }

                setDigitableLine(data.digitableLine || "")
                setBoletoUrl(data.url || "")
                setBoletoLoading(false)
                startBoletoPolling(data.boletoId)
            } catch (err: any) {
                setBoletoError(err.message || "Erro ao criar boleto.")
                setBoletoLoading(false)
            }
        }
        createBoletoCharge()
        return () => {
            if (boletoTimerRef.current) clearInterval(boletoTimerRef.current)
        }
    }, [activeTab, chargeBody])

    // --- Shared mark-as-paid ---
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

        setPaid(true)
        setBoletoPaid(true)
        setTimeout(() => setShowResult(true), 1500)
        onStatusChange("pago", installment)
    }

    // --- PIX polling ---
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

    // --- Boleto polling ---
    async function checkBoletoStatus(id: string): Promise<boolean> {
        try {
            const res = await fetch(`/api/abacatepay/check-status?id=${encodeURIComponent(id)}&type=boleto`)
            if (!res.ok) return false
            const data = await res.json()
            return data.status === "PAID"
        } catch {
            return false
        }
    }

    function startBoletoPolling(id: string) {
        if (!id) return
        boletoTimerRef.current = setInterval(async () => {
            const isPaid = await checkBoletoStatus(id)
            if (isPaid) {
                if (boletoTimerRef.current) clearInterval(boletoTimerRef.current)
                await markAsPaid(id)
            }
        }, 15000) // 15s — boleto não é instantâneo
    }

    // --- PIX simulate (dev) ---
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

    // --- PIX copy ---
    async function handleCopy() {
        await copyToClipboard(brCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
    }

    // --- Boleto copy ---
    async function handleBoletoCopy() {
        await copyToClipboard(digitableLine)
        setBoletoCopied(true)
        setTimeout(() => setBoletoCopied(false), 3000)
    }

    async function copyToClipboard(text: string) {
        await navigator.clipboard.writeText(text)
    }

    if (showResult) {
        return (
            <PaymentResultScreen
                success={paid || boletoPaid}
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
                <h5 className="detail-title">Pagamento</h5>
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

            {/* Method Tabs */}
            <div className="payment-method-tabs">
                <button
                    className={`payment-tab ${activeTab === "pix" ? "active" : ""}`}
                    onClick={() => setActiveTab("pix")}
                >
                    <i className="bi bi-qr-code-scan me-2"></i>
                    PIX
                </button>
                <button
                    className={`payment-tab ${activeTab === "boleto" ? "active" : ""}`}
                    onClick={() => setActiveTab("boleto")}
                >
                    <i className="bi bi-upc-scan me-2"></i>
                    Boleto
                </button>
            </div>

            {/* Tab Content */}
            <div className="payment-tab-content">

                {/* PIX Tab */}
                {activeTab === "pix" && (
                    <div className="animate__animated animate__fadeIn">
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
                )}

                {/* Boleto Tab */}
                {activeTab === "boleto" && (
                    <div className="animate__animated animate__fadeIn">
                        {boletoPaid ? (
                            <div className="payment-success-box">
                                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "3rem" }}></i>
                                <h5 className="fw-bold mt-3 text-success">Pagamento Confirmado!</h5>
                                <p className="text-muted small">Boleto pago com sucesso.</p>
                            </div>
                        ) : boletoLoading ? (
                            <div className="payment-loading-box">
                                <div className="spinner-border text-danger" role="status">
                                    <span className="visually-hidden">Gerando...</span>
                                </div>
                                <p className="text-muted small mt-3">Gerando boleto...</p>
                            </div>
                        ) : boletoError ? (
                            <div className="payment-error-box">
                                <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: "2rem" }}></i>
                                <p className="text-muted small mt-2">{boletoError}</p>
                            </div>
                        ) : (
                            <>
                                <p className="payment-instruction-text">
                                    Copie o código de barras ou abra o boleto para pagar no banco ou app.
                                </p>

                                {/* Barcode visual */}
                                <div className="payment-qr-container">
                                    <div className="payment-qr-badge" style={{ background: '#2D3748' }}>BOLETO</div>
                                    <div className="payment-qr-box" style={{ padding: '1.5rem 1rem' }}>
                                        <i className="bi bi-upc" style={{ fontSize: '4rem', color: '#2D3748', letterSpacing: '-0.1em' }}></i>
                                        <div style={{ fontSize: '0.65rem', color: '#718096', marginTop: '0.5rem', wordBreak: 'break-all', textAlign: 'center', maxWidth: 220 }}>
                                            {digitableLine ? digitableLine.slice(0, 48) + "..." : "—"}
                                        </div>
                                    </div>
                                    <div className="payment-qr-watermark">BOLETO • MM Pay</div>
                                </div>

                                {/* Linha digitável */}
                                {digitableLine && (
                                    <div className="payment-copy-section">
                                        <div className="payment-copy-label">LINHA DIGITÁVEL</div>
                                        <div className="payment-copy-field">
                                            <span className="payment-copy-text">{digitableLine.slice(0, 32)}...</span>
                                            <button className="payment-copy-icon" onClick={handleBoletoCopy}>
                                                <i className={`bi ${boletoCopied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {digitableLine && (
                                    <button className="payment-copy-btn" onClick={handleBoletoCopy}>
                                        <i className={`bi ${boletoCopied ? 'bi-check-circle-fill' : 'bi-clipboard-check'} me-2`}></i>
                                        {boletoCopied ? "Código Copiado!" : "Copiar Linha Digitável"}
                                    </button>
                                )}

                                {boletoUrl && (
                                    <a
                                        href={boletoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="payment-copy-btn"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', marginTop: '0.5rem', background: '#2D3748', color: '#fff' }}
                                    >
                                        <i className="bi bi-box-arrow-up-right me-2"></i>
                                        Abrir Boleto (PDF)
                                    </a>
                                )}

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

                                <div className="text-center mt-2" style={{ fontSize: '0.7rem', color: '#A0AEC0' }}>
                                    <i className="bi bi-info-circle me-1"></i>
                                    Boletos podem levar até 3 dias úteis para compensar.
                                </div>
                            </>
                        )}
                    </div>
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
