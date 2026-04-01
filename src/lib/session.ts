/**
 * Session token utilities — HMAC-SHA256, stateless.
 * Works in serverless (Vercel, etc.) without any storage.
 *
 * Requires env var: SESSION_SECRET (min 32 chars)
 */
import crypto from "crypto"

const SECRET = process.env.SESSION_SECRET || "dev-secret-MUDE-EM-PRODUCAO-32ch"

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    console.error("[session] SESSION_SECRET não definida em produção!")
}

interface SessionPayload {
    /** public_token do cliente */
    t: string
    /** unix ms expiry */
    exp: number
}

/** Gera um token assinado com HMAC-SHA256, válido por `ttlMs` milissegundos. */
export function createSessionToken(publicToken: string, ttlMs = 2 * 60 * 60 * 1000): string {
    const payload: SessionPayload = { t: publicToken, exp: Date.now() + ttlMs }
    const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
    const sig = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url")
    return `${b64}.${sig}`
}

/**
 * Verifica e decodifica um token de sessão.
 * Retorna `{ publicToken }` se válido, ou `null` se inválido/expirado.
 */
export function verifySessionToken(raw: string): { publicToken: string } | null {
    try {
        const dot = raw.lastIndexOf(".")
        if (dot === -1) return null

        const b64 = raw.slice(0, dot)
        const sig  = raw.slice(dot + 1)

        const expected = crypto.createHmac("sha256", SECRET).update(b64).digest("base64url")

        // Comparação em tempo constante para prevenir timing attacks
        const sBuf = Buffer.from(sig)
        const eBuf = Buffer.from(expected)
        if (sBuf.length !== eBuf.length) return null
        if (!crypto.timingSafeEqual(sBuf, eBuf)) return null

        const payload: SessionPayload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"))

        if (!payload.t || typeof payload.exp !== "number") return null
        if (payload.exp < Date.now()) return null

        return { publicToken: payload.t }
    } catch {
        return null
    }
}
