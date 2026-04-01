/**
 * POST /api/cliente/validar
 * Valida os últimos 3 dígitos do CPF e emite um sessionToken assinado.
 *
 * Body: { token: string, cpfFinal: string (3 dígitos) }
 * Resposta sucesso: { autorizado: true, sessionToken: string }
 * Resposta falha:   { autorizado: false }
 */
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../services/backend/dbService"
import { createSessionToken } from "../../../../lib/session"

export const dynamic = "force-dynamic"

/** Extrai e normaliza somente dígitos de uma string. */
function digitsOnly(s: string | null | undefined): string {
    return String(s ?? "").replace(/\D/g, "")
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null)

        const token: string    = body?.token    ?? ""
        const cpfFinal: string = body?.cpfFinal ?? ""

        // ── Validação básica dos inputs ──────────────────────────────────────────
        if (!token || typeof token !== "string" || token.length < 4) {
            return NextResponse.json({ autorizado: false }, { status: 400 })
        }
        if (!/^\d{3}$/.test(cpfFinal)) {
            return NextResponse.json(
                { autorizado: false, error: "cpfFinal deve conter exatamente 3 dígitos." },
                { status: 400 }
            )
        }

        const supa = getSupabaseAdmin()

        // ── Busca cliente pelo public_token ──────────────────────────────────────
        // Somente CLICGC é selecionado — nunca retornamos CLICOD para o cliente.
        const { data: cliente, error } = await supa
            .from("CLIENTE")
            .select("CLICGC")
            .eq("public_token", token)
            .maybeSingle()

        if (error) {
            console.error("[validar] erro Supabase:", error.message)
            return NextResponse.json({ autorizado: false }, { status: 500 })
        }

        // ── Resposta idêntica quando cliente não existe (evita enumeração de tokens) ──
        if (!cliente) {
            return NextResponse.json({ autorizado: false })
        }

        // ── Compara os últimos 3 dígitos do CPF ──────────────────────────────────
        const cpfDigits = digitsOnly((cliente as any).CLICGC)
        const lastThree = cpfDigits.slice(-3)

        if (!lastThree || lastThree !== cpfFinal) {
            return NextResponse.json({ autorizado: false })
        }

        // ── Autorizado — emite token de sessão (2 horas) ─────────────────────────
        const sessionToken = createSessionToken(token)

        return NextResponse.json({ autorizado: true, sessionToken })

    } catch (e) {
        console.error("[validar] erro inesperado:", e)
        return NextResponse.json({ autorizado: false }, { status: 500 })
    }
}
