import React, { useEffect, useRef, useState } from 'react';
import {
  Printer,
  FileDown,
  Edit,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  Check,
  Building,
  Calendar,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  CheckSquare,
  Square,
  Coins,
  CreditCard,
  PenTool,
  Loader2,
} from 'lucide-react';
import { Invoice, CompanyInfo, DocumentType } from '../types';
import { formatKz, formatKzDecimal, numberToKzWords } from '../utils/formatters';
import { downloadInvoicePdf, invoiceFileName } from '../utils/pdfExport';

const LOGO_SRC = (import.meta.env.VITE_LOGO_URL as string) || '/IMG/logo.png';

interface InvoiceA4ViewProps {
  invoice: Invoice;
  companyInfo: CompanyInfo;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
  onNewInvoice: () => void;
  onToggleStatus?: (invoiceId: string, newStatus: 'Paga' | 'Pendente') => void;
}

function getDocumentTypeName(type?: DocumentType): string {
  switch (type) {
    case 'orcamento':
      return 'Orçamento / Proposta Comercial';
    case 'recibo':
      return 'Recibo de Pagamento';
    case 'pro-forma':
      return 'Factura Pró-Forma';
    case 'factura-recibo':
      return 'Factura-Recibo';
    case 'factura':
    default:
      return 'Factura';
  }
}

function getDocTypeShort(type?: DocumentType): string {
  switch (type) {
    case 'orcamento':
      return 'ORÇAMENTO';
    case 'recibo':
      return 'RECIBO';
    case 'pro-forma':
      return 'PRÓ-FORMA';
    case 'factura-recibo':
      return 'FACTURA-RECIBO';
    case 'factura':
    default:
      return 'FACTURA';
  }
}

function getDateParts(dStr: string) {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  try {
    if (dStr.includes('/')) {
      const [day, month, year] = dStr.split('/');
      return { day, monthName: months[parseInt(month, 10) - 1] || '____', yearShort: year?.slice(-2) || '25', yearFull: year || '2025' };
    }
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      return {
        day: String(d.getDate()).padStart(2, '0'),
        monthName: months[d.getMonth()],
        yearShort: String(d.getFullYear()).slice(-2),
        yearFull: String(d.getFullYear()),
      };
    }
  } catch { /* fallback */ }
  return { day: '____', monthName: '________', yearShort: '25', yearFull: '2025' };
}

export const InvoiceA4View: React.FC<InvoiceA4ViewProps> = ({
  invoice,
  companyInfo,
  onBack,
  onEdit,
  onNewInvoice,
  onToggleStatus,
}) => {
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [contentH, setContentH] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!wrapRef.current) return;
      const avail = wrapRef.current.clientWidth;
      setScale(Math.min(1, avail / 794));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const node = sheetRef.current;
    if (!node) return;
    const measure = () => setContentH(node.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [invoice]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const el = document.getElementById('printable-invoice');
      if (el) {
        await downloadInvoicePdf(el, invoiceFileName(getDocumentTypeName(invoice.docType), invoice.number));
      }
    } catch (e: any) {
      console.error('Falha ao gerar PDF', e?.message || e);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${getDocumentTypeName(invoice.docType)} ${invoice.number} - ${invoice.clientName} no valor de ${formatKz(invoice.total)}. Estado: ${invoice.status}.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const dateParts = getDateParts(invoice.date);

  /* ════════════════════════════════════════════════════════════════════
     MOBILE LAYOUT — clean native cards, no scaled A4
     ════════════════════════════════════════════════════════════════════ */
  const mobileView = (
    <div className="lg:hidden space-y-4 pb-8">
      {/* Slim top bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-slate-600 font-semibold text-xs px-2 py-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0056d6] border border-blue-200 uppercase">
            {getDocTypeShort(invoice.docType)}
          </span>
          {invoice.status === 'Paga' || (invoice.docType === 'orcamento' && invoice.status === 'Paga') ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              {invoice.docType === 'orcamento' ? 'Aprovado' : 'Paga'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
              <Clock className="w-3 h-3" />
              Pendente
            </span>
          )}
        </div>
      </div>

      {/* Company header */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-3">
          <img
            src={companyInfo.logoUrl || LOGO_SRC}
            alt="Logo"
            className="w-12 h-12 object-contain shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-sm font-black text-[#0a1e42] uppercase leading-tight truncate">
              PS – Comércio e Prestação de Serviços
            </h1>
            <p className="text-[11px] font-semibold italic text-[#d49419] truncate">
              {companyInfo.slogan || 'Soluções para o seu negócio crescer'}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">N.º Documento</span>
            <span className="text-base font-black text-[#e11d48] font-mono">{invoice.number}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Data</span>
            <span className="text-sm font-bold text-[#0a1e42]">{invoice.date}</span>
          </div>
        </div>
        {(invoice.validityDate || invoice.dueDate) && (
          <div className="mt-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-bold">
              {invoice.docType === 'pro-forma' ? 'Validade: ' : 'Vencimento: '}
            </span>
            <span className="text-xs font-bold text-amber-700">
              {invoice.validityDate || invoice.dueDate}
            </span>
          </div>
        )}
      </div>

      {/* Client info */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center">
            <User className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-black text-[#0a1e42] uppercase">Cliente</span>
        </div>
        <div className="space-y-1 text-xs text-slate-700">
          <div className="flex gap-2">
            <span className="font-bold text-slate-800 w-16 shrink-0">Nome:</span>
            <span className="font-bold text-[#0a1e42]">{invoice.clientName}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-slate-800 w-16 shrink-0">NIF:</span>
            <span className="font-mono">{invoice.clientNif || 'Consumidor Final'}</span>
          </div>
          {invoice.clientPhone && (
            <div className="flex gap-2">
              <span className="font-bold text-slate-800 w-16 shrink-0">Tel:</span>
              <span>{invoice.clientPhone}</span>
            </div>
          )}
          {invoice.clientAddress && (
            <div className="flex gap-2">
              <span className="font-bold text-slate-800 w-16 shrink-0">Morada:</span>
              <span>{invoice.clientAddress}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0a1e42] text-white px-4 py-2 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          <span className="text-[11px] font-black uppercase">Itens</span>
        </div>
        {invoice.items && invoice.items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {invoice.items.map((item, idx) => (
              <div key={item.id || idx} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-[#0a1e42] block truncate">{item.description}</span>
                    {item.specification && (
                      <span className="text-[11px] text-slate-500 block truncate">{item.specification}</span>
                    )}
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      {item.quantity} x {formatKzDecimal(item.price)}
                    </span>
                  </div>
                  <span className="text-sm font-black text-[#0a1e42] font-mono shrink-0">
                    {formatKzDecimal(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-xs text-slate-400">Nenhum item</div>
        )}
        {/* Total */}
        <div className="px-4 py-3 bg-slate-50 border-t-2 border-[#0a1e42] flex items-center justify-between">
          <span className="text-xs font-black text-[#0a1e42] uppercase">Total</span>
          <span className="text-lg font-black text-[#0a1e42] font-mono">{formatKz(invoice.total)}</span>
        </div>
      </div>

      {/* Conditions & Notes */}
      {(invoice.deliveryTime || invoice.deliveryPlace || invoice.notes) && (
        <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2 text-xs text-slate-700">
          {invoice.deliveryTime && (
            <div className="flex gap-2">
              <span className="font-bold text-slate-800 shrink-0">Prazo:</span>
              <span>{invoice.deliveryTime}</span>
            </div>
          )}
          {invoice.deliveryPlace && (
            <div className="flex gap-2">
              <span className="font-bold text-slate-800 shrink-0">Local:</span>
              <span>{invoice.deliveryPlace}</span>
            </div>
          )}
          {invoice.notes && (
            <div>
              <span className="font-bold text-slate-800 block mb-0.5">Observações:</span>
              <span className="text-slate-600 leading-relaxed">{invoice.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* Bank details */}
      {invoice.docType !== 'orcamento' && invoice.docType !== 'recibo' && (
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-4 h-4 text-[#0056d6]" />
            <span className="text-[11px] font-black text-[#0a1e42] uppercase">Dados Bancários</span>
          </div>
          <div className="space-y-1 text-xs text-slate-700">
            <div className="flex gap-2">
              <span className="font-bold text-slate-800 w-14 shrink-0">Banco:</span>
              <span className="font-semibold">{companyInfo.bankName}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-slate-800 w-14 shrink-0">Conta:</span>
              <span className="font-mono">{companyInfo.accountNumber}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-slate-800 w-14 shrink-0">IBAN:</span>
              <span className="font-mono font-bold text-[#0a1e42] text-[11px] break-all">{companyInfo.iban}</span>
            </div>
          </div>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-4 text-center pt-2">
        <div>
          <div className="border-t border-slate-900 mx-auto w-4/5 pt-1.5">
            <span className="font-bold text-[11px] text-slate-900 block leading-tight">PS</span>
            <span className="text-[9px] text-slate-500 italic">(Assinatura e Carimbo)</span>
          </div>
        </div>
        <div>
          <div className="border-t border-slate-900 mx-auto w-4/5 pt-1.5">
            <span className="font-bold text-[11px] text-slate-900 block leading-tight">Cliente</span>
            <span className="text-[9px] text-slate-500 italic">(Assinatura)</span>
          </div>
        </div>
      </div>

      {/* Date */}
      <div className="text-center text-xs text-slate-600">
        Luanda, {dateParts.day} de {dateParts.monthName} de 20{dateParts.yearShort}
      </div>

      {/* Sticky mobile action bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 safe-area-pb">
        <div className="flex gap-2">
          {onToggleStatus && (
            <button
              onClick={() => onToggleStatus(invoice.id, invoice.status === 'Paga' ? 'Pendente' : 'Paga')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                invoice.status === 'Paga'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {invoice.status === 'Paga' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {invoice.status === 'Paga' ? 'Pendente' : 'Paga'}
            </button>
          )}
          <button
            onClick={() => onEdit(invoice)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#0056d6] text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {generatingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            PDF
          </button>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════
     DESKTOP / PRINT LAYOUT — original A4 sheet
     ════════════════════════════════════════════════════════════════════ */
  const desktopView = (
    <div className="hidden lg:block space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="no-print bg-white rounded-2xl p-3 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-[#0a1e42] font-semibold text-xs sm:text-sm px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Histórico</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-[#0056d6] border border-blue-200 uppercase">
              {getDocumentTypeName(invoice.docType)}
            </span>
            <span className="font-black text-[#0a1e42] text-sm sm:text-base">{invoice.number}</span>
          </div>
          {invoice.status === 'Paga' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {invoice.docType === 'orcamento' ? 'Aprovado' : 'Paga'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              Pendente
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {onToggleStatus && (
            <button
              onClick={() => onToggleStatus(invoice.id, invoice.status === 'Paga' ? 'Pendente' : 'Paga')}
              className={`inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                invoice.status === 'Paga' ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {invoice.status === 'Paga' ? <><Clock className="w-3.5 h-3.5" /><span>Marcar Pendente</span></> : <><CheckCircle2 className="w-3.5 h-3.5" /><span>Marcar Paga</span></>}
            </button>
          )}
          <button onClick={() => onEdit(invoice)} className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <Edit className="w-3.5 h-3.5 text-slate-600" /><span>Editar</span>
          </button>
          <button onClick={handlePrint} className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <Printer className="w-3.5 h-3.5 text-slate-600" /><span>Imprimir</span>
          </button>
          <button onClick={handleDownloadPdf} disabled={generatingPdf} className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 bg-[#0056d6] hover:bg-[#0047b3] text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait" title="Descarregar o documento em PDF">
            {generatingPdf ? <><Loader2 className="w-4 h-4 animate-spin" /><span>A gerar…</span></> : <><FileDown className="w-4 h-4" /><span>Gerar PDF</span></>}
          </button>
          <button onClick={onNewInvoice} className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 bg-[#0a1e42] hover:bg-[#132d5e] text-white px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer">
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" /><span>Nova Fatura</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet */}
      <div className="flex justify-center">
        <div ref={wrapRef} className="pdf-scale-wrap w-full max-w-[794px]" style={{ width: 794 * scale, height: contentH * scale, overflow: scale < 1 ? 'hidden' : 'visible' }}>
          <div
            ref={sheetRef}
            id="printable-invoice"
            className="print-container w-[794px] bg-white rounded-2xl sm:rounded-3xl shadow-md border border-slate-200/90 text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0"
            style={{ width: 794, transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            <div className="p-6 sm:p-8 space-y-4">
              {/* 1. Header Oficial PS */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3">
                <div className="flex items-center gap-3">
                  <img src={companyInfo.logoUrl || LOGO_SRC} alt="PS – Comércio e Prestação de Serviços" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                  <div className="space-y-0.5">
                    <h1 className="text-lg sm:text-xl font-black text-[#0a1e42] tracking-tight leading-none uppercase">PS – COMÉRCIO E PRESTAÇÃO DE SERVIÇOS</h1>
                    <p className="text-sm font-semibold italic text-[#d49419] leading-tight">{companyInfo.slogan || 'Soluções para o seu negócio crescer'}</p>
                    <p className="text-[10px] font-medium text-slate-600 leading-snug">{companyInfo.subSlogan || 'Assistência em Contabilidade | Assistência em Administração | Soluções Tecnológicas | Serviços Diversos'}</p>
                  </div>
                </div>
                {invoice.docType !== 'orcamento' && invoice.docType !== 'recibo' && (
                  <div className="text-left sm:text-right space-y-1 self-start sm:self-auto min-w-[190px]">
                    <h2 className="text-lg font-black text-[#0a1e42] uppercase tracking-wide">
                      {invoice.docType === 'pro-forma' ? 'FACTURA PRÓ-FORMA' : invoice.docType === 'factura-recibo' ? 'FACTURA-RECIBO' : 'FACTURA'}
                    </h2>
                    <div className="inline-block border-2 border-slate-300 rounded-xl px-4 py-1 text-center bg-slate-50/50">
                      <span className="text-sm font-black text-[#e11d48] font-mono tracking-wider">N.º {invoice.number}</span>
                    </div>
                  </div>
                )}
                {invoice.docType === 'recibo' && (
                  <div className="text-left sm:text-right space-y-1 min-w-[170px]">
                    <div className="border-2 border-slate-300 rounded-xl px-4 py-1.5 text-center bg-slate-50/50">
                      <span className="text-[11px] font-extrabold text-slate-600 block uppercase">RECIBO N.º</span>
                      <span className="text-base font-black text-[#e11d48] font-mono tracking-wider">{invoice.number}</span>
                    </div>
                  </div>
                )}
              </div>

              {invoice.docType === 'orcamento' && (
                <div className="text-center py-1">
                  <h2 className="text-xl font-black text-[#0a1e42] tracking-wider uppercase">ORÇAMENTO / PROPOSTA COMERCIAL</h2>
                  <div className="flex items-center justify-center gap-2 mt-0.5">
                    <div className="h-0.5 w-24 bg-[#d49419]" />
                    <div className="w-2 h-2 rounded-full bg-[#d49419]" />
                    <div className="h-0.5 w-24 bg-[#d49419]" />
                  </div>
                </div>
              )}
              {invoice.docType === 'recibo' && (
                <div className="text-center py-1">
                  <h2 className="text-2xl font-black text-[#0a1e42] tracking-wider uppercase">RECIBO DE PAGAMENTO</h2>
                  <div className="flex items-center justify-center gap-2 mt-0.5">
                    <div className="h-0.5 w-28 bg-[#d49419]" />
                    <div className="w-2 h-2 rounded-full bg-[#d49419]" />
                    <div className="h-0.5 w-28 bg-[#d49419]" />
                  </div>
                </div>
              )}

              {/* ORÇAMENTO metadata */}
              {invoice.docType === 'orcamento' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-slate-300 p-3 relative bg-white">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0 mt-0.5"><FileText className="w-3.5 h-3.5" /></div>
                      <div className="space-y-1.5 text-xs text-slate-700 flex-1">
                        <div className="flex items-center gap-2"><span className="font-bold text-slate-900">Orçamento n.º:</span><span className="font-mono font-bold text-[#0056d6]">{invoice.number}</span></div>
                        <div className="flex items-center gap-2"><span className="font-bold text-slate-900">Data:</span><span className="font-medium">{invoice.date}</span></div>
                        <div className="flex items-center gap-2"><span className="font-bold text-slate-900">Validade:</span><span className="font-medium text-amber-700 font-semibold">{invoice.validityDate || invoice.dueDate}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-slate-300 p-3 relative bg-white">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0 mt-0.5"><User className="w-3.5 h-3.5" /></div>
                      <div className="space-y-1 text-xs text-slate-700 flex-1">
                        <div className="font-black text-slate-900 text-xs uppercase mb-0.5">Proposta elaborada para:</div>
                        <div className="grid grid-cols-[58px_1fr] gap-1"><span className="font-bold text-slate-800">Cliente:</span><span className="font-bold text-[#0a1e42]">{invoice.clientName}</span></div>
                        <div className="grid grid-cols-[58px_1fr] gap-1"><span className="font-bold text-slate-800">Telefone:</span><span>{invoice.clientPhone || '—'}</span></div>
                        <div className="grid grid-cols-[58px_1fr] gap-1"><span className="font-bold text-slate-800">E-mail:</span><span>{invoice.clientEmail || '—'}</span></div>
                        <div className="grid grid-cols-[58px_1fr] gap-1"><span className="font-bold text-slate-800">Endereço:</span><span>{invoice.clientAddress || '—'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RECIBO metadata */}
              {invoice.docType === 'recibo' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border-2 border-slate-300 bg-white overflow-hidden">
                      <div className="bg-[#0a1e42] text-white px-3.5 py-1.5 flex items-center gap-2"><Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" /><span className="text-[11px] font-black tracking-wider uppercase">Valor Recebido</span></div>
                      <div className="p-3 flex items-center justify-between gap-3"><span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0">Total (KZ)</span><span className="text-lg sm:text-xl font-black text-[#0a1e42] font-mono text-right">{formatKz(invoice.total)}</span></div>
                    </div>
                    <div className="rounded-xl border-2 border-slate-300 bg-white overflow-hidden">
                      <div className="bg-[#0a1e42] text-white px-3.5 py-1.5 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" /><span className="text-[11px] font-black tracking-wider uppercase">Data do Recebimento</span></div>
                      <div className="p-3 flex items-center justify-between gap-3"><span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0">Data</span><span className="text-lg font-black text-[#0a1e42] font-mono">{invoice.date}</span></div>
                    </div>
                  </div>
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-1.5">
                    <p>Recebi(emos) de <strong className="text-[#0a1e42] underline">{invoice.clientName}</strong></p>
                    <p>NIF: <strong className="font-mono text-slate-900">{invoice.clientNif || 'Consumidor Final'}</strong>, a importância de <strong className="text-[#0a1e42]">{formatKz(invoice.total)}</strong> ({invoice.amountInWords || numberToKzWords(invoice.total)}),</p>
                    <p>referente a pagamento de: <span className="font-semibold text-slate-900">{invoice.receiptReference || invoice.notes || 'Serviços prestados conforme fatura.'}</span></p>
                  </div>
                </div>
              )}

              {/* CLIENTE / DADOS */}
              {invoice.docType !== 'orcamento' && invoice.docType !== 'recibo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-slate-300 overflow-hidden bg-white">
                    <div className="bg-[#0a1e42] text-white px-3.5 py-1 flex items-center gap-2"><User className="w-3.5 h-3.5" /><span className="text-[11px] font-black tracking-wider uppercase">DADOS DO CLIENTE</span></div>
                    <div className="p-3 space-y-1 text-xs text-slate-700">
                      <div className="grid grid-cols-[65px_1fr] gap-1"><span className="font-bold text-slate-800">Cliente:</span><span className="font-bold text-[#0a1e42]">{invoice.clientName}</span></div>
                      <div className="grid grid-cols-[65px_1fr] gap-1"><span className="font-bold text-slate-800">NIF:</span><span className="font-mono font-semibold text-slate-900">{invoice.clientNif || 'Consumidor Final'}</span></div>
                      <div className="grid grid-cols-[65px_1fr] gap-1"><span className="font-bold text-slate-800">Endereço:</span><span>{invoice.clientAddress || '—'}</span></div>
                      <div className="grid grid-cols-[65px_1fr] gap-1"><span className="font-bold text-slate-800">Contacto:</span><span>{invoice.clientPhone || '—'}</span></div>
                      <div className="grid grid-cols-[65px_1fr] gap-1"><span className="font-bold text-slate-800">E-mail:</span><span>{invoice.clientEmail || '—'}</span></div>
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-slate-300 p-3 space-y-1.5 text-xs text-slate-700 bg-white">
                    <div className="flex items-center gap-2.5"><div className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0"><Calendar className="w-3 h-3" /></div><span className="font-bold text-slate-800">Data da Emissão:</span><span className="font-medium text-slate-900">{invoice.date}</span></div>
                    <div className="flex items-center gap-2.5"><div className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0"><Clock className="w-3 h-3" /></div><span className="font-bold text-slate-800">{invoice.docType === 'pro-forma' ? 'Validade da Proposta:' : 'Data de Vencimento:'}</span><span className="font-medium text-amber-700 font-semibold">{invoice.validityDate || invoice.dueDate}</span></div>
                    <div className="flex items-center gap-2.5"><div className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0"><FileText className="w-3 h-3" /></div><span className="font-bold text-slate-800">Referência N.º:</span><span className="font-mono">{invoice.referenceDocNumber || '—'}</span></div>
                    <div className="flex items-center gap-2.5"><div className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0"><User className="w-3 h-3" /></div><span className="font-bold text-slate-800">Responsável:</span><span className="font-medium">{invoice.responsibleName || 'Patricia Segunda'}</span></div>
                  </div>
                </div>
              )}

              {/* 4. Texto Introdutório */}
              {invoice.docType === 'orcamento' && <p className="text-xs sm:text-sm text-slate-700 italic">Prezado(a) Cliente,<br />Apresentamos abaixo nossa proposta comercial para o(s) serviço(s) solicitado(s).</p>}
              {invoice.docType === 'pro-forma' && <p className="text-xs sm:text-sm text-slate-700 italic">Apresentamos abaixo a nossa factura pró-forma referente aos bens/serviços descritos:</p>}
              {invoice.docType === 'factura' && <p className="text-xs sm:text-sm text-slate-700 italic">Apresentamos abaixo a nossa factura referente aos bens/serviços descritos:</p>}
              {invoice.docType === 'factura-recibo' && <p className="text-xs sm:text-sm text-slate-700 italic">Apresentamos abaixo a nossa factura-recibo referente aos serviços descritos e devidamente quitados:</p>}

              {/* 5. TABELA DE ITENS */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-[#0a1e42] text-white uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-3 text-center w-10 border-r border-slate-700">N.º</th>
                      <th className="py-2 px-3 border-r border-slate-700">{invoice.docType === 'orcamento' ? 'DESCRIÇÃO DO SERVIÇO' : invoice.docType === 'recibo' ? 'DESCRIÇÃO / REFERÊNCIA' : 'DESCRIÇÃO DOS BENS / SERVIÇOS'}</th>
                      {invoice.docType !== 'recibo' && <th className="py-2 px-3 border-r border-slate-700">DETALHAMENTO</th>}
                      <th className="py-2 px-3 text-center w-14 border-r border-slate-700">QUANT.</th>
                      <th className="py-2 px-3 text-right w-24 border-r border-slate-700">VALOR UNIT. (KZ)</th>
                      <th className="py-2 px-3 text-right w-28">VALOR TOTAL (KZ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-200">{String(index + 1).padStart(2, '0')}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">{item.description}</td>
                          {invoice.docType !== 'recibo' && <td className="py-2 px-3 text-slate-600 border-r border-slate-200 text-[10.5px]">{item.specification || '—'}</td>}
                          <td className="py-2 px-3 text-center font-mono font-medium border-r border-slate-200">{item.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700 border-r border-slate-200">{formatKzDecimal(item.price)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatKzDecimal(item.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={invoice.docType === 'recibo' ? 5 : 6} className="py-3 text-center text-slate-400">Nenhum item adicionado.</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#0a1e42] bg-slate-50 font-black">
                      <td colSpan={invoice.docType === 'recibo' ? 4 : 5} className="py-2 px-4 text-right text-xs uppercase tracking-wider text-[#0a1e42]">TOTAL GERAL (KZ):</td>
                      <td className="py-2 px-3 text-right font-mono text-sm text-[#0a1e42]">{formatKz(invoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 6. CONDIÇÕES & RESUMO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {invoice.docType === 'orcamento' && (
                  <div className="rounded-xl border-2 border-slate-300 p-3 space-y-1.5 text-xs text-slate-700 bg-white">
                    <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200"><CheckSquare className="w-4 h-4 text-[#0056d6]" /><span>CONDIÇÕES DA PROPOSTA</span></div>
                    <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-600">
                      <li>Os valores incluem todos os custos para execução do serviço.</li>
                      <li>Prazo de execução: <strong className="text-slate-900">{invoice.deliveryTime || '15 dias'}</strong></li>
                    </ul>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-800 text-[11px] block mb-1">Forma de pagamento:</span>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-2">{invoice.paymentCondition?.includes('integral') || !invoice.paymentCondition ? <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}<span>Pagamento integral</span></div>
                        <div className="flex items-center gap-2">{invoice.paymentCondition?.includes('50%') ? <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}<span>50% adjudicação / 50% entrega</span></div>
                      </div>
                    </div>
                  </div>
                )}
                {invoice.docType === 'recibo' && (
                  <div className="rounded-xl border-2 border-slate-300 p-3 space-y-1.5 text-xs text-slate-700 bg-white">
                    <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200"><CreditCard className="w-4 h-4 text-[#0056d6]" /><span>FORMA DE PAGAMENTO</span></div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                      <div className="flex items-center gap-2">{invoice.paymentMethod === 'Dinheiro' ? <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}<span>Dinheiro</span></div>
                      <div className="flex items-center gap-2">{invoice.paymentMethod?.includes('Depósito') ? <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}<span>Depósito</span></div>
                      <div className="flex items-center gap-2">{invoice.paymentMethod?.includes('Transferência') || !invoice.paymentMethod ? <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}<span>Transferência</span></div>
                      <div className="flex items-center gap-2">{invoice.paymentMethod?.includes('Multicaixa') ? <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}<span>Multicaixa</span></div>
                    </div>
                  </div>
                )}
                {invoice.docType !== 'orcamento' && invoice.docType !== 'recibo' && (
                  <div className="rounded-xl border-2 border-slate-300 p-3 space-y-1.5 text-xs text-slate-700 bg-white">
                    <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200"><CheckSquare className="w-4 h-4 text-[#0056d6]" /><span>CONDIÇÕES COMERCIAIS</span></div>
                    <ul className="space-y-1 text-[10.5px] list-disc list-inside text-slate-600">
                      <li>Os preços apresentados em Kwanzas (KZ).</li>
                      <li>{invoice.docType === 'pro-forma' ? 'Factura pró-forma sem valor fiscal.' : 'Documento processado por computador com valor fiscal.'}</li>
                      <li>Os valores poderão sofrer alterações sem aviso prévio.</li>
                    </ul>
                    <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                      <div><span className="font-bold text-slate-800">PRAZO: </span><span>{invoice.deliveryTime || '15 dias após aprovação'}</span></div>
                      <div><span className="font-bold text-slate-800">LOCAL: </span><span>{invoice.deliveryPlace || 'Instalações do Cliente / Luanda'}</span></div>
                    </div>
                  </div>
                )}
                {invoice.docType !== 'recibo' ? (
                  <div className="rounded-xl border-2 border-slate-300 overflow-hidden bg-white">
                    <div className="bg-[#0a1e42] text-white px-3.5 py-1 flex items-center gap-2"><Coins className="w-3.5 h-3.5 text-amber-400" /><span className="text-[11px] font-black tracking-wider uppercase">RESUMO FINANCEIRO</span></div>
                    <div className="p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600"><span>Subtotal (KZ):</span><span className="font-mono font-medium">{formatKzDecimal(invoice.subtotal)}</span></div>
                      <div className="flex justify-between items-center text-slate-600"><span>Desconto:</span><span className="font-mono font-medium">{invoice.discountTotal > 0 ? `- ${formatKzDecimal(invoice.discountTotal)}` : '0,00 Kz'}</span></div>
                      <div className="flex justify-between items-center text-slate-600"><span>Impostos:</span><span className="font-mono font-medium">{formatKzDecimal(invoice.taxTotal)}</span></div>
                      <div className="pt-1.5 border-t-2 border-slate-300 flex justify-between items-center font-black text-sm text-[#0a1e42]"><span>TOTAL GERAL (KZ):</span><span className="font-mono text-base font-black">{formatKz(invoice.total)}</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-slate-300 p-3 space-y-1.5 text-xs text-slate-700 bg-white">
                    <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200"><PenTool className="w-4 h-4 text-[#0056d6]" /><span>OBSERVAÇÕES</span></div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">{invoice.notes || 'O presente recibo confere plena quitação da quantia discriminada.'}</p>
                  </div>
                )}
              </div>

              {/* 7. DADOS BANCÁRIOS & OBSERVAÇÕES */}
              {invoice.docType !== 'orcamento' && invoice.docType !== 'recibo' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-slate-300 p-3 space-y-1 text-xs text-slate-700 bg-white">
                    <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200"><Building className="w-4 h-4 text-[#0056d6]" /><span>DADOS BANCÁRIOS</span></div>
                    <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]"><span className="font-bold text-slate-800">Banco:</span><span className="font-semibold text-slate-900">{companyInfo.bankName}</span></div>
                    <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]"><span className="font-bold text-slate-800">Titular:</span><span>{companyInfo.name}</span></div>
                    <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]"><span className="font-bold text-slate-800">Conta:</span><span className="font-mono">{companyInfo.accountNumber}</span></div>
                    <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]"><span className="font-bold text-slate-800">IBAN:</span><span className="font-mono font-bold text-[#0a1e42]">{companyInfo.iban}</span></div>
                    <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]"><span className="font-bold text-slate-800">NIF:</span><span className="font-mono">{companyInfo.nif}</span></div>
                  </div>
                  <div className="rounded-xl border-2 border-slate-300 p-3 space-y-1 text-xs text-slate-700 bg-white">
                    <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200"><PenTool className="w-4 h-4 text-[#0056d6]" /><span>OBSERVAÇÕES</span></div>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">{invoice.notes || 'Agradecemos a preferência e colocamo-nos à disposição para quaisquer esclarecimentos.'}</p>
                  </div>
                </div>
              )}
              {invoice.docType === 'orcamento' && (
                <div className="rounded-xl border-2 border-slate-300 p-3 space-y-1 text-xs text-slate-700 bg-white">
                  <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200"><PenTool className="w-4 h-4 text-[#0056d6]" /><span>OBSERVAÇÕES</span></div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">{invoice.notes || companyInfo.defaultNotes || 'Proposta válida pelo período estipulado.'}</p>
                </div>
              )}

              {/* 8. AGRADECIMENTO & DATA */}
              <div className="pt-1 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-700 gap-2">
                <div className="text-center sm:text-left">
                  {invoice.docType === 'recibo' ? (
                    <p className="font-medium">Por ser verdade, firmo(amos) o presente recibo.</p>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-800">Agradecemos a preferência e confiança em nossos serviços.</p>
                      <p className="text-slate-500">Colocamo-nos à disposição para quaisquer esclarecimentos.</p>
                    </>
                  )}
                </div>
                <div className="font-medium text-slate-800">
                  Luanda, <span className="underline font-bold px-1">{dateParts.day}</span> de{' '}
                  <span className="underline font-bold px-1">{dateParts.monthName}</span> de 20<span className="underline font-bold px-1">{dateParts.yearShort}</span>
                </div>
              </div>

              {/* 9. ASSINATURAS */}
              <div className="pt-4 grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="border-t border-slate-900 mx-auto w-4/5 pt-1.5">
                    <span className="font-bold text-xs text-slate-900 block leading-tight">PS – Comércio e Prestação de Serviços</span>
                    <span className="text-[10px] text-slate-500 italic block">(Assinatura e Carimbo)</span>
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-900 mx-auto w-4/5 pt-1.5">
                    <span className="font-bold text-xs text-slate-900 block leading-tight">Cliente</span>
                    <span className="text-[10px] text-slate-500 italic block">(Assinatura)</span>
                  </div>
                </div>
              </div>

              {invoice.docType === 'recibo' && (
                <div className="text-center">
                  <span className="text-base font-bold italic text-[#d49419]">Agradecemos a sua preferência!</span>
                </div>
              )}
            </div>

            {/* 10. RODAPÉ */}
            <div className="relative bg-[#0a1e42] text-white mt-4 overflow-hidden">
              <svg className="absolute -top-1 left-0 w-full h-6" viewBox="0 0 850 24" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,16 C 160,26 320,20 470,12 C 600,7 700,4 850,2 L850,0 L0,0 Z" fill="#d49419" />
                <path d="M0,21 C 180,29 360,24 520,17 C 640,12 740,8 850,7 L850,0 L0,0 Z" fill="#ffffff" />
              </svg>
              <div className="pt-7 pb-4 px-6 sm:px-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-100 flex-1 justify-center">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{companyInfo.address || 'Periferia do Projecto Nova Vida'}, {companyInfo.city || 'Luanda – Angola'}</span>
                  </div>
                  <div className="w-px self-stretch my-1 bg-[#d49419]/70 hidden sm:block" />
                  <div className="flex items-center gap-2 text-slate-100 flex-1 justify-center">
                    <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-mono font-medium">{companyInfo.phone || '931 032 313'} <span className="text-slate-300">(WhatsApp)</span></span>
                  </div>
                  <div className="w-px self-stretch my-1 bg-[#d49419]/70 hidden sm:block" />
                  <div className="flex items-center gap-2 text-slate-100 flex-1 justify-center">
                    <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-medium">{companyInfo.email || 'segundapatricia065@gmail.com'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  );
};
