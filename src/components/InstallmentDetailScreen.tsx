"use client"
import { useEffect, useRef, useCallback } from "react"
import type { Installment } from "../lib/types"

export default function InstallmentDetailScreen({
    installment,
    onBack,
    onPay,
    onHelp
}: {
    installment: Installment
    onBack: () => void
    onPay: () => void
    onHelp?: () => void
}) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0
        }
    }, [installment])

    const totalAmount = installment.amount + (installment.fine_amount || 0)
    const isPaid = installment.status === "pago"
    const isLate = installment.status === "atrasado"

    const parseDate = (d: string) => new Date(d + "T12:00:00")

    const dueDate = parseDate(installment.due_date)
    dueDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysOverdue = isLate
        ? Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000))
        : 0

    const fmt = (d: string | null | undefined) =>
        d ? parseDate(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"
    const fmtLong = (d: string | null | undefined) =>
        d ? parseDate(d).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : null

    const dueLong = fmtLong(installment.due_date) || "—"
    const paidLong = fmtLong(installment.payment_date)
    const orderNumber = `MM-${String(installment.pcrnot || 0).padStart(8, "0")}`
    const payMethod = installment.payment_method?.toUpperCase() || "PIX"
    const currency = (v: number) => Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)

    // ── Canvas-based receipt image ────────────────────────────────────────────
    const buildReceiptCanvas = useCallback((): HTMLCanvasElement => {
        const W = 390
        const rows: [string, string][] = [
            ["Parcela", `${String(installment.index).padStart(2, "0")} de ${String(installment.count).padStart(2, "0")}`],
            ["Contrato", String(installment.pcrnot || "—")],
            ["Produto", installment.product_name || "Compra MM Magazine"],
            ["Data da compra", fmt(installment.purchase_date)],
            ["Vencimento", fmt(installment.due_date)],
            ["Método de pagamento", payMethod],
            ...(paidLong ? [["Data do pagamento", paidLong] as [string, string]] : []),
        ]
        if (installment.fine_amount) {
            rows.push(["Valor base", currency(installment.amount)])
            rows.push(["Multa / juros", `+ ${currency(installment.fine_amount)}`])
        }

        const ROW_H = 36
        const H = 120 + 160 + 32 + rows.length * ROW_H + 80 + 80
        const dpr = 2
        const canvas = document.createElement("canvas")
        canvas.width = W * dpr
        canvas.height = H * dpr
        canvas.style.width = `${W}px`
        canvas.style.height = `${H}px`
        const ctx = canvas.getContext("2d")!
        ctx.scale(dpr, dpr)

        // Background
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, W, H)

        // Red header
        const hdrH = 120
        ctx.fillStyle = "#E31A2D"
        ctx.beginPath()
        ctx.roundRect(0, 0, W, hdrH + 20, [0, 0, 0, 0])
        ctx.fill()

        // Header text
        ctx.fillStyle = "#fff"
        ctx.font = "bold 20px Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("MM Magazine", W / 2, 48)
        ctx.font = "13px Arial, sans-serif"
        ctx.fillStyle = "rgba(255,255,255,0.8)"
        ctx.fillText("Comprovante de Pagamento", W / 2, 72)
        ctx.fillText(orderNumber, W / 2, 94)

        // Green circle
        const circleY = hdrH + 50
        ctx.fillStyle = "#DCFCE7"
        ctx.beginPath()
        ctx.arc(W / 2, circleY, 40, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = "#22C55E"
        ctx.lineWidth = 3
        ctx.stroke()

        // Checkmark
        ctx.strokeStyle = "#16A34A"
        ctx.lineWidth = 4
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()
        ctx.moveTo(W / 2 - 14, circleY)
        ctx.lineTo(W / 2 - 4, circleY + 12)
        ctx.lineTo(W / 2 + 16, circleY - 14)
        ctx.stroke()

        // Paid label
        const labelY = circleY + 58
        ctx.fillStyle = "#16A34A"
        ctx.font = "bold 11px Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("PARCELA PAGA", W / 2, labelY)

        // Amount
        ctx.fillStyle = "#111827"
        ctx.font = "bold 34px Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(currency(totalAmount), W / 2, labelY + 42)

        // Date
        if (paidLong) {
            ctx.fillStyle = "#6B7280"
            ctx.font = "13px Arial, sans-serif"
            ctx.fillText(`Pago em ${paidLong}`, W / 2, labelY + 64)
        }

        // Dashed separator
        const sepY = hdrH + 210
        ctx.setLineDash([6, 6])
        ctx.strokeStyle = "#E5E7EB"
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(20, sepY)
        ctx.lineTo(W - 20, sepY)
        ctx.stroke()
        ctx.setLineDash([])

        // Receipt rows
        const rowStartY = sepY + 16
        rows.forEach(([label, value], i) => {
            const y = rowStartY + i * ROW_H
            // Row separator
            if (i > 0) {
                ctx.strokeStyle = "#F3F4F6"
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(20, y - 4)
                ctx.lineTo(W - 20, y - 4)
                ctx.stroke()
            }
            ctx.fillStyle = "#9CA3AF"
            ctx.font = "12px Arial, sans-serif"
            ctx.textAlign = "left"
            ctx.fillText(label, 20, y + 14)
            ctx.fillStyle = "#111827"
            ctx.font = "bold 13px Arial, sans-serif"
            ctx.textAlign = "right"
            ctx.fillText(value, W - 20, y + 14)
        })

        // Total bar
        const totalY = rowStartY + rows.length * ROW_H + 12
        ctx.fillStyle = "#F9FAFB"
        ctx.beginPath()
        ctx.roundRect(16, totalY, W - 32, 48, [12])
        ctx.fill()
        ctx.fillStyle = "#374151"
        ctx.font = "bold 13px Arial, sans-serif"
        ctx.textAlign = "left"
        ctx.fillText("Total pago", 30, totalY + 28)
        ctx.fillStyle = "#16A34A"
        ctx.font = "bold 18px Arial, sans-serif"
        ctx.textAlign = "right"
        ctx.fillText(currency(totalAmount), W - 30, totalY + 28)

        // Footer
        const footerY = totalY + 68
        ctx.fillStyle = "#D1D5DB"
        ctx.font = "11px Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(`Gerado em ${new Date().toLocaleString("pt-BR")}`, W / 2, footerY)
        ctx.fillText("mm-magazine.com.br", W / 2, footerY + 18)

        return canvas
    }, [installment, currency, fmt, orderNumber, payMethod, paidLong, totalAmount])

    const handleDownload = useCallback(() => {
        const canvas = buildReceiptCanvas()
        const link = document.createElement("a")
        link.download = `comprovante-${orderNumber}.png`
        link.href = canvas.toDataURL("image/png", 1.0)
        link.click()
    }, [buildReceiptCanvas, orderNumber])

    const shareText = `✅ *Comprovante MM Magazine*\n\nParcela: ${String(installment.index).padStart(2, "0")}/${String(installment.count).padStart(2, "0")}\nContrato: ${installment.pcrnot}\nProduto: ${installment.product_name || "Compra MM Magazine"}\nValor: ${currency(totalAmount)}\nPago em: ${paidLong || "—"}\nMétodo: ${payMethod}\nPedido: ${orderNumber}`

    const handleShare = useCallback(async () => {
        if (typeof navigator === "undefined") return
        if (navigator.share) {
            try {
                const canvas = buildReceiptCanvas()
                canvas.toBlob(async (blob) => {
                    if (!blob) return
                    const file = new File([blob], `comprovante-${orderNumber}.png`, { type: "image/png" })
                    if (navigator.canShare?.({ files: [file] })) {
                        await navigator.share({ files: [file], title: "Comprovante MM Magazine" })
                    } else {
                        await navigator.share({ title: "Comprovante MM Magazine", text: shareText })
                    }
                }, "image/png")
            } catch { /* cancelled */ }
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText)
        }
    }, [buildReceiptCanvas, orderNumber, shareText])

    // ─────────────────────────────────────────────────────────────────────────
    // PAID LAYOUT — receipt / comprovante
    // ─────────────────────────────────────────────────────────────────────────
    if (isPaid) {
        return (
            <div ref={scrollContainerRef} className="detail-screen" style={{ background: "#0A0A0C" }}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
                    .ds-root { font-family: 'DM Sans', sans-serif; }
                    .ds-receipt-header {
                        display: flex; align-items: center; justify-content: space-between;
                        padding: 52px 20px 16px; position: sticky; top: 0; z-index: 10;
                        background: #0A0A0C;
                    }
                    .ds-receipt-header::before {
                        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 120px;
                        background: radial-gradient(ellipse 80% 100% at 50% -20%, rgba(16,185,129,0.12) 0%, transparent 70%);
                        pointer-events: none;
                    }
                    .ds-icon-btn {
                        width: 38px; height: 38px; border-radius: 11px;
                        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
                        display: flex; align-items: center; justify-content: center;
                        color: rgba(255,255,255,0.75); font-size: 15px; cursor: pointer;
                        transition: background 0.15s; flex-shrink: 0;
                    }
                    .ds-icon-btn:hover { background: rgba(255,255,255,0.1); }
                    .ds-icon-btn:active { transform: scale(0.92); }
                    .ds-header-title {
                        font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #fff;
                        position: relative;
                    }
                    .ds-header-actions { display: flex; gap: 8px; }

                    /* Hero */
                    .ds-hero {
                        margin: 0 16px 20px;
                        background: linear-gradient(135deg, #071a11 0%, #0d2e1c 50%, #061610 100%);
                        border: 1px solid rgba(16,185,129,0.2);
                        border-radius: 20px; padding: 28px 20px 24px; text-align: center;
                        position: relative; overflow: hidden;
                        box-shadow: 0 16px 48px rgba(0,0,0,0.5);
                    }
                    .ds-hero::before {
                        content: ''; position: absolute; top: -40px; right: -40px;
                        width: 160px; height: 160px; border-radius: 50%;
                        background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%);
                    }
                    .ds-hero::after {
                        content: ''; position: absolute; bottom: -30px; left: -30px;
                        width: 120px; height: 120px; border-radius: 50%;
                        background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
                    }
                    .ds-hero-inner { position: relative; z-index: 1; }
                    .ds-hero-check {
                        width: 64px; height: 64px; border-radius: 50%;
                        background: rgba(16,185,129,0.15); border: 2px solid rgba(16,185,129,0.4);
                        display: flex; align-items: center; justify-content: center;
                        margin: 0 auto 14px; font-size: 28px; color: #34D399;
                    }
                    .ds-hero-label {
                        font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
                        text-transform: uppercase; color: #34D399; margin-bottom: 6px;
                    }
                    .ds-hero-amount {
                        font-family: 'Syne', sans-serif; font-size: clamp(28px, 8vw, 36px);
                        font-weight: 800; color: #fff; letter-spacing: -1.5px; line-height: 1;
                    }
                    .ds-hero-date {
                        font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 6px;
                    }
                    .ds-hero-method {
                        display: inline-flex; align-items: center; gap: 5px;
                        margin-top: 12px; padding: 5px 14px; border-radius: 999px;
                        background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2);
                        font-size: 11px; font-weight: 600; color: #6EE7B7;
                    }

                    /* Receipt card */
                    .ds-receipt-card {
                        margin: 0 16px 20px;
                        background: #111114;
                        border: 1px solid rgba(255,255,255,0.07);
                        border-radius: 20px; overflow: hidden;
                    }
                    .ds-receipt-top {
                        padding: 18px 18px 14px;
                        display: flex; align-items: center; gap: 12px;
                        border-bottom: 1px solid rgba(255,255,255,0.06);
                    }
                    .ds-product-icon {
                        width: 42px; height: 42px; border-radius: 12px;
                        background: rgba(227,26,45,0.1); border: 1px solid rgba(227,26,45,0.15);
                        display: flex; align-items: center; justify-content: center;
                        font-size: 18px; color: #E31A2D; flex-shrink: 0;
                    }
                    .ds-product-name {
                        font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9);
                        line-height: 1.3;
                    }
                    .ds-product-order {
                        font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px;
                        font-family: 'DM Mono', monospace, 'DM Sans', sans-serif;
                    }

                    /* Dashed tear */
                    .ds-tear {
                        display: flex; align-items: center; gap: 0;
                        margin: 0;
                    }
                    .ds-tear-circle {
                        width: 18px; height: 18px; border-radius: 50%; background: #0A0A0C;
                        flex-shrink: 0;
                    }
                    .ds-tear-line {
                        flex: 1; border: none; border-top: 2px dashed rgba(255,255,255,0.08);
                    }

                    .ds-rows { padding: 6px 0 4px; }
                    .ds-row {
                        display: flex; justify-content: space-between; align-items: center;
                        padding: 11px 18px; border-bottom: 1px solid rgba(255,255,255,0.04);
                    }
                    .ds-row:last-child { border-bottom: none; }
                    .ds-row-label { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 400; }
                    .ds-row-value { font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 600; text-align: right; max-width: 55%; }
                    .ds-row-value.red { color: #F87171; }

                    .ds-total-bar {
                        margin: 4px 12px 12px;
                        padding: 14px 16px; border-radius: 14px;
                        background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15);
                        display: flex; justify-content: space-between; align-items: center;
                    }
                    .ds-total-label { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.7); }
                    .ds-total-value {
                        font-family: 'Syne', sans-serif; font-size: 20px;
                        font-weight: 800; color: #34D399;
                    }

                    /* Action buttons */
                    .ds-actions {
                        display: grid; grid-template-columns: 1fr 1fr;
                        gap: 10px; padding: 0 16px 32px;
                    }
                    .ds-action-btn {
                        display: flex; align-items: center; justify-content: center; gap: 8px;
                        padding: 14px 16px; border-radius: 14px; font-size: 13px; font-weight: 600;
                        cursor: pointer; transition: all 0.15s; border: none;
                        font-family: 'DM Sans', sans-serif;
                    }
                    .ds-action-btn:active { transform: scale(0.96); }
                    .ds-action-btn.download {
                        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
                        color: rgba(255,255,255,0.85);
                    }
                    .ds-action-btn.download:hover { background: rgba(255,255,255,0.09); }
                    .ds-action-btn.share {
                        background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2);
                        color: #6EE7B7;
                    }
                    .ds-action-btn.share:hover { background: rgba(16,185,129,0.18); }

                    @media (max-width: 360px) {
                        .ds-receipt-header { padding: 40px 16px 14px; }
                        .ds-hero { margin: 0 12px 16px; }
                        .ds-receipt-card { margin: 0 12px 16px; }
                        .ds-actions { padding: 0 12px 28px; }
                    }
                `}</style>

                <div className="ds-root">
                    {/* Header */}
                    <div className="ds-receipt-header">
                        <button className="ds-icon-btn" onClick={onBack}>
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        <span className="ds-header-title">Comprovante</span>
                        <div className="ds-header-actions">
                            <button className="ds-icon-btn" onClick={handleShare} title="Compartilhar">
                                <i className="bi bi-share"></i>
                            </button>
                            <button className="ds-icon-btn" onClick={handleDownload} title="Baixar">
                                <i className="bi bi-download"></i>
                            </button>
                        </div>
                    </div>

                    {/* Hero */}
                    <div className="ds-hero">
                        <div className="ds-hero-inner">
                            <div className="ds-hero-check">
                                <i className="bi bi-check-lg"></i>
                            </div>
                            <div className="ds-hero-label">Parcela Paga</div>
                            <div className="ds-hero-amount">{currency(totalAmount)}</div>
                            {paidLong && <div className="ds-hero-date">Pago em {paidLong}</div>}
                            <div className="ds-hero-method">
                                <i className={`bi ${payMethod === "BOLETO" ? "bi-upc" : "bi-qr-code"}`}></i>
                                {payMethod}
                            </div>
                        </div>
                    </div>

                    {/* Receipt card */}
                    <div className="ds-receipt-card">
                        {/* Product row */}
                        <div className="ds-receipt-top">
                            <div className="ds-product-icon">
                                <i className="bi bi-bag-fill"></i>
                            </div>
                            <div>
                                <div className="ds-product-name">{installment.product_name || "Compra MM Magazine"}</div>
                                <div className="ds-product-order">{orderNumber}</div>
                            </div>
                        </div>

                        {/* Tear line */}
                        <div className="ds-tear">
                            <div className="ds-tear-circle" style={{ marginLeft: -9 }}></div>
                            <div className="ds-tear-line"></div>
                            <div className="ds-tear-circle" style={{ marginRight: -9 }}></div>
                        </div>

                        {/* Rows */}
                        <div className="ds-rows">
                            {([
                                ["Parcela", `${String(installment.index).padStart(2, "0")} de ${String(installment.count).padStart(2, "0")}`],
                                ["Contrato", String(installment.pcrnot || "—")],
                                ["Data da compra", fmt(installment.purchase_date)],
                                ["Vencimento", dueLong],
                                paidLong ? ["Data do pagamento", paidLong] : null,
                                installment.fine_amount ? ["Valor base", currency(installment.amount)] : null,
                                installment.fine_amount ? ["Multa / juros", `+ ${currency(installment.fine_amount)}`] : null,
                            ] as ([string, string] | null)[])
                                .filter((r): r is [string, string] => r !== null)
                                .map(([label, value]) => (
                                    <div key={label} className="ds-row">
                                        <span className="ds-row-label">{label}</span>
                                        <span className={`ds-row-value${label === "Multa / juros" ? " red" : ""}`}>{value}</span>
                                    </div>
                                ))}
                        </div>

                        {/* Total */}
                        <div className="ds-total-bar">
                            <span className="ds-total-label">Total pago</span>
                            <span className="ds-total-value">{currency(totalAmount)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="ds-actions">
                        <button className="ds-action-btn download" onClick={handleDownload}>
                            <i className="bi bi-download"></i>
                            Baixar
                        </button>
                        <button className="ds-action-btn share" onClick={handleShare}>
                            <i className="bi bi-share-fill"></i>
                            Compartilhar
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UNPAID LAYOUT — pending or late
    // ─────────────────────────────────────────────────────────────────────────
    const accentHex = "#E31A2D"
    const accentDim = "rgba(227,26,45,0.12)"
    const accentBorder = "rgba(227,26,45,0.25)"
    const heroGrad = "linear-gradient(135deg, #1C0A0F 0%, #2A0D15 50%, #180508 100%)"

    return (
        <div ref={scrollContainerRef} className="detail-screen" style={{ background: "#0A0A0C" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

                @keyframes ds-fadeSlide {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes ds-pulse-red {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(227,26,45,0.4); }
                    50%      { box-shadow: 0 0 0 8px rgba(227,26,45,0);  }
                }
                @keyframes ds-shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }

                .ds-root { font-family: 'DM Sans', sans-serif; }

                /* ── Header ── */
                .ds-unpaid-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 52px 20px 16px; position: sticky; top: 0; z-index: 10;
                    background: #0A0A0C;
                }
                .ds-unpaid-header::before {
                    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 160px;
                    background: radial-gradient(ellipse 90% 100% at 50% -10%, rgba(227,26,45,0.2) 0%, transparent 70%);
                    pointer-events: none;
                }
                .ds-icon-btn {
                    width: 38px; height: 38px; border-radius: 11px;
                    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
                    display: flex; align-items: center; justify-content: center;
                    color: rgba(255,255,255,0.75); font-size: 15px; cursor: pointer;
                    transition: background 0.15s; flex-shrink: 0;
                }
                .ds-icon-btn:hover { background: rgba(255,255,255,0.1); }
                .ds-icon-btn:active { transform: scale(0.92); }
                .ds-header-title {
                    font-family: 'Syne', sans-serif; font-size: 16px;
                    font-weight: 700; color: #fff; position: relative;
                }

                /* ── Value hero ── */
                .ds-value-hero {
                    margin: 0 16px 14px;
                    background: linear-gradient(135deg, #1C0A0F 0%, #2E0D17 45%, #180508 100%);
                    border: 1px solid rgba(227,26,45,0.28);
                    border-radius: 24px; padding: 24px 22px;
                    position: relative; overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset;
                    animation: ds-fadeSlide 0.35s ease both;
                }
                /* grade sutil */
                .ds-value-hero::after {
                    content: ''; position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
                    background-size: 28px 28px;
                    pointer-events: none;
                }
                /* glow top-right */
                .ds-hero-glow {
                    position: absolute; top: -50px; right: -50px;
                    width: 180px; height: 180px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(227,26,45,0.22) 0%, transparent 65%);
                    pointer-events: none;
                }
                /* glow bottom-left */
                .ds-hero-glow2 {
                    position: absolute; bottom: -40px; left: -40px;
                    width: 140px; height: 140px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(227,26,45,0.1) 0%, transparent 65%);
                    pointer-events: none;
                }
                .ds-vh-inner { position: relative; z-index: 1; }
                .ds-vh-top {
                    display: flex; justify-content: space-between;
                    align-items: flex-start; margin-bottom: 18px;
                }
                .ds-vh-parcela-lbl {
                    font-size: 10px; font-weight: 600; letter-spacing: 2.5px;
                    text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 5px;
                }
                .ds-vh-parcela-val {
                    font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800;
                    color: #fff; line-height: 1;
                }
                .ds-vh-parcela-val span { font-size: 15px; color: rgba(255,255,255,0.35); font-weight: 400; margin-left: 2px; }

                /* status pill */
                .ds-vh-status-pill {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 6px 13px; border-radius: 999px;
                    background: rgba(227,26,45,0.15); border: 1px solid rgba(227,26,45,0.3);
                    font-size: 11px; font-weight: 700; white-space: nowrap;
                    color: #FC8181;
                }
                .ds-vh-status-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: #E31A2D;
                    ${isLate ? "animation: ds-pulse-red 1.8s ease infinite;" : ""}
                }

                /* amount */
                .ds-vh-amount-lbl {
                    font-size: 10px; font-weight: 600; letter-spacing: 2px;
                    text-transform: uppercase; color: rgba(255,255,255,0.4);
                    margin-bottom: 6px;
                }
                .ds-vh-amount {
                    font-family: 'Syne', sans-serif;
                    font-size: clamp(30px, 9vw, 40px); font-weight: 800;
                    color: #fff; letter-spacing: -2px; line-height: 1;
                }
                .ds-vh-fine {
                    font-size: 11px; color: #FC8181; margin-top: 5px;
                    display: flex; align-items: center; gap: 5px;
                }
                .ds-vh-divider {
                    height: 1px; background: rgba(255,255,255,0.08); margin: 16px 0;
                }
                .ds-vh-due {
                    display: flex; justify-content: space-between; align-items: center;
                }
                .ds-vh-due-lbl {
                    font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500;
                    display: flex; align-items: center; gap: 5px;
                }
                .ds-vh-due-val {
                    font-size: 13px; font-weight: 700;
                    color: ${isLate ? "#FC8181" : "rgba(255,255,255,0.9)"};
                }

                /* ── Info row (3 chips) ── */
                .ds-info-row {
                    display: grid; grid-template-columns: repeat(3, 1fr);
                    gap: 8px; margin: 0 16px 14px;
                    animation: ds-fadeSlide 0.35s ease 0.08s both;
                }
                .ds-info-chip {
                    background: #111114; border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 14px; padding: 12px 10px; text-align: center;
                    transition: border-color 0.2s;
                }
                .ds-info-chip:hover { border-color: rgba(227,26,45,0.25); }
                .ds-info-chip-lbl {
                    font-size: 9px; font-weight: 700; letter-spacing: 1.2px;
                    text-transform: uppercase; color: rgba(255,255,255,0.28); margin-bottom: 5px;
                }
                .ds-info-chip-val {
                    font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.85);
                }

                /* ── Product strip ── */
                .ds-product-strip {
                    display: flex; align-items: center; gap: 12px;
                    margin: 0 16px 16px; padding: 14px 16px;
                    background: #111114; border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 16px;
                    animation: ds-fadeSlide 0.35s ease 0.14s both;
                }
                .ds-strip-icon {
                    width: 42px; height: 42px; border-radius: 12px;
                    background: rgba(227,26,45,0.1); border: 1px solid rgba(227,26,45,0.2);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 17px; color: #E31A2D; flex-shrink: 0;
                }
                .ds-strip-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.88); line-height: 1.3; }
                .ds-strip-order { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; font-family: monospace; }

                /* ── Late warning banner ── */
                .ds-late-banner {
                    display: flex; align-items: center; gap: 10px;
                    margin: 0 16px 14px; padding: 12px 14px;
                    background: rgba(227,26,45,0.08); border: 1px solid rgba(227,26,45,0.2);
                    border-radius: 14px;
                    animation: ds-fadeSlide 0.35s ease 0.18s both;
                }
                .ds-late-icon {
                    width: 32px; height: 32px; border-radius: 9px;
                    background: rgba(227,26,45,0.15); display: flex; align-items: center;
                    justify-content: center; font-size: 14px; color: #FC8181; flex-shrink: 0;
                }
                .ds-late-text { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.5; }
                .ds-late-text strong { color: #FC8181; font-weight: 600; }

                /* ── CTA footer ── */
                .ds-cta-footer {
                    position: sticky; bottom: 0;
                    background: linear-gradient(to top, #0A0A0C 75%, transparent);
                    padding: 20px 16px 30px;
                    animation: ds-fadeSlide 0.35s ease 0.22s both;
                }
                .ds-cta-row {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 12px; padding: 0 2px;
                }
                .ds-cta-lbl { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 500; }
                .ds-cta-val {
                    font-family: 'Syne', sans-serif; font-size: 20px;
                    font-weight: 800; color: #fff;
                }
                .ds-pay-btn {
                    width: 100%; padding: 17px; border-radius: 16px;
                    background: #E31A2D; color: #fff; font-weight: 700;
                    font-size: 15px; letter-spacing: 0.4px; border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center; gap: 9px;
                    font-family: 'DM Sans', sans-serif;
                    box-shadow: 0 8px 28px rgba(227,26,45,0.4);
                    transition: transform 0.15s, box-shadow 0.15s;
                    position: relative; overflow: hidden;
                }
                /* shimmer no botão */
                .ds-pay-btn::after {
                    content: '';
                    position: absolute; inset: 0;
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
                    background-size: 200% 100%;
                    animation: ds-shimmer 2.5s linear infinite;
                }
                .ds-pay-btn:active { transform: scale(0.97); box-shadow: 0 4px 14px rgba(227,26,45,0.3); }
                .ds-secure-note {
                    text-align: center; margin-top: 10px; font-size: 11px;
                    color: rgba(255,255,255,0.25);
                }

                @media (max-width: 360px) {
                    .ds-unpaid-header { padding: 40px 14px 14px; }
                    .ds-value-hero, .ds-product-strip, .ds-late-banner { margin-left: 12px; margin-right: 12px; }
                    .ds-info-row { margin: 0 12px 12px; }
                    .ds-cta-footer { padding: 16px 12px 26px; }
                    .ds-vh-amount { font-size: clamp(26px, 9vw, 34px); }
                }
            `}</style>

            <div className="ds-root">
                {/* Header */}
                <div className="ds-unpaid-header">
                    <button className="ds-icon-btn" onClick={onBack}>
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <span className="ds-header-title">Detalhes da Parcela</span>
                    <button className="ds-icon-btn" onClick={onHelp}>
                        <i className="bi bi-question-circle"></i>
                    </button>
                </div>

                {/* Value hero */}
                <div className="ds-value-hero">
                    <div className="ds-hero-glow"></div>
                    <div className="ds-hero-glow2"></div>
                    <div className="ds-vh-inner">
                        <div className="ds-vh-top">
                            <div>
                                <div className="ds-vh-parcela-lbl">Parcela</div>
                                <div className="ds-vh-parcela-val">
                                    {String(installment.index).padStart(2, "0")}
                                    <span>/ {String(installment.count).padStart(2, "0")}</span>
                                </div>
                            </div>
                            <div className="ds-vh-status-pill">
                                <span className="ds-vh-status-dot"></span>
                                {isLate
                                    ? `${daysOverdue} dia${daysOverdue !== 1 ? "s" : ""} em atraso`
                                    : "Em aberto"}
                            </div>
                        </div>
                        <div className="ds-vh-amount-lbl">Valor a pagar</div>
                        <div className="ds-vh-amount">{currency(totalAmount)}</div>
                        {installment.fine_amount ? (
                            <div className="ds-vh-fine">
                                <i className="bi bi-exclamation-circle" style={{ fontSize: 11 }}></i>
                                Inclui {currency(installment.fine_amount)} de multa/juros
                            </div>
                        ) : null}
                        <div className="ds-vh-divider"></div>
                        <div className="ds-vh-due">
                            <span className="ds-vh-due-lbl">
                                <i className="bi bi-calendar3"></i>
                                {isLate ? "Venceu em" : "Vencimento"}
                            </span>
                            <span className="ds-vh-due-val">{dueLong}</span>
                        </div>
                    </div>
                </div>

                {/* Info chips */}
                <div className="ds-info-row">
                    {[
                        ["Contrato", String(installment.pcrnot || "—")],
                        ["Compra", fmt(installment.purchase_date)],
                        ["Vence", fmt(installment.due_date)],
                    ].map(([lbl, val]) => (
                        <div key={lbl} className="ds-info-chip">
                            <div className="ds-info-chip-lbl">{lbl}</div>
                            <div className="ds-info-chip-val">{val}</div>
                        </div>
                    ))}
                </div>

                {/* Product strip */}
                <div className="ds-product-strip">
                    <div className="ds-strip-icon">
                        <i className="bi bi-bag-fill"></i>
                    </div>
                    <div>
                        <div className="ds-strip-name">{installment.product_name || "Compra MM Magazine"}</div>
                        <div className="ds-strip-order">{orderNumber}</div>
                    </div>
                </div>

                {/* Banner de atraso */}
                {isLate && (
                    <div className="ds-late-banner">
                        <div className="ds-late-icon">
                            <i className="bi bi-clock-history"></i>
                        </div>
                        <div className="ds-late-text">
                            Esta parcela está <strong>{daysOverdue} dia{daysOverdue !== 1 ? "s" : ""} em atraso</strong>. Regularize agora para evitar novos encargos.
                        </div>
                    </div>
                )}

                <div style={{ flex: 1 }} />

                {/* CTA footer */}
                <div className="ds-cta-footer">
                    <div className="ds-cta-row">
                        <span className="ds-cta-lbl">Total a pagar</span>
                        <span className="ds-cta-val">{currency(totalAmount)}</span>
                    </div>
                    <button className="ds-pay-btn" onClick={onPay}>
                        <i className="bi bi-qr-code-scan"></i>
                        {isLate ? "Regularizar com PIX" : "Pagar com PIX"}
                    </button>
                    <div className="ds-secure-note">
                        <i className="bi bi-shield-check me-1"></i>
                        Pagamento 100% seguro via AbacatePay
                    </div>
                </div>
            </div>
        </div>
    )
}
