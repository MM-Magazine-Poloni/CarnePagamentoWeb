"use client"
import { useCallback, useEffect, useRef, useState } from "react"

const STORAGE_KEY = "mm_tour_completed"

interface Step {
    /** CSS selector for the spotlight target. null = centred modal (no spotlight). */
    selector: string | null
    placement: "top" | "bottom" | "center"
    icon: string
    iconColor: string
    label: string          // small eyebrow label
    title: string
    description: string
}

const STEPS: Step[] = [
    {
        selector: '[data-tour="welcome"]',
        placement: "bottom",
        icon: "bi-person-circle",
        iconColor: "#E31A2D",
        label: "Passo 1 de 4",
        title: "Bem-vindo ao seu Carnê Digital!",
        description: "Aqui você acompanha todas as suas parcelas com a MM Magazine — histórico, status e vencimentos em um só lugar.",
    },
    {
        selector: '[data-tour="next-payment"]',
        placement: "top",
        icon: "bi-calendar2-check-fill",
        iconColor: "#6366F1",
        label: "Passo 2 de 4",
        title: "Próxima parcela",
        description: "Este card mostra o valor e a data do seu próximo vencimento. Parcelas atrasadas aparecem destacadas em vermelho.",
    },
    {
        selector: '[data-tour="pix-action"]',
        placement: "bottom",
        icon: "bi-qr-code-scan",
        iconColor: "#10B981",
        label: "Passo 3 de 4",
        title: "Pague com PIX",
        description: "Toque em 'PIX' ou acesse 'Meus Carnês', escolha uma parcela e toque em 'Pagar com PIX'. O pagamento é confirmado na hora!",
    },
    {
        selector: '[data-tour="carnes-nav"]',
        placement: "top",
        icon: "bi-collection-fill",
        iconColor: "#F59E0B",
        label: "Passo 4 de 4",
        title: "Seus Carnês",
        description: "Acesse todas as suas parcelas aqui. Filtre por status (Pago, Em Aberto, Atrasado) e clique em qualquer parcela para ver o comprovante ou pagar.",
    },
]

interface Rect { x: number; y: number; w: number; h: number }

function resolveRect(selector: string | null, padding = 10): Rect | null {
    if (!selector) return null
    const el = document.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return null
    return {
        x: r.left - padding,
        y: r.top - padding,
        w: r.width + padding * 2,
        h: r.height + padding * 2,
    }
}

export default function ProductTour() {
    const [step, setStep] = useState(0)
    const [visible, setVisible] = useState(false)
    const [rect, setRect] = useState<Rect | null>(null)
    const [exiting, setExiting] = useState(false)
    const rafRef = useRef<number | null>(null)

    // ── Check localStorage on mount ─────────────────────────────────────────
    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            const t = setTimeout(() => setVisible(true), 900)
            return () => clearTimeout(t)
        }
    }, [])

    // ── Restart tour via custom event (dispatched from ProfileTab) ───────────
    useEffect(() => {
        const handler = () => {
            localStorage.removeItem(STORAGE_KEY)
            setStep(0)
            setExiting(false)
            setVisible(true)
        }
        window.addEventListener("mm:start-tour", handler)
        return () => window.removeEventListener("mm:start-tour", handler)
    }, [])

    // ── Track target element rect (live updates on scroll/resize) ────────────
    const updateRect = useCallback(() => {
        if (!visible) return
        const current = STEPS[step]
        const r = resolveRect(current.selector)
        setRect(r)
    }, [visible, step])

    useEffect(() => {
        updateRect()
        const onResize = () => updateRect()
        window.addEventListener("resize", onResize)
        window.addEventListener("scroll", onResize, true)
        return () => {
            window.removeEventListener("resize", onResize)
            window.removeEventListener("scroll", onResize, true)
        }
    }, [updateRect])

    // ── Scroll target element into view when step changes ───────────────────
    useEffect(() => {
        if (!visible) return
        const sel = STEPS[step].selector
        if (!sel) return
        const el = document.querySelector(sel)
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
        // re-measure after scroll settles
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
            setTimeout(updateRect, 350)
        })
    }, [step, visible, updateRect])

    const close = useCallback((markDone = true) => {
        setExiting(true)
        setTimeout(() => {
            setVisible(false)
            setExiting(false)
            if (markDone) localStorage.setItem(STORAGE_KEY, "1")
        }, 280)
    }, [])

    const next = () => {
        if (step < STEPS.length - 1) setStep(s => s + 1)
        else close(true)
    }
    const back = () => {
        if (step > 0) setStep(s => s - 1)
    }

    if (!visible) return null

    const current = STEPS[step]
    const vw = typeof window !== "undefined" ? window.innerWidth : 390
    const vh = typeof window !== "undefined" ? window.innerHeight : 844
    const isLast = step === STEPS.length - 1

    // ── Tooltip position ─────────────────────────────────────────────────────
    let tooltipStyle: React.CSSProperties
    const TT_W = Math.min(340, vw - 32)
    const TT_H_EST = 220 // estimated tooltip height

    if (!rect || current.placement === "center") {
        tooltipStyle = {
            position: "fixed",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: TT_W,
        }
    } else if (current.placement === "top") {
        const rawY = rect.y - TT_H_EST - 16
        const top = Math.max(16, rawY)
        tooltipStyle = {
            position: "fixed",
            top,
            left: Math.max(16, Math.min(vw - TT_W - 16, rect.x + rect.w / 2 - TT_W / 2)),
            width: TT_W,
        }
    } else {
        const rawY = rect.y + rect.h + 16
        const bottom = rawY + TT_H_EST > vh - 16 ? undefined : undefined
        tooltipStyle = {
            position: "fixed",
            top: Math.min(rawY, vh - TT_H_EST - 16),
            left: Math.max(16, Math.min(vw - TT_W - 16, rect.x + rect.w / 2 - TT_W / 2)),
            width: TT_W,
        }
    }

    return (
        <>
            <style suppressHydrationWarning>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

                .pt-overlay {
                    position: fixed; inset: 0;
                    z-index: 9990;
                    pointer-events: none;
                    transition: opacity 0.28s ease;
                }
                .pt-overlay.exiting { opacity: 0; }

                .pt-tooltip {
                    z-index: 9995;
                    background: #111114;
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 20px;
                    padding: 20px 20px 16px;
                    box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
                    font-family: 'DM Sans', sans-serif;
                    pointer-events: auto;
                    animation: ptSlideIn 0.28s cubic-bezier(0.34,1.36,0.64,1) both;
                    will-change: transform, opacity;
                }
                .pt-overlay.exiting .pt-tooltip { animation: ptSlideOut 0.24s ease both; }

                @keyframes ptSlideIn {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)   scale(1); }
                }
                @keyframes ptSlideOut {
                    to { opacity: 0; transform: scale(0.96); }
                }

                .pt-step-label {
                    font-size: 10px; font-weight: 700; letter-spacing: 2px;
                    text-transform: uppercase; color: rgba(255,255,255,0.35);
                    margin-bottom: 12px;
                }
                .pt-icon-row {
                    display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
                }
                .pt-icon {
                    width: 44px; height: 44px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 20px; flex-shrink: 0;
                }
                .pt-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 16px; font-weight: 700; color: #fff; line-height: 1.3;
                }
                .pt-desc {
                    font-size: 13px; color: rgba(255,255,255,0.55);
                    line-height: 1.55; margin-bottom: 16px;
                }

                /* Dots */
                .pt-dots {
                    display: flex; gap: 6px; align-items: center; margin-bottom: 14px;
                }
                .pt-dot {
                    height: 4px; border-radius: 99px;
                    background: rgba(255,255,255,0.15);
                    transition: all 0.25s ease;
                    flex-shrink: 0;
                }
                .pt-dot.active { background: #E31A2D; }

                /* Buttons */
                .pt-actions {
                    display: flex; align-items: center; justify-content: space-between; gap: 8px;
                }
                .pt-btn-skip {
                    background: none; border: none; cursor: pointer;
                    font-size: 12px; color: rgba(255,255,255,0.3); font-family: 'DM Sans', sans-serif;
                    padding: 4px 0; transition: color 0.15s;
                }
                .pt-btn-skip:hover { color: rgba(255,255,255,0.55); }
                .pt-btn-group { display: flex; gap: 8px; }
                .pt-btn-back {
                    padding: 10px 16px; border-radius: 11px;
                    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09);
                    color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600;
                    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s;
                }
                .pt-btn-back:hover { background: rgba(255,255,255,0.1); }
                .pt-btn-back:disabled { opacity: 0.3; cursor: default; }
                .pt-btn-next {
                    padding: 10px 20px; border-radius: 11px;
                    background: #E31A2D; border: none;
                    color: #fff; font-size: 13px; font-weight: 700;
                    cursor: pointer; font-family: 'DM Sans', sans-serif;
                    display: flex; align-items: center; gap: 6px;
                    box-shadow: 0 6px 18px rgba(227,26,45,0.3);
                    transition: transform 0.15s, box-shadow 0.15s;
                }
                .pt-btn-next:hover { box-shadow: 0 8px 22px rgba(227,26,45,0.4); }
                .pt-btn-next:active { transform: scale(0.97); box-shadow: none; }
                .pt-btn-next.finish { background: #10B981; box-shadow: 0 6px 18px rgba(16,185,129,0.3); }

                /* Arrow pointer from tooltip to element */
                .pt-arrow {
                    position: absolute; width: 0; height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    left: 50%; transform: translateX(-50%);
                }
                .pt-arrow.down {
                    top: -7px;
                    border-bottom: 8px solid #111114;
                }
                .pt-arrow.up {
                    bottom: -7px;
                    border-top: 8px solid #111114;
                }

                /* Pulse ring around target */
                @keyframes ptPulse {
                    0%   { box-shadow: 0 0 0 0 rgba(227,26,45,0.5); }
                    70%  { box-shadow: 0 0 0 12px rgba(227,26,45,0); }
                    100% { box-shadow: 0 0 0 0 rgba(227,26,45,0); }
                }
                .pt-pulse-ring {
                    position: fixed; border-radius: 14px;
                    border: 2px solid rgba(227,26,45,0.6);
                    animation: ptPulse 1.8s ease-out infinite;
                    pointer-events: none; z-index: 9992;
                    transition: all 0.3s ease;
                }
            `}</style>

            {/* ── Dark overlay with SVG spotlight cutout ──────────────────────── */}
            <svg
                className={`pt-overlay${exiting ? " exiting" : ""}`}
                width="100%" height="100%"
                xmlns="http://www.w3.org/2000/svg"
            >
                {rect ? (
                    <>
                        <defs>
                            <mask id="pt-mask">
                                <rect width="100%" height="100%" fill="white" />
                                <rect
                                    x={rect.x} y={rect.y}
                                    width={rect.w} height={rect.h}
                                    rx={12}
                                    fill="black"
                                />
                            </mask>
                        </defs>
                        <rect
                            width="100%" height="100%"
                            fill="rgba(0,0,0,0.8)"
                            mask="url(#pt-mask)"
                        />
                        {/* Spotlight border ring */}
                        <rect
                            x={rect.x} y={rect.y}
                            width={rect.w} height={rect.h}
                            rx={12}
                            fill="none"
                            stroke="rgba(255,255,255,0.18)"
                            strokeWidth="1.5"
                        />
                    </>
                ) : (
                    <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" />
                )}
            </svg>

            {/* ── Pulsing ring on target element ──────────────────────────────── */}
            {rect && (
                <div
                    className="pt-pulse-ring"
                    style={{
                        left: rect.x,
                        top: rect.y,
                        width: rect.w,
                        height: rect.h,
                        borderColor: current.iconColor + "99",
                    }}
                />
            )}

            {/* ── Tooltip card ─────────────────────────────────────────────────── */}
            <div
                className={`pt-tooltip${exiting ? " exiting" : ""}`}
                style={tooltipStyle}
            >
                {/* Arrow pointer */}
                {rect && current.placement === "bottom" && (
                    <div className="pt-arrow down" />
                )}
                {rect && current.placement === "top" && (
                    <div className="pt-arrow up" />
                )}

                {/* Step eyebrow */}
                <div className="pt-step-label">{current.label}</div>

                {/* Icon + title */}
                <div className="pt-icon-row">
                    <div
                        className="pt-icon"
                        style={{
                            background: current.iconColor + "1A",
                            border: `1px solid ${current.iconColor}33`,
                            color: current.iconColor,
                        }}
                    >
                        <i className={`bi ${current.icon}`}></i>
                    </div>
                    <div className="pt-title">{current.title}</div>
                </div>

                {/* Description */}
                <p className="pt-desc">{current.description}</p>

                {/* Dots */}
                <div className="pt-dots">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`pt-dot${i === step ? " active" : ""}`}
                            style={{ width: i === step ? 20 : 6 }}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="pt-actions">
                    <button className="pt-btn-skip" onClick={() => close(true)}>
                        Pular tour
                    </button>
                    <div className="pt-btn-group">
                        <button
                            className="pt-btn-back"
                            onClick={back}
                            disabled={step === 0}
                        >
                            Voltar
                        </button>
                        <button
                            className={`pt-btn-next${isLast ? " finish" : ""}`}
                            onClick={next}
                        >
                            {isLast ? (
                                <><i className="bi bi-check2-circle"></i> Começar!</>
                            ) : (
                                <>Próximo <i className="bi bi-arrow-right"></i></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
