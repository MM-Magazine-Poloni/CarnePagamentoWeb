import type { Installment } from "../lib/types"

export default function InstallmentCard({
  installment,
  onClick
}: {
  installment: Installment
  onClick: () => void
}) {
  const isPending = installment.status === "pendente"
  const isLate = installment.status === "atrasado"
  const isPaid = installment.status === "pago"

  const statusLabel = isPending ? "ABERTO" : isLate ? "ATRASADO" : "PAGO"
  const statusClass = isPending ? "badge-aberto" : isLate ? "badge-atrasado" : "badge-pago"
  const totalAmount = installment.amount + (installment.fine_amount || 0)

  const parseDate = (d: string) => new Date(d + "T12:00:00")

  const dueFormatted = parseDate(installment.due_date).toLocaleDateString("pt-BR", {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const paidDateFormatted = installment.payment_date
    ? parseDate(installment.payment_date).toLocaleDateString("pt-BR", {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : dueFormatted

  return (
    <div
      className={`custom-installment-card ${isLate ? 'card-atrasado' : ''} ${isPaid ? 'card-pago' : ''}`}
      onClick={onClick}
    >
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <div className="text-muted small fw-bold text-uppercase ls-1" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)' }}>Parcela</div>
          <div className="fw-bold fs-4 text-white" style={{ lineHeight: 1.1 }}>
            {String(installment.index).padStart(2, '0')}
            <span className="fw-normal fs-6" style={{ color: 'rgba(255,255,255,0.75)' }}> / {String(installment.count).padStart(2, '0')}</span>
          </div>
        </div>
        <div className="d-flex flex-column align-items-end gap-1">
          <span className={`badge-custom ${statusClass}`}>
            {statusLabel}
          </span>
          {isPaid && (
            <span className="card-paid-date">{paidDateFormatted}</span>
          )}
        </div>
      </div>

      <div className="d-flex align-items-center mb-1" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>
        {installment.product_name && (
          <><i className="bi bi-box-seam me-2"></i> {installment.product_name}</>
        )}
      </div>

      <div className="d-flex align-items-center mb-3" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
        {isPaid ? (
          <><i className="bi bi-check-circle-fill me-2 text-success"></i> Pagamento Confirmado</>
        ) : isLate ? (
          <><i className="bi bi-exclamation-triangle-fill me-2" style={{ color: 'var(--status-late)' }}></i> Vencimento: {dueFormatted}</>
        ) : (
          <><i className="bi bi-calendar3 me-2"></i> Vencimento: {dueFormatted}</>
        )}
      </div>

      <div className="d-flex justify-content-between align-items-end">
        <div className="fw-bold fs-4" style={{ color: isPaid ? 'rgba(255,255,255,0.55)' : isLate ? 'var(--status-late)' : '#FFFFFF' }}>
          {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAmount)}
        </div>
        <div className="card-chevron">
          <i className="bi bi-chevron-right"></i>
        </div>
      </div>
    </div>
  )
}
