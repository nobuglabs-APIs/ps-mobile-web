import { useEffect, useState, type FormEvent } from 'react';
import { Archive, Search, UserRound, UserRoundPlus } from 'lucide-react';
import {
  archiveCustomer,
  createCustomer,
  listCustomers,
  updateCustomer,
  type Customer,
  type CustomerInput,
} from '../../api/psMobile';
import { Feedback, PageHeading } from '../../components/feedback/Feedback';

const emptyCustomer: CustomerInput = { name: '' };

export function CustomersPage({ workspaceId, canManage }: { workspaceId: string; canManage: boolean }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerInput>(emptyCustomer);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async (term = search, requestedPage = page) => {
    setLoading(true);
    setError('');
    try {
      const result = await listCustomers(workspaceId, term, requestedPage);
      setCustomers(result.items);
      setTotal(result.total);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load('', 1); }, [workspaceId]);

  const selectCustomer = (customer: Customer) => {
    setSelected(customer);
    setForm({
      name: customer.name,
      tax_id: customer.tax_id || '',
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || '',
    });
    setNotice('');
  };

  const reset = () => {
    setSelected(null);
    setForm(emptyCustomer);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const input: CustomerInput = {
        name: form.name.trim(),
        tax_id: form.tax_id?.trim() || undefined,
        address: form.address?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
      };
      if (selected) await updateCustomer(workspaceId, selected.id, input);
      else await createCustomer(workspaceId, input);
      reset();
      const wasSelected = Boolean(selected);
      setNotice(wasSelected ? 'Cliente atualizado.' : 'Cliente adicionado à lista.');
      setPage(1);
      await load(search, 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível guardar o cliente.');
    } finally {
      setBusy(false);
    }
  };

  const archive = async (customer: Customer) => {
    if (!canManage || !window.confirm(`Arquivar o cliente ${customer.name}?`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await archiveCustomer(workspaceId, customer.id);
      if (selected?.id === customer.id) reset();
      setNotice('Cliente arquivado. As faturas já emitidas não são alteradas.');
      setPage(1);
      await load(search, 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível arquivar o cliente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeading eyebrow="CLIENTES" title="Clientes" description="Guarde os dados para identificar o comprador nos próximos documentos fiscais." />
      {error && <Feedback message={error} />}
      {notice && <Feedback kind="success" message={notice} />}
      <div className="customer-layout">
        <section className="surface-card">
          <div className="section-heading">
            <div><h2>Lista de clientes <span className="count-pill">{total}</span></h2><p>Os clientes arquivados deixam de aparecer nas novas vendas.</p></div>
          </div>
          <div className="search-field customer-search" role="search"><Search size={16} aria-hidden="true" /><input aria-label="Pesquisar clientes" onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { setPage(1); void load(search, 1); } }} placeholder="Nome, NIF, telefone ou e-mail" value={search} /><button className="button button--subtle button--small" onClick={() => { setPage(1); void load(search, 1); }} type="button">Pesquisar</button></div>
          {loading ? <div className="loading-panel">A carregar clientes…</div> : customers.length ? (
            <div className="customer-list">
              {customers.map((customer) => (
                <article className={`customer-row${selected?.id === customer.id ? ' customer-row--active' : ''}`} key={customer.id}>
                  <button className="customer-row__select" onClick={() => selectCustomer(customer)} type="button">
                    <span className="row-icon row-icon--blue"><UserRound size={17} /></span>
                    <span><strong>{customer.name}</strong><small>{customer.tax_id ? `NIF ${customer.tax_id}` : customer.phone || customer.email || 'Sem dados de contacto'}</small></span>
                  </button>
                  {canManage && <button aria-label={`Arquivar ${customer.name}`} className="icon-button icon-button--danger" disabled={busy} onClick={() => void archive(customer)} title="Arquivar cliente" type="button"><Archive size={16} /></button>}
                </article>
              ))}
            </div>
          ) : <div className="empty-state"><span><UserRound size={20} /></span><strong>{search ? 'Não foram encontrados clientes' : 'Sem clientes registados'}</strong><p>{search ? 'Experimente outro nome, NIF ou contacto.' : 'Adicione clientes para preencher os seus dados nas próximas faturas.'}</p></div>}
          {total > 100 && <div className="pagination-controls"><button className="button button--subtle button--small" disabled={page <= 1 || loading} onClick={() => { const next = page - 1; setPage(next); void load(search, next); }} type="button">Anterior</button><span>Página {page} de {Math.ceil(total / 100)}</span><button className="button button--subtle button--small" disabled={page >= Math.ceil(total / 100) || loading} onClick={() => { const next = page + 1; setPage(next); void load(search, next); }} type="button">Seguinte</button></div>}
        </section>

        <section className="surface-card">
          <div className="section-heading"><div><h2>{selected ? 'Editar cliente' : 'Novo cliente'}</h2><p>Os dados são usados apenas em novas vendas.</p></div><UserRoundPlus size={19} aria-hidden="true" /></div>
          {!canManage && <p className="form-hint">O seu perfil pode consultar os clientes, mas não os pode alterar.</p>}
          <form className="form-grid form-grid--compact" onSubmit={(event) => void submit(event)}>
            <fieldset className="settings-form-fields" disabled={!canManage || busy}>
              <label className="form-field form-field--wide"><span>Nome completo ou empresa</span><input autoComplete="name" maxLength={200} minLength={2} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} required value={form.name} /></label>
              <label className="form-field"><span>NIF (opcional)</span><input maxLength={30} onChange={(event) => setForm((value) => ({ ...value, tax_id: event.target.value }))} value={form.tax_id || ''} /></label>
              <label className="form-field"><span>Telefone</span><input autoComplete="tel" maxLength={40} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} value={form.phone || ''} /></label>
              <label className="form-field"><span>E-mail</span><input autoComplete="email" maxLength={254} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} type="email" value={form.email || ''} /></label>
              <label className="form-field form-field--wide"><span>Morada</span><textarea autoComplete="street-address" maxLength={300} onChange={(event) => setForm((value) => ({ ...value, address: event.target.value }))} rows={3} value={form.address || ''} /></label>
            </fieldset>
            {canManage && <div className="form-actions form-actions--wide"><button className="button button--primary" disabled={busy} type="submit">{busy ? 'A guardar…' : selected ? 'Guardar alterações' : 'Adicionar cliente'}</button>{selected && <button className="button button--subtle" disabled={busy} onClick={reset} type="button">Cancelar</button>}</div>}
          </form>
        </section>
      </div>
    </div>
  );
}
