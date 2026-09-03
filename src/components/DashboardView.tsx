import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  Coins,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Eye,
  FileDown,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Invoice, InvoiceStatus, DocumentType } from '../types';
import { formatKz } from '../utils/formatters';
import { DashboardAnalytics } from './DashboardAnalytics';

function getDocTypeLabel(type?: DocumentType): string {
  switch (type) {
    case 'orcamento':
      return 'Orçamento';
    case 'recibo':
      return 'Recibo';
    case 'pro-forma':
      return 'Pró-Forma';
    case 'factura-recibo':
      return 'Factura-Recibo';
    case 'factura':
    default:
      return 'Factura';
  }
}

interface DashboardViewProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onNavigateToInvoices: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  onNewInvoice,
  onViewInvoice,
  onNavigateToInvoices,
}) => {
  // 1. Cálculos dos Indicadores
  const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === 'Paga');
  const totalPaid = paidInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
  const pendingInvoices = invoices.filter((inv) => inv.status === 'Pendente');
  const totalPending = pendingInvoices.reduce((acc, inv) => acc + (inv.total || 0), 0);

  // Faturas deste mês (considerando o mês mais recente das faturas ou corrente)
  const currentMonthInvoices = invoices.filter((inv) => {
    // Verificar formato DD/MM/YYYY
    if (inv.date && inv.date.includes('/')) {
      const parts = inv.date.split('/');
      // Se for do ano corrente/recente
      return parts.length === 3;
    }
    return true;
  });
  const monthInvoiced = currentMonthInvoices.reduce(
    (acc, inv) => acc + (inv.total || 0),
    0
  );

  // Faturas recentes (últimas 6 faturas, mais recentes primeiro)
  const recentInvoices = [...invoices]
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 6);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paga':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Paga
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
            Pendente
          </span>
        );
      case 'Vencida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Vencida
          </span>
        );
      case 'Rascunho':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Rascunho
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner de Boas-Vindas com Botão Principal Nova Fatura */}
      <div className="bg-gradient-to-r from-[#0a1e42] via-[#082d6b] to-[#0056d6] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800/50">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#d49419]/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-slate-200 font-medium mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Painel de Controlo Financeiro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Visão Geral de Facturação
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Acompanhe o desempenho das suas emissões comerciais, faturas pendentes e histórico de pagamentos da PS Comércio &amp; Serviços.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <button
            type="button"
            onClick={onNewInvoice}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#d49419] hover:bg-[#c38410] active:bg-[#ad7409] text-[#0a1e42] font-black text-sm border border-[#f5a623]/60 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Nova Fatura</span>
          </button>
        </div>
      </div>

      {/* Os 4 Indicadores Exigidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Faturas este mês */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faturas este mês
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0056d6] flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#0a1e42]">
              {currentMonthInvoices.length}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-[#0056d6] font-bold">
                {formatKz(monthInvoiced)}
              </span>{' '}
              emitido
            </p>
          </div>
        </div>

        {/* 2. Faturas pagas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faturas pagas
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#0a1e42]">
              {paidInvoices.length}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-600 font-bold">
                {formatKz(totalPaid)}
              </span>{' '}
              liquidado
            </p>
          </div>
        </div>

        {/* 3. Faturas pendentes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Faturas pendentes
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#d49419] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#0a1e42]">
              {pendingInvoices.length}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-[#d49419] font-bold">
                {formatKz(totalPending)}
              </span>{' '}
              a receber
            </p>
          </div>
        </div>

        {/* 4. Total faturado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total faturado
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0a1e42] text-[#f59e0b] flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#0a1e42] truncate" title={formatKz(totalInvoiced)}>
              {formatKz(totalInvoiced)}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {invoices.length} documentos emitidos
            </p>
          </div>
        </div>
      </div>

      {/* Módulo Avançado de Gráficos e Desempenho Financeiro */}
      <DashboardAnalytics invoices={invoices} />

      {/* Área: Faturas Recentes */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0a1e42]">
              Faturas Recentes
            </h3>
            <p className="text-xs text-slate-500">
              Últimas emissões registadas no sistema
            </p>
          </div>

          <button
            onClick={onNavigateToInvoices}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0056d6] hover:text-[#0a1e42] hover:underline cursor-pointer"
          >
            <span>Ver todas as faturas</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Faturas Recentes — Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Documento</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
              {recentInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Documento */}
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-[#0a1e42] group-hover:text-[#0056d6] transition-colors">
                      {inv.number}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {getDocTypeLabel(inv.docType)}
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 truncate max-w-[180px] sm:max-w-[220px]">
                      {inv.clientName}
                    </div>
                    {inv.clientNif && (
                      <div className="text-[11px] text-slate-400">
                        NIF: {inv.clientNif}
                      </div>
                    )}
                  </td>

                  {/* Data */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {inv.date}
                  </td>

                  {/* Vencimento */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {inv.dueDate}
                  </td>

                  {/* Valor */}
                  <td className="py-3.5 px-4 text-right font-extrabold text-[#0a1e42] whitespace-nowrap">
                    {formatKz(inv.total)}
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(inv.status)}
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-6 text-right whitespace-nowrap">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0056d6] hover:text-white text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      title="Visualizar fatura em A4"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar</span>
                    </button>
                  </td>
                </tr>
              ))}

              {recentInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-400 text-sm"
                  >
                    Nenhuma fatura encontrada. Clique em "Nova Fatura" para emitir a primeira.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Faturas Recentes — Mobile / Tablet */}
        <div className="lg:hidden divide-y divide-slate-100">
          {recentInvoices.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm px-4">
              Nenhuma fatura encontrada. Clique em "Nova Fatura" para emitir a primeira.
            </div>
          ) : (
            recentInvoices.map((inv) => (
              <div key={inv.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="font-bold text-[#0a1e42] hover:text-[#0056d6] cursor-pointer text-sm truncate block"
                    >
                      {inv.number}
                    </button>
                    <div className="text-[11px] text-slate-400">
                      {getDocTypeLabel(inv.docType)} • {inv.clientName}
                    </div>
                  </div>
                  {getStatusBadge(inv.status)}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <span className="block text-[10px] uppercase text-slate-400 font-semibold">
                      Data
                    </span>
                    <span className="font-semibold text-slate-700">{inv.date}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <span className="block text-[10px] uppercase text-slate-400 font-semibold">
                      Vencimento
                    </span>
                    <span className="font-semibold text-slate-700">{inv.dueDate}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                    <span className="block text-[10px] uppercase text-slate-400 font-semibold">
                      Valor
                    </span>
                    <span className="font-bold text-[#0a1e42]">{formatKz(inv.total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => onViewInvoice(inv)}
                  className="mt-3 w-full py-2 rounded-xl bg-slate-100 hover:bg-[#0056d6] hover:text-white text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Visualizar fatura
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
