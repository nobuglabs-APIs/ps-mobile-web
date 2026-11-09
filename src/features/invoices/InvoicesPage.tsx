import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Minus, Plus, RotateCcw, ShoppingCart } from 'lucide-react';
import {
  createSale,
  createCreditNote,
  downloadSaft,
  getFiscalSettings,
  getInvoice,
  getSaleInvoice,
  listCustomers,
  listInvoices,
  listProducts,
  type Customer,
  type FiscalSettings,
  type InvoiceDetail,
  type InvoiceDocument,
  type Product,
} from '../../api/psMobile';
import { Feedback, formatDate, formatMoney, PageHeading } from '../../components/feedback/Feedback';
import { InvoiceSheet } from './InvoiceSheet';

const typeLabels: Record<string, string> = {
  invoice: 'Factura',
  receipt: 'Recibo',
  credit_note: 'Nota de crédito',
  debit_note: 'Nota de débito',
};

const paymentOptions = [
  { value: 'cash', label: 'Numerário' },
  { value: 'multicaixa_express', label: 'Multicaixa Express' },
  { value: 'card', label: 'Cartão' },
  { value: 'bank_transfer', label: 'Transferência bancária' },
  { value: 'other', label: 'Outro' },
];

export function InvoicesPage({ workspaceId }: { workspaceId: string }) {
  const [documents, setDocuments] = useState<InvoiceDocument[]>([]);
  const [selected, setSelected] = useState<InvoiceDetail | null>(null);
  const [issuer, setIssuer] = useState<FiscalSettings | null>(null);
  const [creditTarget, setCreditTarget] = useState<InvoiceDocument | null>(null);
  const [creditReason, setCreditReason] = useState('');
  const [creating, setCreating] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [saleRequestKey, setSaleRequestKey] = useState('');
  const [periodFrom, setPeriodFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const selectedProducts = useMemo(
    () => products.filter((product) => (quantities[product.id] || 0) > 0),
    [products, quantities],
  );
  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase();
    return products.filter((product) => !query || product.name.toLocaleLowerCase().includes(query)
      || (product.code || '').toLocaleLowerCase().includes(query));
  }, [productSearch, products]);
  const invoiceTotal = selectedProducts.reduce(
    (total, product) => total + product.price_cents * quantities[product.id],
    0,
  );
  const canCreateInvoice = selectedProducts.length > 0
    && Boolean(paymentMethod)
    && selectedProducts.every((product) => !product.track_stock || quantities[product.id] <= product.stock_quantity);

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

  useEffect(() => {
    let active = true;
    getFiscalSettings(workspaceId)
      .then((settings) => { if (active) setIssuer(settings); })
      .catch(() => { /* a folha imprime sem os dados do emitente */ });
    return () => { active = false; };
  }, [workspaceId]);

  const openCreateForm = async () => {
    setError('');
    setNotice('');
    setFormLoading(true);
    try {
      const [productPage, customerPage] = await Promise.all([
        listProducts(workspaceId),
        listCustomers(workspaceId),
      ]);
      setProducts(productPage.items.filter((product) => product.is_active));
      setCustomers(customerPage.items.filter((customer) => customer.is_active));
      setQuantities({});
      setCustomerId('');
      setPaymentMethod('');
      setProductSearch('');
      setSaleRequestKey(crypto.randomUUID());
      setCreating(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível preparar a emissão da fatura.');
    } finally {
      setFormLoading(false);
    }
  };

  const createInvoice = async () => {
    if (!canCreateInvoice || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const sale = await createSale(
        workspaceId,
        {
          items: selectedProducts.map((product) => ({
            product_id: product.id,
            quantity: quantities[product.id],
          })),
          payment_method: paymentMethod,
          ...(customerId ? { customer_id: customerId } : {}),
        },
        saleRequestKey,
      );
      setCreating(false);
      setQuantities({});
      setSaleRequestKey('');
      setNotice(`Venda #${sale.number} concluída e fatura emitida.`);
      await load();
      try {
        setSelected(await getSaleInvoice(workspaceId, sale.id));
      } catch {
        setError(`Venda #${sale.number} concluída, mas não foi possível abrir a fatura. Consulte os documentos fiscais.`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível emitir a fatura.');
    } finally {
      setBusy(false);
    }
  };

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
      <PageHeading
        eyebrow="FISCALIDADE"
        title="Faturas"
        description="Emita uma fatura paga de forma simples ou consulte os documentos fiscais."
        action={<button className="button button--primary" disabled={busy || formLoading} onClick={() => void openCreateForm()} type="button">{formLoading ? 'A preparar…' : '＋ Nova fatura'}</button>}
      />
      {error && <Feedback message={error} />}
      {notice && <Feedback kind="success" message={notice} />}

      {creating && (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="invoice-create-title" aria-modal="true" className="dialog-card invoice-create-dialog" role="dialog">
            <div className="invoice-create-dialog__heading">
              <div><h2 id="invoice-create-title">Nova fatura</h2><p>Escolha os artigos e confirme o pagamento para emitir o documento.</p></div>
              <button aria-label="Fechar" className="icon-button" disabled={busy} onClick={() => setCreating(false)} type="button">×</button>
            </div>
            <label className="form-field">
              <span>Cliente <small>(opcional)</small></span>
              <select onChange={(event) => setCustomerId(event.target.value)} value={customerId}>
                <option value="">Consumidor Final</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.tax_id ? ` · NIF ${customer.tax_id}` : ''}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Pesquisar artigos</span>
              <input onChange={(event) => setProductSearch(event.target.value)} placeholder="Nome ou código do artigo" value={productSearch} />
            </label>
            <div className="invoice-create-products" aria-label="Artigos">
              {visibleProducts.map((product) => {
                const quantity = quantities[product.id] || 0;
                const unavailable = product.track_stock && product.stock_quantity < 1;
                return (
                  <div className="invoice-create-product" key={product.id}>
                    <span className="invoice-create-product__icon"><ShoppingCart size={16} /></span>
                    <span className="invoice-create-product__copy"><strong>{product.name}</strong><small>{formatMoney(product.price_cents)}{product.track_stock ? ` · ${product.stock_quantity} em stock` : ''}</small></span>
                    <div className="quantity-stepper">
                      <button aria-label={`Diminuir ${product.name}`} disabled={quantity < 1 || busy} onClick={() => setQuantities((current) => ({ ...current, [product.id]: quantity - 1 }))} type="button"><Minus size={14} /></button>
                      <span>{quantity}</span>
                      <button aria-label={`Aumentar ${product.name}`} disabled={unavailable || busy || (product.track_stock && quantity >= product.stock_quantity)} onClick={() => setQuantities((current) => ({ ...current, [product.id]: quantity + 1 }))} type="button"><Plus size={14} /></button>
                    </div>
                  </div>
                );
              })}
              {!visibleProducts.length && <p className="invoice-create-empty">{products.length ? 'Não foram encontrados artigos.' : 'Adicione artigos ao catálogo antes de emitir uma fatura.'}</p>}
            </div>
            <label className="form-field">
              <span>Meio de pagamento</span>
              <select onChange={(event) => setPaymentMethod(event.target.value)} required value={paymentMethod}>
                <option value="">Selecione o pagamento</option>
                {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <div className="invoice-create-total"><span>Total a pagar (com impostos)</span><strong>{formatMoney(invoiceTotal)}</strong></div>
            <p className="form-hint">A emissão regista a venda paga e atualiza o stock dos artigos controlados.</p>
            <div className="form-actions">
              <button className="button button--subtle" disabled={busy} onClick={() => setCreating(false)} type="button">Cancelar</button>
              <button className="button button--primary" disabled={!canCreateInvoice || busy} onClick={() => void createInvoice()} type="button">{busy ? 'A emitir…' : 'Emitir fatura'}</button>
            </div>
          </section>
        </div>
      )}

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
        <InvoiceSheet
          invoice={selected}
          issuer={issuer}
          onClose={() => setSelected(null)}
          actions={selected.doc_type === 'invoice' ? (
            <button className="button button--subtle button--small" onClick={() => { setCreditTarget(selected); setCreditReason(''); }} type="button"><RotateCcw size={15} /> Nota de crédito</button>
          ) : null}
        />
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
