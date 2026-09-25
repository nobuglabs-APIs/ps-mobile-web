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

const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'faturas', label: 'Faturas', icon: <FileText className="w-5 h-5" /> },
  { id: 'clientes', label: 'Clientes', icon: <Users className="w-5 h-5" /> },
  { id: 'produtos', label: 'Itens', icon: <Package className="w-5 h-5" /> },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onNavigate,
  onNewInvoice,
  canCreateInvoice,
}) => {
  const isActive = (tab: ActiveTab) =>
    activeTab === tab ||
    (tab === 'faturas' && (activeTab === 'historico' || activeTab === 'nova-fatura'));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div
        className="flex items-end justify-around px-1"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        {tabs.map((tab, i) => (
          <React.Fragment key={tab.id}>
            {/* Insert FAB before 3rd tab */}
            {i === 2 && canCreateInvoice && (
              <button
                type="button"
                onClick={onNewInvoice}
                className="relative -mt-6 w-[3.25rem] h-[3.25rem] rounded-full bg-[#0056d6] text-white flex items-center justify-center shadow-lg shadow-blue-600/25 active:scale-95 transition-transform cursor-pointer select-none shrink-0"
              >
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[3.5rem] cursor-pointer transition-colors rounded-lg ${
                isActive(tab.id)
                  ? 'text-[#0056d6]'
                  : 'text-slate-400 active:text-slate-600'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold leading-tight">{tab.label}</span>
              {isActive(tab.id) && (
                <span className="w-1 h-1 rounded-full bg-[#0056d6] mt-0.5" />
              )}
            </button>
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};
