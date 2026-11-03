import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Building2, FileText, LockKeyhole, Save, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { deleteWorkspaceLogo, disableTwoFactor, enableTwoFactor, getFiscalSettings, getTwoFactorStatus, requestTwoFactorDisable, setupTwoFactor, updateFiscalSettings, updateWorkspace, uploadWorkspaceLogo, type FiscalSettings, type TwoFactorStatus, type UserProfile, type Workspace } from '../../api/psMobile';
import type { LoginChallenge } from '../../api/client';
import { Feedback, PageHeading } from '../../components/feedback/Feedback';
import { mediaUrl } from '../../api/client';
import { AccountSettings } from './AccountSettings';
import { BillingSettings } from './BillingSettings';

export function SettingsPage({
  workspace,
  workspaceId,
  onWorkspaceUpdated,
  canManageWorkspace,
  profile,
  onProfileUpdated,
}: {
  workspace: Workspace;
  workspaceId: string;
  onWorkspaceUpdated: (workspace: Workspace) => void;
  canManageWorkspace: boolean;
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}) {
  const [settings, setSettings] = useState<FiscalSettings | null>(null);
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [currency, setCurrency] = useState(workspace.currency);
  const [cashControl, setCashControl] = useState(workspace.cash_control);
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [twoFactorAction, setTwoFactorAction] = useState<'enable' | 'disable'>('enable');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => {
    setWorkspaceName(workspace.name);
    setCurrency(workspace.currency);
    setCashControl(workspace.cash_control);
  }, [workspace]);

  useEffect(() => {
    let active = true;
    Promise.all([getFiscalSettings(workspaceId), getTwoFactorStatus()])
      .then(([fiscal, status]) => {
        if (!active) return;
        setSettings(fiscal);
        setTwoFactor(status);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as definições.');
      });
    return () => { active = false; };
  }, [workspaceId]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível guardar as definições.');
    } finally {
      setBusy(false);
    }
  };

  const saveWorkspace = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageWorkspace) return;
    void run(async () => {
      const updated = await updateWorkspace(workspaceId, { name: workspaceName.trim(), currency: currency.trim().toUpperCase(), cash_control: cashControl });
      onWorkspaceUpdated(updated);
      setNotice('Definições do negócio guardadas.');
    });
  };

  const saveFiscal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings || !canManageWorkspace) return;
    void run(async () => {
      const updated = await updateFiscalSettings(workspaceId, {
        company_name: settings.company_name,
        tax_id: settings.tax_id,
        address: settings.address,
        city: settings.city,
        country: settings.country,
        phone: settings.phone,
        email: settings.email,
        invoice_prefix: settings.invoice_prefix,
        credit_note_prefix: settings.credit_note_prefix,
        default_tax_code: settings.default_tax_code,
        default_tax_percentage_bps: settings.default_tax_percentage_bps,
      });
      setSettings(updated);
      setNotice('Dados fiscais atualizados.');
    });

  };

  const setWorkspaceLogo = async (file?: File) => {
    if (!file) return;
    setLogoBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await uploadWorkspaceLogo(workspaceId, file);
      onWorkspaceUpdated({ ...workspace, logo_url: result.url });
      setNotice('Imagem do espaço de trabalho atualizada.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a imagem.');
    } finally {
      setLogoBusy(false);
    }
  };

  const removeWorkspaceLogo = async () => {
    setLogoBusy(true);
    setError('');
    setNotice('');
    try {
      await deleteWorkspaceLogo(workspaceId);
      onWorkspaceUpdated({ ...workspace, logo_url: null });
      setNotice('Imagem do espaço de trabalho removida.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível remover a imagem.');
    } finally {
      setLogoBusy(false);
    }
  };

  const startSetup = () => run(async () => {
    const result = await setupTwoFactor();
    setChallenge(result);
    setTwoFactorAction('enable');
    setCode('');
    setNotice(`Código de ativação enviado por ${result.channel === 'email' ? 'e-mail' : 'SMS'}.`);
  });

  const startDisable = () => run(async () => {
    const result = await requestTwoFactorDisable();
    setChallenge(result);
    setTwoFactorAction('disable');
    setCode('');
    setNotice(`Código de confirmação enviado por ${result.channel === 'email' ? 'e-mail' : 'SMS'}.`);
  });

  const confirmTwoFactorChange = () => run(async () => {
    if (!challenge || code.trim().length !== 6) throw new Error('Introduza o código de seis dígitos.');
    if (twoFactorAction === 'enable') await enableTwoFactor(challenge.challenge_id, code.trim());
    else await disableTwoFactor(challenge.challenge_id, code.trim());
    setChallenge(null);
    setCode('');
    setTwoFactor(await getTwoFactorStatus());
    setNotice(twoFactorAction === 'enable'
      ? 'Autenticação de dois fatores ativada para a sua conta.'
      : 'Autenticação de dois fatores desativada.');
  });

  const setFiscal = <K extends keyof FiscalSettings>(key: K, value: FiscalSettings[K]) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  };

  return (
    <div className="page-stack">
      <PageHeading eyebrow="CONFIGURAÇÕES" title="Definições do negócio" description="Atualize a identidade fiscal do espaço e proteja a sua conta." />
      {error && <Feedback message={error} />}
      {notice && <Feedback kind="success" message={notice} />}

      <section className="surface-card">
        <div className="section-heading">
          <div className="section-heading__title"><span className="row-icon row-icon--blue"><Building2 size={18} /></span><div><h2>Espaço de trabalho</h2><p>Identificação geral e moeda utilizada nos relatórios.</p></div></div>
        </div>
        {!canManageWorkspace && <p className="form-hint">Apenas o proprietário pode alterar as definições do espaço de trabalho.</p>}
        <form className="form-grid form-grid--compact" onSubmit={saveWorkspace}>
          <fieldset className="settings-form-fields" disabled={!canManageWorkspace}>
            <Field label="Nome do negócio"><input maxLength={120} minLength={2} onChange={(event) => setWorkspaceName(event.target.value)} required value={workspaceName} /></Field>
            <Field label="Moeda (ISO 4217)"><input maxLength={3} minLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} required value={currency} /></Field>
            <label className="check-field"><input checked={cashControl} onChange={(event) => setCashControl(event.target.checked)} type="checkbox" /> Exigir abertura de caixa para vendas em numerário</label>
            {canManageWorkspace && <div className="form-actions"><button className="button button--primary" disabled={busy} type="submit"><Save size={16} /> Guardar alterações</button></div>}
          </fieldset>
        </form>
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div className="section-heading__title"><span className="row-icon row-icon--green"><Building2 size={18} /></span><div><h2>Imagem do negócio</h2><p>Identifique este espaço com o logótipo da sua empresa.</p></div></div>
        </div>
        <div className="media-settings">
          <div className="workspace-logo-preview">
            {workspace.logo_url
              ? <img alt={`Logótipo de ${workspace.name}`} src={mediaUrl(workspace.logo_url) || undefined} />
              : <Building2 size={24} aria-hidden="true" />}
          </div>
          <div className="media-settings__actions">
            <label className="button button--subtle"><Upload size={15} /> Escolher imagem<input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!canManageWorkspace || logoBusy} onChange={(event) => { void setWorkspaceLogo(event.target.files?.[0]); event.currentTarget.value = ''; }} type="file" /></label>
            <label className="button button--subtle"><Upload size={15} /> Tirar fotografia<input accept="image/*" capture="environment" className="sr-only" disabled={!canManageWorkspace || logoBusy} onChange={(event) => { void setWorkspaceLogo(event.target.files?.[0]); event.currentTarget.value = ''; }} type="file" /></label>
            {workspace.logo_url && canManageWorkspace && <button className="button button--subtle" disabled={logoBusy} onClick={() => void removeWorkspaceLogo()} type="button"><Trash2 size={15} /> Remover</button>}
          </div>
          <small>JPG, PNG ou WebP. Pode escolher um ficheiro ou tirar uma fotografia no telemóvel.</small>
        </div>
        {!canManageWorkspace && <p className="form-hint">Apenas o proprietário pode alterar a imagem do espaço.</p>}
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div className="section-heading__title"><span className="row-icon row-icon--violet"><FileText size={18} /></span><div><h2>Identificação fiscal</h2><p>Dados usados na emissão dos documentos fiscais e no SAF-T.</p></div></div>
        </div>
        {settings ? (
          <>
            {!canManageWorkspace && <p className="form-hint">Dados em modo de leitura. Apenas o proprietário pode alterar os dados fiscais.</p>}
          <form className="form-grid" onSubmit={saveFiscal}>
            <fieldset className="settings-form-fields" disabled={!canManageWorkspace}>
            <Field label="Nome fiscal"><input maxLength={200} onChange={(event) => setFiscal('company_name', event.target.value)} value={settings.company_name || ''} /></Field>
            <Field label="NIF"><input maxLength={30} onChange={(event) => setFiscal('tax_id', event.target.value)} value={settings.tax_id || ''} /></Field>
            <Field label="Endereço" wide><input maxLength={300} onChange={(event) => setFiscal('address', event.target.value)} value={settings.address || ''} /></Field>
            <Field label="Cidade"><input maxLength={100} onChange={(event) => setFiscal('city', event.target.value)} value={settings.city} /></Field>
            <Field label="País"><input maxLength={2} onChange={(event) => setFiscal('country', event.target.value.toUpperCase())} value={settings.country} /></Field>
            <Field label="Telefone"><input maxLength={40} onChange={(event) => setFiscal('phone', event.target.value)} value={settings.phone || ''} /></Field>
            <Field label="E-mail"><input maxLength={254} onChange={(event) => setFiscal('email', event.target.value)} type="email" value={settings.email || ''} /></Field>
            <Field label="Prefixo de factura"><input maxLength={10} onChange={(event) => setFiscal('invoice_prefix', event.target.value)} value={settings.invoice_prefix} /></Field>
            <Field label="Prefixo de nota de crédito"><input maxLength={10} onChange={(event) => setFiscal('credit_note_prefix', event.target.value)} value={settings.credit_note_prefix} /></Field>
            <Field label="Código fiscal padrão"><input maxLength={10} onChange={(event) => setFiscal('default_tax_code', event.target.value)} value={settings.default_tax_code} /></Field>
            <Field label="IVA padrão (%)"><input max={100} min={0} onChange={(event) => setFiscal('default_tax_percentage_bps', Math.round(Number(event.target.value || 0) * 100))} step="0.01" type="number" value={(settings.default_tax_percentage_bps / 100).toFixed(2)} /></Field>
            {canManageWorkspace && <div className="form-actions"><button className="button button--primary" disabled={busy} type="submit"><Save size={16} /> Guardar dados fiscais</button></div>}
            </fieldset>
          </form>
          </>
        ) : <div className="loading-panel">A carregar dados fiscais…</div>}
      </section>

      {canManageWorkspace && <BillingSettings workspaceId={workspaceId} canManage />}
      <AccountSettings profile={profile} onProfileUpdated={onProfileUpdated} />

      <section className="surface-card security-card">
        <div className="section-heading">
          <div className="section-heading__title"><span className="row-icon row-icon--green"><ShieldCheck size={18} /></span><div><h2>Segurança da conta</h2><p>Proteja o início de sessão com um código de verificação adicional.</p></div></div>
        </div>
        {twoFactor && (
          <>
            <div className="security-status">
              <span className={`status-pill${twoFactor.enabled ? ' status-pill--success' : twoFactor.required ? ' status-pill--warning' : ''}`}>
                {twoFactor.enabled ? '2FA ativo' : twoFactor.required ? 'Ativação obrigatória' : '2FA não ativado'}
              </span>
              <span className="security-status__description">
                {twoFactor.enabled
                  ? 'Um código será solicitado nos próximos inícios de sessão.'
                  : `A ativação será obrigatória a partir de ${new Intl.DateTimeFormat('pt-AO', { dateStyle: 'long' }).format(new Date(twoFactor.required_at))}.`}
              </span>
            </div>
            {challenge ? (
              <div className="challenge-box">
                <p>Introduza o código enviado por {challenge.channel === 'email' ? 'e-mail' : 'SMS'} para {twoFactorAction === 'enable' ? 'ativar' : 'desativar'} a autenticação de dois fatores.</p>
                {challenge.debug_code && <p className="debug-code">Código de teste: {challenge.debug_code}</p>}
                <form className="inline-form" onSubmit={(event) => { event.preventDefault(); void confirmTwoFactorChange(); }}>
                  <input autoComplete="one-time-code" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" required value={code} />
                  <button className="button button--primary" disabled={busy} type="submit"><LockKeyhole size={16} /> Confirmar</button>
                </form>
              </div>
            ) : !twoFactor.enabled
              ? <button className="button button--primary" disabled={busy} onClick={() => void startSetup()} type="button"><ShieldCheck size={16} /> Ativar autenticação de dois fatores</button>
              : <button className="button button--subtle" disabled={busy} onClick={() => void startDisable()} type="button"><LockKeyhole size={16} /> Desativar autenticação de dois fatores</button>}
          </>
        )}
      </section>
    </div>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`form-field${wide ? ' form-field--wide' : ''}`}><span>{label}</span>{children}</label>;
}
