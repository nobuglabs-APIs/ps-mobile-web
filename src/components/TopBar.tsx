import React, { useState } from 'react';
import { Bell, Plus, Settings, LogOut, X } from 'lucide-react';
import { ActiveTab } from '../types';

interface TopBarProps {
  activeTab: ActiveTab;
  onNewInvoice: () => void;
  invoicesCount: number;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onNewInvoice,
  invoicesCount,
  onOpenSettings,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'PS Faturas';
      case 'faturas':
      case 'historico':
        return 'Faturas';
      case 'nova-fatura':
        return 'Nova Fatura';
      case 'clientes':
        return 'Clientes';
      case 'produtos':
        return 'Produtos';
      case 'organizacao':
        return 'Organização';
      case 'definicoes':
      case 'configuracoes':
        return 'Definições';
      default:
        return 'PS Faturas';
    }
  };

  // Saudação adaptativa conforme a hora do dia
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 19) return 'Boa tarde';
    return 'Boa noite';
  };

  // Data atual por extenso em português
  const getFormattedDate = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
  };

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80">
      {/* Mobile: slim bar — no hamburger, bottom nav handles navigation */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#0a1e42] text-[#f59e0b] flex items-center justify-center font-bold text-[10px] select-none">
            PS
          </div>
          <h1 className="text-base font-bold text-[#0a1e42] tracking-tight">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#d49419] ring-1.5 ring-white" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-[#0a1e42]">Notificações</span>
                  <button type="button" onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2 items-start p-2 rounded-lg bg-slate-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0056d6] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Sistema pronto</p>
                      <p className="text-[10px] text-slate-500">{invoicesCount} faturas no arquivo.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings + Logout menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
            {showMobileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMobileMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-[#0056d6]" />
                    <span>Definições</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-rose-50 active:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Terminar Sessão</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: full bar with greeting */}
      <div className="hidden lg:flex items-center justify-between px-6 lg:px-8 py-3.5">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#0a1e42] tracking-tight">
                {getGreeting()}, Administrador
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-[#d49419] border border-[#d49419]/30">
                PS Comércio
              </span>
            </div>
            <p className="text-xs text-slate-500 capitalize">{getFormattedDate()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-[#0a1e42] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer active:scale-95"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d49419] ring-2 ring-white" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-[#0a1e42]">Notificações</span>
                  <button type="button" onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="py-3 space-y-2.5">
                  <div className="flex gap-2.5 items-start p-2 rounded-xl bg-slate-50">
                    <div className="w-2 h-2 rounded-full bg-[#0056d6] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Sistema pronto para emissão</p>
                      <p className="text-[11px] text-slate-500">{invoicesCount} faturas registadas.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white text-sm font-bold border border-blue-400/25 transition-all duration-150 active:scale-[0.98] cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nova Fatura</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-xl bg-[#0a1e42] text-[#f59e0b] border border-slate-700/50 flex items-center justify-center font-bold text-xs select-none">
              PS
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
