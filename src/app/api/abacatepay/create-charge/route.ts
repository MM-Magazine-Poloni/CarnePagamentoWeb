import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../services/backend/dbService"

/**
 * Busca dados atuais de uma cobrança PIX diretamente na AbacatePay.
 * Retorna null se a cobrança não existir, expirou ou a requisição falhar.
 */
async function fetchPixChargeFromProvider(
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

    const apiUrl = process.env.ABACATEPAY_API_URL
    const apiKey = process.env.ABACATEPAY_API_KEY

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: "API de pagamento não configurada" }, { status: 500 })
    }

    const supa = getSupabaseAdmin()

    // ── IDEMPOTÊNCIA ──────────────────────────────────────────────────────────
    // Verifica se já existe uma cobrança PIX pendente para esta parcela.
    // A parcela é identificada univocamente por CLICOD + PCRNOT + FCRPAR.
    // Isso impede que dois dispositivos criem cobranças diferentes para a
    // mesma parcela ao clicar em "Pagar" ao mesmo tempo.
    const { data: existing } = await supa
      .from("PAGAMENTOS")
      .select("PROVIDER_ID, STATUS")
      .eq("CLICOD", Number(clicod))
      .eq("PCRNOT", Number(pvenum))
      .eq("FCRPAR", Number(index))
      .eq("STATUS", "pending")
      .eq("METHOD", "pix")
      .maybeSingle()

    if (existing?.PROVIDER_ID) {
      // Cobrança pendente encontrada — consultar status atual na AbacatePay
      const providerData = await fetchPixChargeFromProvider(
        existing.PROVIDER_ID,
        apiUrl,
        apiKey
      )

      // Pagamento foi confirmado na AbacatePay, mas o webhook ainda não
      // atualizou PAGAMENTOS — corrigir status automaticamente
      if (providerData?.status === "PAID") {
        await supa
          .from("PAGAMENTOS")
          .update({ STATUS: "paid" })
          .eq("CLICOD", Number(clicod))
          .eq("PCRNOT", Number(pvenum))
          .eq("FCRPAR", Number(index))
          .eq("STATUS", "pending")
        return NextResponse.json(
          { error: "Parcela já paga", alreadyPaid: true },
          { status: 409 }
        )
      }

      // Cobrança válida e ainda pendente — reutilizar sem criar nova
      if (providerData?.brCode && providerData?.status !== "EXPIRED") {
        console.log("[create-charge] Reutilizando cobrança PIX:", existing.PROVIDER_ID)
        return NextResponse.json({
          chargeId: existing.PROVIDER_ID,
          brCode: providerData.brCode,
          brCodeBase64: providerData.brCodeBase64 ?? null,
          status: providerData.status,
          expiresAt: providerData.expiresAt,
          reused: true // flag para o frontend identificar reutilização
        })
      }

      // Cobrança expirada ou inválida — marcar como expired e criar nova abaixo
      console.log("[create-charge] Cobrança expirada, criando nova:", existing.PROVIDER_ID)
      await supa
        .from("PAGAMENTOS")
        .update({ STATUS: "expired" })
        .eq("CLICOD", Number(clicod))
        .eq("PCRNOT", Number(pvenum))
        .eq("FCRPAR", Number(index))
        .eq("STATUS", "pending")
        .eq("METHOD", "pix")
    }

    // ── CRIAR NOVA COBRANÇA ───────────────────────────────────────────────────
    const amountInCents = Math.round(Number(amount) * 100)

    const abacateRes = await fetch(`${apiUrl}/v1/pixQrCode/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        amount: amountInCents,
        expiresIn: 3600,
        description: `Parcela ${installmentId}`.slice(0, 37),
        metadata: { externalId: installmentId }
      })
    })

    const text = await abacateRes.text()

    if (!abacateRes.ok) {
      console.error("[create-charge] Erro AbacatePay PIX:", text)
      return NextResponse.json(
        { error: text || "Falha ao criar QR Code PIX" },
        { status: abacateRes.status }
      )
    }

    const json = JSON.parse(text)
    const data = json.data ?? json
    const chargeId = data.id

    // ── PERSISTIR EM PAGAMENTOS ───────────────────────────────────────────────
    const { error: insertErr } = await supa.from("PAGAMENTOS").insert({
      CLICOD: Number(clicod),
      PCRNOT: Number(pvenum),
      FCRPAR: Number(index),
      FBRVLR: Number(amount),
      COBCOD: 7, // PIX
      STATUS: "pending",
      PROVIDER_ID: chargeId ?? null,
      METHOD: "pix"
    })

    if (insertErr) console.error("[create-charge] Erro ao inserir PAGAMENTOS:", insertErr)
    else console.log("[create-charge] PAGAMENTOS PIX inserido:", chargeId)

    if (pvenum && index) {
      const { error: nvendaErr } = await supa
        .from("NVENDA")
        .update({ ENVIADO: true, PAGDES: "PIX" })
        .eq("PVENUM", Number(pvenum))
        .eq("NPESEQ", Number(index))
      if (nvendaErr) console.error("[create-charge] Erro NVENDA:", nvendaErr)
    }

    return NextResponse.json({
      chargeId,
      brCode: data.brCode,
      brCodeBase64: data.brCodeBase64,
      status: data.status,
      expiresAt: data.expiresAt
    })
  } catch (error) {
    console.error("[create-charge] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
