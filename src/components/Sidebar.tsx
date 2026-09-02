import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  LogOut,
  PlusCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { PSLogo } from './PSLogo';

interface SidebarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onNewInvoice: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  invoicesCount?: number;
  clientsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  onNewInvoice,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  invoicesCount = 0,
  clientsCount = 0,
}) => {
  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'faturas',
      label: 'Faturas',
      icon: <FileText className="w-5 h-5" />,
      badge: invoicesCount,
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <Users className="w-5 h-5" />,
      badge: clientsCount,
    },
    {
      id: 'produtos',
      label: 'Produtos / Serviços',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'definicoes',
      label: 'Definições',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onNavigate(tab);
    onCloseMobile();
  };

  const handleNewInvoiceClick = () => {
    onNewInvoice();
    onCloseMobile();
  };

  return (
    <>
      {/* Backdrop para mobile */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Container da Sidebar */}
      <aside
        className={`no-print fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a1e42] text-white flex flex-col border-r border-slate-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full'
        }`}
      >
        {/* Topo da Sidebar: Logótipo PS e Botão Fechar Mobile */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="cursor-pointer group flex items-center gap-2.5 text-left min-w-0 transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            <PSLogo variant="compact" size="sm" isDarkBg />
          </button>

          {/* Botão Fechar Mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer shrink-0 active:scale-95"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Scrollável da Sidebar */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {/* Botão de Ação Rápida: + Nova Fatura */}
          <div className="px-3">
            <button
              type="button"
              onClick={handleNewInvoiceClick}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer select-none border active:scale-[0.98] ${
                activeTab === 'nova-fatura'
                  ? 'bg-[#d49419] hover:bg-[#c38410] active:bg-[#ad7409] text-[#0a1e42] border-[#f5a623]/60'
                  : 'bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white border-blue-400/25'
              }`}
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Nova Fatura</span>
            </button>
          </div>

          {/* Lista de Navegação Principal */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                activeTab === item.id ||
                (item.id === 'faturas' && activeTab === 'historico') ||
                (item.id === 'definicoes' && activeTab === 'configuracoes');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer select-none group active:scale-[0.98] ${
                    isActive
                      ? 'bg-white/[0.12] text-white font-bold border border-white/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05] border border-transparent active:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`transition-colors duration-150 shrink-0 ${
                        isActive
                          ? 'text-[#d49419]'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold transition-colors ${
                          isActive
                            ? 'bg-[#d49419] text-[#0a1e42]'
                            : 'bg-white/10 text-slate-300 group-hover:bg-white/15'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d49419]" />
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Utilizador e Terminar Sessão */}
        <div className="p-3 border-t border-white/10 space-y-2 shrink-0 bg-[#07152e]/90">
          {/* Card do Utilizador */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <div className="w-8 h-8 rounded-lg bg-[#0056d6] text-white border border-blue-400/30 flex items-center justify-center font-bold text-xs shrink-0">
              PS
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">Patricia Segunda</p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Sessão ativa" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Administrador</p>
            </div>
          </div>

          {/* Botão Terminar Sessão */}
          <button
            type="button"
            onClick={() => {
              onCloseMobile();
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 active:bg-rose-500/20 transition-all duration-150 cursor-pointer active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Terminar sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
};
