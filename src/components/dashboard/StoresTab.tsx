import React from "react"

interface StoresTabProps {
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
}

export const StoresTab: React.FC<StoresTabProps> = ({ setActiveTab }) => {
    return (
        <div className="lojas-tab-container pb-5">
            <div className="lojas-header">
                <button className="back-btn shadow-sm" onClick={() => setActiveTab('inicio')}>
                    <i className="bi bi-chevron-left"></i>
                </button>
                <h5 className="fw-bold m-0 flex-grow-1 text-center">Encontrar uma Loja Física</h5>
                <div style={{ width: '40px' }}></div>
            </div>

            {/* Search Bar */}
            <div className="lojas-search">
                <i className="bi bi-search lojas-search-icon"></i>
                <input type="text" className="lojas-search-input" placeholder="Pesquise por cidade ou CEP" />
                <button className="lojas-search-locate">
                    <i className="bi bi-geo-alt"></i>
                </button>
            </div>

            {/* Map Area */}
            <div className="lojas-map">
                <div className="lojas-map-gradient"></div>
                <div className="lojas-map-grid">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="lojas-map-gridline-h" style={{ top: `${(i + 1) * 5}%` }}></div>
                    ))}
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="lojas-map-gridline-v" style={{ left: `${(i + 1) * 5}%` }}></div>
                    ))}
                </div>
                {/* Store Pins */}
                <div className="lojas-pin" style={{ top: '40%', left: '50%' }}>
                    <div className="lojas-pin-icon">
                        <i className="bi bi-shop-window"></i>
                    </div>
                    <div className="lojas-pin-shadow"></div>
                </div>
            </div>

            {/* Stores List */}
            <div className="lojas-list-header">
                <h5 className="fw-bold m-0">Lojas Próximas</h5>
                <span className="lojas-count-badge">1 LOJA ENCONTRADA</span>
            </div>

            <div className="lojas-list">
                {/* MM Magazine Poloni */}
                <div className="loja-card">
                    <div className="loja-card-content">
                        <div className="loja-card-header">
                            <div>
                                <h6 className="loja-name">MM - Magazine Poloni</h6>
                                <span className="loja-status-badge loja-status-aberto">
                                    <i className="bi bi-circle-fill"></i> ABERTO
                                </span>
                            </div>
                            <div className="loja-icon-box">
                                <i className="bi bi-shop-window"></i>
                            </div>
                        </div>
                        <div className="loja-address">
                            <i className="bi bi-geo-alt-fill"></i>
                            <span>R. Rio Branco, 235, Poloni - SP, 15160-000</span>
                        </div>
                        <div className="loja-distance">
                            <i className="bi bi-arrow-up-right"></i>
                            <span>Sua loja mais próxima</span>
                        </div>
                        <div className="loja-info-row">
                            <div className="loja-info-item">
                                <i className="bi bi-clock"></i>
                                <span>Seg a Sex: 8h - 18h</span>
                            </div>
                            <div className="loja-info-item">
                                <i className="bi bi-telephone"></i>
                                <span>(17) 3000-0000</span>
                            </div>
                        </div>
                        <a
                            href="https://www.google.com/maps/search/?api=1&query=R.+Rio+Branco+235+Poloni+SP+15160-000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="loja-directions-btn"
                        >
                            <i className="bi bi-map"></i>
                            Como chegar
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
