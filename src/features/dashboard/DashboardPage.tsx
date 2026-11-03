import { useEffect, useState } from 'react';
import { ArrowUpRight, Boxes, CircleDollarSign, FileText, ShoppingCart, TriangleAlert } from 'lucide-react';
import { getSummary, listInvoices, listProducts, listSales, type InvoiceDocument, type Product, type Summary, type Workspace } from '../../api/psMobile';
import { Feedback, formatDate, formatMoney, PageHeading } from '../../components/feedback/Feedback';
import type { AppView } from '../../components/layout/AppShell';
import { PaymentMethodLogo } from '../../components/payments/PaymentMethodLogo';

const paymentLabels: Record<string, string> = {
  cash: 'Numerário',
  multicaixa_express: 'Multicaixa Express',
  card: 'Cartão',
  bank_transfer: 'Transferência',
  other: 'Outro',
};

export function DashboardPage({
  workspaceId,
  workspace,
  onNavigate,
}: {
  workspaceId: string;
  workspace: Workspace | null;
  onNavigate: (view: AppView) => void;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Array<{ id: string; number: number; total_cents: number; payment_method: string; created_at: string }>>([]);
  const [invoices, setInvoices] = useState<InvoiceDocument[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      getSummary(workspaceId),
      listProducts(workspaceId),
      listSales(workspaceId),
      listInvoices(workspaceId),
    ]).then(([report, productPage, salePage, invoicePage]) => {
      if (!active) return;
      setSummary(report);
      setProducts(productPage.items);
      setSales(salePage.items);
      setInvoices(invoicePage.items);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o resumo.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [workspaceId]);

  const lowStock = products.filter((product) => product.track_stock && product.stock_quantity <= product.min_stock);
  const latestInvoices = invoices.slice(0, 5);

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="RESUMO DO NEGÓCIO"
        title={`Bom dia${workspace?.name ? `, ${workspace.name}` : ''}`}
        description="Acompanhe as vendas, o catálogo e os documentos fiscais do seu espaço."
        action={<span className="period-pill">Últimos 30 dias</span>}
      />
      {error && <Feedback message={error} />}
      {loading && <div className="loading-panel">A carregar os dados do negócio…</div>}

      <section className="metric-grid" aria-label="Indicadores dos últimos 30 dias">
        <MetricCard icon={CircleDollarSign} label="Receita" value={formatMoney(summary?.revenue_cents || 0, workspace?.currency)} detail="Vendas não anuladas" tone="blue" />
        <MetricCard icon={ShoppingCart} label="Vendas" value={String(summary?.sales_count || 0)} detail="No período selecionado" tone="green" />
        <MetricCard icon={ArrowUpRight} label="Lucro estimado" value={formatMoney(summary?.estimated_profit_cents || 0, workspace?.currency)} detail="Com base no custo atual" tone="violet" />
        <MetricCard icon={Boxes} label="Produtos ativos" value={String(products.length)} detail={`${lowStock.length} com stock baixo`} tone={lowStock.length ? 'amber' : 'slate'} />
      </section>

      <div className="dashboard-grid">
        <section className="surface-card">
          <div className="section-heading">
            <div><h2>Vendas recentes</h2><p>Movimento mais recente do negócio</p></div>
            <button type="button" className="text-button" onClick={() => onNavigate('sales')}>Ver vendas <ArrowUpRight size={15} /></button>
          </div>
          {sales.length ? (
            <div className="data-list">
              {sales.slice(0, 6).map((sale) => (
                <div className="data-row" key={sale.id}>
                  <span className="row-icon row-icon--blue"><ShoppingCart size={17} /></span>
                  <span className="row-main"><strong>Venda #{sale.number}</strong><small>{formatDate(sale.created_at)} · {paymentLabels[sale.payment_method] || sale.payment_method}</small></span>
                  <strong className="row-amount">{formatMoney(sale.total_cents, workspace?.currency)}</strong>
                </div>
              ))}
            </div>
          ) : !loading && <EmptyState title="Ainda não há vendas" description="As vendas registadas vão aparecer aqui." />}
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div><h2>Produtos mais vendidos</h2><p>Por quantidade no período</p></div>
            <button type="button" className="text-button" onClick={() => onNavigate('products')}>Catálogo <ArrowUpRight size={15} /></button>
          </div>
          {summary?.top_products.length ? (
            <div className="rank-list">
              {summary.top_products.slice(0, 5).map((product, index) => (
                <div className="rank-row" key={product.product_id}>
                  <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="row-main"><strong>{product.product_name}</strong><small>{product.quantity} unidades</small></span>
                  <strong className="row-amount">{formatMoney(product.revenue_cents, workspace?.currency)}</strong>
                </div>
              ))}
            </div>
          ) : !loading && <EmptyState title="Sem dados de vendas" description="Os produtos terão classificação após as primeiras vendas." />}
        </section>
      </div>

      <div className="dashboard-grid dashboard-grid--lower">
        <section className="surface-card">
          <div className="section-heading">
            <div><h2>Documentos fiscais</h2><p>Últimos documentos emitidos</p></div>
            <button type="button" className="text-button" onClick={() => onNavigate('invoices')}>Ver todos <ArrowUpRight size={15} /></button>
          </div>
          {latestInvoices.length ? (
            <div className="data-list">
              {latestInvoices.map((invoice) => (
                <div className="data-row" key={invoice.id}>
                  <span className="row-icon row-icon--violet"><FileText size={17} /></span>
                  <span className="row-main"><strong>{invoice.display_number}</strong><small>{invoice.customer_name} · {formatDate(invoice.issued_at)}</small></span>
                  <strong className="row-amount">{formatMoney(invoice.total_cents, invoice.currency)}</strong>
                </div>
              ))}
            </div>
          ) : !loading && <EmptyState title="Sem documentos emitidos" description="Os documentos fiscais das vendas aparecem aqui." />}
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div><h2>Recebimentos</h2><p>Distribuição por método de pagamento</p></div>
          </div>
          {summary?.by_payment_method.length ? (
            <div className="payment-list">
              {summary.by_payment_method.map((item) => {
                const share = summary.revenue_cents > 0 ? Math.round((item.total_cents / summary.revenue_cents) * 100) : 0;
                return (
                  <div className="payment-item" key={item.payment_method}>
                    <div className="payment-item__label"><span className="payment-item__method"><PaymentMethodLogo method={item.payment_method} />{paymentLabels[item.payment_method] || item.payment_method}</span><strong>{share}%</strong></div>
                    <div className="progress-track"><span style={{ width: `${share}%` }} /></div>
                    <small>{formatMoney(item.total_cents, workspace?.currency)}</small>
                  </div>
                );
              })}
            </div>
          ) : !loading && <EmptyState title="Sem recebimentos" description="Os métodos de pagamento aparecem quando houver vendas." />}
        </section>
      </div>

      {lowStock.length > 0 && (
        <button className="stock-alert" type="button" onClick={() => onNavigate('products')}>
          <span className="stock-alert__icon"><TriangleAlert size={19} /></span>
          <span><strong>{lowStock.length} {lowStock.length === 1 ? 'produto precisa' : 'produtos precisam'} de atenção ao stock</strong><small>Reponha ou ajuste as quantidades no catálogo.</small></span>
          <ArrowUpRight size={17} />
        </button>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <div className={`metric-card__icon metric-card__icon--${tone}`}><Icon size={20} /></div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span><FileText size={19} /></span><strong>{title}</strong><p>{description}</p></div>;
}
