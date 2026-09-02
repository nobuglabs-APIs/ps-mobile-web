import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  Edit,
  Printer,
  FileDown,
  Plus,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '../types';
import { formatKz } from '../utils/formatters';

interface SimpleInvoicesListViewProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onNewInvoice: () => void;
}

export const SimpleInvoicesListView: React.FC<SimpleInvoicesListViewProps> = ({
  invoices,
  onViewInvoice,
  onEditInvoice,
  onPrintInvoice,
  onNewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | 'Pendente' | 'Paga'>('Todas');

  // Filtragem rápida: pesquisa por número ou cliente, e filtro por estado
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'Todas' || inv.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Header & Ação Nova Fatura */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a1e42] tracking-tight">
            Faturas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Histórico e consulta de faturas emitidas.
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#0047b3] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Fatura</span>
        </button>
      </div>

      {/* Barra de Filtros: Pesquisa + Filtro por Estado */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Pesquisa por número ou cliente */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por número da fatura ou cliente..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] bg-slate-50/50"
          />
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
          {(['Todas', 'Pendente', 'Paga'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-[#0a1e42] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Faturas */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p className="text-sm font-semibold">Nenhuma fatura encontrada.</p>
            <button
              onClick={onNewInvoice}
              className="text-xs font-bold text-[#0056d6] hover:underline"
            >
              Emitir a primeira fatura agora
            </button>
          </div>
        ) : (
          <>
            {/* Visão Tabela Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">Número</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0a1e42]">
                        {inv.number}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {inv.clientName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {inv.date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-[#0a1e42]">
                        {formatKz(inv.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {inv.status === 'Paga' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Paga
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ver */}
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-[#0056d6] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Ver Fatura A4"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => onEditInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Fatura"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Imprimir */}
                          <button
                            onClick={() => onPrintInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Imprimir Fatura"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* PDF */}
                          <button
                            onClick={() => onPrintInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-[#0056d6] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Gerar PDF"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Visão Mobile: Lista de Cartões Responsivos */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <div key={inv.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[#0a1e42]">
                      {inv.number}
                    </span>
                    {inv.status === 'Paga' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Paga
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Pendente
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-xs text-slate-900">
                      {inv.clientName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Data: {inv.date} • Vencimento: {inv.dueDate}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-extrabold text-sm text-[#0a1e42]">
                      {formatKz(inv.total)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-bold text-[#0056d6] bg-blue-50 rounded-lg"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => onEditInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onPrintInvoice(inv)}
                        className="p-1 text-slate-600 bg-slate-100 rounded-lg"
                        title="Imprimir / PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
