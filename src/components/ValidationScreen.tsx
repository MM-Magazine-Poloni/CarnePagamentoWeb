"use client"
import { useRef, useState, useEffect } from "react"
import { apiService } from "../services/frontend/apiService"

interface ValidationScreenProps {
    token: string
    onValidated: (sessionToken: string) => void
    expired?: boolean
}

export default function ValidationScreen({ token, onValidated, expired = false }: ValidationScreenProps) {
    const [digits, setDigits] = useState<string[]>(["", "", "", ""])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(expired ? "Sua sessão expirou. Confirme novamente." : null)
    const [shake, setShake] = useState(false)
    const ref0 = useRef<HTMLInputElement>(null)
    const ref1 = useRef<HTMLInputElement>(null)
    const ref2 = useRef<HTMLInputElement>(null)
    const ref3 = useRef<HTMLInputElement>(null)
    const inputRefs = [ref0, ref1, ref2, ref3]

    useEffect(() => {
        inputRefs[0].current?.focus()
    }, [])

    const handleChange = (idx: number, value: string) => {
        if (!/^\d?$/.test(value)) return
        const next = [...digits]
        next[idx] = value
        setDigits(next)
        setError(null)
        if (value && idx < 3) {
            inputRefs[idx + 1].current?.focus()
        }
        if (next.every(d => d !== "") && idx === 3) {
            submit(next.join(""))
        }
    }

    const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[idx] && idx > 0) {
            inputRefs[idx - 1].current?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
        if (pasted.length === 4) {
            const next = pasted.split("")
            setDigits(next)
            inputRefs[3].current?.focus()
            submit(pasted)
        }
    }

    const submit = async (cpfFinal: string) => {
        if (cpfFinal.length !== 4 || loading) return
        setLoading(true)
        setError(null)

        try {
            const result = await apiService.validateCpf(token, cpfFinal)

            if (result.autorizado && result.sessionToken) {
                onValidated(result.sessionToken)
            } else {
                setError("CPF incorreto. Tente novamente.")
                setDigits(["", "", "", ""])
                setShake(true)
                setTimeout(() => setShake(false), 600)
                setTimeout(() => inputRefs[0].current?.focus(), 50)
            }
        } catch {
            setError("Erro de conexão. Tente novamente.")
            setDigits(["", "", "", ""])
            setTimeout(() => inputRefs[0].current?.focus(), 50)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        submit(digits.join(""))
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

                .vs-root {
                    font-family: 'DM Sans', sans-serif;
                    background: #0A0A0C;
                    min-height: 100dvh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 24px 20px;
                    position: relative;
                    overflow: hidden;
                }
                .vs-root::before {
                    content: '';
                    position: absolute;
                    top: -80px; left: 50%; transform: translateX(-50%);
                    width: 600px; height: 400px;
                    background: radial-gradient(ellipse, rgba(227,26,45,0.1) 0%, transparent 70%);
                    pointer-events: none;
                }

                .vs-card {
                    width: 100%; max-width: 360px;
                    background: #111114;
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 24px;
                    padding: 36px 28px 32px;
                    position: relative;
                    z-index: 1;
                }

                .vs-brand {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 28px;
                }
                .vs-brand-dot {
                    width: 10px; height: 10px;
                    border-radius: 50%;
                    background: #E31A2D;
                    box-shadow: 0 0 10px rgba(227,26,45,0.7);
                }
                .vs-brand-name {
                    font-family: 'Syne', sans-serif;
                    font-size: 18px;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.3px;
                }

                .vs-lock-icon {
                    width: 60px; height: 60px;
                    border-radius: 18px;
                    background: rgba(227,26,45,0.1);
                    border: 1px solid rgba(227,26,45,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: #E31A2D;
                    margin: 0 auto 20px;
                }

                .vs-title {
                    font-family: 'Syne', sans-serif;
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                    text-align: center;
                    margin-bottom: 8px;
                    line-height: 1.3;
                }
                .vs-subtitle {
                    font-size: 13px;
                    color: rgba(255,255,255,0.45);
                    text-align: center;
                    margin-bottom: 32px;
                    line-height: 1.5;
                }

                .vs-digits {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin-bottom: 12px;
                }
                .vs-digit-input {
                    width: 62px; height: 68px;
                    background: rgba(255,255,255,0.04);
                    border: 1.5px solid rgba(255,255,255,0.1);
                    border-radius: 16px;
                    text-align: center;
                    font-family: 'Syne', sans-serif;
                    font-size: 26px;
                    font-weight: 700;
                    color: #fff;
                    caret-color: #E31A2D;
                    outline: none;
                    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
                    -webkit-appearance: none;
                    appearance: none;
                    inputmode: numeric;
                }
                .vs-digit-input:focus {
                    border-color: #E31A2D;
                    background: rgba(227,26,45,0.06);
                    box-shadow: 0 0 0 3px rgba(227,26,45,0.12);
                }
                .vs-digit-input.filled {
                    border-color: rgba(255,255,255,0.2);
                }

                @keyframes vsShake {
                    0%, 100% { transform: translateX(0); }
                    15%       { transform: translateX(-8px); }
                    30%       { transform: translateX(8px); }
                    45%       { transform: translateX(-6px); }
                    60%       { transform: translateX(6px); }
                    75%       { transform: translateX(-4px); }
                    90%       { transform: translateX(4px); }
                }
                .vs-digits.shake { animation: vsShake 0.55s ease; }
                .vs-digits.shake .vs-digit-input { border-color: #E31A2D; }

                .vs-error {
                    font-size: 12px;
                    color: #F87171;
                    text-align: center;
                    min-height: 18px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                }
                .vs-error.expired { color: #FBBF24; }

                .vs-btn {
                    width: 100%;
                    padding: 15px;
                    border-radius: 14px;
                    background: #E31A2D;
                    color: #fff;
                    font-family: 'DM Sans', sans-serif;
                    font-size: 14px;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    box-shadow: 0 8px 24px rgba(227,26,45,0.28);
                    transition: transform 0.15s, opacity 0.15s;
                }
                .vs-btn:disabled { opacity: 0.55; cursor: not-allowed; }
                .vs-btn:not(:disabled):active { transform: scale(0.97); }

                .vs-hint {
                    text-align: center;
                    font-size: 11px;
                    color: rgba(255,255,255,0.25);
                    margin-top: 20px;
                    line-height: 1.5;
                }
                .vs-hint strong { color: rgba(255,255,255,0.4); font-weight: 600; }

                .vs-spinner {
                    width: 18px; height: 18px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: vsSpin 0.6s linear infinite;
                }
                @keyframes vsSpin { to { transform: rotate(360deg); } }

                @media (max-width: 380px) {
                    .vs-card { padding: 28px 18px 28px; }
                    .vs-digits { gap: 8px; }
                    .vs-digit-input { width: 54px; height: 60px; font-size: 22px; border-radius: 14px; }
                }
                @media (max-width: 320px) {
                    .vs-card { padding: 24px 14px 24px; }
                    .vs-digits { gap: 6px; }
                    .vs-digit-input { width: 48px; height: 54px; font-size: 20px; border-radius: 12px; }
                }
            `}</style>

            <div className="vs-root">
                <div className="vs-card">
                    {/* Brand */}
                    <div className="vs-brand">
                        <div className="vs-brand-dot"></div>
                        <span className="vs-brand-name">MM Magazine</span>
                    </div>

                    {/* Lock icon */}
                    <div className="vs-lock-icon">
                        <i className="bi bi-shield-lock-fill"></i>
                    </div>

                    <div className="vs-title">Confirme sua identidade</div>
                    <div className="vs-subtitle">
                        Digite os <strong style={{ color: "rgba(255,255,255,0.7)" }}>4 primeiros dígitos</strong><br />
                        do seu CPF para acessar
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Digit inputs */}
                        <div className={`vs-digits${shake ? " shake" : ""}`} onPaste={handlePaste}>
                            {digits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={inputRefs[i]}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={1}
                                    value={d}
                                    className={`vs-digit-input${d ? " filled" : ""}`}
                                    onChange={e => handleChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    autoComplete="off"
                                    disabled={loading}
                                    aria-label={`Dígito ${i + 1} do CPF`}
                                />
                            ))}
                        </div>

                        {/* Error */}
                        <div className={`vs-error${expired && !error?.includes("incorreto") ? " expired" : ""}`}>
                            {error && (
                                <>
                                    <i className={`bi ${expired && !error.includes("incorreto") ? "bi-clock-history" : "bi-exclamation-circle-fill"}`}
                                        style={{ fontSize: 12 }}></i>
                                    {error}
                                </>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="vs-btn"
                            disabled={loading || digits.some(d => d === "")}
                        >
                            {loading ? (
                                <><div className="vs-spinner"></div> Verificando...</>
                            ) : (
                                <><i className="bi bi-arrow-right-circle-fill"></i> Confirmar</>
                            )}
                        </button>
                    </form>

                    <div className="vs-hint">
                        <i className="bi bi-lock-fill me-1"></i>
                        Seus dados são protegidos.<br />
                        <strong>CPF nunca é armazenado nesta tela.</strong>
                    </div>
                </div>
            </div>
        </>
    )
}
