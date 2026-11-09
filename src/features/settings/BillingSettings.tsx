import { useCallback, useEffect, useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import {
  cancelSubscription,
  getBillingOverview,
  listPlans,
  payCharge,
  simulatePayment,
  startCheckout,
  type BillingOverview as BillingStatus,
  type BillingPayment,
  type Plan,
} from '../../api/psMobile';
import { Feedback, formatDate, formatMoney } from '../../components/feedback/Feedback';

const providers = [
  { value: 'multicaixa_express', label: 'Multicaixa Express' },
  { value: 'unitel_money', label: 'Unitel Money' },
  { value: 'afrimoney', label: 'Afrimoney' },
  { value: 'paypay_africa', label: 'PayPay Africa' },
];

const statusLabels: Record<string, string> = {
  trialing: 'Período experimental',
  active: 'Ativa',
  past_due: 'Pagamento em atraso',
  expired: 'Expirada',
  suspended: 'Suspensa',
  pending: 'Pendente',
  paid: 'Paga',
  cancelled: 'Cancelada',
};

export function BillingSettings({ workspaceId, canManage }: { workspaceId: string; canManage: boolean }) {
  const [overview, setOverview] = useState<BillingStatus | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [provider, setProvider] = useState(providers[0].value);
  const [payerPhone, setPayerPhone] = useState('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [simulationPaymentId, setSimulationPaymentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const [billing, availablePlans] = await Promise.all([getBillingOverview(workspaceId), listPlans()]);
    setOverview(billing);
    setPlans(availablePlans);
  }, [workspaceId]);

  useEffect(() => {
    let active = true;
    Promise.all([getBillingOverview(workspaceId), listPlans()])
      .then(([billing, availablePlans]) => {
        if (!active) return;
        setOverview(billing);
        setPlans(availablePlans);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a subscrição.');
      });
    return () => { active = false; };
  }, [workspaceId]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    setPaymentUrl(null);
    setSimulationPaymentId(null);
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar a subscrição.');
    } finally {
      setBusy(false);
    }
  };

  const choosePlan = (plan: Plan) => run(async () => {
    const result = await startCheckout(workspaceId, plan.code, provider, payerPhone || undefined);
    if (result.payment) handlePayment(result.payment);
    if (result.subscription) setNotice('Plano ativado.');
    else if (result.charge && !result.payment) setNotice('Cobrança criada. Conclua o pagamento para ativar o plano.');
    await load();
  });

  const payPendingCharge = (chargeId: string) => run(async () => {
    const result = await payCharge(workspaceId, chargeId, provider, payerPhone || undefined);
    handlePayment(result);
    await load();
  });

  const handlePayment = (payment: BillingPayment) => {
    if (isSimulatedPayment(payment)) {
      setSimulationPaymentId(payment.id);
      setNotice('Pagamento de teste criado. Confirme-o aqui para ativar o plano.');
    } else {
      setPaymentUrl(payment.external_url);
      setNotice(payment.external_url
        ? 'Pedido de pagamento criado. Conclua-o na página segura do provedor.'
        : 'Pedido de pagamento enviado ao provedor. Aguarde a confirmação.');
    }
  };

  const confirmSimulation = () => run(async () => {
    if (!simulationPaymentId) return;
    await simulatePayment(workspaceId, simulationPaymentId);
    setSimulationPaymentId(null);
    setNotice('Pagamento de teste confirmado. O plano foi ativado.');
    await load();
  });

  const cancel = () => {
    if (!window.confirm('Cancelar a renovação automática no fim do período atual?')) return;
    void run(async () => {
      await cancelSubscription(workspaceId);
      setNotice('A renovação foi cancelada. O acesso mantém-se até ao fim do período pago.');
      await load();
    });
  };

  return (
    <section className="surface-card billing-settings">
      <div className="section-heading">
        <div className="section-heading__title"><span className="row-icon row-icon--amber"><CreditCard size={18} /></span><div><h2>Plano e subscrição</h2><p>Consulte o seu plano, estado e pagamentos.</p></div></div>
        <button className="icon-button" disabled={busy} onClick={() => void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar.'))} type="button" aria-label="Atualizar estado da subscrição"><RefreshCw size={16} /></button>
      </div>
      {error && <Feedback message={error} />}
      {notice && <Feedback kind="success" message={notice} />}
      {paymentUrl && <a className="billing-payment-link" href={paymentUrl} rel="noreferrer" target="_blank">Abrir página segura de pagamento</a>}
      {simulationPaymentId && (
        <div className="billing-simulation-notice">
          <p>Está em modo de testes. Nenhum valor será cobrado.</p>
          <button className="button button--primary" disabled={busy} onClick={confirmSimulation} type="button">
            {busy ? 'A confirmar…' : 'Confirmar pagamento de teste'}
          </button>
        </div>
      )}
      {!overview ? <div className="loading-panel">A carregar plano e subscrição…</div> : (
        <>
          <div className="billing-status-card">
            <div><small>Estado da conta</small><strong>{statusLabels[overview.status] || overview.status}</strong></div>
            <div><small>Plano atual</small><strong>{overview.plan?.name || 'Sem plano contratado'}</strong></div>
            <div><small>{overview.status === 'trialing' ? 'Dias de teste restantes' : 'Renovação / fim do período'}</small><strong>{overview.status === 'trialing' ? overview.trial_days_left : overview.subscription ? formatDate(overview.subscription.current_period_end) : formatDate(overview.trial_ends_at)}</strong></div>
          </div>
          {overview.outstanding_cents > 0 && <p className="billing-outstanding">Valor pendente: <strong>{formatMoney(overview.outstanding_cents, overview.plan?.currency)}</strong></p>}
          {canManage && (
            <div className="billing-checkout-controls">
              <label className="form-field"><span>Como pretende pagar?</span><select value={provider} onChange={(event) => setProvider(event.target.value)}>{providers.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
              <label className="form-field"><span>Telemóvel para pagamento <small>(quando solicitado)</small></span><input autoComplete="tel" placeholder="+244 9xx xxx xxx" type="tel" value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} /></label>
            </div>
          )}
          {overview.charges.length > 0 && (
            <div className="billing-charge-list">
              <h3>Cobranças recentes</h3>
              {overview.charges.map((charge) => (
                <div className="billing-charge-row" key={charge.id}>
                  <span><strong>{charge.description}</strong><small>{formatDate(charge.created_at)} · {statusLabels[charge.status] || charge.status}</small></span>
                  <strong>{formatMoney(charge.amount_cents, charge.currency)}</strong>
                  {canManage && charge.status === 'pending' && <button className="button button--subtle button--small" disabled={busy} onClick={() => void payPendingCharge(charge.id)} type="button">Pagar</button>}
                </div>
              ))}
            </div>
          )}
          {canManage && plans.length > 0 && (
            <div className="billing-plan-section">
              <div className="section-heading"><div><h3>Planos disponíveis</h3><p>Escolha o plano mais adequado ao seu negócio.</p></div></div>
              <div className="billing-plan-grid">
                {plans.map((plan) => (
                  <article className={`billing-plan-card${overview.plan?.code === plan.code ? ' billing-plan-card--current' : ''}`} key={plan.code}>
                    <span className="billing-plan-card__kind">{plan.kind === 'usage' ? 'Por utilização' : plan.kind === 'annual' ? 'Anual' : 'Mensal'}</span>
                    <h4>{plan.name}</h4>
                    {plan.description && <p>{plan.description}</p>}
                    <strong className="billing-plan-card__price">{plan.kind === 'usage' ? `${plan.usage_percent_bps / 100}% por utilização` : `${formatMoney(plan.price_cents, plan.currency)}${plan.kind === 'annual' ? ' / ano' : ' / mês'}`}</strong>
                    {overview.plan?.code === plan.code
                      ? <span className="status-pill status-pill--success">Plano atual</span>
                      : <button className="button button--primary button--small" disabled={busy} onClick={() => void choosePlan(plan)} type="button">{busy ? 'A processar…' : 'Escolher plano'}</button>}
                  </article>
                ))}
              </div>
            </div>
          )}
          {canManage && overview.subscription && !overview.subscription.cancel_at_period_end && (
            <button className="button button--subtle billing-cancel-button" disabled={busy} onClick={cancel} type="button">Cancelar renovação</button>
          )}
        </>
      )}
    </section>
  );
}

function isSimulatedPayment(payment: BillingPayment): boolean {
  return typeof payment.metadata === 'object'
    && payment.metadata !== null
    && 'simulation' in payment.metadata
    && payment.metadata.simulation === true;
}
