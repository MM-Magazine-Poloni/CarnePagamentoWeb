import React from "react"

interface StoresTabProps {
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
}

const STORE = {
    name: "MM Magazine Poloni",
    address: "Rua Rio Branco, 235",
    neighborhood: "Centro",
    city: "Poloni — SP",
    cep: "15160-025",
    mapsQuery: "Rua+Rio+Branco+235+Centro+Poloni+SP+15160-025",
    hours: [
        { days: "Segunda à Sexta", time: "8:00 às 18:00" },
        { days: "Sábado",          time: "8:00 às 12:00" },
        { days: "Domingo",         time: "Fechado"       },
    ]
}

function isOpen(): boolean {
    const now = new Date()
    const day = now.getDay()   // 0=Dom, 1=Seg, ..., 6=Sáb
    const h = now.getHours()
    const m = now.getMinutes()
    const mins = h * 60 + m
    if (day >= 1 && day <= 5) return mins >= 480 && mins < 1080  // 8h–18h
    if (day === 6)             return mins >= 480 && mins < 720   // 8h–12h
    return false
}

export const StoresTab: React.FC<StoresTabProps> = ({ setActiveTab }) => {
    const open = isOpen()

    return (
        <>
            <style>{`
                /* ── Root ── */
                .st-root {
                    font-family: 'DM Sans', sans-serif;
                    background: #0A0A0C;
                    min-height: 100%;
                    color: #fff;
                    padding-bottom: 100px;
                }

                /* ── Header ── */
                .st-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 52px 20px 20px;
                    position: relative;
                }
                .st-header::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 160px;
                    background: radial-gradient(ellipse 80% 100% at 50% -20%, rgba(227,26,45,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .st-back-btn {
                    width: 38px; height: 38px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.08);
                    color: rgba(255,255,255,0.6);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 15px; cursor: pointer;
                    transition: background 0.15s;
                    flex-shrink: 0;
                }
                .st-back-btn:hover { background: rgba(255,255,255,0.1); }
                .st-header-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 17px; font-weight: 700; color: #fff;
                    position: relative;
                }

                /* ── Map ── */
                @keyframes st-ping {
                    0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
                    100% { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
                }
                @keyframes st-bounce {
                    0%, 100% { transform: translate(-50%, -100%) translateY(0); }
                    50%      { transform: translate(-50%, -100%) translateY(-6px); }
                }
                @keyframes st-fadeSlide {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .st-map-wrap {
                    margin: 0 20px 24px;
                    border-radius: 24px;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.08);
                    position: relative;
                    height: 200px;
                    background: #0e1117;
                    animation: st-fadeSlide 0.4s ease 0.05s both;
                }

                /* grid decorativo */
                .st-map-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                    background-size: 32px 32px;
                }

                /* "ruas" decorativas */
                .st-map-road-h {
                    position: absolute; left: 0; right: 0; height: 10px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 2px;
                }
                .st-map-road-v {
                    position: absolute; top: 0; bottom: 0; width: 10px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 2px;
                }
                /* destaque da rua principal */
                .st-map-road-main-h {
                    position: absolute; left: 0; right: 0; height: 14px;
                    background: rgba(255,255,255,0.09);
                }
                .st-map-road-main-v {
                    position: absolute; top: 0; bottom: 0; width: 14px;
                    background: rgba(255,255,255,0.09);
                }

                /* "quadras" decorativas */
                .st-map-block {
                    position: absolute;
                    background: rgba(255,255,255,0.025);
                    border-radius: 4px;
                }

                /* gradiente de fade nas bordas */
                .st-map-fade {
                    position: absolute; inset: 0;
                    background: radial-gradient(ellipse at center, transparent 40%, #0e1117 90%);
                    pointer-events: none;
                }

                /* pin animado */
                .st-pin-wrap {
                    position: absolute;
                    top: 50%; left: 50%;
                }
                .st-pin-ping {
                    position: absolute;
                    top: 50%; left: 50%;
                    width: 48px; height: 48px;
                    border-radius: 50%;
                    background: rgba(227,26,45,0.25);
                    animation: st-ping 1.8s ease-out infinite;
                }
                .st-pin-ping2 {
                    animation-delay: 0.9s;
                }
                .st-pin-body {
                    position: absolute;
                    bottom: 0; left: 50%;
                    transform: translate(-50%, 0);
                    display: flex; flex-direction: column; align-items: center;
                    animation: st-bounce 2.4s ease-in-out infinite;
                }
                .st-pin-head {
                    width: 44px; height: 44px;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    background: linear-gradient(135deg, #E31A2D, #c0152e);
                    box-shadow: 0 4px 20px rgba(227,26,45,0.5);
                    display: flex; align-items: center; justify-content: center;
                }
                .st-pin-head i {
                    transform: rotate(45deg);
                    font-size: 1.1rem; color: white;
                }
                .st-pin-tip {
                    width: 8px; height: 8px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 50%;
                    margin-top: 2px;
                    filter: blur(2px);
                }

                /* label sobre o mapa */
                .st-map-label {
                    position: absolute;
                    bottom: 12px; left: 50%; transform: translateX(-50%);
                    background: rgba(10,10,12,0.85);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 5px 14px;
                    font-size: 0.72rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.7);
                    white-space: nowrap;
                    display: flex; align-items: center; gap: 6px;
                }
                .st-map-label-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: #E31A2D;
                    box-shadow: 0 0 6px rgba(227,26,45,0.8);
                }

                /* ── Card ── */
                .st-card {
                    margin: 0 20px;
                    background: #111114;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 24px;
                    overflow: hidden;
                    animation: st-fadeSlide 0.4s ease 0.15s both;
                }

                .st-card-top {
                    padding: 1.25rem 1.25rem 1rem;
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .st-store-icon {
                    width: 48px; height: 48px;
                    border-radius: 14px;
                    background: rgba(227,26,45,0.1);
                    border: 1px solid rgba(227,26,45,0.2);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.3rem; color: #E31A2D;
                    flex-shrink: 0;
                }
                .st-store-meta { flex: 1; min-width: 0; }
                .st-store-name {
                    font-family: 'Syne', sans-serif;
                    font-size: 1rem; font-weight: 800;
                    color: #fff; margin: 0 0 5px;
                    line-height: 1.2;
                }
                .st-status-pill {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 3px 10px;
                    border-radius: 20px;
                    font-size: 0.62rem; font-weight: 700;
                    letter-spacing: 0.06em; text-transform: uppercase;
                }
                .st-status-open {
                    background: rgba(34,197,94,0.12);
                    border: 1px solid rgba(34,197,94,0.25);
                    color: #4ade80;
                }
                .st-status-closed {
                    background: rgba(239,68,68,0.1);
                    border: 1px solid rgba(239,68,68,0.2);
                    color: #f87171;
                }
                .st-status-dot {
                    width: 5px; height: 5px;
                    border-radius: 50%;
                    background: currentColor;
                }

                /* address row */
                .st-address-row {
                    padding: 1rem 1.25rem;
                    display: flex; align-items: flex-start; gap: 10px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .st-address-icon {
                    width: 32px; height: 32px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.05);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.85rem; color: #E31A2D;
                    flex-shrink: 0; margin-top: 1px;
                }
                .st-address-text { flex: 1; }
                .st-address-main {
                    font-size: 0.85rem; font-weight: 600; color: #fff;
                    line-height: 1.4;
                }
                .st-address-sub {
                    font-size: 0.75rem; color: rgba(255,255,255,0.35);
                    margin-top: 1px;
                }

                /* hours */
                .st-hours-section {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .st-hours-title {
                    font-size: 0.62rem; font-weight: 600;
                    color: rgba(255,255,255,0.25);
                    letter-spacing: 0.12em; text-transform: uppercase;
                    margin-bottom: 10px;
                }
                .st-hours-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 5px 0;
                }
                .st-hours-row + .st-hours-row {
                    border-top: 1px solid rgba(255,255,255,0.04);
                }
                .st-hours-day {
                    font-size: 0.8rem; color: rgba(255,255,255,0.5); font-weight: 500;
                }
                .st-hours-time {
                    font-size: 0.8rem; font-weight: 700; color: #fff;
                }
                .st-hours-time.closed { color: rgba(255,255,255,0.25); font-weight: 500; }

                /* CTA button */
                .st-cta {
                    padding: 1rem 1.25rem;
                }
                .st-directions-btn {
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    width: 100%; padding: 0.95rem;
                    border-radius: 14px; border: none;
                    background: #E31A2D;
                    color: white;
                    font-size: 0.9rem; font-weight: 700;
                    text-decoration: none;
                    box-shadow: 0 4px 18px rgba(227,26,45,0.35);
                    transition: transform 0.15s, box-shadow 0.15s;
                }
                .st-directions-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 22px rgba(227,26,45,0.45);
                    color: white;
                }
                .st-directions-btn:active { transform: scale(0.98); }

                /* ── legal hint ── */
                .st-hint {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.18);
                    padding: 0 20px;
                    line-height: 1.5;
                }

                @media (min-width: 768px) {
                    .st-root { max-width: 600px; margin: 0 auto; }
                }
            `}</style>

            <div className="st-root">
                {/* Header */}
                <div className="st-header">
                    <button className="st-back-btn" onClick={() => setActiveTab('inicio')}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <span className="st-header-title">Nossas Lojas</span>
                    <div style={{ width: 38 }}></div>
                </div>

                {/* Mapa decorativo animado */}
                <div className="st-map-wrap">
                    <div className="st-map-grid"></div>

                    {/* quadras */}
                    <div className="st-map-block" style={{ top: '10%', left: '8%',  width: '18%', height: '25%' }}></div>
                    <div className="st-map-block" style={{ top: '10%', left: '30%', width: '14%', height: '20%' }}></div>
                    <div className="st-map-block" style={{ top: '10%', left: '60%', width: '22%', height: '25%' }}></div>
                    <div className="st-map-block" style={{ top: '65%', left: '8%',  width: '16%', height: '22%' }}></div>
                    <div className="st-map-block" style={{ top: '65%', left: '30%', width: '18%', height: '22%' }}></div>
                    <div className="st-map-block" style={{ top: '65%', left: '60%', width: '22%', height: '22%' }}></div>

                    {/* ruas secundárias */}
                    <div className="st-map-road-h" style={{ top: '8%' }}></div>
                    <div className="st-map-road-h" style={{ top: '60%' }}></div>
                    <div className="st-map-road-v" style={{ left: '27%' }}></div>
                    <div className="st-map-road-v" style={{ left: '55%' }}></div>
                    <div className="st-map-road-v" style={{ left: '85%' }}></div>

                    {/* rua principal (cruzamento no centro) */}
                    <div className="st-map-road-main-h" style={{ top: 'calc(50% - 7px)' }}></div>
                    <div className="st-map-road-main-v" style={{ left: 'calc(50% - 7px)' }}></div>

                    {/* fade nas bordas */}
                    <div className="st-map-fade"></div>

                    {/* Pin */}
                    <div className="st-pin-wrap">
                        <div className="st-pin-ping"></div>
                        <div className="st-pin-ping st-pin-ping2"></div>
                        <div className="st-pin-body">
                            <div className="st-pin-head">
                                <i className="bi bi-shop-window"></i>
                            </div>
                            <div className="st-pin-tip"></div>
                        </div>
                    </div>

                    {/* Label flutuante */}
                    <div className="st-map-label">
                        <div className="st-map-label-dot"></div>
                        Rua Rio Branco, 235 — Centro
                    </div>
                </div>

                {/* Card da loja */}
                <div className="st-card">
                    {/* Nome + status */}
                    <div className="st-card-top">
                        <div className="st-store-meta">
                            <div className="st-store-name">{STORE.name}</div>
                            <span className={`st-status-pill ${open ? "st-status-open" : "st-status-closed"}`}>
                                <span className="st-status-dot"></span>
                                {open ? "Aberto agora" : "Fechado"}
                            </span>
                        </div>
                        <div className="st-store-icon">
                            <i className="bi bi-shop-window"></i>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="st-address-row">
                        <div className="st-address-icon">
                            <i className="bi bi-geo-alt-fill"></i>
                        </div>
                        <div className="st-address-text">
                            <div className="st-address-main">{STORE.address}, {STORE.neighborhood}</div>
                            <div className="st-address-sub">{STORE.city} · CEP {STORE.cep}</div>
                        </div>
                    </div>

                    {/* Horários */}
                    <div className="st-hours-section">
                        <div className="st-hours-title">
                            <i className="bi bi-clock me-1"></i>
                            Horário de Funcionamento
                        </div>
                        {STORE.hours.map(h => (
                            <div key={h.days} className="st-hours-row">
                                <span className="st-hours-day">{h.days}</span>
                                <span className={`st-hours-time ${h.time === "Fechado" ? "closed" : ""}`}>
                                    {h.time}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Botão rotas */}
                    <div className="st-cta">
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${STORE.mapsQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="st-directions-btn"
                        >
                            <i className="bi bi-map-fill"></i>
                            Como Chegar
                        </a>
                    </div>
                </div>

                <p className="st-hint">
                    Toque em "Como Chegar" para abrir a rota no Google Maps
                </p>
            </div>
        </>
    )
}
