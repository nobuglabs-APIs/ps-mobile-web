import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Copy, MailPlus, Shield, UserRound, UserRoundCheck, UserRoundX } from 'lucide-react';
import {
  createInvitation,
  acceptInvitation,
  listInvitations,
  listWorkspaceMembers,
  revokeInvitation,
  updateWorkspaceMember,
  type Invitation,
  type WorkspaceMember,
} from '../../api/psMobile';
import { Feedback, formatDate, PageHeading } from '../../components/feedback/Feedback';

export function TeamPage({ workspaceId, canInvite, canEditMembers, onMembershipAccepted }: { workspaceId: string; canInvite: boolean; canEditMembers: boolean; onMembershipAccepted: () => Promise<void> }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [role, setRole] = useState<'manager' | 'seller'>('seller');
  const [email, setEmail] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [memberList, invitationList] = await Promise.all([listWorkspaceMembers(workspaceId), listInvitations(workspaceId)]);
      setMembers(memberList);
      setInvitations(invitationList);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a equipa.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { void load(); }, [load]);

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canInvite || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    setCreatedCode('');
    try {
      const result = await createInvitation(workspaceId, role, email.trim() || undefined);
      setCreatedCode(result.code);
      setEmail('');
      setNotice('Convite criado. Copie o código agora: a API só o mostra uma vez.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar o convite.');
    } finally {
      setBusy(false);
    }
  };

  const changeMember = async (member: WorkspaceMember, input: { role?: 'manager' | 'seller'; is_active?: boolean }) => {
    setBusyId(member.user_id);
    setError('');
    setNotice('');
    try {
      await updateWorkspaceMember(workspaceId, member.user_id, input);
      setNotice(`Acesso de ${member.full_name} atualizado.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar o membro.');
    } finally {
      setBusyId('');
    }
  };

  const revoke = async (invitation: Invitation) => {
    if (!window.confirm('Revogar este convite?')) return;
    setBusyId(invitation.id);
    setError('');
    setNotice('');
    try {
      await revokeInvitation(workspaceId, invitation.id);
      setNotice('Convite revogado.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível revogar o convite.');
    } finally {
      setBusyId('');
    }
  };

  const accept = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await acceptInvitation(invitationCode.trim());
      setInvitationCode('');
      await onMembershipAccepted();
      setNotice('Convite aceite. O espaço de trabalho já está disponível no seletor.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível aceitar o convite.');
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(createdCode);
      setNotice('Código copiado.');
    } catch {
      setError('Não foi possível copiar o código; selecione-o para copiar.');
    }
  };

  return (
    <div className="page-stack">
      <PageHeading eyebrow="EQUIPA" title="Membros e convites" description="Controle quem pode vender, gerir o catálogo ou administrar o negócio." />
      {error && <Feedback message={error} />}
      {notice && <Feedback kind="success" message={notice} />}
      {createdCode && <section className="surface-card invitation-code"><div><strong>Código de convite</strong><p>Envie este código à pessoa convidada para que aceite o acesso.</p><code>{createdCode}</code></div><button className="button button--subtle" onClick={() => void copyCode()} type="button"><Copy size={16} /> Copiar</button></section>}

      <section className="surface-card team-accept-card">
        <div className="section-heading"><div><h2>Aceitar convite</h2><p>Adicione outro espaço de trabalho à sua conta.</p></div></div>
        <form className="team-accept-form" onSubmit={(event) => void accept(event)}><label className="form-field"><span>Código recebido</span><input minLength={10} onChange={(event) => setInvitationCode(event.target.value)} required value={invitationCode} /></label><button className="button button--subtle" disabled={busy} type="submit">{busy ? 'A validar…' : 'Aceitar convite'}</button></form>
      </section>

      <section className="surface-card">
        <div className="section-heading"><div><h2><UserRound size={17} /> Membros</h2><p>{members.length} utilizadores associados ao negócio.</p></div></div>
        {loading ? <div className="loading-panel">A carregar membros…</div> : members.length ? <div className="team-list">{members.map((member) => (
          <article className="team-row" key={member.user_id}>
            <span className="row-icon row-icon--blue">{member.role === 'owner' ? <Shield size={17} /> : <UserRound size={17} />}</span>
            <span className="team-row__identity"><strong>{member.full_name}{member.role === 'owner' ? ' · Proprietário' : ''}</strong><small>{member.email || 'Sem e-mail'}</small></span>
            <span className={`status-pill${member.is_active ? ' status-pill--success' : ' status-pill--danger'}`}>{member.is_active ? member.role === 'manager' ? 'Gestor' : member.role === 'owner' ? 'Ativo' : 'Vendedor' : 'Desativado'}</span>
            {canEditMembers && member.role !== 'owner' && <div className="team-row__actions">
              <select aria-label={`Papel de ${member.full_name}`} disabled={busyId === member.user_id} onChange={(event) => void changeMember(member, { role: event.target.value as 'manager' | 'seller' })} value={member.role}><option value="seller">Vendedor</option><option value="manager">Gestor</option></select>
              <button aria-label={member.is_active ? `Desativar ${member.full_name}` : `Ativar ${member.full_name}`} className="icon-button" disabled={busyId === member.user_id} onClick={() => void changeMember(member, { is_active: !member.is_active })} title={member.is_active ? 'Desativar acesso' : 'Ativar acesso'} type="button">{member.is_active ? <UserRoundX size={16} /> : <UserRoundCheck size={16} />}</button>
            </div>}
          </article>
        ))}</div> : <div className="empty-state"><span><UserRound size={20} /></span><strong>Sem membros</strong><p>A equipa ainda não tem membros adicionais.</p></div>}
      </section>

      {canInvite && <div className="team-grid">
        <section className="surface-card">
          <div className="section-heading"><div><h2><MailPlus size={17} /> Convidar alguém</h2><p>O código gerado deve ser partilhado manualmente.</p></div></div>
          <form className="form-grid form-grid--compact" onSubmit={(event) => void invite(event)}>
            <label className="form-field"><span>Perfil</span><select onChange={(event) => setRole(event.target.value as 'manager' | 'seller')} value={role}><option value="seller">Vendedor</option>{canEditMembers && <option value="manager">Gestor</option>}</select></label>
            <label className="form-field"><span>E-mail (opcional)</span><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} /></label>
            <button className="button button--primary form-actions--wide" disabled={busy} type="submit">{busy ? 'A criar convite…' : 'Criar convite'}</button>
          </form>
        </section>
        <section className="surface-card">
          <div className="section-heading"><div><h2>Convites emitidos</h2><p>Convites ainda disponíveis para aceitação.</p></div></div>
          {loading ? <div className="loading-panel">A carregar convites…</div> : invitations.filter((item) => !item.accepted_at && !item.revoked_at).length ? <div className="team-list">{invitations.filter((item) => !item.accepted_at && !item.revoked_at).map((item) => <article className="team-row" key={item.id}><span className="row-icon row-icon--blue"><MailPlus size={16} /></span><span className="team-row__identity"><strong>{item.email || `Convite para ${item.role === 'manager' ? 'gestor' : 'vendedor'}`}</strong><small>Expira em {formatDate(item.expires_at)}</small></span><button className="button button--subtle button--small" disabled={busyId === item.id} onClick={() => void revoke(item)} type="button">Revogar</button></article>)}</div> : <div className="empty-state"><span><MailPlus size={20} /></span><strong>Sem convites pendentes</strong><p>Os novos convites aparecerão aqui.</p></div>}
        </section>
      </div>}
      {!canEditMembers && <p className="form-hint">O proprietário gere os papéis e a ativação dos membros. Como gestor, pode convidar vendedores e revogar convites.</p>}
    </div>
  );
}
