import React, { useState } from 'react';
import { Menu, Bell, Plus, User, Check, X } from 'lucide-react';
import { ActiveTab } from '../types';

interface TopBarProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onNewInvoice: () => void;
  invoicesCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onNewInvoice,
  invoicesCount,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

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

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'faturas':
      case 'historico':
        return 'Gestão de Faturas';
      case 'nova-fatura':
        return 'Emissão de Fatura';
      case 'clientes':
        return 'Clientes';
      case 'produtos':
        return 'Produtos & Serviços';
      case 'definicoes':
      case 'configuracoes':
        return 'Definições do Sistema';
      default:
        return 'PS Faturas';
    }
  };

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Esquerda: Botão Menu Mobile + Saudação / Título */}
      <div className="flex items-center gap-3">
        {/* Toggle para Sidebar no Mobile */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-[#0a1e42] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer active:scale-95"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-[#0a1e42] tracking-tight">
              {getGreeting()}, Administrador
            </h2>
            <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-[#d49419] border border-[#d49419]/30">
              PS Comércio
            </span>
          </div>
          <p className="text-xs text-slate-500 capitalize">{getFormattedDate()}</p>
        </div>
      </div>

      {/* Direita: Notificações + Botão Nova Fatura + Perfil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notificações */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-[#0a1e42] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer active:scale-95"
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d49419] ring-2 ring-white" />
          </button>

          {/* Painel de Notificações Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-[#0a1e42]">Notificações</span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 active:scale-90 p-0.5 rounded-lg transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="py-3 space-y-2.5">
                <div className="flex gap-2.5 items-start p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-[#0056d6] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Sistema pronto para emissão
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {invoicesCount} faturas registadas no arquivo local.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5 items-start p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-[#d49419] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Coordenadas bancárias BAI ativas
                    </p>
                    <p className="text-[11px] text-slate-500">
                      IBAN oficial incluído automaticamente em todos os documentos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botão Principal: + Nova Fatura */}
        <button
          type="button"
          onClick={onNewInvoice}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white text-xs sm:text-sm font-bold border border-blue-400/25 transition-all duration-150 active:scale-[0.98] cursor-pointer select-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Fatura</span>
        </button>

        {/* Perfil Miniatura */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-[#0a1e42] text-[#f59e0b] border border-slate-700/50 flex items-center justify-center font-bold text-xs select-none">
            PS
          </div>
        </div>
      </div>
    </header>
  );
};
