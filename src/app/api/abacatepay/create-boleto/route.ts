import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../services/backend/dbService"

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

    // Buscar dados do cliente (obrigatório para boleto)
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

    const amountInCents = Math.round(Number(amount) * 100)

    const url = `${apiUrl}/v1/billing/create`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${apiKey}`
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
          taxId: {
            type: "CPF",
            number: customerCpf
          }
        }
      })
    })

    const text = await res.text()

    if (!res.ok) {
      console.error("Erro AbacatePay Boleto:", text)
      return NextResponse.json(
        { error: text || "Falha ao criar boleto" },
        { status: res.status }
      )
    }

    const json = JSON.parse(text)
    const data = json.data || json
    const boletoId = data.id

    const { error: insertErr } = await supa.from("PAGAMENTOS").insert({
      CLICOD: clicod || 0,
      PCRNOT: pvenum || 0,
      FCRPAR: index || 0,
      FBRVLR: Number(amount),
      COBCOD: 5, // Boleto
      STATUS: "pending",
      PROVIDER_ID: boletoId || null,
      METHOD: "boleto"
    })

    if (insertErr) console.error("Erro ao inserir PAGAMENTOS (boleto):", insertErr)
    else console.log("PAGAMENTOS boleto inserido:", boletoId)

    if (pvenum && index) {
      const { error: nvendaErr } = await supa
        .from("NVENDA")
        .update({ ENVIADO: true, PAGDES: "BOLETO" })
        .eq("PVENUM", pvenum)
        .eq("NPESEQ", index)
      if (nvendaErr) console.error("Erro ao atualizar NVENDA (boleto):", nvendaErr)
    }

    return NextResponse.json({
      boletoId,
      digitableLine: data.digitableLine || data.barCode || null,
      url: data.url || null,
      dueDate: data.dueDate || null,
      status: data.status
    })

  } catch (error) {
    console.error("Erro interno create-boleto:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
