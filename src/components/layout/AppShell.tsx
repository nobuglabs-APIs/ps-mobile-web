import type { ReactNode } from 'react';
import {
  BadgeCheck,
  Boxes,
  Banknote,
  FileText,
  LayoutDashboard,
  LogOut,
  UsersRound,
  UserRound,
  Settings2,
  ShieldCheck,
  ShoppingCart,
} from 'lucide-react';
import type { Membership } from '../../api/psMobile';
import { BrandAttribution } from '../branding/BrandAttribution';
import { mediaUrl } from '../../api/client';

export type AppView = 'overview' | 'products' | 'sales' | 'invoices' | 'customers' | 'cash' | 'team' | 'settings' | 'admin';

const navigation: Array<{ id: AppView; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'sales', label: 'Vendas', icon: ShoppingCart },
  { id: 'products', label: 'Produtos', icon: Boxes },
  { id: 'customers', label: 'Clientes', icon: UserRound },
  { id: 'cash', label: 'Caixa', icon: Banknote },
  { id: 'team', label: 'Equipa', icon: UsersRound },
  { id: 'invoices', label: 'Documentos fiscais', icon: FileText },
  { id: 'settings', label: 'Definições', icon: Settings2 },
  { id: 'admin', label: 'Administração', icon: BadgeCheck },
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
  isAdmin,
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
  isAdmin: boolean;
}) {
  const visibleNavigation = role === 'seller'
    ? navigation.filter(({ id }) => id === 'sales' || id === 'products' || id === 'cash' || (id === 'admin' && isAdmin))
    : navigation.filter(({ id }) => id !== 'admin' || isAdmin);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="PS Faturas, início" onClick={(event) => {
          event.preventDefault();
          onNavigate('overview');
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
              onClick={() => onNavigate(id)}
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
          <button type="button" className="icon-button mobile-logout" onClick={onLogout} aria-label="Terminar sessão" title="Terminar sessão">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
        <footer className="app-attribution"><BrandAttribution /></footer>
      </main>

      <nav className="mobile-nav" aria-label="Navegação principal">
        {visibleNavigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={view === id ? 'mobile-nav__item mobile-nav__item--active' : 'mobile-nav__item'}
            onClick={() => onNavigate(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label === 'Visão geral' ? 'Início' : label === 'Documentos fiscais' ? 'Faturas' : label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
