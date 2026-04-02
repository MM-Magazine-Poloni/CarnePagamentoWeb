"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import type { Installment, InstallmentStatus } from "../../../lib/types"
import { apiService } from "../../../services/frontend/apiService"
import { supabase } from "../../../lib/supabaseClient"

const ValidationScreen = dynamic(
  () => import("../../../components/ValidationScreen"),
  { ssr: false }
)

const ProductTour = dynamic(
  () => import("../../../components/ProductTour"),
  { ssr: false }
)
import InstallmentDetailScreen from "../../../components/InstallmentDetailScreen"
import PaymentScreen from "../../../components/PaymentScreen"
import { HomeTab } from "../../../components/dashboard/HomeTab"
import { SupportTab } from "../../../components/dashboard/SupportTab"
import { InstallmentsTab } from "../../../components/dashboard/InstallmentsTab"
import { ProfileTab } from "../../../components/dashboard/ProfileTab"
import { StoresTab } from "../../../components/dashboard/StoresTab"
import { HistoryTab } from "../../../components/dashboard/HistoryTab"
import { Sidebar } from "../../../components/dashboard/Sidebar"
import { BottomNav } from "../../../components/dashboard/BottomNav"
import { PaymentSuccessOverlay } from "../../../components/dashboard/PaymentSuccessOverlay"
import { HistoryDetailScreen } from "../../../components/dashboard/HistoryDetailScreen"

type ContractWithInstallments = {
  pvenum: number
  total: number
  count: number
  firstDate: string
  installments: Installment[]
}

export default function ClienteContratosPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Token público vindo da URL (/cliente/cli_X8mP2Qa9Ld7TyR1Z).
  // O frontend nunca decodifica nem conhece o CLICOD.
  const publicToken = params?.token as string

  // ── Sessão ────────────────────────────────────────────────────────────────
  // sessionToken fica apenas em memória — nunca em localStorage — para maior
  // segurança contra XSS. O usuário precisará re-validar ao recarregar a página.
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)

  // ── Dados ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contracts, setContracts] = useState<ContractWithInstallments[]>([])
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [expandedContract, setExpandedContract] = useState<number | null>(null)

  const initialTab = (searchParams?.get("tab") as 'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico') || 'inicio'
  const [activeTab, setActiveTab] = useState<'inicio' | 'suporte' | 'carnes' | 'perfil' | 'lojas' | 'historico'>(initialTab)
  const [installmentFilter, setInstallmentFilter] = useState<'tudo' | 'aberto' | 'atrasado' | 'finalizados'>('tudo')
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)
  const [screenMode, setScreenMode] = useState<'none' | 'detail' | 'payment' | 'history_detail'>('none')
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab, screenMode])

  useEffect(() => {
    if (searchParams?.get("payment") === "success") {
      setShowPaymentSuccess(true)
    }
  }, [searchParams])

  const dismissPaymentSuccess = useCallback(() => {
    setShowPaymentSuccess(false)
    const url = new URL(window.location.href)
    url.searchParams.delete("payment")
    router.replace(url.pathname + url.search, { scroll: false })
    window.location.reload()
  }, [router])

  useEffect(() => {
    if (!showPaymentSuccess) return
    const timer = setTimeout(() => dismissPaymentSuccess(), 5000)
    return () => clearTimeout(timer)
  }, [showPaymentSuccess, dismissPaymentSuccess])

  // ── Carrega dados após validação ──────────────────────────────────────────
  useEffect(() => {
    if (!sessionToken || !publicToken) return

    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const json = await apiService.getCustomerData(publicToken, sessionToken!)
        if (!mounted) return
        setCustomerName(json.customerName)
        setContracts(json.contracts || [])
      } catch (err: any) {
        if (!mounted) return
        if (err?.status === 401) {
          // Sessão expirou — volta para a tela de validação
          setSessionToken(null)
          setSessionExpired(true)
          return
        }
        setError(err.message || "Erro de rede")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [sessionToken, publicToken])

  // ── Supabase Realtime: sincronização entre dispositivos ───────────────────
  // Escuta a tabela PAGAMENTOS para o cliente atual.
  // Quando um pagamento é confirmado em qualquer dispositivo (PC, celular etc.),
  // a lista de parcelas é atualizada automaticamente sem precisar recarregar.
  useEffect(() => {
    // Extrair CLICOD do primeiro contrato carregado (definido apenas uma vez)
    const clicod = contracts.flatMap((c: ContractWithInstallments) => c.installments)[0]?.clicod
    if (!clicod || !sessionToken) return

    const channel = supabase
      .channel(`dashboard-pagamentos-${clicod}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "PAGAMENTOS",
          // Filtra por CLICOD para receber apenas mudanças deste cliente
          filter: `CLICOD=eq.${clicod}`
        },
        (payload: any) => {
          const row = payload.new
          // Só processar quando o status mudar para pago ou processado
          if (row.STATUS !== "paid" && row.STATUS !== "processed") return

          const pvenum = Number(row.PCRNOT)
          const fcrpar = Number(row.FCRPAR)

          console.log("[Realtime] Atualizando parcela paga:", pvenum, fcrpar)

          // Atualizar status da parcela correspondente em todos os contratos
          setContracts((prev: ContractWithInstallments[]) =>
            prev.map((c: ContractWithInstallments) => ({
              ...c,
              installments: c.installments.map((i: Installment) =>
                Number(i.pcrnot) === pvenum && Number(i.index) === fcrpar
                  ? { ...i, status: "pago" as InstallmentStatus }
                  : i
              )
            }))
          )
        }
      )
      .subscribe()

    // Cleanup: remover subscription ao deslogar ou recarregar contratos
    return () => {
      supabase.removeChannel(channel)
    }
  // Só recriar quando os contratos são carregados pela primeira vez
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts.length > 0, sessionToken])

  // ── Callback chamado pelo ValidationScreen após CPF correto ──────────────
  const handleValidated = useCallback((token: string) => {
    setSessionExpired(false)
    setSessionToken(token)
  }, [])

  const openDetail = (inst: Installment) => {
    setSelectedInstallment(inst)
    setScreenMode('detail')
  }

  const openPaymentFromDetail = () => setScreenMode('payment')
  const closeScreens = () => { setScreenMode('none'); setSelectedInstallment(null) }
  const goBackFromPayment = () => setScreenMode('detail')
  const goToHome = () => { setScreenMode('none'); setActiveTab('inicio'); setSelectedInstallment(null) }

  const nextInstallment = useMemo(() => {
    const all = contracts.flatMap(c => c.installments).filter(i => i.status !== "pago")
    return all.sort((a, b) => new Date(a.due_date + "T12:00:00").getTime() - new Date(b.due_date + "T12:00:00").getTime())[0]
  }, [contracts])

  const stats = useMemo(() => {
    const all = contracts.flatMap(c => c.installments)
    const paid = all.filter(i => i.status === "pago").length
    const total = all.length
    const totalAmount = all.filter(i => i.status !== "pago").reduce((acc, i) => acc + i.amount, 0)

    const paidWithDates = all.filter(i => i.status === "pago" && i.payment_date && i.due_date)
    const onTimeCount = paidWithDates.filter(i => {
      const payDay = new Date(i.payment_date! + "T12:00:00").setHours(0, 0, 0, 0)
      const dueDay = new Date(i.due_date + "T12:00:00").setHours(0, 0, 0, 0)
      return payDay <= dueDay
    }).length
    const earlyCount = paidWithDates.filter(i => {
      const payDay = new Date(i.payment_date! + "T12:00:00").setHours(0, 0, 0, 0)
      const dueDay = new Date(i.due_date + "T12:00:00").setHours(0, 0, 0, 0)
      return payDay < dueDay
    }).length

    return { paid, total, totalAmount, onTimeCount, earlyCount, scoredTotal: paidWithDates.length }
  }, [contracts])

  // ── Tela de validação (antes de qualquer dado ser carregado) ─────────────
  if (!sessionToken) {
    return (
      <ValidationScreen
        token={publicToken}
        onValidated={handleValidated}
        expired={sessionExpired}
      />
    )
  }

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: "#0A0A0C" }}>
        <div className="spinner-border text-primary-red" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4"
        style={{ background: "#0A0A0C" }}>
        <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
        <h4 className="fw-bold text-white">Ops! Algo deu errado.</h4>
        <p className="text-muted">{error}</p>
        <button className="btn btn-primary-red mt-3 px-4 rounded-3" onClick={() => window.location.reload()}>
          Tentar Novamente
        </button>
      </div>
    )
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} customerName={customerName} />

      <div className="main-content-area">
        <div className="tab-content-animated" key={activeTab}>
          {activeTab === 'inicio' && (
            <HomeTab
              customerName={customerName}
              stats={stats}
              nextInstallment={nextInstallment}
              setActiveTab={setActiveTab}
              setExpandedContract={setExpandedContract}
              openDetail={openDetail}
            />
          )}
          {activeTab === 'suporte' && <SupportTab setActiveTab={setActiveTab} />}
          {activeTab === 'carnes' && (
            <InstallmentsTab
              contracts={contracts}
              stats={stats}
              nextInstallment={nextInstallment}
              installmentFilter={installmentFilter}
              setInstallmentFilter={setInstallmentFilter}
              expandedContract={expandedContract}
              setExpandedContract={setExpandedContract}
              setActiveTab={setActiveTab}
              openDetail={openDetail}
            />
          )}
          {activeTab === 'perfil' && (
            <ProfileTab customerName={customerName} setActiveTab={setActiveTab} stats={stats} />
          )}
          {activeTab === 'lojas' && <StoresTab setActiveTab={setActiveTab} />}
          {activeTab === 'historico' && (
            <HistoryTab
              contracts={contracts}
              stats={stats}
              setActiveTab={setActiveTab}
              setSelectedInstallment={setSelectedInstallment}
              setScreenMode={setScreenMode}
            />
          )}
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {screenMode === 'detail' && selectedInstallment && (
        <InstallmentDetailScreen
          installment={selectedInstallment}
          onBack={closeScreens}
          onPay={openPaymentFromDetail}
          onHelp={() => setActiveTab('suporte')}
        />
      )}

      {screenMode === 'history_detail' && selectedInstallment && (
        <HistoryDetailScreen
          selectedInstallment={selectedInstallment}
          closeScreens={closeScreens}
        />
      )}

      {screenMode === 'payment' && selectedInstallment && (
        <PaymentScreen
          installment={selectedInstallment}
          onBack={goBackFromPayment}
          onGoHome={goToHome}
          onStatusChange={(newStatus: InstallmentStatus) => {
            setContracts(prev =>
              prev.map(c => ({
                ...c,
                installments: c.installments.map(i =>
                  i.id === selectedInstallment.id ? { ...i, status: newStatus } : i
                )
              }))
            )
          }}
        />
      )}

      {showPaymentSuccess && (
        <PaymentSuccessOverlay dismissPaymentSuccess={dismissPaymentSuccess} />
      )}

      {/* Product Tour — só renderiza quando o dashboard está visível */}
      {screenMode === 'none' && <ProductTour />}
    </div>
  )
}
