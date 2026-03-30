import React from "react"

interface PaymentSuccessOverlayProps {
    dismissPaymentSuccess: () => void
}

export const PaymentSuccessOverlay: React.FC<PaymentSuccessOverlayProps> = ({ dismissPaymentSuccess }) => {
    return (
        <div className="payment-success-overlay animate__animated animate__fadeIn">
            <div className="payment-success-content animate__animated animate__zoomIn">
                <div className="payment-success-icon-wrapper">
                    <div className="payment-success-icon-bg">
                        <i className="bi bi-check-lg"></i>
                    </div>
                    <div className="payment-success-ring"></div>
                </div>
                <h2 className="payment-success-title">Pagamento Confirmado!</h2>
                <p className="payment-success-subtitle">
                    Seu pagamento foi processado com sucesso.
                </p>
                <div className="payment-success-details">
                    <div className="payment-success-detail-row">
                        <i className="bi bi-shield-check"></i>
                        <span>Transação segura e verificada</span>
                    </div>
                    <div className="payment-success-detail-row">
                        <i className="bi bi-clock-history"></i>
                        <span>Comprovante disponível em instantes</span>
                    </div>
                </div>
                <button className="payment-success-btn" onClick={dismissPaymentSuccess}>
                    <i className="bi bi-house-door me-2"></i>
                    Voltar ao Início
                </button>
            </div>
        </div>
    )
}
