/*
 * DEPRECATED — Este módulo não é mais usado no fluxo principal.
 *
 * O sistema agora identifica clientes pelo campo `public_token` na tabela CLIENTE
 * (formato: cli_X8mP2Qa9Ld7TyR1Z). O CLICOD permanece como chave interna no banco
 * e nunca é exposto nas URLs públicas.
 *
 * Este arquivo é mantido apenas para compatibilidade com links antigos (tokens hex)
 * durante o período de transição. Pode ser removido após a migração completa.
 */

const SALT = 98765 // constante interna — não exportada
const PREFIX = "x"

/** @deprecated Use public_token (campo na tabela CLIENTE) para identificar clientes. */
export function encodeId(id: number | string): string {
    const num = Number(id)
    if (isNaN(num)) return String(id)
    return PREFIX + (num * SALT).toString(16)
}

/** @deprecated Use public_token (campo na tabela CLIENTE) para identificar clientes. */
export function decodeId(token: string): string {
    if (!token) return ""

    if (token.startsWith(PREFIX)) {
        try {
            const parsed = parseInt(token.slice(PREFIX.length), 16)
            if (!isNaN(parsed) && parsed % SALT === 0) {
                return String(parsed / SALT)
            }
        } catch { /* falha no decode */ }
    }

    if (/^[0-9a-fA-F]+$/.test(token) && !/^\d+$/.test(token)) {
        try {
            const parsed = parseInt(token, 16)
            if (!isNaN(parsed) && parsed % SALT === 0) {
                return String(parsed / SALT)
            }
        } catch { /* falha no decode */ }
    }

    return ""
}

/** @deprecated */
export const encodeClientId = encodeId
/** @deprecated */
export const decodeClientId = decodeId
