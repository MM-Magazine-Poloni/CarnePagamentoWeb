/**
 * Layout server-side para /cliente/[token].
 * Verifica se o token existe na tabela CLIENTE antes de renderizar a página.
 * Se o token não existir, chama notFound() → renderiza not-found.tsx.
 * Isso impede que tokens aleatórios mostrem a tela de validação de CPF.
 */
import { notFound } from "next/navigation"
import { getSupabaseAdmin } from "../../../services/backend/dbService"

export default async function TokenLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { token: string }
}) {
  const { token } = params

  // Rejeitar imediatamente tokens obviamente inválidos
  if (!token || token.length < 6) {
    notFound()
  }

  const supa = getSupabaseAdmin()

  // Verificar se o token existe na base (sem expor CLICOD ou dados sensíveis)
  const { data } = await supa
    .from("CLIENTE")
    .select("CLICOD")
    .eq("public_token", token)
    .maybeSingle()

  if (!data) {
    notFound()
  }

  return <>{children}</>
}
