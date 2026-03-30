import React, { useEffect, useRef } from "react"
import type { Installment } from "../../lib/types"

interface HistoryDetailScreenProps {
    selectedInstallment: Installment
    closeScreens: () => void
}

export const HistoryDetailScreen: React.FC<HistoryDetailScreenProps> = ({ selectedInstallment, closeScreens }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
        }
    }, [selectedInstallment])

    return (
        <div ref={scrollContainerRef} className="hist-detail-screen">
            <div className="hist-detail-header">
                <button className="back-btn shadow-sm" onClick={closeScreens}>
                    <i className="bi bi-chevron-left"></i>
                </button>
                <div style={{ width: '40px' }}></div>
            </div>

            <div className="hist-detail-body">
                {/* Green Check */}
                <div className="hist-check-wrapper">
                    <div className="hist-check-circle">
                        <i className="bi bi-check-lg"></i>
                    </div>
                </div>

                <h4 className="hist-title">Pagamento Realizado!</h4>
                <p className="hist-subtitle">Seu carnê está em dia.</p>

                {/* Receipt Card */}
                <div className="hist-receipt-card">
                    <div className="hist-receipt-amount-section">
                        <div className="hist-receipt-amount-label">VALOR PAGO</div>
                        <div className="hist-receipt-amount-value">
                            {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedInstallment.amount)}
                        </div>
                    </div>

                    <div className="hist-receipt-divider"></div>

                    <div className="hist-receipt-row">
                        <span className="hist-receipt-row-label">Data do Pagamento</span>
                        <span className="hist-receipt-row-value">
                            {selectedInstallment.payment_date
                                ? new Date(selectedInstallment.payment_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')
                                : 'N/A'}
                        </span>
                    </div>

                    <div className="hist-receipt-divider"></div>

                    <div className="hist-receipt-row">
                        <span className="hist-receipt-row-label">Forma de Pagamento</span>
                        <span className="hist-receipt-row-value hist-receipt-method">
                            {(selectedInstallment.payment_method || 'PIX') === 'PIX' ? (
                                <><span className="hist-pix-badge">$</span> PIX</>
                            ) : (
                                <><i className="bi bi-upc-scan me-1"></i> {selectedInstallment.payment_method}</>
                            )}
                        </span>
                    </div>

                    <div className="hist-receipt-divider"></div>

                    <div className="hist-receipt-row">
                        <span className="hist-receipt-row-label">Parcela</span>
                        <span className="hist-receipt-row-value">
                            Refere-se à {String(selectedInstallment.index).padStart(2, '0')}ª Parcela
                        </span>
                    </div>

                    <div className="hist-receipt-divider"></div>

                    <div className="hist-receipt-id-section">
                        <div className="hist-receipt-id-label">ID DA TRANSAÇÃO</div>
                        <div className="hist-receipt-id-row">
                            <span className="hist-receipt-id-value">
                                TRX-{selectedInstallment.contract_id}-{String(selectedInstallment.index).padStart(2, '0')}-MM
                            </span>
                            <button
                                className="hist-receipt-copy-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(`TRX-${selectedInstallment.contract_id}-${String(selectedInstallment.index).padStart(2, '0')}-MM`);
                                }}
                            >
                                <i className="bi bi-clipboard"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <button className="hist-share-btn">
                    <i className="bi bi-share me-2"></i>
                    Compartilhar Comprovante
                </button>

                <button className="hist-pdf-btn">
                    <i className="bi bi-file-earmark-pdf me-2"></i>
                    Baixar PDF
                </button>

                <p className="hist-legal-text">
                    Este é um documento digital válido como comprovante de pagamento junto à rede de lojas MM.
                </p>
            </div>
        </div>
    )
}
