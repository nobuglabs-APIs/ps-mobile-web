import { useEffect, useState, type ReactNode } from 'react';
import {
  Boxes,
  Banknote,
  Bell,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  UsersRound,
  UserRound,
  Settings2,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';
import type { Membership } from '../../api/psMobile';
import { BrandAttribution } from '../branding/BrandAttribution';
import { mediaUrl } from '../../api/client';

export type AppView = 'overview' | 'products' | 'sales' | 'invoices' | 'customers' | 'cash' | 'team' | 'notifications' | 'settings';

const navigation: Array<{ id: AppView; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'sales', label: 'Vendas', icon: ShoppingCart },
  { id: 'products', label: 'Produtos', icon: Boxes },
  { id: 'customers', label: 'Clientes', icon: UserRound },
  { id: 'cash', label: 'Caixa', icon: Banknote },
  { id: 'team', label: 'Equipa', icon: UsersRound },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'invoices', label: 'Documentos fiscais', icon: FileText },
  { id: 'settings', label: 'Definições', icon: Settings2 },
];

export function AppShell({
  children,
  view,
  onNavigate,
  onLogout,
  profileName,
  profileEmail,
  profileAvatarUrl,
  workspaces,
  workspaceId,
  onWorkspaceChange,
  role,
  onInstallApp,
  installHint,
  isInstalled,
}: {
  children: ReactNode;
  view: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  profileName: string;
  profileEmail: string | null;
  profileAvatarUrl: string | null;
  workspaces: Membership[];
  workspaceId: string;
  onWorkspaceChange: (workspaceId: string) => void;
  role: Membership['role'];
  onInstallApp: () => void;
  installHint: string;
  isInstalled: boolean;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const visibleNavigation = role === 'seller'
    ? navigation.filter(({ id }) => id === 'sales' || id === 'products' || id === 'cash' || id === 'notifications')
    : navigation;
  const mobilePrimaryIds: AppView[] = ['overview', 'sales', 'products', 'cash'];
  const mobilePrimaryNavigation = visibleNavigation.filter(({ id }) => mobilePrimaryIds.includes(id));
  const mobileMoreNavigation = visibleNavigation.filter(({ id }) => !mobilePrimaryIds.includes(id));

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [moreOpen]);

  const navigate = (nextView: AppView) => {
    setMoreOpen(false);
    onNavigate(nextView);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="PS Faturas, início" onClick={(event) => {
          event.preventDefault();
          navigate('overview');
        }}>
          <img alt="" className="brand__mark brand__mark--image" decoding="async" src="/brand/ps-mobile.webp" />
          <span className="brand__text">
            <strong>Faturas</strong>
            <small>PS-Mobile</small>
          </span>
        </a>

        <div className="workspace-picker">
          <label htmlFor="workspace-select">Espaço de trabalho</label>
          <select
            id="workspace-select"
            value={workspaceId}
            onChange={(event) => onWorkspaceChange(event.target.value)}
          >
            {workspaces.map((workspace) => (
              <option key={workspace.workspace_id} value={workspace.workspace_id}>
                {workspace.workspace_name}
              </option>
            ))}
          </select>
        </div>

        <nav className="primary-nav" aria-label="Navegação principal">
          <span className="nav-caption">GESTÃO</span>
          {visibleNavigation.map(({ id, label, icon: Icon }) => (
            <button
              className={`nav-link${view === id ? ' nav-link--active' : ''}`}
              key={id}
              type="button"
              onClick={() => navigate(id)}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="account-card">
            <span className="account-avatar" aria-hidden="true">
              {profileAvatarUrl ? <img alt="" src={mediaUrl(profileAvatarUrl) || undefined} /> : profileName.slice(0, 1).toLocaleUpperCase()}
            </span>
            <span className="account-details">
              <strong>{profileName}</strong>
              <small>{profileEmail || 'Conta PS-Mobile'}</small>
            </span>
            <ShieldCheck size={17} aria-label="Conta protegida" />
          </div>
          <button type="button" className="nav-link nav-link--logout" onClick={onLogout}>
            <LogOut size={18} aria-hidden="true" />
            <span>Terminar sessão</span>
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <div className="mobile-topbar">
          <div className="brand" aria-label="PS Faturas">
            <img alt="" className="brand__mark brand__mark--image" decoding="async" src="/brand/ps-mobile.webp" />
            <span className="brand__text"><strong>Faturas</strong><small>PS-Mobile</small></span>
          </div>
          <label className="mobile-workspace-picker">
            <span className="sr-only">Espaço de trabalho</span>
            <select value={workspaceId} onChange={(event) => onWorkspaceChange(event.target.value)}>
              {workspaces.map((workspace) => <option key={workspace.workspace_id} value={workspace.workspace_id}>{workspace.workspace_name}</option>)}
            </select>
          </label>
          <button
            aria-current={view === 'notifications' ? 'page' : undefined}
            aria-label="Abrir notificações"
            className={`icon-button mobile-notifications${view === 'notifications' ? ' mobile-notifications--active' : ''}`}
            onClick={() => navigate('notifications')}
            title="Notificações"
            type="button"
          >
            <Bell size={19} aria-hidden="true" />
          </button>
          <button type="button" className="icon-button mobile-logout" onClick={onLogout} aria-label="Terminar sessão" title="Terminar sessão">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
        <footer className="app-attribution"><BrandAttribution /></footer>
      </main>

      {moreOpen && (
        <div className="mobile-more-overlay">
          <button aria-label="Fechar menu" className="mobile-more-dismiss" onClick={() => setMoreOpen(false)} type="button" />
          <nav aria-label="Mais secções" className="mobile-more-panel" id="mobile-more-panel">
            {mobileMoreNavigation.map(({ id, label, icon: Icon }) => (
              <button
                aria-current={view === id ? 'page' : undefined}
                className={view === id ? 'mobile-more-item mobile-more-item--active' : 'mobile-more-item'}
                key={id}
                onClick={() => navigate(id)}
                type="button"
              >
                <Icon size={19} aria-hidden="true" />
                <span>{label === 'Documentos fiscais' ? 'Faturas' : label}</span>
              </button>
            ))}
            {!isInstalled && (
              <>
                <button className="mobile-more-item" onClick={onInstallApp} type="button">
                  <Download size={19} aria-hidden="true" />
                  <span>Instalar aplicação</span>
                </button>
                {installHint && <p className="mobile-install-hint" role="status">{installHint}</p>}
              </>
            )}
          </nav>
        </div>
      )}
      <nav className="mobile-nav" aria-label="Navegação principal">
        {mobilePrimaryNavigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={view === id ? 'mobile-nav__item mobile-nav__item--active' : 'mobile-nav__item'}
            onClick={() => navigate(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label === 'Visão geral' ? 'Início' : label}</span>
          </button>
        ))}
        <button
          aria-expanded={moreOpen}
          aria-controls="mobile-more-panel"
          className={`mobile-nav__item${moreOpen || mobileMoreNavigation.some(({ id }) => id === view) ? ' mobile-nav__item--active' : ''}`}
          onClick={() => setMoreOpen((open) => !open)}
          type="button"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
          <span>Mais</span>
        </button>
      </nav>
    </div>
  );
}
