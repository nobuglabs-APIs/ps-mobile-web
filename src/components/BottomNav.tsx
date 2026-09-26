import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Plus,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onNewInvoice: () => void;
  canCreateInvoice: boolean;
}

const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; activeIcon: React.ReactNode }> = [
  {
    id: 'dashboard',
    label: 'Início',
    icon: <LayoutDashboard className="w-6 h-6" strokeWidth={1.8} />,
    activeIcon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.2} />,
  },
  {
    id: 'faturas',
    label: 'Faturas',
    icon: <FileText className="w-6 h-6" strokeWidth={1.8} />,
    activeIcon: <FileText className="w-6 h-6" strokeWidth={2.2} />,
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: <Users className="w-6 h-6" strokeWidth={1.8} />,
    activeIcon: <Users className="w-6 h-6" strokeWidth={2.2} />,
  },
  {
    id: 'produtos',
    label: 'Itens',
    icon: <Package className="w-6 h-6" strokeWidth={1.8} />,
    activeIcon: <Package className="w-6 h-6" strokeWidth={2.2} />,
  },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  onNewInvoice,
  canCreateInvoice,
}) => {
  const isActive = (tab: ActiveTab) =>
    activeTab === tab ||
    (tab === 'faturas' && activeTab === 'historico');

  const isFabActive = activeTab === 'nova-fatura';
  const showFab = canCreateInvoice;

  const renderTabButton = (tab: (typeof tabs)[number]) => (
    <button
      type="button"
      onClick={() => onNavigate(tab.id)}
      aria-current={isActive(tab.id) ? 'page' : undefined}
      className={`flex flex-col items-center justify-center gap-1 py-2 min-w-[3rem] min-h-[48px] cursor-pointer transition-colors rounded-lg ${
        isActive(tab.id) ? 'text-[#0056d6]' : 'text-slate-400 active:text-slate-600'
      }`}
    >
      {isActive(tab.id) ? tab.activeIcon : tab.icon}
      <span className="text-[10px] font-semibold leading-tight">{tab.label}</span>
      {isActive(tab.id) && <span className="w-1 h-1 rounded-full bg-[#0056d6]" />}
    </button>
  );

  return (
    <nav
      aria-label="Navegação principal"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(2,32,71,0.08)]"
    >
      <div
        className={`grid ${showFab ? 'grid-cols-5' : 'grid-cols-4'} items-end px-2 pt-2`}
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {showFab ? (
          <>
            <div className="flex justify-center">{renderTabButton(tabs[0])}</div>
            <div className="flex justify-center">{renderTabButton(tabs[1])}</div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onNewInvoice}
                aria-label="Novo documento"
                aria-current={isFabActive ? 'page' : undefined}
                className={`relative -mt-10 w-16 h-16 rounded-full flex items-center justify-center shrink-0 cursor-pointer select-none transition-transform active:scale-95 ring-4 ring-white ${
                  isFabActive
                    ? 'bg-[#0043a8] text-white shadow-xl shadow-blue-700/40 scale-105'
                    : 'bg-[#0056d6] text-white shadow-xl shadow-blue-600/30'
                }`}
              >
                <Plus className="w-8 h-8" strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex justify-center">{renderTabButton(tabs[2])}</div>
            <div className="flex justify-center">{renderTabButton(tabs[3])}</div>
          </>
        ) : (
          tabs.map((tab) => (
            <div key={tab.id} className="flex justify-center">
              {renderTabButton(tab)}
            </div>
          ))
        )}
      </div>
    </nav>
  );
};
