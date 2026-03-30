import React from "react"

interface SupportTabProps {
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
}

export const SupportTab: React.FC<SupportTabProps> = ({ setActiveTab }) => {
    return (
        <div className="p-3 bg-app pb-5">
            <div className="d-flex align-items-center mb-4">
                <button className="back-btn shadow-sm" onClick={() => setActiveTab('inicio')}>
                    <i className="bi bi-chevron-left"></i>
                </button>
                <h5 className="fw-bold m-0 flex-grow-1 text-center" style={{ marginRight: '40px' }}>Suporte e Ajuda</h5>
            </div>

            <div className="mb-4">
                <h3 className="fw-bold text-dark lh-sm m-0">Como podemos te</h3>
                <h3 className="fw-bold text-danger lh-sm m-0 mb-2">ajudar hoje?</h3>
                <p className="text-muted small">Gerencie seus carnês da MM Magazine rapidamente.</p>
            </div>

            <div className="suporte-card shadow-sm mb-4 position-relative overflow-hidden bg-white"
                style={{ borderRadius: '16px', padding: '1.5rem', border: '1px solid #f0f0f0' }}>
                <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="bg-success bg-opacity-10 text-success rounded p-3 d-flex align-items-center justify-content-center"
                        style={{ width: '48px', height: '48px' }}>
                    </div>
                    <div>
                        <h6 className="fw-bold m-0 fs-5 text-dark">WhatsApp</h6>
                    </div>
                </div>
                <p className="text-muted small m-0 pe-5">
                    Fale agora com um consultor via contato direto.
                </p>
                <div className="position-absolute" style={{ top: '1.5rem', right: '1.5rem' }}>
                    <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1" style={{ fontSize: '0.6rem', fontWeight: 700 }}>
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.4rem' }}></i> ONLINE AGORA
                    </div>
                </div>
                <div className="whatsapp-bg-icon position-absolute opacity-10" style={{ right: '-10px', bottom: '-20px', fontSize: '100px', color: '#25D366' }}>
                    <i className="bi bi-whatsapp"></i>
                </div>
            </div>

            <div className="search-bar position-relative mb-4">
                <i className="bi bi-search position-absolute text-muted" style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)' }}></i>
                <input type="text" className="form-control bg-white shadow-sm border-0"
                    placeholder="Pesquise por dúvidas, parcelas..."
                    style={{ paddingLeft: '2.5rem', height: '50px', borderRadius: '12px' }} />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
                <h6 className="fw-bold m-0 text-dark fs-5">Perguntas Frequentes</h6>
                <span className="text-danger small fw-bold" style={{ fontSize: '0.7rem' }}>VER TUDO</span>
            </div>

            <div className="d-flex flex-column gap-2 mb-4">
                <div className="bg-white rounded-4 px-3 py-3 d-flex align-items-center justify-content-between shadow-sm">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-danger bg-opacity-10 text-danger rounded p-2 d-flex align-items-center justify-content-center">
                            <i className="bi bi-receipt"></i>
                        </div>
                        <span className="fw-bold text-dark fs-6">Como pago meu carnê?</span>
                    </div>
                    <i className="bi bi-chevron-down text-muted"></i>
                </div>
                <div className="bg-white rounded-4 px-3 py-3 d-flex align-items-center justify-content-between shadow-sm">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-danger bg-opacity-10 text-danger rounded p-2 d-flex align-items-center justify-content-center">
                            <i className="bi bi-clock"></i>
                        </div>
                        <span className="fw-bold text-dark fs-6">Taxas e juros por atraso</span>
                    </div>
                    <i className="bi bi-chevron-down text-muted"></i>
                </div>
                <div className="bg-white rounded-4 px-3 py-3 d-flex align-items-center justify-content-between shadow-sm">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-danger bg-opacity-10 text-danger rounded p-2 d-flex align-items-center justify-content-center">
                            <i className="bi bi-shield-check"></i>
                        </div>
                        <span className="fw-bold text-dark fs-6">Configurações de segurança</span>
                    </div>
                    <i className="bi bi-chevron-down text-muted"></i>
                </div>
            </div>

            <div className="bg-white rounded-4 px-3 py-3 d-flex align-items-center justify-content-between shadow-sm mt-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-light text-secondary rounded p-2 d-flex align-items-center justify-content-center">
                        <i className="bi bi-shop"></i>
                    </div>
                    <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '0.8rem' }}>ENCONTRAR UMA LOJA FÍSICA</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Localize a MM Magazine mais próxima</div>
                    </div>
                </div>
                <i className="bi bi-chevron-right text-muted small"></i>
            </div>
        </div>
    )
}
