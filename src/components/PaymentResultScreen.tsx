"use client"
import { useEffect, useRef } from "react"
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

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
        }
    }, [])

    const totalAmount = installment.amount + (installment.fine_amount || 0)
    const formattedAmount = Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAmount)

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Comprovante de Pagamento - MM Magazine',
                    text: `Pagamento da parcela ${installment.index}/${installment.count} do contrato ${installment.pcrnot} no valor de ${formattedAmount} realizado com sucesso!`,
                    url: window.location.href
                })
            } catch (err) {
                console.error('Erro ao compartilhar:', err)
            }
        } else {
            alert("Compartilhamento não suportado neste navegador.")
        }
    }

    const handleDownload = () => {
        // Simulação de download de comprovante
        alert("Baixando comprovante... (Funcionalidade de PDF em desenvolvimento)")
    }

    return (
        <div ref={scrollContainerRef} className="payment-result-screen animate__animated animate__fadeIn">
            <div className="result-container">
                {success ? (
                    <div className="result-success-content text-center">
                        <div className="result-icon-wrapper success animate__animated animate__zoomIn animate__delay-1s">
                            <i className="bi bi-check-circle-fill"></i>
                        </div>
                        <h2 className="result-title animate__animated animate__fadeInUp animate__delay-1s">Pagamento Confirmado!</h2>
                        <p className="result-subtitle animate__animated animate__fadeInUp animate__delay-1s">
                            Sua parcela foi paga com sucesso.
                        </p>

                        <div className="result-card animate__animated animate__fadeInUp animate__delay-2s">
                            <div className="result-card-row">
                                <span className="result-card-label">Valor Pago</span>
                                <span className="result-card-value success">{formattedAmount}</span>
                            </div>
                            <div className="result-card-row">
                                <span className="result-card-label">Contrato</span>
                                <span className="result-card-value">{installment.pcrnot}</span>
                            </div>
                            <div className="result-card-row">
                                <span className="result-card-label">Parcela</span>
                                <span className="result-card-value">{installment.index}/{installment.count}</span>
                            </div>
                            <div className="result-card-row">
                                <span className="result-card-label">Data</span>
                                <span className="result-card-value">{new Date().toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>

                        <div className="result-actions animate__animated animate__fadeInUp animate__delay-2s">
                            <button className="result-btn-download" onClick={handleDownload}>
                                <i className="bi bi-file-earmark-pdf me-2"></i>
                                Baixar Comprovante
                            </button>
                            <button className="result-btn-share" onClick={handleShare}>
                                <i className="bi bi-share me-2"></i>
                                Compartilhar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="result-error-content text-center">
                        <div className="result-icon-wrapper error animate__animated animate__shakeX">
                            <i className="bi bi-x-circle-fill"></i>
                        </div>
                        <h2 className="result-title">Ops! Algo deu errado</h2>
                        <p className="result-subtitle">
                            Não conseguimos processar seu pagamento no momento.
                        </p>
                        {errorMsg && (
                            <div className="result-error-box">
                                {errorMsg}
                            </div>
                        )}
                        <p className="text-muted small mt-3">
                            Tente novamente ou entre em contato com nosso suporte se o problema persistir.
                        </p>
                    </div>
                )}

                <div className="result-footer-actions animate__animated animate__fadeInUp animate__delay-3s">
                    <button className="result-btn-home" onClick={onGoHome || onClose}>
                        VOLTAR AO INÍCIO
                    </button>
                </div>
            </div>

            <style jsx>{`
                .payment-result-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: #F7FAFC;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    overflow-y: auto;
                }
                .result-container {
                    max-width: 500px;
                    margin: auto;
                    width: 100%;
                }
                .result-icon-wrapper {
                    font-size: 80px;
                    margin-bottom: 20px;
                }
                .result-icon-wrapper.success {
                    color: #10B981;
                }
                .result-icon-wrapper.error {
                    color: #EF4444;
                }
                .result-title {
                    font-weight: 800;
                    color: #1A202C;
                    margin-bottom: 8px;
                }
                .result-subtitle {
                    color: #718096;
                    margin-bottom: 30px;
                }
                .result-card {
                    background: white;
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    margin-bottom: 30px;
                    text-align: left;
                }
                .result-card-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #EDF2F7;
                }
                .result-card-row:last-child {
                    border-bottom: none;
                }
                .result-card-label {
                    color: #A0AEC0;
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                .result-card-value {
                    color: #2D3748;
                    font-weight: 700;
                }
                .result-card-value.success {
                    color: #10B981;
                    font-size: 1.2rem;
                }
                .result-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 40px;
                }
                .result-btn-download, .result-btn-share {
                    padding: 14px;
                    border-radius: 12px;
                    font-weight: 700;
                    border: none;
                    transition: all 0.2s;
                }
                .result-btn-download {
                    background: #2D3748;
                    color: white;
                }
                .result-btn-share {
                    background: #EDF2F7;
                    color: #4A5568;
                }
                .result-btn-home {
                    width: 100%;
                    padding: 16px;
                    border-radius: 12px;
                    background: #E31A2D;
                    color: white;
                    font-weight: 800;
                    border: none;
                    letter-spacing: 1px;
                    box-shadow: 0 4px 12px rgba(227, 26, 45, 0.2);
                }
                .result-error-box {
                    background: #FFF5F5;
                    color: #C53030;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    margin-top: 10px;
                }
            `}</style>
        </div>
    )
}
