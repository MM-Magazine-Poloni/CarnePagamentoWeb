import React from "react"
import type { Installment } from "../../lib/types"
import InstallmentCard from "../InstallmentCard"

interface InstallmentsTabProps {
    contracts: any[]
    stats: { totalAmount: number }
    nextInstallment: Installment | undefined
    installmentFilter: 'tudo' | 'aberto' | 'atrasado' | 'finalizados'
    setInstallmentFilter: (filter: 'tudo' | 'aberto' | 'atrasado' | 'finalizados') => void
    expandedContract: number | null
    setExpandedContract: (id: number | null) => void
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
    openDetail: (inst: Installment) => void
}

export const InstallmentsTab: React.FC<InstallmentsTabProps> = ({
    contracts,
    stats,
    nextInstallment,
    installmentFilter,
    setInstallmentFilter,
    expandedContract,
    setExpandedContract,
    setActiveTab,
    openDetail
}) => {
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

                .it-root {
                    font-family: 'DM Sans', sans-serif;
                    background: #0A0A0C;
                    min-height: 100%;
                    color: #fff;
                    padding-bottom: 100px;
                }

                /* ── HEADER ── */
                .it-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 52px 20px 16px;
                    position: relative;
                }
                .it-header::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 140px;
                    background: radial-gradient(ellipse 80% 100% at 50% -20%, rgba(227,26,45,0.15) 0%, transparent 70%);
                    pointer-events: none;
                }
                .it-icon-btn {
                    width: 38px; height: 38px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.08);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255,255,255,0.8);
                    font-size: 15px;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: background 0.15s ease;
                }
                .it-icon-btn:hover { background: rgba(255,255,255,0.1); }
                .it-title {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(17px, 5vw, 22px);
                    font-weight: 700;
                    color: #fff;
                    position: relative;
                }

                /* ── SUMMARY CARD ── */
                .it-summary {
                    margin: 0 20px 0;
                    border-radius: 20px;
                    padding: 22px 22px 20px;
                    background: linear-gradient(135deg, #1C0A0F 0%, #2A0D15 50%, #180508 100%);
                    border: 1px solid rgba(227,26,45,0.2);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.5);
                }
                .it-summary-grid {
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }
                .it-summary-glow {
                    position: absolute;
                    top: -50px; right: -50px;
                    width: 180px; height: 180px;
                    background: radial-gradient(circle, rgba(227,26,45,0.2) 0%, transparent 70%);
                    pointer-events: none;
                }
                .it-summary-label {
                    font-size: 10px;
                    letter-spacing: 2.5px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.7);
                    margin-bottom: 6px;
                    position: relative;
                }
                .it-summary-amount {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(22px, 6vw, 30px);
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -1px;
                    line-height: 1;
                    position: relative;
                }
                .it-summary-next {
                    margin-top: 14px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: rgba(255,255,255,0.75);
                    position: relative;
                }
                .it-summary-next-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: #E31A2D;
                    box-shadow: 0 0 6px rgba(227,26,45,0.7);
                    flex-shrink: 0;
                }

                /* ── FILTER PILLS ── */
                .it-filters {
                    display: flex;
                    gap: 8px;
                    padding: 20px 20px 0;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .it-filters::-webkit-scrollbar { display: none; }
                .it-pill {
                    flex-shrink: 0;
                    padding: 7px 16px;
                    border-radius: 99px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.04);
                    color: rgba(255,255,255,0.7);
                    font-family: 'DM Sans', sans-serif;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    letter-spacing: 0.2px;
                }
                .it-pill:hover:not(.active) {
                    background: rgba(255,255,255,0.07);
                    color: rgba(255,255,255,0.85);
                }
                .it-pill.active {
                    background: #E31A2D;
                    border-color: #E31A2D;
                    color: #fff;
                    font-weight: 600;
                    box-shadow: 0 4px 14px rgba(227,26,45,0.35);
                }
                .it-pill.pill-tudo.active {
                    background: #3B82F6;
                    border-color: #3B82F6;
                    box-shadow: 0 4px 14px rgba(59,130,246,0.35);
                }
                .it-pill.pill-aberto.active {
                    background: var(--status-open);
                    border-color: var(--status-open);
                    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
                }
                .it-pill.pill-atrasado.active {
                    background: var(--status-late);
                    border-color: var(--status-late);
                    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
                }
                .it-pill.pill-finalizados.active {
                    background: var(--status-paid);
                    border-color: var(--status-paid);
                    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
                }

                /* ── SECTIONS ── */
                .it-section-title {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    color: rgba(255,255,255,0.55);
                    font-weight: 700;
                    margin: 24px 20px 8px;
                }

                /* ── LIST ── */
                .it-list {
                    padding: 16px 20px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                /* ── EMPTY STATE ── */
                .it-empty {
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
                .it-empty-icon {
                    font-size: 40px;
                    color: rgba(255,255,255,0.15);
                }
                .it-empty-text {
                    font-size: 13px;
                    color: rgba(255,255,255,0.65);
                    text-align: center;
                    line-height: 1.5;
                }

                /* ── CONTRACT CARD ── */
                .it-contract {
                    background: linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 20px;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 4px;
                }
                .it-contract:hover {
                    border-color: rgba(255,255,255,0.12);
                    background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%);
                }
                .it-contract.expanded {
                    border-color: rgba(227,26,45,0.3);
                    background: linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.3);
                }
                .it-contract-head {
                    padding: 16px 16px 14px;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }

                .it-contract-top {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                .it-contract-icon {
                    width: 38px; height: 38px;
                    border-radius: 10px;
                    background: rgba(227,26,45,0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 17px;
                    color: #E31A2D;
                    flex-shrink: 0;
                    box-shadow: inset 0 0 12px rgba(227,26,45,0.05);
                }
                .it-contract-meta {
                    flex: 1;
                    min-width: 0;
                }
                .it-contract-meta-label {
                    font-size: 10px;
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.65);
                    font-weight: 500;
                }
                .it-contract-num {
                    font-family: 'Syne', sans-serif;
                    font-size: 13px;
                    font-weight: 700;
                    color: #fff;
                    line-height: 1.2;
                }
                .it-chevron {
                    width: 28px; height: 28px;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.06);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: rgba(255,255,255,0.7);
                    font-size: 12px;
                    flex-shrink: 0;
                    transition: background 0.15s ease, color 0.15s ease, transform 0.2s ease;
                }
                .it-contract.expanded .it-chevron {
                    background: rgba(227,26,45,0.15);
                    color: #E31A2D;
                    transform: rotate(180deg);
                }

                .it-contract-row2 {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .it-contract-balance-label {
                    font-size: 10px;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.7);
                    font-weight: 600;
                    margin-bottom: 3px;
                }
                .it-contract-balance {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(16px, 4.5vw, 20px);
                    font-weight: 800;
                    color: #fff;
                    line-height: 1;
                    letter-spacing: -0.5px;
                }
                .it-badges {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 6px;
                }
                .it-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 10px;
                    font-weight: 700;
                    white-space: nowrap;
                    letter-spacing: 0.2px;
                }
                .it-badge-late {
                    background: rgba(227,26,45,0.15);
                    color: #ff6b7a;
                    border: 1px solid rgba(227,26,45,0.25);
                }
                .it-badge-open {
                    background: rgba(245,158,11,0.12);
                    color: #FBBF24;
                    border: 1px solid rgba(245,158,11,0.2);
                }
                .it-badge-paid {
                    background: rgba(16,185,129,0.1);
                    color: #34D399;
                    border: 1px solid rgba(16,185,129,0.2);
                }

                .it-progress {
                    height: 4px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 999px;
                    overflow: hidden;
                    margin-top: 4px;
                }
                .it-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #E31A2D, #ff6b7a);
                    border-radius: 999px;
                    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .it-contract-body {
                    padding: 0 16px 20px;
                    animation: itFadeIn 0.3s ease;
                }
                @keyframes itFadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .it-inst-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                }
                @media (min-width: 480px) {
                    .it-inst-grid { display: grid; grid-template-columns: 1fr 1fr; }
                }
                @media (min-width: 900px) {
                    .it-inst-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
                }
                @media (min-width: 1200px) {
                    .it-inst-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
                }

                /* ── RESPONSIVIDADE ADICIONAL ── */
                @media (max-width: 360px) {
                    .it-header { padding: 36px 16px 16px; }
                    .it-summary { margin: 0 16px 0; padding: 20px; }
                    .it-filters { padding: 16px 16px 0; }
                    .it-section-title { margin: 20px 16px 8px; }
                    .it-list { padding: 16px 16px 0; }
                    .it-contract-head { padding: 16px; }
                    .it-contract-balance { font-size: 18px; }
                }

                @media (min-width: 768px) {
                    .it-root { max-width: 900px; margin: 0 auto; padding-bottom: 40px; }
                }
            `}</style>

            <div className="it-root">
                {/* Header */}
                <div className="it-header">
                    <button className="it-icon-btn" onClick={() => setActiveTab('inicio')}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <span className="it-title">Meus Carnês</span>
                    <button className="it-icon-btn" onClick={() => setActiveTab('suporte')}>
                        <i className="bi bi-question-circle"></i>
                    </button>
                </div>

                {/* Summary Card */}
                <div className="it-summary">
                    <div className="it-summary-grid"></div>
                    <div className="it-summary-glow"></div>
                    <div className="it-summary-label">Total Restante</div>
                    <div className="it-summary-amount">
                        {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalAmount)}
                    </div>
                    {nextInstallment && (
                        <div className="it-summary-next">
                            <span className="it-summary-next-dot"></span>
                            Próximo vencimento:&nbsp;
                            <strong style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                                {new Date(nextInstallment.due_date + "T12:00:00").toLocaleDateString("pt-BR", { day: 'numeric', month: 'short' })}
                            </strong>
                        </div>
                    )}
                </div>

                {/* Filter Pills */}
                <div className="it-filters">
                    {(['tudo', 'aberto', 'atrasado', 'finalizados'] as const).map((f) => (
                        <button
                            key={f}
                            className={`it-pill pill-${f}${installmentFilter === f ? ' active' : ''}`}
                            onClick={() => setInstallmentFilter(f)}
                        >
                            {f === 'tudo' ? 'Tudo' : f === 'aberto' ? 'Em Aberto' : f === 'atrasado' ? 'Atrasados' : 'Finalizados'}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="it-list">
                    {contracts.length === 0 ? (
                        <div className="it-empty">
                            <i className="bi bi-folder-x it-empty-icon"></i>
                            <p className="it-empty-text">Nenhum contrato ativo encontrado no momento.</p>
                        </div>
                    ) : (
                        (() => {
                            // Separar contratos em ativos e finalizados
                            const activeContracts = contracts.filter(c => 
                                c.installments.some((i: Installment) => i.status !== 'pago')
                            );
                            const finishedContracts = contracts.filter(c => 
                                c.installments.every((i: Installment) => i.status === 'pago')
                            );

                            // Decidir o que exibir com base no filtro
                            let displayList: any[] = [];
                            let showActiveSection = false;
                            let showFinishedSection = false;

                            if (installmentFilter === 'finalizados') {
                                displayList = finishedContracts;
                            } else if (installmentFilter === 'aberto' || installmentFilter === 'atrasado') {
                                displayList = activeContracts;
                            } else {
                                // 'tudo' - mostrar ambos com títulos de seção
                                displayList = [...activeContracts, ...finishedContracts];
                                if (activeContracts.length > 0 && finishedContracts.length > 0) {
                                    showActiveSection = true;
                                    showFinishedSection = true;
                                }
                            }

                            if (displayList.length === 0) {
                                return (
                                    <div className="it-empty">
                                        <i className="bi bi-folder-x it-empty-icon"></i>
                                        <p className="it-empty-text">Nenhum contrato encontrado para este filtro.</p>
                                    </div>
                                );
                            }

                            return (
                                <>
                                    {showActiveSection && <div className="it-section-title">Contratos Ativos</div>}
                                    {activeContracts.map((c) => {
                                        // Somente renderizar se estiver no displayList
                                        if (!displayList.includes(c)) return null;
                                        
                                        const filteredInstallments = c.installments
                                            .filter((i: Installment) => {
                                                const isLate = i.status === 'atrasado';
                                                
                                                if (installmentFilter === 'tudo' || installmentFilter === 'finalizados') return true
                                                if (installmentFilter === 'aberto') return i.status === 'pendente'
                                                if (installmentFilter === 'atrasado') return isLate
                                                return true
                                            })
                                            .sort((a: Installment, b: Installment) =>
                                                new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                                            )

                                        if (filteredInstallments.length === 0) return null;
                                        return renderContract(c, filteredInstallments);
                                    })}

                                    {showFinishedSection && <div className="it-section-title">Contratos Finalizados</div>}
                                    {finishedContracts.map((c) => {
                                        if (!displayList.includes(c)) return null;
                                        
                                        const filteredInstallments = c.installments
                                            .sort((a: Installment, b: Installment) =>
                                                new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
                                            )

                                        return renderContract(c, filteredInstallments);
                                    })}
                                </>
                            );
                        })()
                    )}
                </div>
            </div>
        </>
    )

    function renderContract(c: any, filteredInstallments: Installment[]) {
        const lateCount   = filteredInstallments.filter((i: Installment) => i.status === 'atrasado').length
        const totalValue  = filteredInstallments
            .filter((i: Installment) => i.status !== 'pago')
            .reduce((acc: number, i: Installment) => acc + i.amount, 0)
        const isExpanded  = expandedContract === c.pvenum
        const progressPct = (c.installments.filter((i: Installment) => i.status === 'pago').length / (c.installments.length || 1)) * 100
        const isFinished  = c.installments.every((i: Installment) => i.status === 'pago');

        return (
            <div key={c.pvenum} className={`it-contract${isExpanded ? ' expanded' : ''}${isFinished ? ' finished' : ''}`}>
                <div
                    className="it-contract-head"
                    onClick={() => setExpandedContract(isExpanded ? null : c.pvenum)}
                >
                    {/* Top row */}
                    <div className="it-contract-top">
                        <div className="it-contract-icon" style={isFinished ? { background: 'rgba(16,185,129,0.12)', color: '#10B981' } : {}}>
                            <i className={`bi bi-file-earmark-${isFinished ? 'check' : 'text'}-fill`}></i>
                        </div>
                        <div className="it-contract-meta">
                            <div className="it-contract-meta-label">Contrato</div>
                            <div className="it-contract-num">Nº {c.pvenum}</div>
                            {c.installments?.[0]?.product_name && (
                                <div className="it-contract-product" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: '2px' }}>
                                    {c.installments[0].product_name}
                                </div>
                            )}
                        </div>
                        <div className="it-chevron">
                            <i className="bi bi-chevron-down"></i>
                        </div>
                    </div>

                    {/* Balance + badges */}
                    <div className="it-contract-row2">
                        <div>
                            <div className="it-contract-balance-label">{isFinished ? 'Valor Total Pago' : 'Saldo restante'}</div>
                            <div className="it-contract-balance" style={isFinished ? { color: '#10B981' } : {}}>
                                {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(isFinished ? c.installments.reduce((acc: number, i: any) => acc + i.amount, 0) : totalValue)}
                            </div>
                        </div>
                        <div className="it-badges">
                            {isFinished ? (
                                <span className="it-badge it-badge-paid" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--status-paid)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                    <i className="bi bi-check-all"></i> FINALIZADO
                                </span>
                            ) : (
                                <>
                                    {lateCount > 0 && (
                                        <span className="it-badge it-badge-late" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ff6b7a', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                                            <i className="bi bi-exclamation-circle-fill"></i>
                                            {lateCount} {lateCount === 1 ? 'atrasada' : 'atrasadas'}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="it-progress">
                        <div className="it-progress-fill" style={{ width: `${progressPct}%`, background: isFinished ? '#10B981' : '' }}></div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="it-contract-body">
                        <div className="it-inst-grid">
                            {filteredInstallments.map((inst: Installment) => (
                                <InstallmentCard
                                    key={inst.id}
                                    installment={inst}
                                    onClick={() => openDetail(inst)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }
}
