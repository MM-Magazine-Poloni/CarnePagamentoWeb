import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../services/backend/dbService"

/**
 * Consulta o status atual de uma cobrança PIX diretamente na AbacatePay.
 * Retorna null se a cobrança não existir, expirou ou a requisição falhar.
 */
async function fetchPixCharge(
    chargeId: string,
    apiUrl: string,
    apiKey: string
): Promise<Record<string, any> | null> {
    try {
        const res = await fetch(
            `${apiUrl}/v1/pixQrCode/check?id=${encodeURIComponent(chargeId)}`,
            { headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` } }
        )
        if (!res.ok) return null
        const json = await res.json()
        return json.data ?? json
    } catch {
        return null
    }
}

export async function POST(req: Request) {
    try {
        const { installmentId, amount, clicod, pvenum, index } = await req.json()

        if (!installmentId || !amount || isNaN(Number(amount)) || isNaN(Number(clicod))) {
            return NextResponse.json({ error: "Dados de entrada inválidos" }, { status: 400 })
        }

        const pcrnot = Number(pvenum)
        const fcrpar = Number(index)
        // externalId canônico — formato "PCRNOT-FCRPAR" usado em todo o sistema
        const externalId = `${pcrnot}-${fcrpar}`

        const apiUrl = process.env.ABACATEPAY_API_URL
        const apiKey = process.env.ABACATEPAY_API_KEY
        if (!apiUrl || !apiKey) {
            return NextResponse.json({ error: "API de pagamento não configurada" }, { status: 500 })
        }

        const supa = getSupabaseAdmin()

        // ── IDEMPOTÊNCIA ──────────────────────────────────────────────────────────
        // Busca qualquer cobrança não-processada para este PCRNOT+FCRPAR.
        // Isso impede cobranças duplicadas independentemente de CLICOD.
        const { data: existing, error: selErr } = await supa
            .from("PAGAMENTOS")
            .select("PROVIDER_ID, STATUS, CLICOD, FBRVLR")
            .eq("PCRNOT", pcrnot)
            .eq("FCRPAR", fcrpar)
            .neq("STATUS", "processed")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

        if (selErr) {
            console.error(`[create-charge] Erro ao buscar PAGAMENTOS (${externalId}):`, selErr)
        }

        if (existing) {
            const provId = (existing as any).PROVIDER_ID as string | null
            const status = (existing as any).STATUS as string

            console.log(`[create-charge] Registro existente — externalId: ${externalId}, PROVIDER_ID: ${provId}, STATUS: ${status}`)

            // Já foi pago (webhook processou mas PAGAMENTOS ainda não é "processed")
            if (status === "paid") {
                console.log(`[create-charge] Parcela já paga — externalId: ${externalId}`)
                return NextResponse.json({ error: "Parcela já paga", alreadyPaid: true }, { status: 409 })
            }

            if (provId && status === "pending") {
                // Consulta status atual na AbacatePay
                const providerData = await fetchPixCharge(provId, apiUrl, apiKey)
                console.log(`[create-charge] Status AbacatePay — PROVIDER_ID: ${provId}, status: ${providerData?.status}`)

                if (providerData?.status === "PAID") {
                    // Webhook ainda não atualizou — corrige status localmente
                    await supa
                        .from("PAGAMENTOS")
                        .update({ STATUS: "paid" })
                        .eq("PCRNOT", pcrnot)
                        .eq("FCRPAR", fcrpar)
                        .eq("STATUS", "pending")
                    console.log(`[create-charge] Status corrigido para paid — externalId: ${externalId}`)
                    return NextResponse.json({ error: "Parcela já paga", alreadyPaid: true }, { status: 409 })
                }

                if (providerData?.brCode && providerData.status !== "EXPIRED") {
                    // Cobrança ainda válida — reutiliza sem criar nova
                    console.log(`[create-charge] Reutilizando cobrança — PROVIDER_ID: ${provId}, externalId: ${externalId}`)
                    return NextResponse.json({
                        chargeId:     provId,
                        brCode:       providerData.brCode,
                        brCodeBase64: providerData.brCodeBase64 ?? null,
                        status:       providerData.status,
                        expiresAt:    providerData.expiresAt,
                        reused:       true,
                    })
                }

                // Cobrança expirada — marca e cria nova abaixo
                console.log(`[create-charge] Cobrança expirada, criando nova — PROVIDER_ID: ${provId}, externalId: ${externalId}`)
                await supa
                    .from("PAGAMENTOS")
                    .update({ STATUS: "expired" })
                    .eq("PCRNOT", pcrnot)
                    .eq("FCRPAR", fcrpar)
                    .eq("STATUS", "pending")
            }
        }

        // ── CRIAR NOVA COBRANÇA NA ABACATEPAY ────────────────────────────────────
        const amountDecimal = parseFloat(Number(amount).toFixed(2))
        const amountInCents = Math.round(amountDecimal * 100)
        // 15 minutos — suficiente para o cliente abrir o app sem deixar cobranças acumulando
        const PIX_EXPIRES_IN = 900
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ""

        console.log(`[create-charge] Criando cobrança — externalId: ${externalId}, valor: ${amountDecimal}, centavos: ${amountInCents}`)

        let abacateRes: Response
        try {
            abacateRes = await fetch(`${apiUrl}/v1/pixQrCode/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept:         "application/json",
                    Authorization:  `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    amount:      amountInCents,
                    expiresIn:   PIX_EXPIRES_IN,
                    methods:     ["PIX"],
                    description: `Parcela ${externalId}`.slice(0, 37),
                    metadata:    { externalId },
                    ...(baseUrl && {
                        returnUrl:     `${baseUrl}/`,
                        completionUrl: `${baseUrl}/`,
                    }),
                }),
            })
        } catch (fetchErr) {
            console.error(`[create-charge] Falha de rede ao criar cobrança (${externalId}):`, fetchErr)
            return NextResponse.json({ error: "Falha ao conectar com a API de pagamento" }, { status: 502 })
        }

        const text = await abacateRes.text()
        if (!abacateRes.ok) {
            console.error(`[create-charge] AbacatePay retornou ${abacateRes.status} (${externalId}):`, text)
            return NextResponse.json(
                { error: text || "Falha ao criar QR Code PIX" },
                { status: abacateRes.status }
            )
        }

        const json     = JSON.parse(text)
        const data     = json.data ?? json
        const chargeId = data.id as string | undefined

        console.log(`[create-charge] Cobrança criada — PROVIDER_ID: ${chargeId}, externalId: ${externalId}`)

        // ── PERSISTIR EM PAGAMENTOS (imediatamente após criar) ────────────────────
        const { error: insertErr } = await supa.from("PAGAMENTOS").insert({
            CLICOD:      Number(clicod),
            PCRNOT:      pcrnot,
            FCRPAR:      fcrpar,
            FBRVLR:      amountDecimal,
            COBCOD:      7,          // PIX
            STATUS:      "pending",
            PROVIDER_ID: chargeId ?? null,
            METHOD:      "pix",
        })
        if (insertErr) {
            console.error(`[create-charge] Erro ao inserir PAGAMENTOS — PROVIDER_ID: ${chargeId}, externalId: ${externalId}:`, insertErr)
        } else {
            console.log(`[create-charge] PAGAMENTOS inserido — PROVIDER_ID: ${chargeId}, externalId: ${externalId}`)
        }

        // Marca NVENDA como enviado
        if (pcrnot && fcrpar) {
            const { error: nvErr } = await supa
                .from("NVENDA")
                .update({ ENVIADO: true, PAGDES: "PIX" })
                .eq("PVENUM", pcrnot)
                .eq("NPESEQ", fcrpar)
            if (nvErr) console.error(`[create-charge] Erro NVENDA (${externalId}):`, nvErr)
        }

        return NextResponse.json({
            chargeId,
            brCode:       data.brCode,
            brCodeBase64: data.brCodeBase64,
            status:       data.status,
            expiresAt:    data.expiresAt,
        })
    } catch (error) {
        console.error("[create-charge] Erro interno:", error)
        return NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
}
