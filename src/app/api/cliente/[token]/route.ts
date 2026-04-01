import { NextResponse } from "next/server"
import type { Installment } from "../../../../lib/types"
import { dbService, getSupabaseAdmin } from "../../../../services/backend/dbService"
import { verifySessionToken } from "../../../../lib/session"

export const dynamic = "force-dynamic"

type ContractWithInstallments = {
    pvenum: number
    total: number
    count: number
    firstDate: string
    installments: Installment[]
}

export async function GET(
    req: Request,
    { params }: { params: { token: string } }
) {
    try {
        // ── 1. Recebe o token público da URL (/cliente/cli_xxxx) ─────────────────
        const publicToken = params.token

        if (!publicToken) {
            return NextResponse.json({ error: "Token ausente" }, { status: 400 })
        }

        // ── 2. Valida o sessionToken no header Authorization ─────────────────────
        const authHeader = req.headers.get("Authorization") ?? ""
        const rawSession = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
        const session = verifySessionToken(rawSession)

        if (!session || session.publicToken !== publicToken) {
            return NextResponse.json(
                { error: "Sessão inválida ou expirada. Faça a validação novamente." },
                { status: 401 }
            )
        }

        const supa = getSupabaseAdmin()

        let clicod: number
        let customerName: string | null = null
        let customerCpf: string | null = null

        if (publicToken.startsWith("cli_")) {
            // ── 2a. FLUXO PRINCIPAL: busca por public_token ───────────────────────
            // Localiza o cliente na tabela CLIENTE usando o campo public_token.
            // O CLICOD nunca é exposto na URL — fica apenas como chave interna.
            const { data: clienteRow, error: clienteErr } = await supa
                .from("CLIENTE")
                .select("CLICOD, CLINOM, CLICGC")
                .eq("public_token", publicToken)
                .maybeSingle()

            if (clienteErr) {
                console.error("Erro ao buscar cliente por public_token:", clienteErr)
                return NextResponse.json({ error: "Erro interno" }, { status: 500 })
            }

            if (!clienteRow) {
                return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
            }

            // ── 3. Extrai o CLICOD interno (nunca sai desta rota) ────────────────
            clicod = Number((clienteRow as any).CLICOD)
            customerName = (clienteRow as any).CLINOM ?? null
            customerCpf = (clienteRow as any).CLICGC ?? null

        } else {
            // ── 2b. FLUXO LEGADO: compatibilidade com links hex antigos ──────────
            // Mantido apenas para não quebrar links já distribuídos.
            // Pode ser removido após migração completa dos links para public_token.
            const { decodeClientId } = await import("../../../../lib/obfuscate")
            const decoded = decodeClientId(publicToken)
            clicod = Number(decoded)

            if (!clicod || isNaN(clicod)) {
                return NextResponse.json({ error: "Token inválido" }, { status: 400 })
            }

            const { data: clienteRow } = await supa
                .from("CLIENTE")
                .select("CLINOM, CLICGC")
                .eq("CLICOD", clicod)
                .maybeSingle()

            customerName = clienteRow ? (clienteRow as any).CLINOM : null
            customerCpf = clienteRow ? (clienteRow as any).CLICGC : null
        }

        if (!clicod || isNaN(clicod)) {
            return NextResponse.json({ error: "CLICOD inválido" }, { status: 400 })
        }

        // ── 4. Usa o CLICOD interno para buscar parcelas (NVENDA) ────────────────
        const { data, error } = await supa
            .from("NVENDA")
            .select("PVENUM, PVEDAT, NPESEQ, PVETPA, PAGCOD, PAGDES, CLICOD, PRODES")
            .eq("CLICOD", clicod)
            .order("PVENUM", { ascending: false })
            .order("NPESEQ", { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Limpeza de registros órfãos
        await dbService.cleanupOrphanedRecords(supa, clicod, data || [])

        if (!data || data.length === 0) {
            return NextResponse.json(
                { customerName, customerCpf, contracts: [] },
                {
                    headers: {
                        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                        "Pragma": "no-cache",
                        "Expires": "0",
                    },
                }
            )
        }

        // ── 5. FCRECEBER — fonte principal de status das parcelas ────────────────
        const { data: fbcData } = await supa
            .from("FCRECEBER")
            .select("PCRNOT, FCRPAR, FCRVEN, FCRPGT, COBCOD")
            .eq("CLICOD", clicod)

        // ── 6. PAGAMENTOS — complementar (pix_charge_id, método) ─────────────────
        const { data: pgtData } = await supa
            .from("PAGAMENTOS")
            .select("PCRNOT, FCRPAR, STATUS, PROVIDER_ID, METHOD")
            .eq("CLICOD", clicod)

        // Mapa FCRECEBER: "PCRNOT-FCRPAR" → { fcrven, fcrpgt, cobcod }
        const fcrMap = new Map<string, { fcrven: string | null; fcrpgt: string | null; cobcod: number | null }>()
        for (const row of (fbcData || []) as any[]) {
            fcrMap.set(`${row.PCRNOT}-${row.FCRPAR}`, {
                fcrven: row.FCRVEN || null,
                fcrpgt: row.FCRPGT || null,
                cobcod: row.COBCOD != null ? Number(row.COBCOD) : null
            })
        }

        // Mapa PAGAMENTOS: prioriza paid/processed sobre pending
        const pgtMap = new Map<string, { status: string; providerId: string | null; method: string | null }>()
        for (const row of (pgtData || []) as any[]) {
            const key = `${row.PCRNOT}-${row.FCRPAR}`
            const existing = pgtMap.get(key)
            if (!existing || existing.status === "pending") {
                pgtMap.set(key, {
                    status: row.STATUS,
                    providerId: row.PROVIDER_ID || null,
                    method: row.METHOD || null
                })
            }
        }

        function addDays(base: string, days: number) {
            const d = new Date(base + "T12:00:00")
            d.setDate(d.getDate() + days)
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, "0")
            const dd = String(d.getDate()).padStart(2, "0")
            return `${y}-${m}-${dd}`
        }

        // ── 7. Monta contratos e parcelas ────────────────────────────────────────
        const map = new Map<number, ContractWithInstallments>()
        for (const row of data as any[]) {
            const num = Number(row.PVENUM)
            if (!map.has(num)) {
                map.set(num, {
                    pvenum: num,
                    total: 0,
                    count: 0,
                    firstDate: row.PVEDAT,
                    installments: []
                })
            }

            const item = map.get(num)!
            item.total += Number(row.PVETPA || 0)
            item.count = Math.max(item.count, Number(row.NPESEQ))
            if (new Date(row.PVEDAT + "T12:00:00") < new Date(item.firstDate + "T12:00:00")) {
                item.firstDate = row.PVEDAT
            }

            const idx = Number(row.NPESEQ)
            const firstIsBoleto = String(row.PAGDES || "").toUpperCase() === "BOLETO" || Number(row.PAGCOD) === 5
            const due = firstIsBoleto
                ? addDays(item.firstDate, 30 * idx)
                : addDays(item.firstDate, 30 * (idx - 1))

            const fcrKey = `${num}-${idx}`
            const fcr = fcrMap.get(fcrKey)

            // Vencimento real vem da FCRECEBER; fallback para data calculada
            const dueDate = fcr?.fcrven || due

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const dueDateObj = new Date(dueDate + "T12:00:00")
            dueDateObj.setHours(0, 0, 0, 0)

            // FCRECEBER.FCRPGT é o veredito de pagamento
            let status: any
            if (fcr?.fcrpgt) {
                status = "pago"
            } else if (dueDateObj < today) {
                status = "atrasado"
            } else {
                status = "pendente"
            }

            const pgt = pgtMap.get(fcrKey)
            const cobcodMap: Record<number, string> = {
                1: "Dinheiro", 2: "Cheque", 3: "Cartão Débito",
                4: "Cartão Crédito", 5: "Boleto", 6: "Cheque Pré", 7: "PIX"
            }
            const cobcodMethod = fcr?.cobcod != null ? (cobcodMap[fcr.cobcod] ?? null) : null
            const paymentMethod = fcr?.fcrpgt
                ? (cobcodMethod || pgt?.method || "PIX")
                : null
            const pixChargeId = (!fcr?.fcrpgt && pgt?.status === "pending")
                ? (pgt.providerId || null)
                : null

            item.installments.push({
                id: `${row.PVENUM}-${row.NPESEQ}`,
                contract_id: String(row.PVENUM),
                index: idx,
                count: 0,
                amount: Number(row.PVETPA || 0),
                due_date: dueDate,
                status,
                pix_charge_id: pixChargeId,
                pcrnot: Number(row.PVENUM),
                clicod: clicod, // CLICOD interno — não exposto na URL
                payment_date: fcr?.fcrpgt || null,
                payment_method: paymentMethod,
                product_name: row.PRODES,
                purchase_date: row.PVEDAT
            })
        }

        const contracts = Array.from(map.values()).map(c => ({
            ...c,
            installments: c.installments.map(i => ({ ...i, count: c.count }))
        })).sort((a, b) => b.pvenum - a.pvenum)

        return NextResponse.json(
            { customerName, customerCpf, contracts },
            {
                headers: {
                    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            }
        )

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
}
