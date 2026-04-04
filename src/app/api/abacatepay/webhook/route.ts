import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../services/backend/dbService"

type Supa = ReturnType<typeof getSupabaseAdmin>

// ─── GET — verificação de saúde do endpoint ───────────────────────────────────
export async function GET() {
    return NextResponse.json({ status: "ok", service: "abacatepay-webhook" })
}

// ─── POST — recebe eventos do AbacatePay ─────────────────────────────────────
// Regras:
//   • Valida assinatura HMAC-SHA256 antes de qualquer processamento
//   • Sempre responde 200 — nunca retorna erro ao provider
//   • Valida pagamento via API antes de atualizar o banco
//   • Idempotente: verifica STATUS = "processed" antes de agir
export async function POST(req: Request) {
    // Lê o body bruto uma única vez — necessário para validação HMAC
    let rawBody: string
    try {
        rawBody = await req.text()
    } catch {
        console.error("[webhook] Falha ao ler body")
        return NextResponse.json({ ok: true })
    }

    // ── Validação de assinatura HMAC-SHA256 ───────────────────────────────────
    const webhookSecret = process.env.ABACATEPAY_WEBHOOK_SECRET
    if (webhookSecret) {
        const signature = req.headers.get("x-abacatepay-signature") ?? ""
        const valid = await verifyHmacSignature(rawBody, signature, webhookSecret)
        if (!valid) {
            // Responde 200 para não revelar que a validação falhou,
            // mas não processa — impede replay attacks e webhooks falsos.
            console.warn("[webhook] Assinatura HMAC inválida — requisição ignorada")
            return NextResponse.json({ ok: true })
        }
        console.log("[webhook] Assinatura HMAC válida")
    } else {
        console.warn("[webhook] ABACATEPAY_WEBHOOK_SECRET não configurado — validação de assinatura desabilitada")
    }

    // Parse do body já lido
    let body: Record<string, unknown>
    try {
        body = JSON.parse(rawBody)
    } catch {
        console.error("[webhook] Body não é JSON válido")
        return NextResponse.json({ ok: true })
    }

    console.log("[webhook] Evento recebido:", (body as any)?.event)
    await processWebhook(body)
    return NextResponse.json({ ok: true })
}

// ─── Validação HMAC-SHA256 via Web Crypto API ─────────────────────────────────
// AbacatePay envia a assinatura no header x-abacatepay-signature como hex.
// Calcula: HMAC-SHA256(ABACATEPAY_WEBHOOK_SECRET, rawBody)
async function verifyHmacSignature(
    payload: string,
    signature: string,
    secret: string
): Promise<boolean> {
    if (!signature) return false
    try {
        const encoder  = new TextEncoder()
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        )
        const mac      = await crypto.subtle.sign("HMAC", key, encoder.encode(payload))
        const expected = Array.from(new Uint8Array(mac))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("")

        // Comparação em tempo constante — evita timing attacks
        return timingSafeEqual(expected, signature.toLowerCase().replace(/^sha256=/, ""))
    } catch (err) {
        console.error("[webhook][hmac] Erro na validação de assinatura:", err)
        return false
    }
}

// Comparação de strings em tempo constante para evitar timing attacks
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    let diff = 0
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return diff === 0
}

// ─── Orquestrador principal ───────────────────────────────────────────────────
async function processWebhook(body: Record<string, unknown>): Promise<void> {
    if (body?.event !== "billing.paid") {
        console.log(`[webhook] Evento ignorado: ${body?.event}`)
        return
    }

    const supa      = getSupabaseAdmin()
    const pixQrCode = (body.data as any)?.pixQrCode as Record<string, unknown> | undefined
    const billing   = (body.data as any)?.billing   as Record<string, unknown> | undefined

    try {
        if (pixQrCode) {
            await handlePixQrCode(supa, pixQrCode)
        } else if (billing) {
            await handleBilling(supa, billing)
        } else {
            console.warn("[webhook] Payload sem pixQrCode nem billing:", JSON.stringify(body.data))
        }
    } catch (err) {
        console.error("[webhook] Erro inesperado em processWebhook:", err)
    }
}

// ─── Validação obrigatória via API do AbacatePay ──────────────────────────────
async function verifyPaymentStatus(id: string, type: "pix" | "billing"): Promise<boolean> {
    const apiUrl = process.env.ABACATEPAY_API_URL
    const apiKey = process.env.ABACATEPAY_API_KEY

    if (!apiUrl || !apiKey) {
        console.error("[webhook][verify] ABACATEPAY_API_URL ou ABACATEPAY_API_KEY não configurados")
        return false
    }

    const endpoint = type === "billing"
        ? `${apiUrl}/v1/billing/check?id=${encodeURIComponent(id)}`
        : `${apiUrl}/v1/pixQrCode/check?id=${encodeURIComponent(id)}`

    try {
        const res = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Accept":        "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
        })

        if (!res.ok) {
            const text = await res.text()
            console.error(`[webhook][verify] API retornou ${res.status} para id ${id}:`, text)
            return false
        }

        const json   = await res.json()
        const data   = json.data ?? json
        const status = data?.status as string | undefined

        if (status !== "PAID") {
            console.warn(`[webhook][verify] Status não confirmado — id: ${id}, status recebido: ${status}`)
            return false
        }

        console.log(`[webhook][verify] PAID confirmado pela API — id: ${id}`)
        return true
    } catch (err) {
        console.error(`[webhook][verify] Erro ao consultar API para id ${id}:`, err)
        return false
    }
}

// ─── PIX QR Code ─────────────────────────────────────────────────────────────
async function handlePixQrCode(supa: Supa, pixQrCode: Record<string, unknown>): Promise<void> {
    const chargeId = pixQrCode?.id as string | undefined
    if (!chargeId) {
        console.warn("[webhook][pix] chargeId ausente no payload")
        return
    }

    console.log(`[webhook][pix] Iniciando — chargeId: ${chargeId}`)

    // 1. Verificação obrigatória via API — aborta se não for PAID
    const isPaid = await verifyPaymentStatus(chargeId, "pix")
    if (!isPaid) {
        console.warn(`[webhook][pix] Pagamento não confirmado pela API, fluxo interrompido — chargeId: ${chargeId}`)
        return
    }

    // 2. Busca o registro + verificação de idempotência
    const { data: pagRow, error: selErr } = await supa
        .from("PAGAMENTOS")
        .select("PCRNOT, FCRPAR, CLICOD, FBRVLR, STATUS")
        .eq("PROVIDER_ID", chargeId)
        .limit(1)
        .maybeSingle()

    if (selErr) {
        console.error(`[webhook][pix] Erro ao buscar PAGAMENTOS (${chargeId}):`, selErr)
        return
    }
    if (!pagRow) {
        console.warn(`[webhook][pix] Registro não encontrado em PAGAMENTOS — chargeId: ${chargeId}`)
        return
    }
    if ((pagRow as any).STATUS === "processed") {
        console.log(`[webhook][pix] Já processado, ignorando — chargeId: ${chargeId}`)
        return
    }

    // 3. Marca como processado antes de atualizar o restante (anti-race condition)
    const { error: markErr } = await supa
        .from("PAGAMENTOS")
        .update({ STATUS: "processed" })
        .eq("PROVIDER_ID", chargeId)
        .neq("STATUS", "processed")
    if (markErr) console.error(`[webhook][pix] Erro ao marcar como processed (${chargeId}):`, markErr)

    const pvenum  = Number((pagRow as any).PCRNOT)
    const npeseq  = Number((pagRow as any).FCRPAR)
    const wClicod = Number((pagRow as any).CLICOD)
    // Garante 2 casas decimais para valores financeiros
    const wValor  = parseFloat(Number((pagRow as any).FBRVLR).toFixed(2))

    if (!pvenum || !npeseq) {
        console.warn(`[webhook][pix] PCRNOT/FCRPAR inválidos — chargeId: ${chargeId}`)
        return
    }

    // 4. Atualiza NVENDA
    const { error: nvErr } = await supa
        .from("NVENDA")
        .update({ PAGCOD: 7 })
        .eq("PVENUM", pvenum)
        .eq("NPESEQ", npeseq)
    if (nvErr) console.error(`[webhook][pix] Erro NVENDA (${pvenum}-${npeseq}):`, nvErr)
    else       console.log(`[webhook][pix] NVENDA atualizado (${pvenum}-${npeseq})`)

    // 5. Atualiza FCRECEBER
    if (wClicod) {
        await upsertFcreceber(supa, { clicod: wClicod, pcrnot: pvenum, fcrpar: npeseq, valor: wValor, tag: "pix" })
    }

    console.log(`[webhook][pix] Concluído — chargeId: ${chargeId}`)
}

// ─── Billing (cobrança) ───────────────────────────────────────────────────────
async function handleBilling(supa: Supa, billing: Record<string, unknown>): Promise<void> {
    const billingId = billing?.id as string | undefined
    if (!billingId) {
        console.warn("[webhook][billing] billingId ausente no payload")
        return
    }

    console.log(`[webhook][billing] Iniciando — billingId: ${billingId}`)

    // 1. Verificação obrigatória via API
    const isPaid = await verifyPaymentStatus(billingId, "billing")
    if (!isPaid) {
        console.warn(`[webhook][billing] Pagamento não confirmado pela API, fluxo interrompido — billingId: ${billingId}`)
        return
    }

    // 2. Verificação de idempotência
    const { data: pagRow, error: selErr } = await supa
        .from("PAGAMENTOS")
        .select("STATUS")
        .eq("PROVIDER_ID", billingId)
        .limit(1)
        .maybeSingle()

    if (selErr) {
        console.error(`[webhook][billing] Erro ao buscar PAGAMENTOS (${billingId}):`, selErr)
        return
    }
    if ((pagRow as any)?.STATUS === "processed") {
        console.log(`[webhook][billing] Já processado, ignorando — billingId: ${billingId}`)
        return
    }

    // 3. Marca como processado imediatamente
    const { error: markErr } = await supa
        .from("PAGAMENTOS")
        .update({ STATUS: "processed" })
        .eq("PROVIDER_ID", billingId)
        .neq("STATUS", "processed")
    if (markErr) console.error(`[webhook][billing] Erro ao marcar como processed (${billingId}):`, markErr)

    const products = billing.products as Array<{ externalId?: string }> | undefined
    if (!products?.length) {
        console.warn(`[webhook][billing] Sem produtos no payload — billingId: ${billingId}`)
        return
    }

    for (const product of products) {
        const externalId = product.externalId
        if (!externalId) continue

        const parts  = externalId.split("-")
        if (parts.length < 2) continue
        const pvenum = Number(parts[0])
        const npeseq = Number(parts[1])
        if (isNaN(pvenum) || isNaN(npeseq)) continue

        // 4. Atualiza NVENDA
        const { error: nvErr } = await supa
            .from("NVENDA")
            .update({ PAGCOD: 7 })
            .eq("PVENUM", pvenum)
            .eq("NPESEQ", npeseq)
        if (nvErr) console.error(`[webhook][billing] Erro NVENDA (${pvenum}-${npeseq}):`, nvErr)
        else       console.log(`[webhook][billing] NVENDA atualizado (${pvenum}-${npeseq})`)

        // 5. Busca CLICOD e valor
        const { data: nvRow, error: nvSelErr } = await supa
            .from("NVENDA")
            .select("CLICOD, PVETPA")
            .eq("PVENUM", pvenum)
            .eq("NPESEQ", npeseq)
            .maybeSingle()

        if (nvSelErr) {
            console.error(`[webhook][billing] Erro ao buscar NVENDA (${pvenum}-${npeseq}):`, nvSelErr)
            continue
        }

        const wClicod = nvRow ? Number((nvRow as any).CLICOD) : null
        const wValor  = nvRow ? parseFloat(Number((nvRow as any).PVETPA).toFixed(2)) : 0

        if (wClicod) {
            await upsertFcreceber(supa, { clicod: wClicod, pcrnot: pvenum, fcrpar: npeseq, valor: wValor, tag: "billing" })
        }
    }

    console.log(`[webhook][billing] Concluído — billingId: ${billingId}`)
}

// ─── Helper: atualiza ou insere em FCRECEBER ──────────────────────────────────
async function upsertFcreceber(
    supa: Supa,
    { clicod, pcrnot, fcrpar, valor, tag }: { clicod: number; pcrnot: number; fcrpar: number; valor: number; tag: string }
): Promise<void> {
    // Data no formato YYYY-MM-DD — único formato aceito pelo banco legado
    const today = new Date().toISOString().split("T")[0]
    const ctx   = `(${clicod}/${pcrnot}/${fcrpar})`

    const { data: updRows, error: updErr } = await supa
        .from("FCRECEBER")
        .update({ FCRPGT: today, COBCOD: 7 })
        .eq("CLICOD", clicod)
        .eq("PCRNOT", pcrnot)
        .eq("FCRPAR", fcrpar)
        .select("FCRPAR")

    if (updErr) {
        console.error(`[webhook][${tag}] FCRECEBER update error ${ctx}:`, updErr)
        return
    }

    if (!updRows || updRows.length === 0) {
        const { error: insErr } = await supa.from("FCRECEBER").insert({
            CLICOD: clicod,
            PCRNOT: pcrnot,
            FCRPAR: fcrpar,
            FBRVLR: valor,   // já com 2 casas decimais
            COBCOD: 7,       // PIX
            FCRPGT: today,   // YYYY-MM-DD
        })
        if (insErr) console.error(`[webhook][${tag}] FCRECEBER insert error ${ctx}:`, insErr)
        else        console.log(`[webhook][${tag}] FCRECEBER inserido ${ctx}`)
    } else {
        console.log(`[webhook][${tag}] FCRECEBER atualizado ${ctx}`)
    }
}
