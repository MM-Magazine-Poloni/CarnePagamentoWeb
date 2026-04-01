import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../services/backend/dbService"

/**
 * Webhook endpoint para o AbacatePay.
 * Evento: billing.paid
 *
 * Payload esperado:
 * {
 *   "event": "billing.paid",
 *   "data": {
 *     "billing": {
 *       "id": "bill_xxx",
 *       "status": "PAID",
 *       "products": [{ "externalId": "12764-1", ... }]
 *     }
 *   }
 * }
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.log("Webhook recebido:", JSON.stringify(body, null, 2))

        if (body?.event !== "billing.paid") {
            console.log("Evento ignorado:", body?.event)
            return NextResponse.json({ ok: true, ignored: true })
        }

        const supa = getSupabaseAdmin()

        // O AbacatePay envia billing.paid para AMBOS:
        // 1) PIX QR Code → payload tem data.pixQrCode com { id, status, amount }
        // 2) Cobrança    → payload tem data.billing  com { id, status, products }

        const pixQrCode = body.data?.pixQrCode
        const billing = body.data?.billing

        if (pixQrCode) {
            // ---- PIX QR Code payment ----
            const chargeId = pixQrCode.id as string
            console.log("PIX QR Code pago, chargeId:", chargeId)

            if (chargeId) {
                const { error: payErr } = await supa
                    .from("PAGAMENTOS")
                    .update({ STATUS: "paid" })
                    .eq("PROVIDER_ID", chargeId)
                    .neq("STATUS", "processed")

                if (payErr) console.error("Erro ao atualizar PAGAMENTOS:", payErr)
                else console.log("PAGAMENTOS atualizado para paid, PROVIDER_ID:", chargeId)

                // Buscar PCRNOT e FCRPAR do registro para atualizar NVENDA e FCRECEBER
                const { data: pagRow } = await supa
                    .from("PAGAMENTOS")
                    .select("PCRNOT, FCRPAR, CLICOD, FBRVLR")
                    .eq("PROVIDER_ID", chargeId)
                    .limit(1)
                    .maybeSingle()

                if (pagRow) {
                    const pvenum = Number((pagRow as any).PCRNOT)
                    const npeseq = Number((pagRow as any).FCRPAR)
                    const wClicod = Number((pagRow as any).CLICOD)
                    const wValor = Number((pagRow as any).FBRVLR)

                    if (pvenum && npeseq) {
                        await supa
                            .from("NVENDA")
                            .update({ PAGCOD: 7 })
                            .eq("PVENUM", pvenum)
                            .eq("NPESEQ", npeseq)
                        console.log("NVENDA atualizado:", { pvenum, npeseq })

                        if (wClicod) {
                            const today = new Date().toISOString().split("T")[0]
                            const { error: fbcErr } = await supa.from("FCRECEBER").upsert({
                                CLICOD: wClicod,
                                PCRNOT: pvenum,
                                FCRPAR: npeseq,
                                FBRVLR: wValor,
                                COBCOD: 7,
                                FCRPGT: today
                            }, { onConflict: "PCRNOT,FCRPAR" })
                            if (fbcErr) console.error("FCRECEBER upsert error (pix):", fbcErr)
                            else console.log("FCRECEBER upserted via webhook (pix):", { pvenum, npeseq, wClicod })
                        }
                    }
                }
            }
        } else if (billing) {
            // ---- Cobrança (billing) payment ----
            const billingId = billing.id as string
            const products = billing.products as Array<{ externalId?: string }> | undefined
            console.log("Billing pago, billingId:", billingId)

            if (billingId) {
                await supa
                    .from("PAGAMENTOS")
                    .update({ STATUS: "paid" })
                    .eq("PROVIDER_ID", billingId)
                    .neq("STATUS", "processed")

                if (products && products.length > 0) {
                    for (const product of products) {
                        const externalId = product.externalId
                        if (!externalId) continue
                        // externalId tem formato "PVENUM-NPESEQ"
                        const parts = externalId.split("-")
                        if (parts.length >= 2) {
                            const pvenum = Number(parts[0])
                            const npeseq = Number(parts[1])
                            if (!isNaN(pvenum) && !isNaN(npeseq)) {
                                await supa
                                    .from("NVENDA")
                                    .update({ PAGCOD: 7 })
                                    .eq("PVENUM", pvenum)
                                    .eq("NPESEQ", npeseq)

                                const { data: nvRow2 } = await supa
                                    .from("NVENDA")
                                    .select("CLICOD, PVETPA")
                                    .eq("PVENUM", pvenum)
                                    .eq("NPESEQ", npeseq)
                                    .maybeSingle()
                                const wClicod2 = nvRow2 ? Number((nvRow2 as any).CLICOD) : null
                                const wValor2 = nvRow2 ? Number((nvRow2 as any).PVETPA) : 0
                                if (wClicod2) {
                                    const today = new Date().toISOString().split("T")[0]
                                    const { error: fbcErr2 } = await supa.from("FCRECEBER").upsert({
                                        CLICOD: wClicod2,
                                        PCRNOT: pvenum,
                                        FCRPAR: npeseq,
                                        FBRVLR: wValor2,
                                        COBCOD: 7,
                                        FCRPGT: today
                                    }, { onConflict: "PCRNOT,FCRPAR" })
                                    if (fbcErr2) console.error("FCRECEBER upsert error (billing):", fbcErr2)
                                    else console.log("FCRECEBER upserted via webhook (billing):", { pvenum, npeseq, wClicod2 })
                                }
                            }
                        }
                    }
                }
            }
        } else {
            console.log("Payload sem pixQrCode nem billing:", JSON.stringify(body.data))
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error("Webhook error:", error)
        return NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
}

// AbacatePay pode enviar GET para verificar se o endpoint existe
export async function GET() {
    return NextResponse.json({ status: "ok", service: "abacatepay-webhook" })
}
