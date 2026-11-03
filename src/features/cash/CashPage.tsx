import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowDownToLine, Banknote, CircleDollarSign, DoorClosed, DoorOpen } from 'lucide-react';
import { ApiError } from '../../api/client';
import {
  addCashMovement,
  closeCash,
  getCurrentCash,
  listCashSessions,
  openCash,
  type CashSession,
  type CashSummary,
} from '../../api/psMobile';
import { Feedback, formatDate, formatMoney, PageHeading } from '../../components/feedback/Feedback';

type MovementKind = 'expense' | 'withdrawal' | 'deposit';
const movementNames: Record<MovementKind, string> = { expense: 'Despesa', withdrawal: 'Retirada', deposit: 'Reforço' };

export function CashPage({ workspaceId, currency, canViewHistory }: { workspaceId: string; currency: string; canViewHistory: boolean }) {
  const [session, setSession] = useState<CashSummary | null>(null);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [openingAmount, setOpeningAmount] = useState('0');
  const [countedAmount, setCountedAmount] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementKind, setMovementKind] = useState<MovementKind>('expense');
  const [movementNote, setMovementNote] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [noOpenSession, setNoOpenSession] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoaded(false);
    setError('');
    try {
      setSession(await getCurrentCash(workspaceId));
      setNoOpenSession(false);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 404) {
        setSession(null);
        setNoOpenSession(true);
      } else {
        setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a caixa.');
        setSession(null);
        setNoOpenSession(false);
      }
    } finally {
      setLoaded(true);
    }
    if (canViewHistory) {
      try {
        setHistory((await listCashSessions(workspaceId)).items);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o histórico da caixa.');
      }
    }
  }, [workspaceId, canViewHistory]);

  useEffect(() => { void load(); }, [load]);

  const cents = (value: string) => {
    const amount = Number(value.replace(',', '.'));
    if (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000_000) throw new Error('Introduza um valor válido.');
    return Math.round(amount * 100);
  };

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível concluir a operação.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpen = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      await openCash(workspaceId, cents(openingAmount));
      setNotice('Caixa aberta. Pode agora registar vendas em numerário.');
    });
  };

  const handleMovement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      const amount = cents(movementAmount);
      if (amount <= 0) throw new Error('O valor do movimento deve ser superior a zero.');
      await addCashMovement(workspaceId, { kind: movementKind, amount_cents: amount, note: movementNote.trim() || undefined });
      setMovementAmount('');
      setMovementNote('');
      setNotice(`${movementNames[movementKind]} registada.`);
    });
  };

  const handleClose = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      await closeCash(workspaceId, cents(countedAmount), closingNote.trim() || undefined);
      setCountedAmount('');
      setClosingNote('');
      setNotice('Caixa fechada. A diferença entre o saldo esperado e o contado ficou registada.');
    });
  };

  return (
    <div className="page-stack">
      <PageHeading eyebrow="OPERAÇÃO" title="Caixa" description="Abra a sessão, registe movimentos e confira o dinheiro no fecho." />
      {error && <Feedback message={error} />}
      {notice && <Feedback kind="success" message={notice} />}
      {session ? (
        <>
          <section className="surface-card">
            <div className="section-heading"><div><h2><DoorOpen size={18} /> Caixa aberta</h2><p>Iniciada {formatDate(session.opened_at)}. O saldo considera apenas dinheiro físico.</p></div><span className="status-pill status-pill--success">Aberta</span></div>
            <div className="metric-grid cash-metrics">
              <Metric label="Saldo esperado" value={formatMoney(session.current_expected_cents, currency)} />
              <Metric label="Fundo inicial" value={formatMoney(session.opening_float_cents, currency)} />
              <Metric label="Vendas em numerário" value={formatMoney(session.cash_sales_cents, currency)} />
              <Metric label="Despesas e retiradas" value={formatMoney(session.expenses_cents + session.withdrawals_cents, currency)} />
            </div>
          </section>
          <div className="cash-actions-grid">
            <section className="surface-card">
              <div className="section-heading"><div><h2><ArrowDownToLine size={17} /> Movimento de caixa</h2><p>Registe uma despesa, retirada ou reforço.</p></div></div>
              <form className="form-grid form-grid--compact" onSubmit={(event) => void handleMovement(event)}>
                <label className="form-field"><span>Tipo</span><select onChange={(event) => setMovementKind(event.target.value as MovementKind)} value={movementKind}>{Object.entries(movementNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="form-field"><span>Valor ({currency})</span><input inputMode="decimal" min="0.01" onChange={(event) => setMovementAmount(event.target.value)} required step="0.01" type="number" value={movementAmount} /></label>
                <label className="form-field form-field--wide"><span>Descrição (opcional)</span><input maxLength={500} onChange={(event) => setMovementNote(event.target.value)} value={movementNote} /></label>
                <button className="button button--primary form-actions--wide" disabled={busy} type="submit">{busy ? 'A registar…' : 'Registar movimento'}</button>
              </form>
            </section>
            <section className="surface-card">
              <div className="section-heading"><div><h2><DoorClosed size={17} /> Fechar caixa</h2><p>Conte apenas o dinheiro físico que está na gaveta.</p></div></div>
              <form className="form-grid form-grid--compact" onSubmit={(event) => void handleClose(event)}>
                <label className="form-field"><span>Valor contado ({currency})</span><input inputMode="decimal" min="0" onChange={(event) => setCountedAmount(event.target.value)} required step="0.01" type="number" value={countedAmount} /></label>
                <label className="form-field"><span>Nota (opcional)</span><input maxLength={500} onChange={(event) => setClosingNote(event.target.value)} value={closingNote} /></label>
                <button className="button button--danger form-actions--wide" disabled={busy} type="submit">{busy ? 'A fechar…' : 'Confirmar fecho'}</button>
              </form>
            </section>
          </div>
        </>
      ) : noOpenSession ? (
        <section className="surface-card cash-open-card">
          <span className="metric-card__icon"><Banknote size={19} /></span>
          <h2>Começar o turno</h2>
          <p>Indique o fundo inicial de dinheiro. Ao abrir, as vendas em numerário ficam associadas a esta sessão.</p>
          <form className="form-grid form-grid--compact" onSubmit={(event) => void handleOpen(event)}>
            <label className="form-field"><span>Fundo inicial ({currency})</span><input inputMode="decimal" min="0" onChange={(event) => setOpeningAmount(event.target.value)} required step="0.01" type="number" value={openingAmount} /></label>
            <button className="button button--primary" disabled={busy} type="submit">{busy ? 'A abrir…' : 'Abrir caixa'}</button>
          </form>
        </section>
      ) : loaded && error ? <button className="button button--subtle" disabled={busy} onClick={() => void load()} type="button">Tentar novamente</button> : <div className="loading-panel">A carregar sessão de caixa…</div>}

      {canViewHistory && <section className="surface-card">
        <div className="section-heading"><div><h2><CircleDollarSign size={17} /> Histórico de sessões</h2><p>Resumo dos fechos realizados neste negócio.</p></div></div>
        {history.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Abertura</th><th>Estado</th><th>Fundo inicial</th><th>Contado</th><th>Diferença</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{formatDate(item.opened_at)}</td><td><span className={`status-pill${item.status === 'open' ? ' status-pill--success' : ''}`}>{item.status === 'open' ? 'Aberta' : 'Fechada'}</span></td><td>{formatMoney(item.opening_float_cents, currency)}</td><td>{item.counted_cents == null ? '—' : formatMoney(item.counted_cents, currency)}</td><td>{item.difference_cents == null ? '—' : formatMoney(item.difference_cents, currency)}</td></tr>)}</tbody></table></div> : <div className="empty-state"><span><CircleDollarSign size={20} /></span><strong>Sem sessões anteriores</strong><p>O histórico será preenchido à medida que a caixa for usada.</p></div>}
      </section>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="metric-card"><small>{label}</small><strong>{value}</strong></article>;
}
