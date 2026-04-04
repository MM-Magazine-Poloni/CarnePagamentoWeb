/**
 * Serviço para chamadas de API (Frontend).
 * Responsável pela comunicação entre o navegador e os endpoints da API.
 */
export const apiService = {
    /**
     * Valida os últimos 3 dígitos do CPF e obtém um sessionToken.
     * Retorna { autorizado: true, sessionToken } ou { autorizado: false }.
     */
    async validateCpf(token: string, cpfFinal: string): Promise<{ autorizado: boolean; sessionToken?: string }> {
        const res = await fetch("/api/cliente/validar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, cpfFinal }),
        })
        const json = await res.json()
        if (!res.ok && res.status !== 200) {
            return { autorizado: false }
        }
        return json
    },

    /**
     * Busca dados de um cliente pelo token público.
     * Requer sessionToken obtido via validateCpf.
     */
    async getCustomerData(rawToken: string, sessionToken: string) {
        if (!rawToken) throw new Error("Token do cliente não informado.")
        if (!sessionToken) throw new Error("Sessão não iniciada.")

        const res = await fetch(`/api/cliente/${rawToken}`, {
            headers: { "Authorization": `Bearer ${sessionToken}` },
        })
        const json = await res.json()

        if (res.status === 401) {
            const err = new Error(json.error || "Sessão expirada.")
            ;(err as any).status = 401
            throw err
        }

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
            const err = new Error(json.error || "Falha ao criar QR Code PIX.")
            // Propaga flag para que PaymentScreen detecte parcela já paga
            if (res.status === 409 && json.alreadyPaid) (err as any).alreadyPaid = true
            throw err
        }

        return json
    },

}
