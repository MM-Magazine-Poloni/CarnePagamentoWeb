/**
 * Serviço para chamadas de API (Frontend).
 * Responsável pela comunicação entre o navegador e os endpoints da API.
 */
export const apiService = {
    /**
     * Busca dados de um cliente pelo token (clicod).
     */
    async getCustomerData(rawToken: string) {
        if (!rawToken) throw new Error("Token do cliente não informado.")
        
        const res = await fetch(`/api/cliente/${rawToken}`)
        const json = await res.json()

        if (!res.ok) {
            throw new Error(json.error || "Erro ao buscar dados do cliente.")
        }

        return json
    },

    /**
     * Busca dados de um contrato pelo PVENUM.
     */
    async getContractData(pvenum: string) {
        if (!pvenum) throw new Error("Número do contrato não informado.")
        
        const res = await fetch(`/api/contracts/${pvenum}`)
        const json = await res.json()

        if (!res.ok) {
            throw new Error(json.error || "Erro ao buscar dados do contrato.")
        }

        return json
    },

    /**
     * Cria uma cobrança PIX via AbacatePay.
     */
    async createCharge(body: {
        installmentId: string,
        amount: number,
        clicod: number,
        pvenum: number,
        index: number
    }) {
        const res = await fetch("/api/abacatepay/create-charge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })

        const json = await res.json()
        if (!res.ok) {
            throw new Error(json.error || "Falha ao criar QR Code PIX.")
        }

        return json
    },

    /**
     * Cria uma cobrança Boleto via AbacatePay.
     */
    async createBoleto(body: {
        installmentId: string,
        amount: number,
        clicod: number,
        pvenum: number,
        index: number
    }) {
        const res = await fetch("/api/abacatepay/create-boleto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        })

        const json = await res.json()
        if (!res.ok) {
            throw new Error(json.error || "Falha ao criar boleto.")
        }

        return json
    }
}
