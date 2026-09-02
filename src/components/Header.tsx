import React from 'react';
import { FilePlus, History, Settings, LogOut, User } from 'lucide-react';
import { ActiveTab } from '../types';
import { PSLogo } from './PSLogo';

interface HeaderProps {
  activeTab: ActiveTab;
  onNavigateToTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  invoicesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigateToTab,
  onLogout,
  invoicesCount = 0,
}) => {
  const isHistoricoActive = activeTab === 'historico' || activeTab === 'faturas';

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
      {/* Esquerda: Logótipo PS & Nome da Empresa */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={() => onNavigateToTab('nova-fatura')}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          title="PS - Faturação"
        >
          <PSLogo variant="compact" size="sm" />
        </button>
      </div>

      {/* Centro: Navegação Limpa: Emitir Fatura · Histórico · Configurações */}
      <nav className="flex items-center gap-1 sm:gap-2 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70">
        <button
          onClick={() => onNavigateToTab('nova-fatura')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'nova-fatura'
              ? 'bg-[#0056d6] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0a1e42] hover:bg-slate-200/60'
          }`}
        >
          <FilePlus className="w-4 h-4 stroke-[2.5]" />
          <span>Emitir Fatura</span>
        </button>

        <button
          onClick={() => onNavigateToTab('historico')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            isHistoricoActive
              ? 'bg-[#0a1e42] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0a1e42] hover:bg-slate-200/60'
          }`}
        >
          <History className="w-4 h-4 stroke-[2.5]" />
          <span>Histórico</span>
          {invoicesCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${
                isHistoricoActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {invoicesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigateToTab('configuracoes')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'configuracoes'
              ? 'bg-[#0a1e42] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#0a1e42] hover:bg-slate-200/60'
          }`}
        >
          <Settings className="w-4 h-4 stroke-[2.5]" />
          <span>Configurações</span>
        </button>
      </nav>

      {/* Direita: Utilizador Autenticado e Botão Sair */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 pl-3 pr-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <div className="w-6 h-6 rounded-full bg-[#0056d6] text-white flex items-center justify-center font-bold text-[10px]">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-700">admin@psservicos.ao</span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 transition-all cursor-pointer active:scale-95 shadow-2xs"
          title="Terminar Sessão"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
};

