import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FileCheck2, Printer, X } from 'lucide-react';
import type { FiscalSettings, InvoiceDetail } from '../../api/psMobile';
import { formatDate, formatMoney } from '../../components/feedback/Feedback';

const typeLabels: Record<string, string> = {
  invoice: 'Fatura',
  receipt: 'Recibo',
  credit_note: 'Nota de crédito',
  debit_note: 'Nota de débito',
};

const statusLabels: Record<string, string> = {
  issued: 'Emitido',
  paid: 'Pago',
  cancelled: 'Anulado',
  draft: 'Rascunho',
};

type TaxRow = { rate: number; base: number; tax: number };

function taxRows(invoice: InvoiceDetail): TaxRow[] {
  const grouped = new Map<number, TaxRow>();
  for (const line of invoice.lines) {
    const row = grouped.get(line.tax_percentage_bps) ?? { rate: line.tax_percentage_bps, base: 0, tax: 0 };
    row.base += line.tax_base_cents;
    row.tax += line.tax_amount_cents;
    grouped.set(line.tax_percentage_bps, row);
  }
  return [...grouped.values()].sort((left, right) => right.rate - left.rate);
}

function formatRate(bps: number): string {
  return `${(bps / 100).toLocaleString('pt-PT', { maximumFractionDigits: 2 })}%`;
}

/**
 * Folha A4 do documento fiscal. É montada diretamente no <body> para que a
 * impressão do browser apanhe apenas a fatura e não a aplicação por baixo.
 */
export function InvoiceSheet({
  invoice,
  issuer,
  onClose,
  actions,
}: {
  invoice: InvoiceDetail;
  issuer: FiscalSettings | null;
  onClose: () => void;
  actions?: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const taxes = taxRows(invoice);
  const cancelled = invoice.status === 'cancelled';
  const issuerName = issuer?.company_name || 'PS-Mobile';
  const issuerLocation = [issuer?.address, issuer?.city, issuer?.country].filter(Boolean).join(', ');

  return createPortal(
    <div className="invoice-overlay" role="dialog" aria-label={`Documento ${invoice.display_number}`} aria-modal="true">
      <div className="invoice-overlay__bar">
        <div>
          <strong>{typeLabels[invoice.doc_type] || invoice.doc_type} {invoice.display_number}</strong>
          <small>{invoice.customer_name} · {formatMoney(invoice.total_cents, invoice.currency)}</small>
        </div>
        <div className="invoice-overlay__actions">
          {actions}
          <button className="button button--primary button--small" onClick={() => window.print()} type="button">
            <Printer size={15} /> Imprimir
          </button>
          <button className="invoice-overlay__close" aria-label="Fechar documento" onClick={onClose} type="button">
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="invoice-overlay__scroll">
        <article className="invoice-sheet" id="printable-invoice">
          <header className="inv-head">
            <div className="inv-issuer">
              <span className="inv-issuer__mark">PS-Mobile</span>
              <strong>{issuerName}</strong>
              {issuerLocation && <span>{issuerLocation}</span>}
              <span>
                {issuer?.tax_id ? `NIF ${issuer.tax_id}` : 'NIF não configurado'}
                {issuer?.phone ? ` · Tel. ${issuer.phone}` : ''}
              </span>
              {issuer?.email && <span>{issuer.email}</span>}
            </div>
            <div className="inv-title">
              <span className="inv-title__kind">{typeLabels[invoice.doc_type] || invoice.doc_type}</span>
              <strong>{invoice.display_number}</strong>
              <span className={`inv-badge inv-badge--${cancelled ? 'cancelled' : 'issued'}`}>
                {statusLabels[invoice.status] || invoice.status}
              </span>
              <small>Emitido em {formatDate(invoice.issued_at)}</small>
            </div>
          </header>

          <section className="inv-parties">
            <div>
              <small>Cliente</small>
              <strong>{invoice.customer_name}</strong>
              <span>{invoice.customer_tax_id ? `NIF ${invoice.customer_tax_id}` : 'Sem NIF'}</span>
              {invoice.customer_address && <span>{invoice.customer_address}</span>}
            </div>
            <div>
              <small>Moeda</small>
              <strong>{invoice.currency}</strong>
              <span>{invoice.lines.length} {invoice.lines.length === 1 ? 'linha' : 'linhas'}</span>
            </div>
          </section>

          <table className="inv-table">
            <thead>
              <tr>
                <th className="inv-col-number">#</th>
                <th>Descrição</th>
                <th className="inv-col-qty">Qtd.</th>
                <th className="inv-col-price">Preço unit.</th>
                <th className="inv-col-tax">IVA</th>
                <th className="inv-col-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={`${line.line_number}-${line.product_code}`}>
                  <td className="inv-col-number">{line.line_number}</td>
                  <td>
                    <strong>{line.description}</strong>
                    <small>{line.product_code}</small>
                  </td>
                  <td className="inv-col-qty">{line.quantity}</td>
                  <td className="inv-col-price">{formatMoney(line.unit_price_cents, invoice.currency)}</td>
                  <td className="inv-col-tax">{formatRate(line.tax_percentage_bps)}</td>
                  <td className="inv-col-total">{formatMoney(line.line_total_cents, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="inv-totals">
            {invoice.lines.length > 0 && (
              <div className="inv-totals__taxes">
                <small>Resumo de imposto</small>
                {taxes.map((row) => (
                  <span key={row.rate}>
                    <span>Base {formatRate(row.rate)} · {formatMoney(row.base, invoice.currency)}</span>
                    <span>{formatMoney(row.tax, invoice.currency)}</span>
                  </span>
                ))}
              </div>
            )}
            <div className="inv-totals__rows">
              <div><span>Subtotal</span><strong>{formatMoney(invoice.subtotal_cents, invoice.currency)}</strong></div>
              <div><span>Impostos</span><strong>{formatMoney(invoice.tax_cents, invoice.currency)}</strong></div>
              <div className="inv-totals__grand"><span>Total</span><strong>{formatMoney(invoice.total_cents, invoice.currency)}</strong></div>
            </div>
          </div>

          <footer className="inv-foot">
            <div className="inv-foot__integrity">
              <FileCheck2 size={13} />
              <span>Documento assinado digitalmente</span>
              <code>{invoice.hash}</code>
            </div>
            <div className="inv-foot__integrity">
              <span>Controlo</span>
              <code>{invoice.hash_control}</code>
            </div>
            <p>
              Processado por computador · PS-Mobile
              {issuer?.software_validation_number ? ` · Validação ${issuer.software_validation_number}` : ''}
            </p>
          </footer>

          {cancelled && <div className="inv-stamp">Anulado</div>}
        </article>
      </div>
    </div>,
    document.body,
  );
}
