import React from "react"
import type { Installment } from "../../lib/types"

interface HistoryTabProps {
    contracts: any[]
    stats: { paid: number; total: number; totalAmount: number }
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
    setSelectedInstallment: (inst: Installment) => void
    setScreenMode: (mode: 'none' | 'detail' | 'payment' | 'history_detail') => void
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
    contracts,
    stats,
    setActiveTab,
    setSelectedInstallment,
    setScreenMode
}) => {
    const progressPct = (stats.paid / (stats.total || 1)) * 100
    const circumference = 2 * Math.PI * 15.9155
    const dashOffset = circumference - (progressPct / 100) * circumference

    const paidInstallments = contracts
        .flatMap(c => c.installments)
        .filter((i: Installment) => i.status === 'pago')
        .sort((a: Installment, b: Installment) => {
            const dA = a.payment_date || a.due_date
            const dB = b.payment_date || b.due_date
            return new Date(dB + "T12:00:00").getTime() - new Date(dA + "T12:00:00").getTime()
        })

    const grouped = new Map<string, { label: string; items: Installment[] }>()
    for (const inst of paidInstallments) {
        const d = new Date((inst.payment_date || inst.due_date) + "T12:00:00")
        const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
        if (!grouped.has(key)) {
            grouped.set(key, {
                label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                items: []
            })
        }
        grouped.get(key)!.items.push(inst)
    }

    const methodIcon: Record<string, string> = {
        PIX: 'bi-qr-code-scan',
        BOLETO: 'bi-upc-scan',
        CARTAO: 'bi-credit-card-fill',
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

                .hy-root {
                    font-family: 'DM Sans', sans-serif;
                    background: #0A0A0C;
                    min-height: 100%;
                    color: #fff;
                    padding-bottom: 100px;
                }

                /* ── HEADER ── */
                .hy-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 52px 20px 16px;
                    position: relative;
                }
                .hy-header::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 140px;
                    background: radial-gradient(ellipse 80% 100% at 50% -20%, rgba(227,26,45,0.13) 0%, transparent 70%);
                    pointer-events: none;
                }
                .hy-icon-btn {
                    width: 38px; height: 38px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255,255,255,0.6);
                    font-size: 15px;
                    cursor: pointer;
                    transition: background 0.15s ease;
                }
                .hy-icon-btn:hover { background: rgba(255,255,255,0.1); }
                .hy-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 17px;
                    font-weight: 700;
                    color: #fff;
                    position: relative;
                }
                .hy-spacer { width: 38px; }

                /* ── PROGRESS CARD ── */
                .hy-progress-card {
                    margin: 0 20px;
                    border-radius: 20px;
                    padding: 20px;
                    background: linear-gradient(135deg, #1C0A0F 0%, #2A0D15 50%, #180508 100%);
                    border: 1px solid rgba(227,26,45,0.2);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
                }
                .hy-progress-grid {
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }
                .hy-progress-glow {
                    position: absolute;
                    top: -40px; right: -40px;
                    width: 160px; height: 160px;
                    background: radial-gradient(circle, rgba(227,26,45,0.18) 0%, transparent 70%);
                    pointer-events: none;
                }
                .hy-progress-inner {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    position: relative;
                    margin-bottom: 16px;
                }
                .hy-ring-wrap {
                    position: relative;
                    width: 72px; height: 72px;
                    flex-shrink: 0;
                }
                .hy-ring-wrap svg {
                    width: 72px; height: 72px;
                }
                .hy-ring-track {
                    stroke: rgba(255,255,255,0.07);
                    stroke-width: 2.5;
                    fill: none;
                }
                .hy-ring-fill {
                    stroke: #E31A2D;
                    stroke-width: 2.5;
                    fill: none;
                    stroke-linecap: round;
                    transition: stroke-dashoffset 0.5s ease;
                    transform-origin: 18px 18px;
                    transform: rotate(-90deg);
                }
                .hy-ring-label {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Syne', sans-serif;
                    font-size: 13px;
                    font-weight: 700;
                    color: #fff;
                }
                .hy-progress-text { flex: 1; }
                .hy-progress-top-label {
                    font-size: 10px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.3);
                    margin-bottom: 6px;
                    font-weight: 500;
                }
                .hy-progress-count {
                    font-family: 'Syne', sans-serif;
                    font-size: 28px;
                    font-weight: 800;
                    letter-spacing: -1px;
                    line-height: 1;
                    color: #fff;
                }
                .hy-progress-count-sep {
                    color: rgba(255,255,255,0.2);
                    font-weight: 400;
                    margin: 0 2px;
                }
                .hy-progress-sub {
                    font-size: 11px;
                    color: rgba(255,255,255,0.35);
                    margin-top: 4px;
                }
                .hy-progress-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.07);
                    position: relative;
                    margin-bottom: 16px;
                }
                .hy-progress-balance-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                }
                .hy-balance-label {
                    font-size: 10px;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.3);
                    margin-bottom: 3px;
                    font-weight: 500;
                }
                .hy-balance-value {
                    font-family: 'Syne', sans-serif;
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: -0.5px;
                }
                .hy-bar {
                    height: 3px;
                    background: rgba(255,255,255,0.07);
                    border-radius: 99px;
                    overflow: hidden;
                    position: relative;
                }
                .hy-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #E31A2D, #ff6b7a);
                    border-radius: 99px;
                    transition: width 0.5s ease;
                }

                /* ── TIMELINE ── */
                .hy-timeline {
                    padding: 20px 20px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .hy-month-label {
                    font-size: 10px;
                    letter-spacing: 2.5px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.25);
                    font-weight: 600;
                    margin-bottom: 10px;
                    padding-left: 2px;
                }

                .hy-month-items {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .hy-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 14px;
                    padding: 13px 14px;
                    cursor: pointer;
                    transition: background 0.15s ease, border-color 0.15s ease;
                    -webkit-tap-highlight-color: transparent;
                }
                .hy-item:hover {
                    background: rgba(255,255,255,0.07);
                    border-color: rgba(255,255,255,0.11);
                }
                .hy-item:active {
                    background: rgba(255,255,255,0.09);
                }

                .hy-item-icon {
                    width: 38px; height: 38px;
                    border-radius: 11px;
                    background: rgba(16,185,129,0.1);
                    border: 1px solid rgba(16,185,129,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    color: #34D399;
                    flex-shrink: 0;
                }

                .hy-item-info { flex: 1; min-width: 0; }
                .hy-item-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #fff;
                    line-height: 1.2;
                    margin-bottom: 2px;
                }
                .hy-item-sub {
                    font-size: 11px;
                    color: rgba(255,255,255,0.35);
                    font-weight: 400;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .hy-item-right {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 4px;
                    flex-shrink: 0;
                }
                .hy-item-amount {
                    font-family: 'Syne', sans-serif;
                    font-size: 14px;
                    font-weight: 700;
                    color: #34D399;
                    letter-spacing: -0.3px;
                }
                .hy-item-arrow {
                    color: rgba(255,255,255,0.2);
                    font-size: 11px;
                }

                /* ── EMPTY ── */
                .hy-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    gap: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 20px;
                }
                .hy-empty-icon {
                    font-size: 40px;
                    color: rgba(255,255,255,0.12);
                }
                .hy-empty-text {
                    font-size: 13px;
                    color: rgba(255,255,255,0.3);
                    text-align: center;
                    line-height: 1.5;
                }
            `}</style>

            <div className="hy-root">
                {/* Header */}
                <div className="hy-header">
                    <button className="hy-icon-btn" onClick={() => setActiveTab('inicio')}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <span className="hy-title">Histórico</span>
                    <div className="hy-spacer"></div>
                </div>

                {/* Progress Card */}
                <div className="hy-progress-card">
                    <div className="hy-progress-grid"></div>
                    <div className="hy-progress-glow"></div>

                    <div className="hy-progress-inner">
                        {/* Ring */}
                        <div className="hy-ring-wrap">
                            <svg viewBox="0 0 36 36">
                                <circle className="hy-ring-track" cx="18" cy="18" r="15.9155" />
                                <circle
                                    className="hy-ring-fill"
                                    cx="18" cy="18" r="15.9155"
                                    style={{
                                        strokeDasharray: `${circumference}`,
                                        strokeDashoffset: `${dashOffset}`,
                                    }}
                                />
                            </svg>
                            <div className="hy-ring-label">{Math.round(progressPct)}%</div>
                        </div>

                        {/* Text */}
                        <div className="hy-progress-text">
                            <div className="hy-progress-top-label">Progresso do Carnê</div>
                            <div className="hy-progress-count">
                                {String(stats.paid).padStart(2, '0')}
                                <span className="hy-progress-count-sep">/</span>
                                {String(stats.total).padStart(2, '0')}
                            </div>
                            <div className="hy-progress-sub">parcelas pagas</div>
                        </div>
                    </div>

                    <div className="hy-progress-divider"></div>

                    <div className="hy-progress-balance-row">
                        <div>
                            <div className="hy-balance-label">Saldo Restante</div>
                            <div className="hy-balance-value">
                                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalAmount)}
                            </div>
                        </div>
                        <div style={{ width: '120px' }}>
                            <div className="hy-bar">
                                <div className="hy-bar-fill" style={{ width: `${progressPct}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="hy-timeline">
                    {paidInstallments.length === 0 ? (
                        <div className="hy-empty">
                            <i className="bi bi-clock-history hy-empty-icon"></i>
                            <p className="hy-empty-text">Nenhum pagamento realizado ainda.</p>
                        </div>
                    ) : (
                        Array.from(grouped.entries()).map(([key, { label, items }]) => (
                            <div key={key}>
                                <div className="hy-month-label">{label}</div>
                                <div className="hy-month-items">
                                    {items.map((inst: Installment) => {
                                        const payDate = inst.payment_date || inst.due_date
                                        const dateStr = new Date(payDate + "T12:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                                        const method = (inst.payment_method || 'PIX').toUpperCase()
                                        const icon = methodIcon[method] || 'bi-receipt-cutoff'

                                        return (
                                            <div
                                                key={inst.id}
                                                className="hy-item"
                                                onClick={() => {
                                                    setSelectedInstallment(inst)
                                                    setScreenMode('history_detail')
                                                }}
                                            >
                                                <div className="hy-item-icon">
                                                    <i className={`bi ${icon}`}></i>
                                                </div>
                                                <div className="hy-item-info">
                                                    <div className="hy-item-title">
                                                        Parcela {String(inst.index).padStart(2, '0')}
                                                    </div>
                                                    <div className="hy-item-sub">
                                                        {dateStr} · {method}
                                                    </div>
                                                </div>
                                                <div className="hy-item-right">
                                                    <div className="hy-item-amount">
                                                        {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(inst.amount)}
                                                    </div>
                                                    <i className="bi bi-chevron-right hy-item-arrow"></i>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    )
}
