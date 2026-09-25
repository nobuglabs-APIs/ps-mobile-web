import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Copy,
  Printer,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  FileClock,
  ClipboardList,
  PenLine,
  Inbox,
  X,
} from 'lucide-react';
import { Invoice, InvoiceStatus, DocumentType } from '../types';
import { formatKz } from '../utils/formatters';

interface InvoicesViewProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => Promise<boolean>;
  clientFilter?: string;
  onClearClientFilter?: () => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

type FilterTab = 'Todas' | 'Pagas' | 'Pendentes' | 'Vencidas' | 'Rascunhos' | 'Canceladas';

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

function getDocTypeTone(type?: DocumentType): string {
  switch (type) {
    case 'orcamento':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'recibo':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'pro-forma':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'factura-recibo':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'factura':
    default:
      return 'bg-blue-50 text-[#0056d6] border-blue-200';
  }
}

function getDocTypeIcon(type?: DocumentType) {
  switch (type) {
    case 'orcamento':
      return <ClipboardList className="w-3 h-3" />;
    case 'recibo':
      return <ReceiptText className="w-3 h-3" />;
    case 'pro-forma':
      return <FileClock className="w-3 h-3" />;
    case 'factura-recibo':
      return <PenLine className="w-3 h-3" />;
    case 'factura':
    default:
      return <ReceiptText className="w-3 h-3" />;
  }
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onNewInvoice,
  onViewInvoice,
  onEditInvoice,
  onDuplicateInvoice,
  onDeleteInvoice,
  clientFilter = '',
  onClearClientFilter,
  canCreate,
  canEdit,
  canDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

      const matchesClient =
        !clientFilter || inv.clientName.trim().toLocaleLowerCase() === clientFilter.trim().toLocaleLowerCase();
      if (!matchesClient) return false;

      // Filtro de Estado
      if (activeFilter === 'Todas') return true;
      if (activeFilter === 'Pagas') return inv.status === 'Paga';
      if (activeFilter === 'Pendentes') return inv.status === 'Pendente';
      if (activeFilter === 'Vencidas') return inv.status === 'Vencida';
      if (activeFilter === 'Rascunhos') return inv.status === 'Rascunho';
      if (activeFilter === 'Canceladas') return inv.status === 'Cancelada';

      return true;
    });
  }, [invoices, searchTerm, activeFilter, clientFilter]);

  // Ordenação: mais recentes primeiro (por data de criação/emissão)
  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [filteredInvoices]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / ITEMS_PER_PAGE));
  const currentInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedInvoices, currentPage]);

  // Se os filtros reduzem o total, repõe a página
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [clientFilter]);

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Paga
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
            Pendente
          </span>
        );
      case 'Vencida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Vencida
          </span>
        );
      case 'Cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelada
          </span>
        );
      case 'Rascunho':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
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
    Canceladas: invoices.filter((i) => i.status === 'Cancelada').length,
  };

  const deleteTarget = deleteConfirmId
    ? invoices.find((i) => i.id === deleteConfirmId)
    : undefined;

  return (
    <div className="space-y-5 pb-12">
      {/* Topo: Título + Botão Nova Fatura */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-extrabold text-[#0a1e42] tracking-tight">Faturas</h1>
          <p className="text-[11px] lg:text-sm text-slate-500 mt-0.5 hidden lg:block">
            Arquivo e controlo de todos os documentos comerciais emitidos
          </p>
        </div>

          {canCreate && <button
            type="button"
            onClick={onNewInvoice}
            className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white text-xs lg:text-sm font-bold border border-blue-400/25 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0 select-none"
          >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Fatura</span>
        </button>}
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white lg:p-4 lg:rounded-2xl lg:border lg:border-slate-200/90 space-y-3 lg:space-y-4">
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
            placeholder="Pesquisar..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl lg:border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Filtros por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          {(['Todas', 'Pagas', 'Pendentes', 'Vencidas', 'Rascunhos', 'Canceladas'] as FilterTab[]).map(
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
        {clientFilter && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-[#0a1e42]">
            <span className="min-w-0 truncate">
              A mostrar documentos de <strong>{clientFilter}</strong>
            </span>
            <button
              type="button"
              onClick={onClearClientFilter}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-bold text-[#0056d6] hover:bg-white"
            >
              <X className="w-3.5 h-3.5" /> Limpar
            </button>
          </div>
        )}
      </div>

      {sortedInvoices.length === 0 ? (
        /* Estado vazio profissional */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            {searchTerm || activeFilter !== 'Todas' || clientFilter
              ? 'Nenhum documento corresponde aos filtros'
              : 'Ainda não existem faturas'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || activeFilter !== 'Todas' || clientFilter
              ? 'Tenta alterar o termo de pesquisa ou escolher outro estado.'
              : 'Emita a primeira fatura para começar a acompanhar os seus documentos comerciais.'}
          </p>
          {canCreate && !searchTerm && activeFilter === 'Todas' && !clientFilter && (
            <button
              type="button"
              onClick={onNewInvoice}
              className="mt-5 px-4 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Emitir Fatura
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tabela de Faturas — Desktop */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Documento</th>
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Emissão</th>
                    <th className="py-3.5 px-4">Vencimento</th>
                    <th className="py-3.5 px-4 text-right">Valor</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
                  {currentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Documento */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex items-center gap-1 p-1.5 rounded-lg border ${getDocTypeTone(
                              inv.docType
                            )}`}
                          >
                            {getDocTypeIcon(inv.docType)}
                          </span>
                          <div>
                            <button
                              onClick={() => onViewInvoice(inv)}
                              className="font-extrabold text-[#0a1e42] group-hover:text-[#0056d6] hover:underline cursor-pointer whitespace-nowrap"
                            >
                              {inv.number}
                            </button>
                            <div className="text-[11px] text-slate-400">
                              {getDocTypeLabel(inv.docType)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 truncate max-w-[200px]">
                          {inv.clientName}
                        </div>
                        {inv.clientNif && (
                          <div className="text-[11px] text-slate-400">
                            NIF: {inv.clientNif}
                          </div>
                        )}
                      </td>

                      {/* Emissão */}
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
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="p-2 rounded-lg text-slate-500 hover:text-[#0a1e42] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Visualizar em A4"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && <button
                            onClick={() => onEditInvoice(inv)}
                            className="p-2 rounded-lg text-slate-500 hover:text-[#0a1e42] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar dados"
                          >
                            <Edit className="w-4 h-4" />
                          </button>}
                          {canCreate && <button
                            onClick={() => onDuplicateInvoice(inv)}
                            className="p-2 rounded-lg text-slate-500 hover:text-[#d49419] hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Duplicar com nova numeração"
                          >
                            <Copy className="w-4 h-4" />
                          </button>}
                          <button
                            onClick={() => handlePrint(inv)}
                            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Imprimir ou PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {canDelete && inv.status !== 'Cancelada' && (
                            <button
                              onClick={() => setDeleteConfirmId(inv.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Anular documento"
                              aria-label={`Anular ${inv.number}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {sortedInvoices.length > 0 && (
              <Pagination
                start={Math.max(1, (safePage - 1) * ITEMS_PER_PAGE + 1)}
                end={Math.min(safePage * ITEMS_PER_PAGE, sortedInvoices.length)}
                total={sortedInvoices.length}
                currentPage={safePage}
                totalPages={totalPages}
                onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              />
            )}
          </div>

          {/* Mobile / Tablet: flat list */}
          <div className="lg:hidden">
            {currentInvoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => onViewInvoice(inv)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
              >
                <div className="w-10 h-10 rounded-full bg-[#0a1e42]/5 flex items-center justify-center shrink-0">
                  <ReceiptText className="w-4 h-4 text-[#0056d6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[#0a1e42] truncate">{inv.number}</span>
                    <span className="font-bold text-sm text-[#0a1e42] whitespace-nowrap">{formatKz(inv.total)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 truncate">{inv.clientName}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{inv.date}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}

            {/* Paginação Mobile */}
            {sortedInvoices.length > 0 && (
              <Pagination
                start={Math.max(1, (safePage - 1) * ITEMS_PER_PAGE + 1)}
                end={Math.min(safePage * ITEMS_PER_PAGE, sortedInvoices.length)}
                total={sortedInvoices.length}
                currentPage={safePage}
                totalPages={totalPages}
                onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              />
            )}
          </div>
        </>
      )}

      {/* Modal de confirmação de anulação */}
      {deleteConfirmId && (
        <div className="modal-backdrop fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="cancel-invoice-title" className="modal-panel bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 id="cancel-invoice-title" className="text-base font-extrabold text-slate-900">Anular documento?</h3>
              <p className="text-xs text-slate-500 mt-1">
                {deleteTarget ? (
                  <>
                    <span className="font-bold text-slate-700">{deleteTarget.number}</span>{' '}
                    — {deleteTarget.clientName}. O documento será mantido no histórico como cancelado.
                  </>
                ) : (
                  'O documento será mantido no histórico como cancelado.'
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isCancelling}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={async () => {
                  setIsCancelling(true);
                  const cancelled = await onDeleteInvoice(deleteConfirmId);
                  setIsCancelling(false);
                  if (cancelled) setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60"
              >
                {isCancelling ? 'A anular...' : 'Sim, Anular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Pagination({
  start,
  end,
  total,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: {
  start: number;
  end: number;
  total: number;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      <div>
        A mostrar{' '}
        <span className="font-bold text-slate-800">{start}</span> a{' '}
        <span className="font-bold text-slate-800">{end}</span> de{' '}
        <span className="font-bold text-slate-800">{total}</span> documentos
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
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
            onClick={onNext}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-semibold flex items-center gap-1"
          >
            <span>Próxima</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
