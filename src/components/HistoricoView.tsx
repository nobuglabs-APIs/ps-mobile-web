import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Copy,
  Printer,
  FileDown,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  FileText,
  Building,
  RotateCw,
  Coins,
  Receipt,
  XCircle,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { Invoice, DocumentType, InvoiceStatus } from '../types';
import { formatKz, formatKzDecimal } from '../utils/formatters';
import { Select } from './Select';

interface HistoricoViewProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onDuplicateInvoice: (invoice: Invoice) => void;
  onConvertInvoiceType: (invoice: Invoice, newType: DocumentType) => void;
  onToggleStatus: (invoiceId: string, newStatus: InvoiceStatus) => void;
  onNewInvoice: () => void;
}

export const HistoricoView: React.FC<HistoricoViewProps> = ({
  invoices,
  onSelectInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onDuplicateInvoice,
  onConvertInvoiceType,
  onToggleStatus,
  onNewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'old' | 'highest' | 'lowest'>('recent');

  // Modal para converter tipo de documento
  const [convertingInvoice, setConvertingInvoice] = useState<Invoice | null>(null);

  // Filtragem e ordenação
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Filtro por tipo
        if (selectedDocType !== 'all') {
          const type = inv.docType || 'factura';
          if (type !== selectedDocType) return false;
        }

        // Filtro por status
        if (selectedStatus !== 'all' && inv.status !== selectedStatus) {
          return false;
        }

        // Filtro por busca textual
        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase();
          const matchNumber = inv.number.toLowerCase().includes(term);
          const matchClient = inv.clientName.toLowerCase().includes(term);
          const matchNif = (inv.clientNif || '').toLowerCase().includes(term);
          const matchNotes = (inv.notes || '').toLowerCase().includes(term);
          const matchItems = inv.items?.some(
            (it) =>
              it.description.toLowerCase().includes(term) ||
              (it.specification && it.specification.toLowerCase().includes(term))
          );
          return matchNumber || matchClient || matchNif || matchNotes || matchItems;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        }
        if (sortBy === 'old') {
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
        }
        if (sortBy === 'highest') {
          return b.total - a.total;
        }
        if (sortBy === 'lowest') {
          return a.total - b.total;
        }
        return 0;
      });
  }, [invoices, searchTerm, selectedDocType, selectedStatus, sortBy]);

  // Métricas rápidas de faturação
  const metrics = useMemo(() => {
    const totalBilled = invoices.reduce((acc, i) => acc + i.total, 0);
    const paidInvoices = invoices.filter((i) => i.status === 'Paga');
    const totalPaid = paidInvoices.reduce((acc, i) => acc + i.total, 0);
    const pendingInvoices = invoices.filter((i) => i.status === 'Pendente');
    const totalPending = pendingInvoices.reduce((acc, i) => acc + i.total, 0);

    const countsByType = {
      factura: invoices.filter((i) => (i.docType || 'factura') === 'factura').length,
      proforma: invoices.filter((i) => i.docType === 'pro-forma').length,
      orcamento: invoices.filter((i) => i.docType === 'orcamento').length,
      recibo: invoices.filter((i) => i.docType === 'recibo').length,
      facturaRecibo: invoices.filter((i) => i.docType === 'factura-recibo').length,
    };

    return {
      totalBilled,
      totalPaid,
      totalPending,
      totalCount: invoices.length,
      countsByType,
    };
  }, [invoices]);

  const getDocTypeBadge = (type?: DocumentType) => {
    switch (type) {
      case 'orcamento':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
            ORÇAMENTO
          </span>
        );
      case 'pro-forma':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
            PRÓ-FORMA
          </span>
        );
      case 'recibo':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
            RECIBO
          </span>
        );
      case 'factura-recibo':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
            FACTURA-RECIBO
          </span>
        );
      case 'factura':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-[#0056d6] border border-blue-200">
            FACTURA
          </span>
        );
    }
  };

  const handlePrintItem = (invoice: Invoice) => {
    onSelectInvoice(invoice);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header com Resumo e Botão Nova Fatura */}
      <div className="bg-white lg:rounded-2xl lg:p-6 lg:border lg:border-slate-200/90 lg:shadow-2xs flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-2xl font-black text-[#0a1e42] tracking-tight">
              Histórico
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] lg:text-xs font-bold bg-blue-50 text-[#0056d6] border border-blue-200 font-mono">
              {metrics.totalCount}
            </span>
          </div>
          <p className="text-[11px] lg:text-sm text-slate-500 font-medium mt-0.5 hidden lg:block">
            Gestão, pesquisa e conversão de Facturas, Pró-Formas, Orçamentos e Recibos da PS
          </p>
        </div>

        <button
          onClick={onNewInvoice}
          className="inline-flex items-center gap-1.5 bg-[#0056d6] hover:bg-[#0047b3] text-white px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span className="lg:inline">Novo</span>
        </button>
      </div>

      {/* 4 Cards de Totais — mobile: 2x2 flat, desktop: 4-col */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white lg:rounded-2xl p-3 lg:p-4 lg:border lg:border-slate-200/90 lg:shadow-2xs">
          <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Facturado</span>
          <span className="text-base lg:text-xl font-black text-[#0a1e42] font-mono mt-0.5 block">{formatKz(metrics.totalBilled)}</span>
        </div>
        <div className="bg-white lg:rounded-2xl p-3 lg:p-4 lg:border lg:border-slate-200/90 lg:shadow-2xs">
          <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Liquidado</span>
          <span className="text-base lg:text-xl font-black text-emerald-600 font-mono mt-0.5 block">{formatKz(metrics.totalPaid)}</span>
        </div>
        <div className="bg-white lg:rounded-2xl p-3 lg:p-4 lg:border lg:border-slate-200/90 lg:shadow-2xs">
          <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Pendente</span>
          <span className="text-base lg:text-xl font-black text-amber-600 font-mono mt-0.5 block">{formatKz(metrics.totalPending)}</span>
        </div>
        <div className="bg-white lg:rounded-2xl p-3 lg:p-4 lg:border lg:border-slate-200/90 lg:shadow-2xs">
          <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Documentos</span>
          <span className="text-base lg:text-xl font-black text-[#0a1e42] font-mono mt-0.5 block">{metrics.totalCount}</span>
        </div>
      </div>

      {/* Barra de Filtros por Tipo de Documento */}
      <div className="bg-white lg:rounded-2xl lg:p-5 lg:border lg:border-slate-200/90 lg:shadow-2xs space-y-3 lg:space-y-4">
        {/* Pílulas de Tipos de Documento */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedDocType('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] lg:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDocType === 'all'
                ? 'bg-[#0a1e42] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({invoices.length})
          </button>

          <button
            onClick={() => setSelectedDocType('factura')}
            className={`px-3 py-1.5 rounded-xl text-[11px] lg:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDocType === 'factura'
                ? 'bg-[#0056d6] text-white shadow-xs'
                : 'bg-blue-50 text-[#0056d6] hover:bg-blue-100'
            }`}
          >
            Facturas ({metrics.countsByType.factura})
          </button>

          <button
            onClick={() => setSelectedDocType('pro-forma')}
            className={`px-3 py-1.5 rounded-xl text-[11px] lg:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDocType === 'pro-forma'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Pró-Forma ({metrics.countsByType.proforma})
          </button>

          <button
            onClick={() => setSelectedDocType('orcamento')}
            className={`px-3 py-1.5 rounded-xl text-[11px] lg:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDocType === 'orcamento'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Orçamentos ({metrics.countsByType.orcamento})
          </button>

          <button
            onClick={() => setSelectedDocType('recibo')}
            className={`px-3 py-1.5 rounded-xl text-[11px] lg:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDocType === 'recibo'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Recibos ({metrics.countsByType.recibo})
          </button>

          <button
            onClick={() => setSelectedDocType('factura-recibo')}
            className={`px-3 py-1.5 rounded-xl text-[11px] lg:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedDocType === 'factura-recibo'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            Factura-Recibo ({metrics.countsByType.facturaRecibo})
          </button>
        </div>

        {/* Linha de Pesquisa, Estado e Ordenação */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-2 lg:border-t border-slate-100">
          {/* Campo de Busca Rápida */}
          <div className="lg:col-span-6 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl lg:border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 text-xs lg:text-sm text-slate-800"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>

          {/* Filtro de Estado */}
          <div className="lg:col-span-3">
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { value: 'all', label: 'Todos os Estados' },
                { value: 'Pendente', label: 'Pendentes' },
                { value: 'Paga', label: 'Pagas / Aprovadas' },
                { value: 'Cancelada', label: 'Canceladas' },
              ]}
            />
          </div>

          {/* Ordenação */}
          <div className="lg:col-span-3">
            <Select
              value={sortBy}
              onChange={(v) => setSortBy(v as any)}
              options={[
                { value: 'recent', label: 'Mais Recentes' },
                { value: 'old', label: 'Mais Antigos' },
                { value: 'highest', label: 'Maior Valor' },
                { value: 'lowest', label: 'Menor Valor' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Lista de Documentos */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white lg:rounded-2xl lg:border lg:border-slate-200/90 lg:shadow-2xs px-6 py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-700 text-base">Nenhum documento encontrado</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1">
              {searchTerm || selectedDocType !== 'all' || selectedStatus !== 'all'
                ? 'Não foram encontrados registos para os filtros selecionados.'
                : 'Ainda não emitiu nenhuma fatura ou orçamento.'}
            </p>
          </div>
          {(searchTerm || selectedDocType !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedDocType('all'); setSelectedStatus('all'); }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Tipo & Número</th>
                    <th className="py-3 px-4">Cliente / Contacto</th>
                    <th className="py-3 px-4">Data Emissão</th>
                    <th className="py-3 px-4">Resumo dos Serviços</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => onSelectInvoice(invoice)}>
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          <div>{getDocTypeBadge(invoice.docType)}</div>
                          <button onClick={() => onSelectInvoice(invoice)} className="font-black text-[#0a1e42] hover:text-[#0056d6] transition-colors font-mono text-xs sm:text-sm block">{invoice.number}</button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block group-hover:text-[#0056d6] transition-colors">{invoice.clientName}</span>
                        {invoice.clientNif && <span className="text-[11px] font-mono text-slate-400 block">NIF: {invoice.clientNif}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium text-xs whitespace-nowrap">{invoice.date}</td>
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <span className="text-xs text-slate-600 truncate block">
                          {invoice.items && invoice.items.length > 0 ? invoice.items.map((i) => i.description).join(', ') : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-xs sm:text-sm whitespace-nowrap">{formatKz(invoice.total)}</td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onToggleStatus(invoice.id, invoice.status === 'Paga' ? 'Pendente' : 'Paga')} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 cursor-pointer ${invoice.status === 'Paga' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : invoice.status === 'Cancelada' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {invoice.status === 'Paga' ? <><CheckCircle2 className="w-3 h-3 text-emerald-600" /><span>Paga</span></> : invoice.status === 'Cancelada' ? <><XCircle className="w-3 h-3 text-rose-600" /><span>Cancelada</span></> : <><Clock className="w-3 h-3 text-amber-600" /><span>Pendente</span></>}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => onSelectInvoice(invoice)} className="p-1.5 rounded-lg text-slate-600 hover:text-[#0056d6] hover:bg-blue-50 transition-colors" title="Visualizar"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handlePrintItem(invoice)} className="p-1.5 rounded-lg text-slate-600 hover:text-[#0a1e42] hover:bg-slate-100 transition-colors" title="Imprimir"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => onEditInvoice(invoice)} className="p-1.5 rounded-lg text-slate-600 hover:text-[#0056d6] hover:bg-blue-50 transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => onDuplicateInvoice(invoice)} className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Duplicar"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => setConvertingInvoice(invoice)} className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Converter"><RotateCw className="w-4 h-4" /></button>
                          <button onClick={() => { if (window.confirm(`Eliminar ${invoice.number}?`)) onDeleteInvoice(invoice.id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile flat list */}
          <div className="lg:hidden">
            {filteredInvoices.map((invoice, idx) => (
              <button
                key={invoice.id}
                onClick={() => onSelectInvoice(invoice)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-50 cursor-pointer ${idx < filteredInvoices.length - 1 ? 'border-b border-slate-100' : 'border-b border-slate-100'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getDocTypeBadge(invoice.docType)}
                      <span className="font-bold text-sm text-[#0a1e42] font-mono truncate">{invoice.number}</span>
                    </div>
                    <span className="font-bold text-sm text-[#0a1e42] whitespace-nowrap">{formatKz(invoice.total)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-xs text-slate-500 truncate">{invoice.clientName}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{invoice.date}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Modal de Conversão de Tipo de Documento */}
      {convertingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-[#0056d6]" />
                <h3 className="font-black text-[#0a1e42] text-base">
                  Converter {convertingInvoice.number}
                </h3>
              </div>
              <button
                onClick={() => setConvertingInvoice(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              Selecione o novo tipo para o qual deseja converter este documento. Os dados do cliente,
              itens e valores serão mantidos e um novo número correspondente será gerado:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onConvertInvoiceType(convertingInvoice, 'factura');
                  setConvertingInvoice(null);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-[#0056d6] hover:bg-blue-50/50 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                    Factura Comercial (FT)
                  </span>
                  <span className="text-[11px] text-slate-500">Documento fiscal definitivo</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#0056d6]">FT</span>
              </button>

              <button
                onClick={() => {
                  onConvertInvoiceType(convertingInvoice, 'pro-forma');
                  setConvertingInvoice(null);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-purple-600 hover:bg-purple-50/50 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                    Factura Pró-Forma (PF)
                  </span>
                  <span className="text-[11px] text-slate-500">Cotação formal sem valor fiscal</span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-700">PF</span>
              </button>

              <button
                onClick={() => {
                  onConvertInvoiceType(convertingInvoice, 'factura-recibo');
                  setConvertingInvoice(null);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                    Factura-Recibo (FR)
                  </span>
                  <span className="text-[11px] text-slate-500">Factura com quitação imediata</span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-700">FR</span>
              </button>

              <button
                onClick={() => {
                  onConvertInvoiceType(convertingInvoice, 'recibo');
                  setConvertingInvoice(null);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                    Recibo de Pagamento (RC)
                  </span>
                  <span className="text-[11px] text-slate-500">Comprovativo de quitação</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700">RC</span>
              </button>

              <button
                onClick={() => {
                  onConvertInvoiceType(convertingInvoice, 'orcamento');
                  setConvertingInvoice(null);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-amber-600 hover:bg-amber-50/50 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                    Orçamento / Proposta (ORC)
                  </span>
                  <span className="text-[11px] text-slate-500">Proposta comercial com condições</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-800">ORC</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setConvertingInvoice(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
