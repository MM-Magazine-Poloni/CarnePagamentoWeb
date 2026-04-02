import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../services/backend/dbService"

/**
 * Busca dados atuais de uma cobrança Boleto diretamente na AbacatePay.
 * Retorna null se a cobrança não existir ou a requisição falhar.
 */
async function fetchBoletoFromProvider(
  boletoId: string,
  apiUrl: string,
  apiKey: string
): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(
      `${apiUrl}/v1/billing/check?id=${encodeURIComponent(boletoId)}`,
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
    // Verifica se já existe boleto pendente para esta parcela
    // (identificada por CLICOD + PCRNOT + FCRPAR).
    const { data: existing } = await supa
      .from("PAGAMENTOS")
      .select("PROVIDER_ID, STATUS")
      .eq("CLICOD", Number(clicod))
      .eq("PCRNOT", Number(pvenum))
      .eq("FCRPAR", Number(index))
      .eq("STATUS", "pending")
      .eq("METHOD", "boleto")
      .maybeSingle()

    if (existing?.PROVIDER_ID) {
      const providerData = await fetchBoletoFromProvider(
        existing.PROVIDER_ID,
        apiUrl,
        apiKey
      )

      // Boleto pago mas webhook ainda não atualizou PAGAMENTOS
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

      // Boleto válido e pendente — reutilizar sem criar novo
      const digitableLine = providerData?.digitableLine ?? providerData?.barCode ?? null
      if (digitableLine && providerData?.status !== "EXPIRED") {
        console.log("[create-boleto] Reutilizando boleto:", existing.PROVIDER_ID)
        return NextResponse.json({
          boletoId: existing.PROVIDER_ID,
          digitableLine,
          url: providerData?.url ?? null,
          dueDate: providerData?.dueDate ?? null,
          status: providerData?.status,
          reused: true // flag para o frontend identificar reutilização
        })
      }

      // Boleto expirado — marcar e criar novo abaixo
      console.log("[create-boleto] Boleto expirado, criando novo:", existing.PROVIDER_ID)
      await supa
        .from("PAGAMENTOS")
        .update({ STATUS: "expired" })
        .eq("CLICOD", Number(clicod))
        .eq("PCRNOT", Number(pvenum))
        .eq("FCRPAR", Number(index))
        .eq("STATUS", "pending")
        .eq("METHOD", "boleto")
    }

    // ── BUSCAR DADOS DO CLIENTE (obrigatório para boleto) ─────────────────────
    const { data: customerData } = await supa
      .from("CLIENTE")
      .select("CLINOM, CLICGC")
      .eq("CLICOD", clicod)
      .maybeSingle()

    if (!customerData) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const customerName = String((customerData as any).CLINOM || "Cliente")
    const customerCpf = String((customerData as any).CLICGC || "").replace(/\D/g, "")

    // Buscar nome do produto
    const { data: nvRow } = await supa
      .from("NVENDA")
      .select("PRODES")
      .eq("PVENUM", pvenum)
      .eq("NPESEQ", index)
      .maybeSingle()
    const productName = String((nvRow as any)?.PRODES || `Parcela ${installmentId}`).slice(0, 60)

    // ── CRIAR NOVO BOLETO ─────────────────────────────────────────────────────
    const amountInCents = Math.round(Number(amount) * 100)

    const abacateRes = await fetch(`${apiUrl}/v1/billing/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        frequency: "ONE_TIME",
        methods: ["BOLETO"],
        products: [
          {
            externalId: installmentId,
            name: productName,
            quantity: 1,
            price: amountInCents
          }
        ],
        customer: {
          name: customerName,
          taxId: { type: "CPF", number: customerCpf }
        }
      })
    })

    const text = await abacateRes.text()

    if (!abacateRes.ok) {
      console.error("[create-boleto] Erro AbacatePay:", text)
      return NextResponse.json(
        { error: text || "Falha ao criar boleto" },
        { status: abacateRes.status }
      )
    }

    const json = JSON.parse(text)
    const data = json.data ?? json
    const boletoId = data.id

    // ── PERSISTIR EM PAGAMENTOS ───────────────────────────────────────────────
    const { error: insertErr } = await supa.from("PAGAMENTOS").insert({
      CLICOD: Number(clicod),
      PCRNOT: Number(pvenum),
      FCRPAR: Number(index),
      FBRVLR: Number(amount),
      COBCOD: 5, // Boleto
      STATUS: "pending",
      PROVIDER_ID: boletoId ?? null,
      METHOD: "boleto"
    })

    if (insertErr) console.error("[create-boleto] Erro ao inserir PAGAMENTOS:", insertErr)
    else console.log("[create-boleto] PAGAMENTOS boleto inserido:", boletoId)

    if (pvenum && index) {
      const { error: nvendaErr } = await supa
        .from("NVENDA")
        .update({ ENVIADO: true, PAGDES: "BOLETO" })
        .eq("PVENUM", Number(pvenum))
        .eq("NPESEQ", Number(index))
      if (nvendaErr) console.error("[create-boleto] Erro NVENDA:", nvendaErr)
    }

    return NextResponse.json({
      boletoId,
      digitableLine: data.digitableLine ?? data.barCode ?? null,
      url: data.url ?? null,
      dueDate: data.dueDate ?? null,
      status: data.status
    })
  } catch (error) {
    console.error("[create-boleto] Erro interno:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
