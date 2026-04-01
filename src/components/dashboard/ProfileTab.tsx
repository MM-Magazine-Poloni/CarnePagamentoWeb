import React from "react"

interface ProfileTabProps {
    customerName: string | null
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
    stats?: { paid: number; total: number; totalAmount: number }
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ customerName, setActiveTab, stats }) => {
    const getCustomerLevel = () => {
        if (!stats) return { label: 'BRONZE', color: '#CD7F32', icon: 'patch-check', pct: 0 }
        if (stats.paid >= 10 || stats.total > 20) return { label: 'OURO', color: '#FFD700', icon: 'patch-check-fill', pct: 100 }
        if (stats.paid >= 5) return { label: 'PRATA', color: '#C0C0C0', icon: 'patch-check-fill', pct: 60 }
        return { label: 'BRONZE', color: '#CD7F32', icon: 'patch-check', pct: 20 }
    }
    const level = getCustomerLevel()
    const firstName = customerName ? customerName.split(' ')[0] : 'Cliente'
    const initials = customerName
        ? customerName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : 'MM'

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

                .pf-root {
                    font-family: 'DM Sans', sans-serif;
                    background: #0A0A0C;
                    min-height: 100%;
                    color: #fff;
                    padding-bottom: 100px;
                }

                /* ── HEADER ── */
                .pf-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 52px 20px 16px;
                    position: relative;
                }
                .pf-header::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 130px;
                    background: radial-gradient(ellipse 80% 100% at 50% -20%, rgba(227,26,45,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .pf-icon-btn {
                    width: 38px; height: 38px; border-radius: 12px;
                    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
                    display: flex; align-items: center; justify-content: center;
                    color: rgba(255,255,255,0.7); font-size: 15px; cursor: pointer;
                    flex-shrink: 0; transition: background 0.15s;
                }
                .pf-icon-btn:hover { background: rgba(255,255,255,0.1); }
                .pf-header-title {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(15px, 4.5vw, 18px);
                    font-weight: 700; color: #fff; position: relative;
                }

                /* ── HERO CARD ── */
                .pf-hero {
                    margin: 0 16px 20px;
                    background: #111114;
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 22px;
                    padding: 24px 20px;
                    display: flex; flex-direction: column; align-items: center;
                    position: relative; overflow: hidden;
                }
                .pf-hero::before {
                    content: '';
                    position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
                    width: 240px; height: 180px;
                    background: radial-gradient(ellipse, rgba(227,26,45,0.08) 0%, transparent 70%);
                    pointer-events: none;
                }
                .pf-avatar {
                    width: 72px; height: 72px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
                    color: #fff; margin-bottom: 12px; flex-shrink: 0;
                    border: 2px solid rgba(255,255,255,0.08);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
                }
                .pf-customer-name {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(16px, 5vw, 20px);
                    font-weight: 700; color: #fff; margin-bottom: 3px;
                    text-align: center; word-break: break-word;
                }
                .pf-customer-cpf {
                    font-size: 12px; color: rgba(255,255,255,0.3);
                    margin-bottom: 12px;
                }
                .pf-level-pill {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 5px 14px; border-radius: 999px;
                    font-size: 10px; font-weight: 800;
                    letter-spacing: 1.5px; text-transform: uppercase;
                }
                .pf-hero-stats {
                    display: grid; grid-template-columns: 1fr 1fr;
                    gap: 10px; width: 100%; margin-top: 16px;
                    padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);
                }
                .pf-stat-cell {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 14px; padding: 12px;
                    display: flex; flex-direction: column; gap: 2px;
                }
                .pf-stat-lbl {
                    font-size: 10px; font-weight: 600; letter-spacing: 1px;
                    text-transform: uppercase; color: rgba(255,255,255,0.3);
                }
                .pf-stat-val {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(15px, 4vw, 18px);
                    font-weight: 700; color: #fff; line-height: 1.1;
                }
                .pf-level-bar-wrap {
                    width: 100%; margin-top: 14px; padding-top: 14px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }
                .pf-level-bar-header {
                    display: flex; justify-content: space-between;
                    font-size: 10px; color: rgba(255,255,255,0.35);
                    font-weight: 600; margin-bottom: 6px;
                }
                .pf-level-bar {
                    height: 4px; background: rgba(255,255,255,0.08);
                    border-radius: 99px; overflow: hidden;
                }
                .pf-level-bar-fill {
                    height: 100%; border-radius: 99px;
                    transition: width 0.6s ease;
                }

                /* ── SECTION LABEL ── */
                .pf-section-lbl {
                    font-size: 10px; font-weight: 700; letter-spacing: 2px;
                    text-transform: uppercase; color: rgba(255,255,255,0.3);
                    margin: 20px 16px 8px;
                }

                /* ── MENU LIST ── */
                .pf-menu {
                    margin: 0 16px;
                    background: #111114;
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 18px;
                    overflow: hidden;
                }
                .pf-menu-item {
                    display: flex; align-items: center;
                    gap: 12px; padding: 14px 16px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                    transition: background 0.15s;
                    min-height: 56px;
                }
                .pf-menu-item:last-child { border-bottom: none; }
                .pf-menu-item:hover { background: rgba(255,255,255,0.03); }
                .pf-menu-item:active { background: rgba(255,255,255,0.05); }
                .pf-menu-icon {
                    width: 36px; height: 36px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 16px; flex-shrink: 0;
                }
                .pf-menu-text { flex: 1; min-width: 0; }
                .pf-menu-title {
                    font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85);
                    line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .pf-menu-subtitle {
                    font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 1px;
                }
                .pf-menu-chevron {
                    color: rgba(255,255,255,0.2); font-size: 12px; flex-shrink: 0;
                }

                /* ── BUTTONS ── */
                .pf-btn {
                    margin: 0 16px;
                    width: calc(100% - 32px);
                    padding: 15px; border-radius: 16px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px; font-weight: 700;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    cursor: pointer; border: none;
                    transition: transform 0.15s, box-shadow 0.15s;
                    -webkit-tap-highlight-color: transparent;
                }
                .pf-btn:active { transform: scale(0.97); }
                .pf-btn-tutorial {
                    background: rgba(227,26,45,0.08);
                    border: 1px solid rgba(227,26,45,0.2) !important;
                    color: #E31A2D;
                }
                .pf-btn-tutorial:hover { background: rgba(227,26,45,0.12); }
                .pf-btn-exit {
                    background: #E31A2D; color: #fff;
                    box-shadow: 0 8px 24px rgba(227,26,45,0.28);
                }
                .pf-btn-exit:hover { box-shadow: 0 10px 28px rgba(227,26,45,0.38); }

                /* ── FOOTER ── */
                .pf-footer {
                    text-align: center; margin: 20px 0 0; padding-bottom: 8px;
                }
                .pf-footer-brand {
                    font-size: 10px; font-weight: 700; letter-spacing: 2px;
                    text-transform: uppercase; color: rgba(255,255,255,0.15); margin-bottom: 3px;
                }
                .pf-footer-version { font-size: 10px; color: rgba(255,255,255,0.1); }

                /* ── RESPONSIVE ── */
                @media (max-width: 360px) {
                    .pf-header { padding: 40px 14px 14px; }
                    .pf-hero { margin: 0 12px 16px; padding: 20px 16px; }
                    .pf-section-lbl { margin: 16px 12px 6px; }
                    .pf-menu { margin: 0 12px; }
                    .pf-btn { margin: 0 12px; width: calc(100% - 24px); }
                    .pf-menu-item { padding: 12px 14px; }
                    .pf-avatar { width: 62px; height: 62px; font-size: 18px; }
                }
                @media (min-width: 768px) {
                    .pf-root { max-width: 560px; margin: 0 auto; padding-bottom: 40px; }
                }
            `}</style>

            <div className="pf-root">
                {/* Header */}
                <div className="pf-header">
                    <button className="pf-icon-btn" onClick={() => setActiveTab('inicio')}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <span className="pf-header-title">Perfil</span>
                    <div style={{ width: 38 }} />
                </div>

                {/* Hero card */}
                <div className="pf-hero">
                    <div className="pf-avatar" style={{ background: `linear-gradient(135deg, ${level.color}55, ${level.color}22)`, border: `2px solid ${level.color}44` }}>
                        {initials}
                    </div>
                    <div className="pf-customer-name">{firstName}</div>
                    <div className="pf-customer-cpf">CPF: ***.***.***-**</div>
                    <div className="pf-level-pill" style={{ background: level.color + '1A', border: `1px solid ${level.color}40`, color: level.color }}>
                        <i className={`bi bi-${level.icon}`} style={{ fontSize: 10 }}></i>
                        Cliente {level.label}
                    </div>

                    {stats && (
                        <div className="pf-hero-stats">
                            <div className="pf-stat-cell">
                                <span className="pf-stat-lbl">Pagas</span>
                                <span className="pf-stat-val">{String(stats.paid).padStart(2, '0')}<span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, fontSize: 12 }}>/{String(stats.total).padStart(2, '0')}</span></span>
                            </div>
                            <div className="pf-stat-cell">
                                <span className="pf-stat-lbl">Saldo</span>
                                <span className="pf-stat-val" style={{ fontSize: 'clamp(12px, 3.5vw, 15px)' }}>
                                    {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalAmount)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="pf-level-bar-wrap">
                        <div className="pf-level-bar-header">
                            <span>Nível de Pontualidade</span>
                            <span style={{ color: level.color, fontWeight: 700 }}>{level.label}</span>
                        </div>
                        <div className="pf-level-bar">
                            <div className="pf-level-bar-fill" style={{ width: `${level.pct}%`, background: level.color }} />
                        </div>
                    </div>
                </div>

                {/* Menu — Acesso rápido */}
                <div className="pf-section-lbl">Acesso Rápido</div>
                <div className="pf-menu">
                    <div className="pf-menu-item" onClick={() => setActiveTab('carnes')}>
                        <div className="pf-menu-icon" style={{ background: 'rgba(227,26,45,0.1)', color: '#E31A2D' }}>
                            <i className="bi bi-collection-fill"></i>
                        </div>
                        <div className="pf-menu-text">
                            <div className="pf-menu-title">Meus Carnês</div>
                            <div className="pf-menu-subtitle">Ver parcelas e contratos</div>
                        </div>
                        <i className="bi bi-chevron-right pf-menu-chevron"></i>
                    </div>
                    <div className="pf-menu-item" onClick={() => setActiveTab('historico')}>
                        <div className="pf-menu-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>
                            <i className="bi bi-clock-history"></i>
                        </div>
                        <div className="pf-menu-text">
                            <div className="pf-menu-title">Histórico de Pagamentos</div>
                            <div className="pf-menu-subtitle">Extrato e comprovantes</div>
                        </div>
                        <i className="bi bi-chevron-right pf-menu-chevron"></i>
                    </div>
                    <div className="pf-menu-item" onClick={() => setActiveTab('suporte')}>
                        <div className="pf-menu-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#FBBF24' }}>
                            <i className="bi bi-headset"></i>
                        </div>
                        <div className="pf-menu-text">
                            <div className="pf-menu-title">Suporte e Ajuda</div>
                            <div className="pf-menu-subtitle">Falar com atendimento</div>
                        </div>
                        <i className="bi bi-chevron-right pf-menu-chevron"></i>
                    </div>
                    <div className="pf-menu-item" onClick={() => setActiveTab('lojas')}>
                        <div className="pf-menu-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399' }}>
                            <i className="bi bi-shop"></i>
                        </div>
                        <div className="pf-menu-text">
                            <div className="pf-menu-title">Nossas Lojas</div>
                            <div className="pf-menu-subtitle">Endereços e horários</div>
                        </div>
                        <i className="bi bi-chevron-right pf-menu-chevron"></i>
                    </div>
                </div>

                {/* Tutorial */}
                <div className="pf-section-lbl">Ajuda</div>
                <button
                    className="pf-btn pf-btn-tutorial"
                    onClick={() => window.dispatchEvent(new Event("mm:start-tour"))}
                >
                    <i className="bi bi-play-circle-fill"></i>
                    Ver tutorial novamente
                </button>

                {/* Sair */}
                <div style={{ height: 12 }} />
                <button className="pf-btn pf-btn-exit">
                    <i className="bi bi-box-arrow-left"></i>
                    Sair da Conta
                </button>

                {/* Footer */}
                <div className="pf-footer">
                    <div className="pf-footer-brand">MM Magazine Digital</div>
                    <div className="pf-footer-version">Versão 3.4.12</div>
                </div>
            </div>
        </>
    )
}
