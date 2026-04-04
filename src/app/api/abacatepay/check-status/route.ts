import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Consulta o status de uma cobrança PIX no AbacatePay.
 * GET /api/abacatepay/check-status?id=xxx
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const chargeId = searchParams.get("id")

        if (!chargeId) {
            return NextResponse.json({ error: "ID ausente" }, { status: 400 })
        }

        const apiUrl = process.env.ABACATEPAY_API_URL
        const apiKey = process.env.ABACATEPAY_API_KEY

        if (!apiUrl || !apiKey) {
            return NextResponse.json(
                { error: "API de pagamento não configurada" },
                { status: 500 }
            )
        }

        const endpoint = `${apiUrl}/v1/pixQrCode/check?id=${encodeURIComponent(chargeId)}`

        const res = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Accept":        "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
        })

        const text = await res.text()

        if (!res.ok) {
            console.error("Erro ao checar status PIX:", text)
            return NextResponse.json(
                { error: text || "Falha ao checar status" },
                { status: res.status }
            )
        }

        const json = JSON.parse(text)
        const data = json.data ?? json

        return NextResponse.json({
            status:    data.status,
            expiresAt: data.expiresAt,
        })

    } catch (error) {
        console.error("Erro interno check-status:", error)
        return NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
}
