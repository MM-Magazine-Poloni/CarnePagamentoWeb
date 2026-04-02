import React from "react"
import type { Installment } from "../../lib/types"

interface HomeTabProps {
    customerName: string | null
    stats: { paid: number; total: number; totalAmount: number; onTimeCount: number; earlyCount: number; scoredTotal: number }
    nextInstallment: Installment | undefined
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
    setExpandedContract: (id: number | null) => void
    openDetail: (inst: Installment) => void
}

export const HomeTab: React.FC<HomeTabProps> = ({
    customerName,
    stats,
    nextInstallment,
    setActiveTab,
    setExpandedContract,
    openDetail
}) => {
    const firstName = customerName ? customerName.split(' ')[0] : 'Cliente'
    const progress = Math.round((stats.paid / (stats.total || 1)) * 100)
    const circumference = 2 * Math.PI * 15.9155
    const dashOffset = circumference - (progress / 100) * circumference

    // Nível baseado em pontualidade de pagamento
    const getCustomerLevel = () => {
        const { onTimeCount, scoredTotal } = stats
        if (scoredTotal === 0) {
            return { label: 'BRONZE', color: '#CD7F32', icon: 'patch-check', description: 'Faça seu primeiro pagamento no prazo', pct: 0 }
        }
        const pct = Math.round((onTimeCount / scoredTotal) * 100)
        if (pct >= 90) return { label: 'OURO', color: '#FFD700', icon: 'patch-check-fill', description: 'Pagador exemplar', pct }
        if (pct >= 60) return { label: 'PRATA', color: '#C0C0C0', icon: 'patch-check-fill', description: 'Bom histórico de pagamentos', pct }
        return { label: 'BRONZE', color: '#CD7F32', icon: 'patch-check', description: 'Pague em dia para subir de nível', pct }
    };
    const level = getCustomerLevel();

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

                .ht-root {
                    font-family: 'DM Sans', sans-serif;
                    background: #0A0A0C;
                    min-height: 100%;
                    color: #fff;
                    padding-bottom: 100px;
                }

                /* ── HEADER ── */
                .ht-header {
                    padding: 52px 20px 16px;
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    position: relative;
                }
                .ht-header::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 160px;
                    background: radial-gradient(ellipse 90% 100% at 10% -20%, rgba(227,26,45,0.22) 0%, transparent 70%);
                    pointer-events: none;
                }
                .ht-greeting {
                    font-family: 'DM Sans', sans-serif;
                    font-size: 12px;
                    font-weight: 400;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 4px;
                }
                .ht-name {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(24px, 6vw, 28px);
                    font-weight: 800;
                    color: #fff;
                    line-height: 1.1;
                }
                .ht-notif-btn {
                    width: 44px;
                    height: 44px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255,255,255,0.6);
                    font-size: 18px;
                    position: relative;
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .ht-notif-dot {
                    position: absolute;
                    top: 8px; right: 8px;
                    width: 7px; height: 7px;
                    background: #E31A2D;
                    border-radius: 50%;
                    border: 1.5px solid #0A0A0C;
                }

                /* ── CARD VISUAL ── */
                .ht-card-wrap {
                    padding: 8px 20px 0;
                }
                .ht-card {
                    border-radius: 20px;
                    padding: 22px 24px;
                    background: linear-gradient(135deg, #1C0A0F 0%, #2A0D15 40%, #1A0508 100%);
                    border: 1px solid rgba(227,26,45,0.2);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset;
                }
                .ht-card::before {
                    content: '';
                    position: absolute;
                    top: -40px; right: -40px;
                    width: 160px; height: 160px;
                    background: radial-gradient(circle, rgba(227,26,45,0.25) 0%, transparent 70%);
                    pointer-events: none;
                }
                .ht-card-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 24px 24px;
                }
                .ht-card-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    position: relative;
                }
                .ht-card-logo {
                    font-family: 'Syne', sans-serif;
                    font-size: 13px;
                    font-weight: 800;
                    letter-spacing: 3px;
                    color: rgba(255,255,255,0.9);
                }
                .ht-card-chip {
                    width: 32px; height: 24px;
                    border-radius: 5px;
                    background: linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c);
                    opacity: 0.85;
                }
                .ht-card-body {
                    position: relative;
                }
                .ht-card-label {
                    font-size: 10px;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.35);
                    margin-bottom: 2px;
                }
                .ht-card-amount {
                    font-family: 'Syne', sans-serif;
                    font-size: 28px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: -0.5px;
                }
                .ht-card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 20px;
                    position: relative;
                }
                .ht-card-holder-label {
                    font-size: 10px;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.3);
                    margin-bottom: 2px;
                }
                .ht-card-holder-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: rgba(255,255,255,0.75);
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    max-width: 160px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .ht-card-badge {
                    background: rgba(227,26,45,0.25);
                    border: 1px solid rgba(227,26,45,0.35);
                    border-radius: 8px;
                    padding: 4px 10px;
                    font-size: 10px;
                    font-weight: 600;
                    color: #ff6b7a;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }

                /* ── PURCHASE POWER ── */
                .ht-power-row {
                    margin: 14px 20px 0;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 14px;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .ht-power-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    background: #10B981;
                    box-shadow: 0 0 8px rgba(16,185,129,0.6);
                    flex-shrink: 0;
                }
                .ht-power-text {
                    font-size: 12px;
                    color: rgba(255,255,255,0.45);
                    font-weight: 400;
                }
                .ht-power-val {
                    margin-left: auto;
                    font-family: 'Syne', sans-serif;
                    font-size: 15px;
                    font-weight: 700;
                    color: #10B981;
                }

                /* ── QUICK ACTIONS ── */
                .ht-actions {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    padding: 20px 20px 0;
                }
                .ht-action {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 7px;
                    cursor: pointer;
                }
                .ht-action-icon {
                    width: 52px; height: 52px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    transition: transform 0.15s ease;
                }
                .ht-action:active .ht-action-icon {
                    transform: scale(0.92);
                }
                .ht-action-label {
                    font-size: 10px;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.45);
                }

                /* ── STATS ROW ── */
                .ht-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    padding: 20px 20px 0;
                }
                .ht-stat {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 16px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .ht-stat-icon {
                    font-size: 18px;
                    margin-bottom: 2px;
                }
                .ht-stat-label {
                    font-size: 11px;
                    letter-spacing: 0.5px;
                    color: rgba(255,255,255,0.35);
                    text-transform: uppercase;
                    font-weight: 500;
                }
                .ht-stat-value {
                    font-family: 'Syne', sans-serif;
                    font-size: 18px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: -0.3px;
                }

                /* ── PAYMENT CARD ── */
                .ht-payment {
                    margin: 20px 20px 0;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                }
                .ht-payment::before {
                    content: '';
                    position: absolute;
                    bottom: -30px; right: -30px;
                    width: 120px; height: 120px;
                    background: radial-gradient(circle, rgba(227,26,45,0.08) 0%, transparent 70%);
                }
                .ht-payment-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .ht-payment-left {}
                .ht-payment-top-label {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: rgba(255,255,255,0.35);
                    margin-bottom: 6px;
                    font-weight: 500;
                }
                .ht-payment-amount {
                    font-family: 'Syne', sans-serif;
                    font-size: 30px;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -1px;
                    line-height: 1;
                }
                .ht-payment-date {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 12px;
                    color: rgba(255,255,255,0.4);
                    margin-top: 6px;
                    font-weight: 400;
                }
                .ht-progress-ring {
                    width: 64px; height: 64px;
                    flex-shrink: 0;
                }
                .ht-progress-ring svg {
                    transform: rotate(-90deg);
                }
                .ht-ring-track {
                    stroke: rgba(255,255,255,0.08);
                    stroke-width: 2.5;
                    fill: none;
                }
                .ht-ring-fill {
                    stroke: #E31A2D;
                    stroke-width: 2.5;
                    fill: none;
                    stroke-linecap: round;
                    transition: stroke-dashoffset 0.6s ease;
                }
                .ht-ring-text {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Syne', sans-serif;
                    font-size: 12px;
                    font-weight: 700;
                    color: #fff;
                }
                .ht-progress-wrap {
                    position: relative;
                    width: 64px; height: 64px;
                }
                .ht-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.06);
                    margin-bottom: 16px;
                }
                .ht-payment-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                .ht-btn-primary {
                    background: #E31A2D;
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    padding: 13px 0;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    box-shadow: 0 6px 20px rgba(227,26,45,0.35);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                    letter-spacing: 0.2px;
                }
                .ht-btn-primary:active {
                    transform: scale(0.97);
                    box-shadow: 0 3px 10px rgba(227,26,45,0.25);
                }
                .ht-btn-secondary {
                    background: rgba(255,255,255,0.06);
                    color: rgba(255,255,255,0.7);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 13px 0;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    transition: transform 0.15s ease, background 0.15s ease;
                    letter-spacing: 0.2px;
                }
                .ht-btn-secondary:active {
                    transform: scale(0.97);
                    background: rgba(255,255,255,0.1);
                }

                /* ── INFO ALERT ── */
                .ht-alert {
                    margin: 14px 20px 0;
                    background: rgba(16,185,129,0.07);
                    border: 1px solid rgba(16,185,129,0.2);
                    border-radius: 14px;
                    padding: 13px 14px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .ht-alert-icon {
                    width: 32px; height: 32px;
                    border-radius: 10px;
                    background: rgba(16,185,129,0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 15px;
                    color: #10B981;
                    flex-shrink: 0;
                }
                .ht-alert-text {
                    font-size: 12px;
                    color: rgba(255,255,255,0.5);
                    line-height: 1.5;
                    font-weight: 400;
                }

                /* ── RESPONSIVIDADE ADICIONAL ── */
                @media (max-width: 360px) {
                    .ht-header { padding: 40px 16px 12px; }
                    .ht-card-wrap, .ht-actions, .ht-stats, .ht-payment, .ht-alert { padding-left: 16px; padding-right: 16px; }
                    .ht-action-icon { width: 46px; height: 46px; font-size: 18px; }
                    .ht-payment-amount { font-size: 26px; }
                    .ht-card { padding: 18px 20px; }
                }

                @media (min-width: 768px) {
                    .ht-root { max-width: 900px; margin: 0 auto; padding-bottom: 40px; }
                    .ht-actions { grid-template-columns: repeat(4, 1fr); gap: 20px; }
                    .ht-stats { grid-template-columns: repeat(2, 1fr); gap: 20px; }
                }
            `}</style>

            <div className="ht-root">
                {/* Header */}
                <div className="ht-header" data-tour="welcome">
                    <div>
                        <div className="ht-greeting">Bem-vindo de volta</div>
                        <h1 className="ht-name">Olá, {firstName}!</h1>
                    </div>
                </div>

                {/* Card Visual */}
                <div className="ht-card-wrap">
                    <div className="ht-card">
                        <div className="ht-card-grid"></div>
                        <div className="ht-card-top">
                            <span className="ht-card-logo">MM MAGAZINE</span>
                            <div className="ht-card-chip"></div>
                        </div>
                        <div className="ht-card-body">
                            <div className="ht-card-label">Nível de Pontualidade</div>
                            <div className="ht-card-amount" style={{ color: level.color }}>{level.label}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{level.description}</div>
                        </div>
                        <div className="ht-card-footer">
                            <div>
                                <div className="ht-card-holder-label">Titular</div>
                                <div className="ht-card-holder-name">{customerName || 'CLIENTE MM'}</div>
                            </div>
                            <div className="ht-card-badge" style={{ borderColor: level.color + '60', color: level.color }}>{level.label}</div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="ht-actions" data-tour="pix-action">
                    <div className="ht-action" onClick={() => setActiveTab('carnes')}>
                        <div className="ht-action-icon" style={{ background: 'rgba(227,26,45,0.12)', color: '#E31A2D' }}>
                            <i className="bi bi-qr-code-scan"></i>
                        </div>
                        <span className="ht-action-label">PIX</span>
                    </div>
                    <div className="ht-action" onClick={() => setActiveTab('carnes')}>
                        <div className="ht-action-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                            <i className="bi bi-upc-scan"></i>
                        </div>
                        <span className="ht-action-label">Boleto</span>
                    </div>
                    <div className="ht-action" onClick={() => setActiveTab('historico')}>
                        <div className="ht-action-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#FBBF24' }}>
                            <i className="bi bi-wallet-fill"></i>
                        </div>
                        <span className="ht-action-label">Extrato</span>
                    </div>
                    <div className="ht-action" onClick={() => setActiveTab('lojas')}>
                        <div className="ht-action-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#34D399' }}>
                            <i className="bi bi-shop"></i>
                        </div>
                        <span className="ht-action-label">Lojas</span>
                    </div>
                </div>

                {/* Next Payment */}
                {nextInstallment && (
                    <div className="ht-payment" data-tour="next-payment">
                        <div className="ht-payment-header">
                            <div className="ht-payment-left">
                                <div className="ht-payment-top-label">Próximo Vencimento</div>
                                <div className="ht-payment-amount">
                                    {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(nextInstallment.amount)}
                                </div>
                                <div className="ht-payment-date">
                                    <i className="bi bi-calendar3"></i>
                                    {new Date(nextInstallment.due_date + "T12:00:00").toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' })}
                                </div>
                                {nextInstallment.product_name && (
                                    <div className="ht-payment-product mt-1" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                                        <i className="bi bi-box-seam me-1"></i>
                                        {nextInstallment.product_name}
                                    </div>
                                )}
                            </div>
                            <div className="ht-progress-wrap">
                                <svg viewBox="0 0 36 36" width="64" height="64">
                                    <circle className="ht-ring-track" cx="18" cy="18" r="15.9155" />
                                    <circle
                                        className="ht-ring-fill"
                                        cx="18" cy="18" r="15.9155"
                                        style={{
                                            strokeDasharray: `${circumference}`,
                                            strokeDashoffset: `${dashOffset}`,
                                            transformOrigin: '18px 18px',
                                            transform: 'rotate(-90deg)',
                                        }}
                                    />
                                </svg>
                                <div className="ht-ring-text">{progress}%</div>
                            </div>
                        </div>

                        <div className="ht-divider"></div>

                        <div className="ht-payment-actions">
                            <button className="ht-btn-primary" onClick={() => openDetail(nextInstallment)}>
                                <i className="bi bi-cash-coin"></i>
                                Pagar Agora
                            </button>
                            <button className="ht-btn-secondary" onClick={() => {
                                setActiveTab('carnes');
                                setExpandedContract(Number(nextInstallment.contract_id));
                            }}>
                                <i className="bi bi-card-list"></i>
                                Ver Carnês
                            </button>
                        </div>
                    </div>
                )}

                {/* Info Alert */}
                <div className="ht-alert">
                    <div className="ht-alert-icon">
                        <i className="bi bi-graph-up-arrow"></i>
                    </div>
                    <div className="ht-alert-text">
                        Mantenha seus pagamentos em dia e aumente seu score para novos limites.
                    </div>
                </div>
            </div>
        </>
    )
}
