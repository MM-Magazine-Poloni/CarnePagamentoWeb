import React from "react"

interface ProfileTabProps {
    customerName: string | null
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
    stats?: { paid: number; total: number; totalAmount: number }
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ customerName, setActiveTab, stats }) => {
    // Lógica de Nível do Cliente (mesma da HomeTab)
    const getCustomerLevel = () => {
        if (!stats) return { label: 'BRONZE', color: '#CD7F32', icon: 'patch-check' };
        if (stats.paid >= 10 || stats.total > 20) return { label: 'OURO', color: '#FFD700', icon: 'patch-check-fill' };
        if (stats.paid >= 5) return { label: 'PRATA', color: '#C0C0C0', icon: 'patch-check-fill' };
        return { label: 'BRONZE', color: '#CD7F32', icon: 'patch-check' };
    };
    const level = getCustomerLevel();

    return (
        <div className="p-3 bg-app pb-5">
            <div className="d-flex align-items-center mb-4">
                <button className="back-btn shadow-sm" onClick={() => setActiveTab('inicio')}>
                    <i className="bi bi-chevron-left"></i>
                </button>
                <h5 className="fw-bold m-0 flex-grow-1 text-center" style={{ marginRight: '40px' }}>Perfil</h5>
            </div>

            <div className="bg-white rounded-4 p-4 shadow-sm text-center mb-4 position-relative overflow-hidden d-flex flex-column align-items-center">
                <div className="mb-3 d-flex justify-content-center position-relative perfil-avatar-wrapper">
                    <div className="rounded-4 bg-danger text-white d-flex align-items-center justify-content-center shadow"
                        style={{ width: '80px', height: '80px', position: 'relative', zIndex: 2, backgroundColor: level.color }}>
                        <i className="bi bi-person-fill fs-1"></i>
                    </div>
                    <div className="position-absolute text-muted opacity-10 fw-bold fst-italic"
                        style={{ fontSize: '120px', top: -40, right: -20, zIndex: 1, letterSpacing: '-5px' }}>
                        M
                    </div>
                </div>
                <h4 className="fw-bold text-dark m-0 mb-1">{customerName || 'Cliente MM'}</h4>
                <p className="text-muted small mb-3">CPF: 000.***.***-00</p>
                <div className="d-inline-flex rounded-pill px-3 py-1 align-items-center gap-1" 
                    style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', backgroundColor: level.color + '20', color: level.color }}>
                    <i className={`bi bi-${level.icon}`}></i> CLIENTE {level.label}
                </div>
            </div>

            <div className="mb-4">
                <div className="text-muted fw-bold mb-2 ms-1" style={{ fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Preferências</div>
                <div className="bg-white rounded-4 shadow-sm overflow-hidden">
                    <div className="d-flex align-items-center justify-content-between p-3 border-bottom" onClick={() => setActiveTab('suporte')} style={{ cursor: 'pointer' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-2 d-flex align-items-center justify-content-center">
                                <i className="bi bi-headset fs-5"></i>
                            </div>
                            <span className="fw-bold text-dark">Suporte e Ajuda</span>
                        </div>
                        <i className="bi bi-chevron-right text-muted small"></i>
                    </div>
                    <div className="d-flex align-items-center justify-content-between p-3" style={{ cursor: 'pointer' }}>
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-secondary bg-opacity-10 text-secondary rounded-3 p-2 d-flex align-items-center justify-content-center">
                                <i className="bi bi-moon-fill fs-5"></i>
                            </div>
                            <span className="fw-bold text-dark">Tema do Aplicativo</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted small fw-600">Sistema</span>
                            <i className="bi bi-chevron-right text-muted small"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <div className="text-muted fw-bold mb-2 ms-1" style={{ fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Carnês e Documentos</div>
                <div className="bg-white rounded-4 shadow-sm overflow-hidden p-3 d-flex align-items-center justify-content-between"
                    onClick={() => setActiveTab('carnes')} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                            style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                            <i className="bi bi-file-earmark-text-fill fs-5"></i>
                        </div>
                        <span className="fw-bold text-dark">Meus Contratos</span>
                    </div>
                    <i className="bi bi-chevron-right text-muted small"></i>
                </div>
            </div>

            <button className="btn btn-danger w-100 rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm mb-4"
                style={{ background: '#E31A2D' }}>
                <i className="bi bi-box-arrow-left"></i> Sair da Conta
            </button>

            <div className="text-center pb-5 mb-3">
                <div className="fw-bold text-muted mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>MM MAGAZINE DIGITAL</div>
                <div className="text-muted" style={{ fontSize: '0.6rem' }}>Versão 3.4.12 (Build 2024)</div>
            </div>
        </div>
    )
}
