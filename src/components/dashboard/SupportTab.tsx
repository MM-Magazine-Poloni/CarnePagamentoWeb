import React, { useState } from "react"

interface SupportTabProps {
    setActiveTab: (tab: 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') => void
}

const WHATSAPP_NUMBER = "5517996261658"
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

const faqs = [
    {
        icon: "bi-receipt-cutoff",
        question: "Como pago meu carnê?",
        answer: "Você pode pagar via PIX diretamente pelo app. Basta acessar a parcela desejada, clicar em 'Pagar Agora' e usar o QR Code ou a chave PIX gerada."
    },
    {
        icon: "bi-clock-history",
        question: "Taxas e juros por atraso",
        answer: "Parcelas em atraso não geram juros."
    },
    {
        icon: "bi-shield-check",
        question: "Segurança dos meus dados",
        answer: "Seu CPF nunca é armazenado no dispositivo. A autenticação utiliza tokens criptografados com validade de 2 horas para sua proteção."
    },
    {
        icon: "bi-shop",
        question: "Onde ficam as lojas físicas?",
        answer: "Acesse a aba 'Lojas' no menu principal para visualizar endereços, horários de funcionamento e telefone de cada unidade."
    },
]

export const SupportTab: React.FC<SupportTabProps> = ({ setActiveTab }) => {
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    const [search, setSearch] = useState("")

    const filtered = faqs.filter(f =>
        f.question.toLowerCase().includes(search.toLowerCase()) ||
        f.answer.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

                .sp-root {
                    font-family: 'DM Sans', sans-serif;
                    background: #0A0A0C;
                    min-height: 100%;
                    color: #fff;
                    padding-bottom: 100px;
                }

                /* ── HEADER ── */
                .sp-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 52px 20px 16px;
                    position: relative;
                }
                .sp-header::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 160px;
                    background: radial-gradient(ellipse 80% 100% at 50% -20%, rgba(227,26,45,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .sp-icon-btn {
                    width: 38px; height: 38px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.08);
                    display: flex; align-items: center; justify-content: center;
                    color: rgba(255,255,255,0.7); font-size: 15px; cursor: pointer;
                    flex-shrink: 0; transition: background 0.15s;
                }
                .sp-icon-btn:hover { background: rgba(255,255,255,0.1); }
                .sp-header-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 17px; font-weight: 700;
                    color: #fff; position: relative;
                }
                .sp-spacer { width: 38px; }

                /* ── HERO TEXT ── */
                .sp-hero-text {
                    padding: 4px 20px 20px;
                }
                .sp-hero-title {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(22px, 6vw, 28px);
                    font-weight: 800;
                    color: #fff;
                    line-height: 1.15;
                    margin-bottom: 6px;
                }
                .sp-hero-title span { color: #E31A2D; }
                .sp-hero-sub {
                    font-size: 13px;
                    color: rgba(255,255,255,0.4);
                    line-height: 1.5;
                }

                /* ── WHATSAPP CARD ── */
                .sp-wa-card {
                    margin: 0 20px 20px;
                    background: linear-gradient(135deg, #071a10 0%, #0d2e1c 50%, #051209 100%);
                    border: 1px solid rgba(37,211,102,0.25);
                    border-radius: 20px;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    text-decoration: none;
                    display: block;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                    -webkit-tap-highlight-color: transparent;
                }
                .sp-wa-card:hover {
                    border-color: rgba(37,211,102,0.4);
                    box-shadow: 0 12px 40px rgba(37,211,102,0.1);
                }
                .sp-wa-card:active {
                    transform: scale(0.99);
                }
                .sp-wa-bg {
                    position: absolute;
                    right: -16px; bottom: -24px;
                    font-size: 110px;
                    color: rgba(37,211,102,0.07);
                    pointer-events: none;
                    line-height: 1;
                }
                .sp-wa-glow {
                    position: absolute;
                    top: -40px; right: -40px;
                    width: 160px; height: 160px;
                    background: radial-gradient(circle, rgba(37,211,102,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .sp-wa-top {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    margin-bottom: 12px;
                    position: relative;
                }
                .sp-wa-icon {
                    width: 48px; height: 48px;
                    border-radius: 14px;
                    background: rgba(37,211,102,0.15);
                    border: 1px solid rgba(37,211,102,0.25);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 22px;
                    color: #25D366;
                    flex-shrink: 0;
                }
                .sp-wa-name-wrap { flex: 1; }
                .sp-wa-name {
                    font-family: 'Syne', sans-serif;
                    font-size: 17px; font-weight: 700;
                    color: #fff;
                }
                .sp-wa-badge {
                    display: inline-flex; align-items: center; gap: 4px;
                    background: rgba(37,211,102,0.12);
                    border: 1px solid rgba(37,211,102,0.25);
                    border-radius: 999px;
                    padding: 3px 10px;
                    font-size: 9px; font-weight: 700;
                    color: #25D366;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    margin-top: 4px;
                }
                .sp-wa-badge-dot {
                    width: 5px; height: 5px;
                    border-radius: 50%;
                    background: #25D366;
                    box-shadow: 0 0 6px rgba(37,211,102,0.7);
                    animation: spPulse 1.5s ease-in-out infinite;
                }
                @keyframes spPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                .sp-wa-desc {
                    font-size: 13px;
                    color: rgba(255,255,255,0.5);
                    line-height: 1.5;
                    position: relative;
                }
                .sp-wa-cta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 14px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #25D366;
                    position: relative;
                }

                /* ── SEARCH ── */
                .sp-search-wrap {
                    margin: 0 20px 24px;
                    position: relative;
                }
                .sp-search-icon {
                    position: absolute;
                    left: 14px; top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255,255,255,0.3);
                    font-size: 14px;
                    pointer-events: none;
                }
                .sp-search {
                    width: 100%;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 14px;
                    padding: 13px 14px 13px 40px;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 13px;
                    color: #fff;
                    outline: none;
                    transition: border-color 0.15s, background 0.15s;
                    box-sizing: border-box;
                }
                .sp-search::placeholder { color: rgba(255,255,255,0.25); }
                .sp-search:focus {
                    border-color: rgba(227,26,45,0.35);
                    background: rgba(255,255,255,0.07);
                }

                /* ── FAQ ── */
                .sp-faq-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 20px;
                    margin-bottom: 12px;
                }
                .sp-faq-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 15px; font-weight: 700;
                    color: rgba(255,255,255,0.85);
                }
                .sp-faq-all {
                    font-size: 11px; font-weight: 700;
                    color: #E31A2D; letter-spacing: 0.5px;
                    cursor: pointer; text-transform: uppercase;
                }

                .sp-faq-list {
                    padding: 0 20px;
                    display: flex; flex-direction: column; gap: 8px;
                }

                .sp-faq-item {
                    background: #111114;
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 16px;
                    overflow: hidden;
                    transition: border-color 0.15s;
                }
                .sp-faq-item.open {
                    border-color: rgba(227,26,45,0.25);
                }
                .sp-faq-q {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
                .sp-faq-q-icon {
                    width: 34px; height: 34px; border-radius: 10px;
                    background: rgba(227,26,45,0.1);
                    border: 1px solid rgba(227,26,45,0.15);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 15px; color: #E31A2D; flex-shrink: 0;
                }
                .sp-faq-q-text {
                    flex: 1;
                    font-size: 13px; font-weight: 600;
                    color: rgba(255,255,255,0.85);
                    line-height: 1.3;
                }
                .sp-faq-q-chevron {
                    font-size: 12px;
                    color: rgba(255,255,255,0.3);
                    transition: transform 0.2s ease;
                    flex-shrink: 0;
                }
                .sp-faq-item.open .sp-faq-q-chevron {
                    transform: rotate(180deg);
                    color: #E31A2D;
                }
                .sp-faq-answer {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease, padding 0.2s ease;
                }
                .sp-faq-item.open .sp-faq-answer {
                    max-height: 200px;
                }
                .sp-faq-answer-inner {
                    padding: 0 16px 14px 62px;
                    font-size: 13px;
                    color: rgba(255,255,255,0.45);
                    line-height: 1.6;
                }

                /* ── STORE LINK ── */
                .sp-store-link {
                    margin: 20px 20px 0;
                    background: #111114;
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 16px;
                    padding: 14px 16px;
                    display: flex; align-items: center; gap: 12px;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                    transition: background 0.15s;
                }
                .sp-store-link:hover { background: rgba(255,255,255,0.05); }
                .sp-store-icon {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.08);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 16px; color: rgba(255,255,255,0.5);
                    flex-shrink: 0;
                }
                .sp-store-text { flex: 1; }
                .sp-store-title {
                    font-size: 12px; font-weight: 700;
                    color: rgba(255,255,255,0.75);
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }
                .sp-store-sub {
                    font-size: 11px;
                    color: rgba(255,255,255,0.3);
                    margin-top: 1px;
                }

                /* ── RESPONSIVE ── */
                @media (max-width: 360px) {
                    .sp-header { padding: 36px 14px 14px; }
                    .sp-hero-text { padding: 4px 14px 16px; }
                    .sp-wa-card { margin: 0 14px 16px; padding: 16px; }
                    .sp-search-wrap { margin: 0 14px 20px; }
                    .sp-faq-header { padding: 0 14px; }
                    .sp-faq-list { padding: 0 14px; }
                    .sp-store-link { margin: 16px 14px 0; }
                    .sp-faq-answer-inner { padding-left: 52px; }
                }
                @media (min-width: 768px) {
                    .sp-root { max-width: 700px; margin: 0 auto; padding-bottom: 40px; }
                }
            `}</style>

            <div className="sp-root">
                {/* Header */}
                <div className="sp-header">
                    <button className="sp-icon-btn" onClick={() => setActiveTab('inicio')}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <span className="sp-header-title">Suporte</span>
                    <div className="sp-spacer"></div>
                </div>

                {/* Hero */}
                <div className="sp-hero-text">
                    <div className="sp-hero-title">
                        Como podemos te<br />
                        <span>ajudar hoje?</span>
                    </div>
                    <div className="sp-hero-sub">Gerencie seus carnês da MM Magazine rapidamente.</div>
                </div>

                {/* WhatsApp Card */}
                <a className="sp-wa-card" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <div className="sp-wa-glow"></div>
                    <div className="sp-wa-top">
                        <div className="sp-wa-icon">
                            <i className="bi bi-whatsapp"></i>
                        </div>
                        <div className="sp-wa-name-wrap">
                            <div className="sp-wa-name">WhatsApp</div>
                            <div className="sp-wa-badge">
                                <div className="sp-wa-badge-dot"></div>
                                Online agora
                            </div>
                        </div>
                    </div>
                    <div className="sp-wa-desc">
                        Fale agora com um consultor via contato direto.
                    </div>
                    <div className="sp-wa-cta">
                        <i className="bi bi-arrow-right-circle-fill"></i>
                        Iniciar conversa · (17) 99626-1658
                    </div>
                    <div className="sp-wa-bg">
                        <i className="bi bi-whatsapp"></i>
                    </div>
                </a>

                {/* Search */}
                <div className="sp-search-wrap">
                    <i className="bi bi-search sp-search-icon"></i>
                    <input
                        type="text"
                        className="sp-search"
                        placeholder="Pesquise por dúvidas, parcelas..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* FAQ */}
                <div className="sp-faq-header">
                    <span className="sp-faq-title">Perguntas Frequentes</span>
                    <span className="sp-faq-all">Ver Tudo</span>
                </div>
                <div className="sp-faq-list">
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                            Nenhuma dúvida encontrada.
                        </div>
                    ) : (
                        filtered.map((faq, idx) => (
                            <div
                                key={idx}
                                className={`sp-faq-item${openFaq === idx ? ' open' : ''}`}
                            >
                                <div className="sp-faq-q" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                                    <div className="sp-faq-q-icon">
                                        <i className={`bi ${faq.icon}`}></i>
                                    </div>
                                    <span className="sp-faq-q-text">{faq.question}</span>
                                    <i className="bi bi-chevron-down sp-faq-q-chevron"></i>
                                </div>
                                <div className="sp-faq-answer">
                                    <div className="sp-faq-answer-inner">{faq.answer}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Store link */}
                <div className="sp-store-link" onClick={() => setActiveTab('lojas')}>
                    <div className="sp-store-icon">
                        <i className="bi bi-shop"></i>
                    </div>
                    <div className="sp-store-text">
                        <div className="sp-store-title">Encontrar uma loja física</div>
                        <div className="sp-store-sub">Localize a MM Magazine mais próxima</div>
                    </div>
                    <i className="bi bi-chevron-right" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}></i>
                </div>
            </div>
        </>
    )
}
