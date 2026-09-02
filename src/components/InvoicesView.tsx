import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Copy,
  FileDown,
  Printer,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { Invoice, InvoiceStatus } from '../types';
import { formatKz } from '../utils/formatters';

interface InvoicesViewProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
}

type FilterTab = 'Todas' | 'Pagas' | 'Pendentes' | 'Vencidas' | 'Rascunhos';

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onNewInvoice,
  onViewInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 8;

  // Filtragem dos documentos
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Filtro de Texto
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        inv.number.toLowerCase().includes(term) ||
        inv.clientName.toLowerCase().includes(term) ||
        (inv.clientNif && inv.clientNif.toLowerCase().includes(term)) ||
        (inv.notes && inv.notes.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // Filtro de Estado
      if (activeFilter === 'Todas') return true;
      if (activeFilter === 'Pagas') return inv.status === 'Paga';
      if (activeFilter === 'Pendentes') return inv.status === 'Pendente';
      if (activeFilter === 'Vencidas') return inv.status === 'Vencida';
      if (activeFilter === 'Rascunhos') return inv.status === 'Rascunho';

      return true;
    });
  }, [invoices, searchTerm, activeFilter]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const currentInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const handleFilterChange = (filter: FilterTab) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handlePrint = (inv: Invoice) => {
    onViewInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paga':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Paga
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
            Pendente
          </span>
        );
      case 'Vencida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Vencida
          </span>
        );
      case 'Rascunho':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Rascunho
          </span>
        );
    }
  };

  // Contagens para os filtros
  const counts = {
    Todas: invoices.length,
    Pagas: invoices.filter((i) => i.status === 'Paga').length,
    Pendentes: invoices.filter((i) => i.status === 'Pendente').length,
    Vencidas: invoices.filter((i) => i.status === 'Vencida').length,
    Rascunhos: invoices.filter((i) => i.status === 'Rascunho').length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Topo: Título + Botão Nova Fatura */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a1e42] tracking-tight">
            Faturas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Arquivo e controlo de todos os documentos comerciais emitidos
          </p>
        </div>

        <button
          type="button"
          onClick={onNewInvoice}
          className="px-5 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white text-sm font-bold border border-blue-400/25 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0 select-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Fatura</span>
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 space-y-4">
        {/* Campo de Pesquisa */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Pesquisar por número ou cliente..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filtros por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          {(['Todas', 'Pagas', 'Pendentes', 'Vencidas', 'Rascunhos'] as FilterTab[]).map(
            (tab) => {
              const isActive = activeFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleFilterChange(tab)}
                  className={`px-3.5 py-1.5 rounded-xl transition-all duration-150 whitespace-nowrap cursor-pointer flex items-center gap-1.5 active:scale-[0.98] select-none ${
                    isActive
                      ? 'bg-[#0a1e42] text-white font-bold border border-[#0a1e42]'
                      : 'text-slate-600 hover:text-[#0a1e42] hover:bg-slate-100 active:bg-slate-200 border border-transparent'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Tabela de Faturas */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Nº</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4">Vencimento</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
              {currentInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Nº */}
                  <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="font-extrabold text-[#0a1e42] group-hover:text-[#0056d6] hover:underline cursor-pointer"
                    >
                      {inv.number}
                    </button>
                  </td>

                  {/* Cliente */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[240px]">
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
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Visualizar */}
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#0a1e42] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Visualizar fatura em A4"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => onEditInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#0a1e42] hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar dados da fatura"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Duplicar */}
                      <button
                        onClick={() => onDuplicateInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#d49419] hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Duplicar fatura com nova numeração"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      {/* Baixar PDF / Imprimir */}
                      <button
                        onClick={() => handlePrint(inv)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        title="Imprimir ou Descarregar PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={() => setDeleteConfirmId(inv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar fatura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    Nenhuma fatura encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {filteredInvoices.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              A mostrar{' '}
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              a{' '}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)}
              </span>{' '}
              de{' '}
              <span className="font-bold text-slate-800">
                {filteredInvoices.length}
              </span>{' '}
              faturas
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-semibold flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <div className="px-2 font-bold text-slate-700">
                {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-semibold flex items-center gap-1"
              >
                <span>Próxima</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Eliminação */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">
                Eliminar fatura?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta ação não pode ser revertida. A fatura será removida do arquivo local permanentemente.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteInvoice(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
