import React from "react"

interface BottomNavProps {
    activeTab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico'
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    const items = [
        { key: 'inicio' as const, icon: 'house-door', label: 'Início' },
        { key: 'carnes' as const, icon: 'collection', label: 'Carnês' },
        { key: 'historico' as const, icon: 'clock-history', label: 'Histórico' },
        { key: 'perfil' as const, icon: 'person', label: 'Perfil' },
    ]

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

                .bn-root {
                    font-family: 'DM Sans', sans-serif;
                    position: fixed;
                    bottom: 0; left: 0; right: 0;
                    z-index: 200;

                    /* safe area for notch phones */
                    padding-bottom: env(safe-area-inset-bottom, 0px);

                    background: rgba(13, 13, 15, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-top: 1px solid rgba(255,255,255,0.07);

                    display: flex;
                    align-items: stretch;
                }

                /* hide on desktop — sidebar handles nav there */
                @media (min-width: 768px) {
                    .bn-root { display: none; }
                }

                .bn-inner {
                    display: flex;
                    width: 100%;
                    padding: 6px 4px 2px;
                }

                .bn-item {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 6px 0 8px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    position: relative;
                    -webkit-tap-highlight-color: transparent;
                    transition: opacity 0.15s ease;
                }
                .bn-item:active {
                    opacity: 0.7;
                }

                /* pill indicator above active icon */
                .bn-item::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 50%;
                    transform: translateX(-50%) scaleX(0);
                    width: 28px; height: 2.5px;
                    background: #E31A2D;
                    border-radius: 0 0 4px 4px;
                    box-shadow: 0 0 8px rgba(227,26,45,0.6);
                    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
                }
                .bn-item.active::before {
                    transform: translateX(-50%) scaleX(1);
                }

                .bn-icon-wrap {
                    width: 36px; height: 36px;
                    border-radius: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 19px;
                    transition: background 0.2s ease, color 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
                }
                .bn-item:not(.active) .bn-icon-wrap {
                    background: transparent;
                    color: rgba(255,255,255,0.35);
                }
                .bn-item.active .bn-icon-wrap {
                    background: rgba(227,26,45,0.14);
                    color: #E31A2D;
                    transform: translateY(-2px);
                }

                .bn-label {
                    font-size: 10px;
                    font-weight: 500;
                    letter-spacing: 0.3px;
                    transition: color 0.2s ease, opacity 0.2s ease;
                    line-height: 1;
                }
                .bn-item:not(.active) .bn-label {
                    color: rgba(255,255,255,0.3);
                }
                .bn-item.active .bn-label {
                    color: #E31A2D;
                    font-weight: 600;
                }
            `}</style>

            <nav className="bn-root" role="navigation" aria-label="Navegação principal">
                <div className="bn-inner">
                    {items.map((item) => {
                        const isActive = activeTab === item.key
                        return (
                            <button
                                key={item.key}
                                className={`bn-item${isActive ? ' active' : ''}`}
                                onClick={() => setActiveTab(item.key)}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className="bn-icon-wrap">
                                    <i className={`bi bi-${item.icon}${isActive ? '-fill' : ''}`}></i>
                                </div>
                                <span className="bn-label">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
