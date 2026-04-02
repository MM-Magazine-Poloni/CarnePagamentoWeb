"use client"
import { useState, useEffect, useRef } from "react"
import type { Installment } from "../lib/types"

interface PaymentResultScreenProps {
    success: boolean
    installment: Installment
    onClose: () => void
    onGoHome?: () => void
    errorMsg?: string
}

export default function PaymentResultScreen({
    success,
    installment,
    onClose,
    onGoHome,
    errorMsg
}: PaymentResultScreenProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const receiptRef = useRef<HTMLDivElement>(null)
    const [copied, setCopied] = useState(false)
    const [sharing, setSharing] = useState(false)

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
        }
    }, [])

    const totalAmount = installment.amount + (installment.fine_amount || 0)
    const formattedAmount = Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAmount)
    const todayFormatted = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "")
    const txId = `TRX-${installment.pcrnot}-${String(installment.index).padStart(2, "0")}-MM`
    // Método vindo da parcela já atualizada (após pagamento), ou PIX como padrão
    const payMethod = installment.payment_method || "PIX"
    const isPixMethod = payMethod.toUpperCase() === "PIX"

    const handleCopyTx = () => {
        navigator.clipboard.writeText(txId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    // Captura o card do comprovante como PNG usando html2canvas,
    // depois compartilha como arquivo via Web Share API.
    // Fallback: faz download direto se o navegador não suportar share com files.
    const handleShare = async () => {
        if (!receiptRef.current || sharing) return
        setSharing(true)
        try {
            const html2canvas = (await import("html2canvas")).default

            const el = receiptRef.current

            // Forçar o elemento a revelar altura total antes da captura
            const prevOverflow = el.style.overflow
            const prevPaddingBottom = el.style.paddingBottom
            el.style.overflow = "visible"
            el.style.paddingBottom = "1.75rem"

            // Aguardar um frame para o browser recalcular o layout
            await new Promise(r => requestAnimationFrame(r))

            const fullHeight = el.scrollHeight

            const canvas = await html2canvas(el, {
                backgroundColor: "#111114",
                scale: 2,           // resolução 2x para ficar nítido no mobile
                useCORS: true,
                logging: false,
                width: el.offsetWidth,
                height: fullHeight,
                windowWidth: el.offsetWidth,
                windowHeight: fullHeight,
                scrollX: 0,
                scrollY: 0
            })

            // Restaurar estilos originais
            el.style.overflow = prevOverflow
            el.style.paddingBottom = prevPaddingBottom

            // Converter canvas para Blob PNG
            const blob = await new Promise<Blob | null>(resolve =>
                canvas.toBlob(resolve, "image/png")
            )
            if (!blob) throw new Error("Falha ao gerar imagem")

            const file = new File([blob], "comprovante-mm.png", { type: "image/png" })

            // Tentar compartilhar como arquivo (suportado em mobile)
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "Comprovante de Pagamento - MM Magazine"
                })
            } else {
                // Fallback para desktop: baixar a imagem
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "comprovante-mm.png"
                a.click()
                URL.revokeObjectURL(url)
            }
        } catch (err: any) {
            // Ignorar cancelamento pelo usuário
            if (err?.name !== "AbortError") {
                console.error("Erro ao compartilhar:", err)
            }
        } finally {
            setSharing(false)
        }
    }

    return (
        <>
            <style>{`
                @keyframes prs-slideUp {
                    from { transform: translateY(32px); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
                @keyframes prs-pop {
                    0%   { transform: scale(0.5); opacity: 0; }
                    70%  { transform: scale(1.12); }
                    100% { transform: scale(1);    opacity: 1; }
                }
                @keyframes prs-ring {
                    0%   { box-shadow: 0 0 0 0   rgba(34,197,94,0.45); }
                    100% { box-shadow: 0 0 0 20px rgba(34,197,94,0);    }
                }
                @keyframes prs-fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                .prs-screen {
                    position: fixed;
                    inset: 0;
                    background: var(--bg-app, #0A0A0C);
                    z-index: 300;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    animation: prs-fadeIn 0.25s ease;
                }

                .prs-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem 1.25rem;
                    position: sticky;
                    top: 0;
                    background: var(--bg-app, #0A0A0C);
                    z-index: 10;
                }
                .prs-back-btn {
                    width: 38px; height: 38px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.04);
                    color: rgba(255,255,255,0.7);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .prs-back-btn:hover { background: rgba(255,255,255,0.08); }

                .prs-body {
                    padding: 0.5rem 1.25rem 2.5rem;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    max-width: 480px;
                    margin: 0 auto;
                    width: 100%;
                }

                .prs-icon-wrap {
                    margin-bottom: 1.5rem;
                    animation: prs-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both;
                }
                .prs-check-circle {
                    width: 80px; height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 28px rgba(34,197,94,0.35);
                    animation: prs-ring 1s ease-out 0.6s both;
                }
                .prs-check-circle i { font-size: 2.6rem; color: white; }

                .prs-error-circle {
                    width: 80px; height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ef4444, #b91c1c);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 28px rgba(239,68,68,0.35);
                }
                .prs-error-circle i { font-size: 2.6rem; color: white; }

                .prs-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 1.4rem;
                    font-weight: 800;
                    color: #fff;
                    text-align: center;
                    margin-bottom: 0.3rem;
                    animation: prs-slideUp 0.4s ease 0.3s both;
                }
                .prs-subtitle {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.4);
                    text-align: center;
                    margin-bottom: 1.75rem;
                    animation: prs-slideUp 0.4s ease 0.38s both;
                }

                .prs-card-wrap {
                    width: 100%;
                    animation: prs-slideUp 0.4s ease 0.48s both;
                }

                .prs-status-badge {
                    position: absolute;
                    top: -11px; left: 50%; transform: translateX(-50%);
                    background: #22c55e;
                    color: white;
                    font-size: 0.6rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    padding: 3px 12px;
                    border-radius: 20px;
                    text-transform: uppercase;
                    white-space: nowrap;
                }

                .prs-actions {
                    width: 100%;
                    animation: prs-slideUp 0.4s ease 0.58s both;
                }
                .prs-btn-home {
                    width: 100%;
                    padding: 1rem;
                    border-radius: 14px;
                    border: none;
                    background: #E31A2D;
                    color: white;
                    font-size: 0.9rem;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    box-shadow: 0 4px 16px rgba(227,26,45,0.3);
                    transition: transform 0.15s;
                    margin-bottom: 0.75rem;
                }
                .prs-btn-home:active { transform: scale(0.98); }

                .prs-error-msg {
                    background: rgba(239,68,68,0.08);
                    border: 1px solid rgba(239,68,68,0.2);
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 0.82rem;
                    color: #fca5a5;
                    margin-bottom: 1.5rem;
                    width: 100%;
                    text-align: center;
                }
            `}</style>

            <div ref={scrollContainerRef} className="prs-screen">
                <div className="prs-header">
                    <button className="prs-back-btn" onClick={onClose}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <div style={{ width: 38 }}></div>
                </div>

                <div className="prs-body">
                    {success ? (
                        <>
                            <div className="prs-icon-wrap">
                                <div className="prs-check-circle">
                                    <i className="bi bi-check-lg"></i>
                                </div>
                            </div>

                            <div className="prs-title">Pagamento Confirmado!</div>
                            <div className="prs-subtitle">Seu carnê está em dia.</div>

                            {/* Card capturado pelo html2canvas — ref necessário */}
                            <div className="prs-card-wrap">
                                <div ref={receiptRef} className="hist-receipt-card">
                                    <div className="prs-status-badge">
                                        <i className="bi bi-check-circle-fill me-1"></i>
                                        PAGO
                                    </div>

                                    <div className="hist-receipt-amount-section">
                                        <div className="hist-receipt-amount-label">Valor Pago</div>
                                        <div className="hist-receipt-amount-value">{formattedAmount}</div>
                                    </div>

                                    <div className="hist-receipt-divider"></div>

                                    <div className="hist-receipt-row">
                                        <span className="hist-receipt-row-label">Data do Pagamento</span>
                                        <span className="hist-receipt-row-value">{todayFormatted}</span>
                                    </div>

                                    <div className="hist-receipt-divider"></div>

                                    <div className="hist-receipt-row">
                                        <span className="hist-receipt-row-label">Forma de Pagamento</span>
                                        <span className="hist-receipt-row-value hist-receipt-method">
                                            {isPixMethod ? (
                                                <><span className="hist-pix-badge">$</span> PIX</>
                                            ) : (
                                                <><i className="bi bi-upc-scan me-1"></i> {payMethod}</>
                                            )}
                                        </span>
                                    </div>

                                    <div className="hist-receipt-divider"></div>

                                    <div className="hist-receipt-row">
                                        <span className="hist-receipt-row-label">Parcela</span>
                                        <span className="hist-receipt-row-value">
                                            {String(installment.index).padStart(2, "0")}ª de {installment.count}
                                        </span>
                                    </div>

                                    {installment.product_name && (
                                        <>
                                            <div className="hist-receipt-divider"></div>
                                            <div className="hist-receipt-row">
                                                <span className="hist-receipt-row-label">Produto</span>
                                                <span className="hist-receipt-row-value" style={{ maxWidth: "55%", textAlign: "right" }}>
                                                    {installment.product_name}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div className="hist-receipt-divider"></div>

                                    <div className="hist-receipt-id-section">
                                        <div className="hist-receipt-id-label">ID da Transação</div>
                                        <div className="hist-receipt-id-row">
                                            <span className="hist-receipt-id-value">{txId}</span>
                                            <button className="hist-receipt-copy-btn" onClick={handleCopyTx}>
                                                <i className={`bi ${copied ? "bi-check-lg" : "bi-clipboard"}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="prs-actions">
                                {/* Botão compartilhar — gera PNG do card e abre o share sheet */}
                                <button
                                    className="hist-share-btn"
                                    onClick={handleShare}
                                    disabled={sharing}
                                    style={{ opacity: sharing ? 0.7 : 1 }}
                                >
                                    {sharing ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                                style={{ width: 15, height: 15, borderWidth: 2 }}
                                            ></span>
                                            Gerando imagem...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-share me-2"></i>
                                            Compartilhar Comprovante
                                        </>
                                    )}
                                </button>

                                <button className="prs-btn-home" onClick={onGoHome || onClose}>
                                    <i className="bi bi-house-fill me-2"></i>
                                    Voltar ao Início
                                </button>
                            </div>

                            <p className="hist-legal-text">
                                Este é um documento digital válido como comprovante de pagamento junto à rede de lojas MM.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="prs-icon-wrap">
                                <div className="prs-error-circle">
                                    <i className="bi bi-x-lg"></i>
                                </div>
                            </div>

                            <div className="prs-title">Ops! Algo deu errado</div>
                            <div className="prs-subtitle">
                                Não conseguimos processar seu pagamento no momento.
                            </div>

                            {errorMsg && (
                                <div className="prs-error-msg">{errorMsg}</div>
                            )}

                            <div className="prs-actions">
                                <button className="prs-btn-home" onClick={onClose}>
                                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                                    Tentar Novamente
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
