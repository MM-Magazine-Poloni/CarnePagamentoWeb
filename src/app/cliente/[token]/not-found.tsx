/**
 * Página 404 para /cliente/[token].
 * Exibida quando o token da URL não existe na base de dados.
 */
export default function NotFound() {
  return (
    <>
      <style>{`
        .nf-root {
          font-family: 'DM Sans', sans-serif;
          background: #0A0A0C;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
        }
        .nf-card {
          width: 100%; max-width: 360px;
          background: #111114;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 40px 28px 36px;
          text-align: center;
        }
        .nf-icon {
          width: 64px; height: 64px;
          border-radius: 20px;
          background: rgba(227,26,45,0.1);
          border: 1px solid rgba(227,26,45,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; color: #E31A2D;
          margin: 0 auto 24px;
        }
        .nf-title {
          font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px;
        }
        .nf-sub {
          font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.6;
        }
        .nf-code {
          display: inline-block;
          margin-top: 24px;
          padding: 6px 16px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          font-size: 11px;
          color: rgba(255,255,255,0.25);
          letter-spacing: 1px;
        }
      `}</style>
      <div className="nf-root">
        <div className="nf-card">
          <div className="nf-icon">
            <i className="bi bi-link-45deg"></i>
          </div>
          <div className="nf-title">Link inválido</div>
          <div className="nf-sub">
            Este link de pagamento não existe ou foi desativado.<br />
            Verifique com a loja se o endereço está correto.
          </div>
          <div className="nf-code">ERRO 404</div>
        </div>
      </div>
    </>
  )
}
