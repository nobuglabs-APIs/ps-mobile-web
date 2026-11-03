import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { cancelSale, createSale, listCustomers, listProducts, listSales, type Customer, type Product, type Sale } from '../../api/psMobile';
import { Feedback, formatDate, formatMoney, PageHeading } from '../../components/feedback/Feedback';
import { PaymentMethodLogo } from '../../components/payments/PaymentMethodLogo';
import { mediaUrl } from '../../api/client';

const paymentOptions = [
  { value: 'cash', label: 'Numerário' },
  { value: 'multicaixa_express', label: 'Multicaixa Express' },
  { value: 'card', label: 'Cartão' },
  { value: 'bank_transfer', label: 'Transferência bancária' },
  { value: 'other', label: 'Outro' },
];

export function SalesPage({
  workspaceId,
  currency,
  canCancel,
}: {
  workspaceId: string;
  currency: string;
  canCancel: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const customerLookupId = useRef(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const [productPage, salePage] = await Promise.all([
        listProducts(workspaceId),
        listSales(workspaceId),
      ]);
      setProducts(productPage.items);
      setSales(salePage.items);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as vendas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [workspaceId]);

  useEffect(() => {
    const requestId = ++customerLookupId.current;
    const timer = window.setTimeout(() => {
      listCustomers(workspaceId, customerSearch)
        .then((page) => {
          if (requestId === customerLookupId.current) setCustomers(page.items);
        })
        .catch((reason: unknown) => {
          if (requestId === customerLookupId.current) {
            setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os clientes.');
          }
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [workspaceId, customerSearch]);

  const cartItems = useMemo(
    () => products.filter((product) => (cart[product.id] || 0) > 0),
    [cart, products],
  );
  const total = cartItems.reduce((sum, product) => sum + product.price_cents * cart[product.id], 0);

  const setQuantity = (productId: string, value: number) => {
    setCart((items) => {
      const next = { ...items };
      if (value <= 0) delete next[productId];
      else next[productId] = Math.min(value, 1_000_000);
      return next;
    });
  };

  const submitSale = async () => {
    if (!cartItems.length || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const sale = await createSale(workspaceId, {
        items: cartItems.map((product) => ({ product_id: product.id, quantity: cart[product.id] })),
        payment_method: paymentMethod,
        customer_id: customerId || undefined,
      });
      setCart({});
      setCustomerId('');
      setNotice(`Venda #${sale.number} registada. O documento fiscal foi emitido automaticamente.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível registar a venda.');
    } finally {
      setBusy(false);
    }
  };

  const voidSale = async (sale: Sale) => {
    if (sale.status === 'cancelled' || !window.confirm(`Anular a venda #${sale.number}? O stock será reposto se a caixa ainda estiver aberta.`)) return;
    setError('');
    setNotice('');
    try {
      await cancelSale(workspaceId, sale.id);
      setNotice(`Venda #${sale.number} anulada.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível anular a venda.');
    }
  };

  return (
    <div className="page-stack">
      <PageHeading eyebrow="OPERAÇÃO" title="Vendas" description="Registe uma venda; o total, o stock e o documento fiscal são processados pela API." />
      {error && <Feedback message={error} />}
      {notice && <Feedback kind="success" message={notice} />}

      <div className="sales-layout">
        <section className="surface-card">
          <div className="section-heading">
            <div><h2>Nova venda</h2><p>Escolha os produtos e quantidades.</p></div>
            <span className="count-pill">{products.length} produtos</span>
          </div>
          <label className="form-field sale-customer-select"><span>Cliente na fatura</span><input aria-label="Pesquisar cliente" onChange={(event) => { setCustomerId(''); setCustomerSearch(event.target.value); }} placeholder="Pesquisar clientes" value={customerSearch} /><select aria-label="Selecionar cliente da fatura" onChange={(event) => setCustomerId(event.target.value)} value={customerId}><option value="">Consumidor Final</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.tax_id ? ` · NIF ${customer.tax_id}` : ''}</option>)}</select><small className="form-hint">Opcional. Pesquise pelo nome ou NIF, ou deixe como Consumidor Final.</small></label>
          {loading ? <div className="loading-panel">A carregar catálogo…</div> : products.length ? (
            <div className="sale-product-list">
              {products.map((product) => (
                <article className="sale-product" key={product.id}>
                  {product.cover_url ? <img alt="" className="sale-product__image" loading="lazy" src={mediaUrl(product.cover_url) || undefined} /> : <span className="row-icon row-icon--blue"><ShoppingCart size={17} /></span>}
                  <span className="row-main"><strong>{product.name}</strong><small>{product.track_stock ? `${product.stock_quantity} em stock` : 'Stock não controlado'}</small></span>
                  <strong className="row-amount">{formatMoney(product.price_cents, currency)}</strong>
                  <div className="quantity-stepper">
                    <button aria-label={`Diminuir quantidade de ${product.name}`} disabled={!cart[product.id]} onClick={() => setQuantity(product.id, (cart[product.id] || 0) - 1)} type="button"><Minus size={14} /></button>
                    <span>{cart[product.id] || 0}</span>
                    <button aria-label={`Aumentar quantidade de ${product.name}`} disabled={product.track_stock && cart[product.id] >= product.stock_quantity} onClick={() => setQuantity(product.id, (cart[product.id] || 0) + 1)} type="button"><Plus size={14} /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="empty-state"><span><ShoppingCart size={20} /></span><strong>Adicione produtos ao catálogo</strong><p>É necessário ter pelo menos um produto ativo para registar vendas.</p></div>}
        </section>

        <aside className="surface-card cart-panel">
          <div className="section-heading"><div><h2>Resumo da venda</h2><p>Confirme antes de registar.</p></div></div>
          {cartItems.length ? (
            <div className="cart-items">
              {cartItems.map((product) => (
                <div className="cart-item" key={product.id}>
                  <div><strong>{product.name}</strong><small>{cart[product.id]} × {formatMoney(product.price_cents, currency)}</small></div>
                  <strong>{formatMoney(product.price_cents * cart[product.id], currency)}</strong>
                  <button className="icon-button icon-button--danger" aria-label={`Remover ${product.name}`} onClick={() => setQuantity(product.id, 0)} type="button"><Trash2 size={15} /></button>
                </div>
              ))}
              <label className="form-field"><span>Meio de pagamento</span>
                <select onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}>
                  {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {paymentMethod === 'multicaixa_express' && (
                  <span className="sales-payment-brand"><PaymentMethodLogo method={paymentMethod} /><span>Multicaixa Express</span></span>
                )}
              </label>
              <div className="cart-total"><span>Total</span><strong>{formatMoney(total, currency)}</strong></div>
              <button className="button button--primary button--full" disabled={busy} onClick={() => void submitSale()} type="button">
                {busy ? 'A registar venda…' : 'Confirmar venda'}
              </button>
              <p className="form-hint">O servidor valida novamente o preço e o stock no momento da confirmação.</p>
            </div>
          ) : <div className="empty-cart"><ShoppingCart size={22} /><span>O carrinho está vazio.</span><small>Selecione os artigos que pretende vender.</small></div>}
        </aside>
      </div>

      <section className="surface-card">
        <div className="section-heading"><div><h2>Histórico de vendas <span className="count-pill">{sales.length}</span></h2><p>Vendas recentes deste espaço de trabalho.</p></div></div>
        {loading ? <div className="loading-panel">A carregar histórico…</div> : sales.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Venda</th><th>Data</th><th>Pagamento</th><th>Valor</th><th>Estado</th><th><span className="sr-only">Ações</span></th></tr></thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td><span className="table-primary">#{sale.number}</span></td>
                    <td>{formatDate(sale.created_at)}</td>
                    <td>{paymentOptions.find((option) => option.value === sale.payment_method)?.label || sale.payment_method}</td>
                    <td><strong>{formatMoney(sale.total_cents, currency)}</strong></td>
                    <td><span className={`status-pill${sale.status === 'paid' ? ' status-pill--success' : ' status-pill--danger'}`}>{sale.status === 'paid' ? 'Concluída' : 'Anulada'}</span></td>
                    <td>{canCancel && sale.status === 'paid' && <button className="button button--subtle button--small" onClick={() => void voidSale(sale)} type="button">Anular</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading && <div className="empty-state"><span><ShoppingCart size={20} /></span><strong>Sem vendas registadas</strong><p>Quando registar uma venda, o histórico aparece nesta área.</p></div>}
      </section>
    </div>
  );
}
