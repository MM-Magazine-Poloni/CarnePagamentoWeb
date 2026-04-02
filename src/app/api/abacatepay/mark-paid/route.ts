import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../services/backend/dbService"

/**
 * Server-side endpoint to mark a payment as paid.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
 * POST /api/abacatepay/mark-paid
 * Body: { chargeId: "pix_char_xxx", pvenum?: number, npeseq?: number, clicod?: number }
 */
export async function POST(req: Request) {
    try {
        const { chargeId, pvenum, npeseq, clicod, amount } = await req.json()

        if (!chargeId) {
            return NextResponse.json({ error: "chargeId ausente" }, { status: 400 })
        }

        const supa = getSupabaseAdmin()

        // SECURITY: Verify payment with AbacatePay before updating the database
        // This prevents someone from calling this endpoint with a fake chargeId.
        const apiUrl = process.env.ABACATEPAY_API_URL
        const apiKey = process.env.ABACATEPAY_API_KEY
        if (apiUrl && apiKey) {
            const checkUrl = `${apiUrl}/v1/pixQrCode/check?id=${encodeURIComponent(chargeId)}`
            const checkRes = await fetch(checkUrl, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                }
            })
            if (!checkRes.ok) {
                return NextResponse.json({ error: "Falha ao verificar status do pagamento" }, { status: 403 })
            }
            const checkJson = await checkRes.json()
            const paymentData = checkJson.data || checkJson
            if (paymentData.status !== "PAID") {
                return NextResponse.json({ error: "Pagamento não confirmado na operadora" }, { status: 403 })
            }
        }

        // Buscar COBCOD do registro para usar no FCRECEBER (5=Boleto, 7=PIX)
        const { data: pagRow } = await supa
            .from("PAGAMENTOS")
            .select("COBCOD")
            .eq("PROVIDER_ID", chargeId)
            .neq("STATUS", "processed")
            .maybeSingle()
        const cobcod = pagRow ? Number((pagRow as any).COBCOD) || 7 : 7

        // Update payment status in the new PAGAMENTOS table structure
        // The user robot expects 'paid' to change it to 'processed'
        const today = new Date().toISOString()
        const { error: updErr, count } = await supa
            .from("PAGAMENTOS")
            .update({
                STATUS: "paid",
                FCRPGT: today
            })
            .eq("PROVIDER_ID", chargeId)
            .neq("STATUS", "processed") // Don't update if already processed by robot

        console.log("mark-paid: PROVIDER_ID=", chargeId, "count=", count, "err=", updErr)

        if (updErr) {
            return NextResponse.json({ error: updErr.message }, { status: 500 })
        }

        // Update NVENDA if pvenum/npeseq provided
        if (pvenum && npeseq) {
            const { error: nvErr } = await supa
                .from("NVENDA")
                .update({ PAGCOD: 7 })
                .eq("PVENUM", pvenum)
                .eq("NPESEQ", npeseq)

            if (nvErr) console.error("mark-paid NVENDA error:", nvErr)
            else console.log("mark-paid NVENDA updated:", { pvenum, npeseq })

            // Upsert into FBCRECEBER to persist paid status
            let finalClicod = clicod
            if (!finalClicod) {
                // Fallback: fetch CLICOD from NVENDA
                const { data: nvendaRow } = await supa
                    .from("NVENDA")
                    .select("CLICOD")
                    .eq("PVENUM", pvenum)
                    .eq("NPESEQ", npeseq)
                    .maybeSingle()
                if (nvendaRow) finalClicod = Number((nvendaRow as any).CLICOD)
            }

            if (finalClicod) {
                // Get installment value for FBRVLR
                let fbrvlr = amount || 0
                if (!fbrvlr) {
                    const { data: valRow } = await supa
                        .from("NVENDA")
                        .select("PVETPA")
                        .eq("PVENUM", pvenum)
                        .eq("NPESEQ", npeseq)
                        .maybeSingle()
                    if (valRow) fbrvlr = Number((valRow as any).PVETPA)
                }

                const todayDateOnly = new Date().toISOString().split("T")[0]

                // UPDATE primeiro — mais seguro que upsert pois não depende de
                // um UNIQUE constraint específico na tabela FCRECEBER.
                // Filtra por CLICOD+PCRNOT+FCRPAR para garantir precisão.
                const { data: updRows, error: updErr } = await supa
                    .from("FCRECEBER")
                    .update({ FCRPGT: todayDateOnly, COBCOD: cobcod })
                    .eq("CLICOD", finalClicod)
                    .eq("PCRNOT", pvenum)
                    .eq("FCRPAR", npeseq)
                    .select("FCRPAR")

                if (updErr) {
                    console.error("mark-paid FCRECEBER update error:", updErr)
                } else if (!updRows || updRows.length === 0) {
                    // Linha não existe ainda — inserir registro novo
                    const { error: insErr } = await supa.from("FCRECEBER").insert({
                        CLICOD: finalClicod,
                        PCRNOT: pvenum,
                        FCRPAR: npeseq,
                        FBRVLR: fbrvlr,
                        COBCOD: cobcod,
                        FCRPGT: todayDateOnly
                    })
                    if (insErr) console.error("mark-paid FCRECEBER insert error:", insErr)
                    else console.log("mark-paid FCRECEBER inserido:", { pvenum, npeseq, finalClicod })
                } else {
                    console.log("mark-paid FCRECEBER atualizado:", { pvenum, npeseq, finalClicod })
                }
            }
        }

        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
}
