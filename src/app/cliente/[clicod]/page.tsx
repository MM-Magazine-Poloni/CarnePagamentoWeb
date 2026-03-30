"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"
import type { Installment, InstallmentStatus } from "../../../lib/types"
import InstallmentCard from "../../../components/InstallmentCard"
import InstallmentDetailScreen from "../../../components/InstallmentDetailScreen"
import PaymentScreen from "../../../components/PaymentScreen"
import { decodeClientId } from "../../../lib/obfuscate"
import { apiService } from "../../../services/frontend/apiService"
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
  const rawToken = params?.clicod as string
  const clicod = useMemo(() => Number(decodeClientId(rawToken)), [rawToken])
  const [loading, setLoading] = useState(true)
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

  // Scroll to top when tab or screen mode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab, screenMode])

  // Detect ?payment=success from AbacatePay redirect
  useEffect(() => {
    if (searchParams?.get("payment") === "success") {
      setShowPaymentSuccess(true)
    }
  }, [searchParams])

  const dismissPaymentSuccess = useCallback(() => {
    setShowPaymentSuccess(false)
    // Remove query param from URL without reload
    const url = new URL(window.location.href)
    url.searchParams.delete("payment")
    router.replace(url.pathname + url.search, { scroll: false })
    // Reload data to get updated statuses
    window.location.reload()
  }, [router])

  // Auto-dismiss payment success after 5 seconds
  useEffect(() => {
    if (!showPaymentSuccess) return
    const timer = setTimeout(() => {
      dismissPaymentSuccess()
    }, 5000)
    return () => clearTimeout(timer)
  }, [showPaymentSuccess, dismissPaymentSuccess])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!rawToken || !clicod || isNaN(clicod)) {
        setError("Cliente inválido")
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)

      try {
        const json = await apiService.getCustomerData(rawToken)

        if (!mounted) return
        setCustomerName(json.customerName)
        setContracts(json.contracts || [])
      } catch (err: any) {
        if (!mounted) return
        setError(err.message || "Erro de rede")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [clicod])

  const openDetail = (inst: Installment) => {
    setSelectedInstallment(inst)
    setScreenMode('detail')
  }

  const openPaymentFromDetail = () => {
    setScreenMode('payment')
  }

  const closeScreens = () => {
    setScreenMode('none')
    setSelectedInstallment(null)
  }

  const goBackFromPayment = () => {
    setScreenMode('detail')
  }

  const goToHome = () => {
    setScreenMode('none')
    setActiveTab('inicio')
    setSelectedInstallment(null)
  }

  const nextInstallment = useMemo(() => {
    const all = contracts.flatMap(c => c.installments).filter(i => i.status !== "pago")
    return all.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
  }, [contracts])

  const stats = useMemo(() => {
    const all = contracts.flatMap(c => c.installments)
    const paid = all.filter(i => i.status === "pago").length
    const total = all.length
    const totalAmount = all.filter(i => i.status !== "pago").reduce((acc, i) => acc + i.amount, 0)
    return { paid, total, totalAmount }
  }, [contracts])

  return (
    <div className="dashboard-container">
      {loading ? (
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary-red" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : error ? (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100 text-center p-4">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3"></i>
          <h4 className="fw-bold">Ops! Algo deu errado.</h4>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary-red mt-3 px-4 rounded-3" onClick={() => window.location.reload()}>Tentar Novamente</button>
        </div>
      ) : (
        <>
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} customerName={customerName} />

          {/* Main Content Wrapper */}
          <div className="main-content-area">
            {/* TAB CONTENT */}
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

              {activeTab === 'suporte' && (
                <SupportTab setActiveTab={setActiveTab} />
              )}

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

              {activeTab === 'lojas' && (
                <StoresTab setActiveTab={setActiveTab} />
              )}

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
        </>
      )}

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
            setContracts((prev) =>
              prev.map((c) => ({
                ...c,
                installments: c.installments.map((i) =>
                  i.id === selectedInstallment.id
                    ? { ...i, status: newStatus }
                    : i
                )
              }))
            )
          }}
        />
      )}

      {/* Payment Success Overlay */}
      {showPaymentSuccess && (
        <PaymentSuccessOverlay dismissPaymentSuccess={dismissPaymentSuccess} />
      )}
    </div>
  )
}

