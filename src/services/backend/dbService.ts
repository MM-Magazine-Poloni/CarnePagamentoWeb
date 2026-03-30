import { createClient, SupabaseClient } from "@supabase/supabase-js"

/**
 * Cria um cliente Supabase com a Service Role Key (Server-side apenas).
 */
export function getSupabaseAdmin(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    
    if (!url || !key) {
        throw new Error("Supabase URL ou Key não configurada no servidor.")
    }

    return createClient(url, key)
}

/**
 * Serviço para lidar com operações de banco de dados (Backend).
 */
export const dbService = {
    /**
     * Limpa registros órfãos nas tabelas PAGAMENTOS e FCRECEBER que não existem mais na NVENDA.
     */
    async cleanupOrphanedRecords(supa: SupabaseClient, clicod: number, nvendaData: any[]) {
        const nvendaKeys = new Set(nvendaData.map(v => `${v.PVENUM}-${v.NPESEQ}`))

        // Cleanup PAGAMENTOS
        const { data: pgtData } = await supa
            .from("PAGAMENTOS")
            .select("id, PCRNOT, FCRPAR")
            .eq("CLICOD", clicod)

        if (pgtData && pgtData.length > 0) {
            const orphans = pgtData.filter(p => !nvendaKeys.has(`${p.PCRNOT}-${p.FCRPAR}`))
            if (orphans.length > 0) {
                const orphanIds = orphans.map(o => o.id)
                await supa.from("PAGAMENTOS").delete().in("id", orphanIds)
                console.log(`[DB Service] Deleted ${orphans.length} orphan records from PAGAMENTOS for clicod ${clicod}`)
            }
        }

        // Cleanup FCRECEBER
        const { data: fbcData } = await supa
            .from("FCRECEBER")
            .select("PCRNOT, FCRPAR")
            .eq("CLICOD", clicod)

        if (fbcData && fbcData.length > 0) {
            const orphans = fbcData.filter(f => !nvendaKeys.has(`${f.PCRNOT}-${f.FCRPAR}`))
            if (orphans.length > 0) {
                for (const orphan of orphans) {
                    await supa.from("FCRECEBER").delete()
                        .eq("PCRNOT", orphan.PCRNOT)
                        .eq("FCRPAR", orphan.FCRPAR)
                        .eq("CLICOD", clicod)
                }
                console.log(`[DB Service] Deleted ${orphans.length} orphan records from FCRECEBER for clicod ${clicod}`)
            }
        }
    },

    /**
     * Limpa registros órfãos para um contrato (PVENUM) específico.
     */
    async cleanupOrphanedContractRecords(supa: SupabaseClient, pvenum: number, nvendaData: any[]) {
        const nvendaIndices = new Set(nvendaData.map(v => Number(v.NPESEQ)))

        // Cleanup PAGAMENTOS
        const { data: pgtData } = await supa
            .from("PAGAMENTOS")
            .select("id, FCRPAR")
            .eq("PCRNOT", pvenum)

        if (pgtData && pgtData.length > 0) {
            const orphans = pgtData.filter(p => !nvendaIndices.has(Number(p.FCRPAR)))
            if (orphans.length > 0) {
                const orphanIds = orphans.map(o => o.id)
                await supa.from("PAGAMENTOS").delete().in("id", orphanIds)
                console.log(`[DB Service] Deleted ${orphans.length} orphan records from PAGAMENTOS for PVENUM ${pvenum}`)
            }
        }

        // Cleanup FCRECEBER
        const { data: fbcData } = await supa
            .from("FCRECEBER")
            .select("FCRPAR")
            .eq("PCRNOT", pvenum)

        if (fbcData && fbcData.length > 0) {
            const orphans = fbcData.filter(f => !nvendaIndices.has(Number(f.FCRPAR)))
            if (orphans.length > 0) {
                for (const orphan of orphans) {
                    await supa.from("FCRECEBER").delete()
                        .eq("PCRNOT", pvenum)
                        .eq("FCRPAR", orphan.FCRPAR)
                }
                console.log(`[DB Service] Deleted ${orphans.length} orphan records from FCRECEBER for PVENUM ${pvenum}`)
            }
        }
    }
}
