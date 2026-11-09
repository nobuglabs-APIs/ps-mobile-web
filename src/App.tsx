import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowRight, CreditCard, LoaderCircle, Store, X } from 'lucide-react';
import {
  clearTokens,
  readAccessToken,
  saveTokens,
  SessionChallengeRequiredError,
  type LoginChallenge,
  type TokenResponse,
} from './api/client';
import { acceptInvitation, createWorkspace, getMe, getWorkspace, logout, type UserProfile, type Workspace } from './api/psMobile';
import { AppShell, type AppView } from './components/layout/AppShell';
import { BrandSplash } from './components/branding/BrandSplash';
import { Feedback } from './components/feedback/Feedback';
import { AuthPage } from './features/auth/AuthPage';
import type { SettingsTab } from './features/settings/SettingsPage';
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const InvoicesPage = lazy(() => import('./features/invoices/InvoicesPage').then((module) => ({ default: module.InvoicesPage })));
const ProductsPage = lazy(() => import('./features/products/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const SalesPage = lazy(() => import('./features/sales/SalesPage').then((module) => ({ default: module.SalesPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const CustomersPage = lazy(() => import('./features/customers/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const CashPage = lazy(() => import('./features/cash/CashPage').then((module) => ({ default: module.CashPage })));
const TeamPage = lazy(() => import('./features/team/TeamPage').then((module) => ({ default: module.TeamPage })));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));

const WORKSPACE_KEY = 'ps_mobile_workspace_id';
const shortcutViews = ['sales', 'products', 'cash'] as const satisfies readonly AppView[];

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceId, setWorkspaceId] = useState(() => localStorage.getItem(WORKSPACE_KEY) || '');
  const [view, setView] = useState<AppView>(() => {
    const requestedView = new URLSearchParams(window.location.search).get('view');
    return shortcutViews.find((shortcutView) => shortcutView === requestedView) || 'overview';
  });
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('workspace');
  const [sessionChallenge, setSessionChallenge] = useState<LoginChallenge | null>(null);
  const [billingRequired, setBillingRequired] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installHint, setInstallHint] = useState('');
  const [isInstalled, setIsInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);
  const [loading, setLoading] = useState(Boolean(readAccessToken()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setInstallHint('');
    };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const loadSession = useCallback(async () => {
    const user = await getMe();
    setProfile(user);
    if (!user.workspaces.length) {
      setWorkspace(null);
      setWorkspaceId('');
      localStorage.removeItem(WORKSPACE_KEY);
      return;
    }

    const savedId = localStorage.getItem(WORKSPACE_KEY);
    const selected = user.workspaces.find((membership) => membership.workspace_id === savedId)
      || user.workspaces[0];
    const currentWorkspace = await getWorkspace(selected.workspace_id);
    setWorkspace(currentWorkspace);
    setWorkspaceId(selected.workspace_id);
    localStorage.setItem(WORKSPACE_KEY, selected.workspace_id);
  }, []);

  useEffect(() => {
    const onChallenge = (event: Event) => {
      const challengeEvent = event as CustomEvent<LoginChallenge>;
      setSessionChallenge(challengeEvent.detail);
      setProfile(null);
      setWorkspace(null);
    };
    window.addEventListener('ps-mobile:auth-challenge', onChallenge);
    return () => window.removeEventListener('ps-mobile:auth-challenge', onChallenge);
  }, []);

  useEffect(() => {
    const onBillingRequired = () => setBillingRequired(true);
    window.addEventListener('ps-mobile:billing-required', onBillingRequired);
    return () => window.removeEventListener('ps-mobile:billing-required', onBillingRequired);
  }, []);

  useEffect(() => {
    if (!readAccessToken()) {
      setLoading(false);
      return;
    }
    loadSession()
      .catch((reason: unknown) => {
        if (!(reason instanceof SessionChallengeRequiredError)) {
          clearTokens();
          setError(reason instanceof Error ? reason.message : 'A sessão expirou. Inicie sessão novamente.');
        }
      })
      .finally(() => setLoading(false));
  }, [loadSession]);

  const handleAuthenticated = async (tokens: TokenResponse) => {
    saveTokens(tokens);
    setSessionChallenge(null);
    setError('');
    setLoading(true);
    try {
      await loadSession();
    } catch (reason) {
      clearTokens();
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar a conta.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const changeWorkspace = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      const selectedWorkspace = await getWorkspace(id);
      setWorkspaceId(id);
      setWorkspace(selectedWorkspace);
      localStorage.setItem(WORKSPACE_KEY, id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível mudar de espaço de trabalho.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    const refreshToken = localStorage.getItem('ps_mobile_refresh_token');
    try {
      if (refreshToken) await logout(refreshToken);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível terminar a sessão no servidor.');
    } finally {
      clearTokens();
      setProfile(null);
      setWorkspace(null);
      setSessionChallenge(null);
      setBusy(false);
    }
  };

  const handleCreateWorkspace = async () => {
    const name = workspaceName.trim();
    if (name.length < 2) {
      setError('O nome do negócio deve ter pelo menos dois caracteres.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await createWorkspace(name);
      setWorkspace(created);
      setWorkspaceId(created.id);
      localStorage.setItem(WORKSPACE_KEY, created.id);
      await loadSession();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar o espaço de trabalho.');
    } finally {
      setBusy(false);
    }
  };

  const handleAcceptInvitation = async () => {
    const code = invitationCode.trim();
    if (code.length < 10) {
      setError('Introduza o código completo do convite.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await acceptInvitation(code);
      setInvitationCode('');
      await loadSession();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível aceitar o convite.');
    } finally {
      setBusy(false);
    }
  };

  const installApp = async () => {
    if (!installPrompt) {
      setInstallHint('No menu do navegador, escolha “Adicionar ao ecrã principal” ou “Instalar aplicação”.');
      return;
    }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setInstallHint('');
      } else {
        setInstallHint('Pode instalar a aplicação mais tarde através do menu do navegador.');
      }
      setInstallPrompt(null);
    } catch {
      setInstallHint('Não foi possível abrir a instalação. Use o menu do navegador para adicionar a aplicação ao ecrã principal.');
    }
  };

  if (loading) {
    return <BrandSplash />;
  }

  if (!profile || !readAccessToken() || sessionChallenge) {
    return <AuthPage key={sessionChallenge?.challenge_id || 'login'} onAuthenticated={handleAuthenticated} pendingChallenge={sessionChallenge} />;
  }

  if (!workspace) {
    return (
      <main className="workspace-empty">
        <section className="surface-card workspace-empty__card">
          <span className="auth-icon"><Store size={23} /></span>
          <p className="eyebrow">ESPAÇO DE TRABALHO</p>
          <h1>Crie o seu espaço</h1>
          <p>Associe um nome ao negócio para gerir os produtos, vendas e documentos fiscais.</p>
          <label className="form-field"><span>Nome do negócio</span><input maxLength={120} minLength={2} onChange={(event) => setWorkspaceName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void handleCreateWorkspace(); }} value={workspaceName} /></label>
          {error && <Feedback message={error} />}
          <button className="button button--primary button--full" disabled={busy} onClick={() => void handleCreateWorkspace()} type="button">{busy ? 'A criar…' : 'Criar espaço de trabalho'} <ArrowRight size={17} /></button>
          <div className="workspace-join-divider"><span>ou já recebeu um convite?</span></div>
          <label className="form-field"><span>Código do convite</span><input autoComplete="off" onChange={(event) => setInvitationCode(event.target.value)} value={invitationCode} /></label>
          <button className="button button--subtle button--full" disabled={busy} onClick={() => void handleAcceptInvitation()} type="button">{busy ? 'A validar…' : 'Aceitar convite'}</button>
        </section>
      </main>
    );
  }

  const currentMembership = profile.workspaces.find((item) => item.workspace_id === workspaceId);
  const role = currentMembership?.role || 'seller';
  const activeView = !profile.is_admin && role === 'seller' && !['sales', 'products', 'cash', 'notifications'].includes(view)
    ? 'sales'
    : view;

  return (
    <AppShell
      onLogout={() => void handleLogout()}
      onInstallApp={() => void installApp()}
      onNavigate={(nextView) => {
        if (nextView === 'settings') setSettingsTab('workspace');
        setView(nextView);
      }}
      onWorkspaceChange={(id) => void changeWorkspace(id)}
      profileEmail={profile.email}
      profileAvatarUrl={profile.avatar_url}
      profileName={profile.full_name}
      installHint={installHint}
      isInstalled={isInstalled}
      role={role}
      view={activeView}
      workspaceId={workspaceId}
      workspaces={profile.workspaces}
    >
      <Suspense fallback={<div className="loading-panel" role="status">A preparar esta área…</div>}>
      {error && <div className="global-feedback"><Feedback message={error} /></div>}
      {busy && <div className="global-busy"><LoaderCircle className="spin" size={16} /> A atualizar…</div>}
      {activeView === 'overview' && <DashboardPage key={workspaceId} onNavigate={setView} workspace={workspace} workspaceId={workspaceId} />}
      {activeView === 'products' && <ProductsPage key={workspaceId} canManage={role !== 'seller'} currency={workspace.currency} workspaceId={workspaceId} />}
      {activeView === 'sales' && <SalesPage key={workspaceId} canCancel={role !== 'seller'} currency={workspace.currency} workspaceId={workspaceId} />}
      {activeView === 'customers' && role !== 'seller' && <CustomersPage canManage key={workspaceId} workspaceId={workspaceId} />}
      {activeView === 'cash' && <CashPage canViewHistory={role !== 'seller'} currency={workspace.currency} key={workspaceId} workspaceId={workspaceId} />}
      {activeView === 'team' && role !== 'seller' && <TeamPage canEditMembers={role === 'owner'} canInvite={role === 'owner' || role === 'manager'} key={workspaceId} onMembershipAccepted={loadSession} workspaceId={workspaceId} />}
      {activeView === 'notifications' && <NotificationsPage />}
      {activeView === 'invoices' && <InvoicesPage key={workspaceId} workspaceId={workspaceId} />}
      {activeView === 'settings' && <SettingsPage canManageWorkspace={role === 'owner'} initialTab={settingsTab} key={workspaceId} onProfileUpdated={setProfile} onWorkspaceUpdated={setWorkspace} profile={profile} workspace={workspace} workspaceId={workspaceId} />}
      </Suspense>
      {billingRequired && (
        <div className="modal-backdrop" role="presentation">
          <section aria-labelledby="billing-required-title" aria-modal="true" className="dialog-card billing-required-dialog" role="dialog">
            <div className="billing-required-icon"><CreditCard aria-hidden="true" size={21} /></div>
            <button
              aria-label="Fechar aviso"
              className="icon-button billing-required-close"
              onClick={() => setBillingRequired(false)}
              type="button"
            >
              <X size={17} />
            </button>
            <h2 id="billing-required-title">Período de teste terminado</h2>
            <p>Para continuar a registar vendas e a fazer alterações, escolha um plano ou regularize a subscrição. Os seus dados continuam disponíveis.</p>
            {role === 'owner' ? (
              <button
                className="button button--primary"
                onClick={() => {
                  setBillingRequired(false);
                  setSettingsTab('billing');
                  setView('settings');
                }}
                type="button"
              >
                Ver planos
                <ArrowRight size={16} />
              </button>
            ) : (
              <p className="billing-required-hint">Peça ao proprietário do negócio para escolher ou regularizar um plano.</p>
            )}
            <button className="button button--subtle" onClick={() => setBillingRequired(false)} type="button">Fechar</button>
          </section>
        </div>
      )}
    </AppShell>
  );
}
