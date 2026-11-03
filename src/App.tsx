import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { ArrowRight, LoaderCircle, Store } from 'lucide-react';
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
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const InvoicesPage = lazy(() => import('./features/invoices/InvoicesPage').then((module) => ({ default: module.InvoicesPage })));
const ProductsPage = lazy(() => import('./features/products/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const SalesPage = lazy(() => import('./features/sales/SalesPage').then((module) => ({ default: module.SalesPage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const AdminPage = lazy(() => import('./features/admin/AdminPage').then((module) => ({ default: module.AdminPage })));
const CustomersPage = lazy(() => import('./features/customers/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const CashPage = lazy(() => import('./features/cash/CashPage').then((module) => ({ default: module.CashPage })));
const TeamPage = lazy(() => import('./features/team/TeamPage').then((module) => ({ default: module.TeamPage })));

const WORKSPACE_KEY = 'ps_mobile_workspace_id';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceId, setWorkspaceId] = useState(() => localStorage.getItem(WORKSPACE_KEY) || '');
  const [view, setView] = useState<AppView>('overview');
  const [sessionChallenge, setSessionChallenge] = useState<LoginChallenge | null>(null);
  const [loading, setLoading] = useState(Boolean(readAccessToken()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');

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

  if (loading) {
    return <BrandSplash />;
  }

  if (!profile || !readAccessToken() || sessionChallenge) {
    return <AuthPage key={sessionChallenge?.challenge_id || 'login'} onAuthenticated={handleAuthenticated} pendingChallenge={sessionChallenge} />;
  }

  if (!workspace && profile.is_admin) {
    return <AdminPage />;
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
  const activeView = !profile.is_admin && role === 'seller' && !['sales', 'products', 'cash'].includes(view)
    ? 'sales'
    : view;

  return (
    <AppShell
      onLogout={() => void handleLogout()}
      onNavigate={setView}
      onWorkspaceChange={(id) => void changeWorkspace(id)}
      profileEmail={profile.email}
      profileAvatarUrl={profile.avatar_url}
      profileName={profile.full_name}
      role={role}
      isAdmin={profile.is_admin}
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
      {activeView === 'invoices' && <InvoicesPage key={workspaceId} workspaceId={workspaceId} />}
      {activeView === 'settings' && <SettingsPage canManageWorkspace={role === 'owner'} key={workspaceId} onProfileUpdated={setProfile} onWorkspaceUpdated={setWorkspace} profile={profile} workspace={workspace} workspaceId={workspaceId} />}
      {activeView === 'admin' && profile.is_admin && <AdminPage onBack={() => setView('overview')} />}
      </Suspense>
    </AppShell>
  );
}
