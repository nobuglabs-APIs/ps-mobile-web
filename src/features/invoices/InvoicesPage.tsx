import { useEffect, useState } from 'react';
import { Download, FileCheck2, FileText, Printer, RotateCcw } from 'lucide-react';
import { createCreditNote, downloadSaft, getInvoice, listInvoices, type InvoiceDetail, type InvoiceDocument } from '../../api/psMobile';
import { Feedback, formatDate, formatMoney, PageHeading } from '../../components/feedback/Feedback';

const typeLabels: Record<string, string> = {
  invoice: 'Factura',
  receipt: 'Recibo',
  credit_note: 'Nota de crédito',
  debit_note: 'Nota de débito',
};

export function InvoicesPage({ workspaceId }: { workspaceId: string }) {
  const [documents, setDocuments] = useState<InvoiceDocument[]>([]);
  const [selected, setSelected] = useState<InvoiceDetail | null>(null);
  const [creditTarget, setCreditTarget] = useState<InvoiceDocument | null>(null);
  const [creditReason, setCreditReason] = useState('');
  const [periodFrom, setPeriodFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const page = await listInvoices(workspaceId);
      setDocuments(page.items);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os documentos fiscais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [workspaceId]);

  const openDetail = async (document: InvoiceDocument) => {
    setError('');
    setBusy(true);
    try {
      setSelected(await getInvoice(workspaceId, document.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível abrir o documento.');
    } finally {
      setBusy(false);
    }
  };

  const exportSaft = async () => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const from = new Date(`${periodFrom}T00:00:00.000Z`).toISOString();
      const to = new Date(`${periodTo}T23:59:59.999Z`).toISOString();
      const blob = await downloadSaft(workspaceId, from, to);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SAFT-AO-${periodFrom}-${periodTo}.xml`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice('Exportação SAF-T descarregada.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível exportar o SAF-T.');
    } finally {
      setBusy(false);
    }
  };

  const issueCreditNote = async () => {
    if (!creditTarget || !creditReason.trim()) {
      setError('Indique o motivo da nota de crédito.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await createCreditNote(workspaceId, creditTarget.id, creditReason.trim());
      setCreditTarget(null);
      setCreditReason('');
      setSelected(result);
      setNotice(`${result.display_number} emitida com sucesso.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível emitir a nota de crédito.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeading eyebrow="FISCALIDADE" title="Documentos fiscais" description="Consulte os documentos emitidos automaticamente nas vendas e exporte o ficheiro SAF-T." />
      {error && <Feedback message={error} />}
      {notice && <Feedback kind="success" message={notice} />}

      <section className="surface-card export-card">
        <div className="export-card__intro">
          <span className="row-icon row-icon--violet"><Download size={18} /></span>
          <div><h2>Exportar SAF-T (AO)</h2><p>Gere o ficheiro fiscal para o período escolhido.</p></div>
        </div>
        <div className="export-controls">
          <label className="form-field"><span>De</span><input onChange={(event) => setPeriodFrom(event.target.value)} type="date" value={periodFrom} /></label>
          <label className="form-field"><span>Até</span><input onChange={(event) => setPeriodTo(event.target.value)} type="date" value={periodTo} /></label>
          <button className="button button--primary" disabled={busy || periodFrom > periodTo} onClick={() => void exportSaft()} type="button"><Download size={16} /> {busy ? 'A preparar…' : 'Descarregar XML'}</button>
        </div>
      </section>

      {selected && (
        <section className="surface-card invoice-detail" id="printable-document">
          <div className="section-heading no-print">
            <div><h2>Documento {selected.display_number}</h2><p>Emitido em {formatDate(selected.issued_at)}</p></div>
            <div className="inline-actions">
              {selected.doc_type === 'invoice' && <button className="button button--subtle" onClick={() => { setCreditTarget(selected); setCreditReason(''); }} type="button"><RotateCcw size={15} /> Nota de crédito</button>}
              <button className="button button--subtle" onClick={() => window.print()} type="button"><Printer size={15} /> Imprimir</button>
              <button className="icon-button" aria-label="Fechar documento" onClick={() => setSelected(null)} type="button">×</button>
            </div>
          </div>
          <div className="invoice-paper">
            <div className="invoice-paper__header">
              <div><span className="eyebrow">PS-MOBILE · DOCUMENTO FISCAL</span><h2>{typeLabels[selected.doc_type] || selected.doc_type}</h2></div>
              <div className="invoice-number"><small>N.º do documento</small><strong>{selected.display_number}</strong></div>
            </div>
            <div className="invoice-meta">
              <div><small>Cliente</small><strong>{selected.customer_name}</strong><span>{selected.customer_tax_id || 'Consumidor final'}</span></div>
              <div><small>Data de emissão</small><strong>{formatDate(selected.issued_at)}</strong></div>
              <div><small>Estado</small><strong>{selected.status}</strong></div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Descrição</th><th>Qtd.</th><th>Preço unitário</th><th>IVA</th><th>Total</th></tr></thead>
                <tbody>{selected.lines.map((line) => (
                  <tr key={`${line.line_number}-${line.product_code}`}>
                    <td><span className="table-primary">{line.description}</span><small className="table-secondary">{line.product_code}</small></td>
                    <td>{line.quantity}</td>
                    <td>{formatMoney(line.unit_price_cents, selected.currency)}</td>
                    <td>{line.tax_percentage_bps / 100}%</td>
                    <td><strong>{formatMoney(line.line_total_cents, selected.currency)}</strong></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="invoice-totals">
              <div><span>Subtotal</span><strong>{formatMoney(selected.subtotal_cents, selected.currency)}</strong></div>
              <div><span>Impostos</span><strong>{formatMoney(selected.tax_cents, selected.currency)}</strong></div>
              <div className="invoice-totals__grand"><span>Total</span><strong>{formatMoney(selected.total_cents, selected.currency)}</strong></div>
            </div>
            <div className="invoice-integrity"><FileCheck2 size={16} /><span>Documento assinado digitalmente</span><code>{selected.hash}</code></div>
          </div>
        </section>
      )}

      <section className="surface-card">
        <div className="section-heading"><div><h2>Documentos emitidos <span className="count-pill">{documents.length}</span></h2><p>Documentos fiscais registados no espaço de trabalho.</p></div></div>
        {loading ? <div className="loading-panel">A carregar documentos…</div> : documents.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Documento</th><th>Cliente</th><th>Emissão</th><th>Total</th><th>Estado</th><th><span className="sr-only">Abrir</span></th></tr></thead>
              <tbody>{documents.map((document) => (
                <tr key={document.id}>
                  <td><span className="table-primary">{document.display_number}</span><small className="table-secondary">{typeLabels[document.doc_type] || document.doc_type}</small></td>
                  <td>{document.customer_name}</td>
                  <td>{formatDate(document.issued_at)}</td>
                  <td><strong>{formatMoney(document.total_cents, document.currency)}</strong></td>
                  <td><span className={`status-pill${document.status === 'issued' ? ' status-pill--success' : ''}`}>{document.status}</span></td>
                  <td><button className="button button--subtle button--small" disabled={busy} onClick={() => void openDetail(document)} type="button"><FileText size={14} /> Abrir</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : !loading && <div className="empty-state"><span><FileText size={20} /></span><strong>Sem documentos fiscais</strong><p>Ao registar vendas, os documentos emitidos aparecem aqui.</p></div>}
      </section>

      {creditTarget && (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="credit-title" aria-modal="true" className="dialog-card" role="dialog">
            <h2 id="credit-title">Emitir nota de crédito</h2>
            <p>A nota será associada ao documento {creditTarget.display_number} e registada no histórico fiscal.</p>
            <label className="form-field"><span>Motivo</span><textarea maxLength={500} onChange={(event) => setCreditReason(event.target.value)} required rows={3} value={creditReason} /></label>
            <div className="form-actions"><button className="button button--subtle" onClick={() => setCreditTarget(null)} type="button">Cancelar</button><button className="button button--primary" disabled={busy || !creditReason.trim()} onClick={() => void issueCreditNote()} type="button">{busy ? 'A emitir…' : 'Emitir nota'}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
