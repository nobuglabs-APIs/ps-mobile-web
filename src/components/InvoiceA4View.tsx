import React, { useState } from 'react';
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
} from 'lucide-react';
import { Invoice, CompanyInfo, DocumentType } from '../types';
import { PSLogo } from './PSLogo';
import { formatKz, formatKzDecimal, numberToKzWords } from '../utils/formatters';

interface InvoiceA4ViewProps {
  invoice: Invoice;
  companyInfo: CompanyInfo;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
  onNewInvoice: () => void;
  onToggleStatus?: (invoiceId: string, newStatus: 'Paga' | 'Pendente') => void;
}

export const InvoiceA4View: React.FC<InvoiceA4ViewProps> = ({
  invoice,
  companyInfo,
  onBack,
  onEdit,
  onNewInvoice,
  onToggleStatus,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${getDocumentTypeName(invoice.docType)} ${invoice.number} - ${
        invoice.clientName
      } no valor de ${formatKz(invoice.total)}. Estado: ${invoice.status}.`
    );
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! Segue o documento *${invoice.number}* (${getDocumentTypeName(
        invoice.docType
      )}) da *${companyInfo.name}* para *${invoice.clientName}* no valor de *${formatKz(
        invoice.total
      )}*. Estado: ${invoice.status}.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

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

  // Parse date for footer "Luanda, DD de Mês de 20YY"
  const getDateParts = (dStr: string) => {
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    try {
      if (dStr.includes('/')) {
        const [day, month, year] = dStr.split('/');
        const mIndex = parseInt(month, 10) - 1;
        const mName = months[mIndex] || '____';
        const yShort = year ? year.slice(-2) : '25';
        return { day, monthName: mName, yearShort: yShort, yearFull: year || '2025' };
      }
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const mName = months[d.getMonth()];
        const yShort = String(d.getFullYear()).slice(-2);
        return { day, monthName: mName, yearShort: yShort, yearFull: String(d.getFullYear()) };
      }
    } catch {
      // fallback
    }
    return { day: '____', monthName: '________', yearShort: '25', yearFull: '2025' };
  };

  const dateParts = getDateParts(invoice.date);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar (hidden when printing) */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Esquerda: Voltar e Identificador */}
        <div className="flex items-center gap-3">
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
            <span className="font-black text-[#0a1e42] text-sm sm:text-base">
              {invoice.number}
            </span>
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

        {/* Direita: AÇÕES: [ Editar ] [ Imprimir ] [ Gerar PDF ] [ Nova Fatura ] */}
        <div className="flex flex-wrap items-center gap-2">
          {onToggleStatus && (
            <button
              onClick={() =>
                onToggleStatus(
                  invoice.id,
                  invoice.status === 'Paga' ? 'Pendente' : 'Paga'
                )
              }
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                invoice.status === 'Paga'
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {invoice.status === 'Paga' ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Marcar Pendente</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar Paga</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onEdit(invoice)}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-slate-600" />
            <span>Editar</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-[#0056d6] hover:bg-[#0047b3] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            title="Exportar ou Imprimir em formato PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Gerar PDF</span>
          </button>

          <button
            onClick={onNewInvoice}
            className="inline-flex items-center gap-1.5 bg-[#0a1e42] hover:bg-[#132d5e] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Nova Fatura</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="flex justify-center">
        <div
          id="printable-invoice"
          className="print-container w-full max-w-[850px] bg-white rounded-2xl sm:rounded-3xl shadow-md border border-slate-200/90 text-slate-800 print:shadow-none print:border-none print:p-0 print:m-0 overflow-hidden"
        >
          {/* Top Padding */}
          <div className="p-8 sm:p-12 space-y-6">
            {/* 1. Header Oficial PS */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4">
              {/* Logótipo & Marca */}
              <div className="flex items-center gap-3.5">
                <PSLogo variant="icon" size="lg" />
                <div className="space-y-0.5">
                  <h1 className="text-xl sm:text-2xl font-black text-[#0a1e42] tracking-tight leading-none uppercase">
                    PS – COMÉRCIO E PRESTAÇÃO DE SERVIÇOS
                  </h1>
                  <p className="text-sm font-semibold italic text-[#d49419] leading-tight">
                    {companyInfo.slogan || 'Soluções para o seu negócio crescer'}
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-medium text-slate-600 leading-snug">
                    {companyInfo.subSlogan ||
                      'Assistência em Contabilidade | Assistência em Administração | Soluções Tecnológicas | Serviços Diversos'}
                  </p>
                </div>
              </div>

              {/* Top Right Document Title & Number Badge for Factura, Pró-Forma, Factura-Recibo */}
              {invoice.docType !== 'orcamento' && invoice.docType !== 'recibo' && (
                <div className="text-left sm:text-right space-y-1 self-start sm:self-auto min-w-[200px]">
                  <h2 className="text-lg sm:text-xl font-black text-[#0a1e42] uppercase tracking-wide">
                    {invoice.docType === 'pro-forma'
                      ? 'FACTURA PRÓ-FORMA'
                      : invoice.docType === 'factura-recibo'
                      ? 'FACTURA-RECIBO'
                      : 'FACTURA'}
                  </h2>
                  <div className="inline-block border-2 border-slate-300 rounded-xl px-4 py-1 text-center bg-slate-50/50">
                    <span className="text-sm font-black text-[#e11d48] font-mono tracking-wider">
                      N.º {invoice.number}
                    </span>
                  </div>
                </div>
              )}

              {/* Top Right for Recibo */}
              {invoice.docType === 'recibo' && (
                <div className="text-left sm:text-right space-y-1 min-w-[180px]">
                  <div className="border-2 border-slate-300 rounded-xl px-4 py-2 text-center bg-slate-50/50">
                    <span className="text-[11px] font-extrabold text-slate-600 block uppercase">
                      RECIBO N.º
                    </span>
                    <span className="text-base font-black text-[#e11d48] font-mono tracking-wider">
                      {invoice.number}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Título Central com Traço Dourado (Para Orçamento e Recibo) */}
            {invoice.docType === 'orcamento' && (
              <div className="text-center py-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#0a1e42] tracking-wider uppercase">
                  ORÇAMENTO / PROPOSTA COMERCIAL
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="h-0.5 w-24 bg-[#d49419]" />
                  <div className="w-2 h-2 rounded-full bg-[#d49419]" />
                  <div className="h-0.5 w-24 bg-[#d49419]" />
                </div>
              </div>
            )}

            {invoice.docType === 'recibo' && (
              <div className="text-center py-2">
                <h2 className="text-2xl sm:text-3xl font-black text-[#0a1e42] tracking-wider uppercase">
                  RECIBO DE PAGAMENTO
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="h-0.5 w-28 bg-[#d49419]" />
                  <div className="w-2 h-2 rounded-full bg-[#d49419]" />
                  <div className="h-0.5 w-28 bg-[#d49419]" />
                </div>
              </div>
            )}

            {/* 3. BLOCOS DE METADADOS SUPERIORES */}

            {/* CASO A: ORÇAMENTO / PROPOSTA COMERCIAL */}
            {invoice.docType === 'orcamento' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Caixa Esquerda: Orçamento n.º, Data, Validade */}
                <div className="rounded-2xl border-2 border-slate-300 p-4 relative bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="space-y-2 text-xs text-slate-700 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Orçamento n.º:</span>
                        <span className="font-mono font-bold text-[#0056d6]">
                          {invoice.number}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Data:</span>
                        <span className="font-medium">{invoice.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Validade da Proposta:</span>
                        <span className="font-medium text-amber-700 font-semibold">
                          {invoice.validityDate || invoice.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caixa Direita: Proposta elaborada para */}
                <div className="rounded-2xl border-2 border-slate-300 p-4 relative bg-white">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-700 flex-1">
                      <div className="font-black text-slate-900 text-xs uppercase mb-1">
                        Proposta elaborada para:
                      </div>
                      <div className="grid grid-cols-[60px_1fr] gap-1">
                        <span className="font-bold text-slate-800">Cliente:</span>
                        <span className="font-bold text-[#0a1e42]">{invoice.clientName}</span>
                      </div>
                      <div className="grid grid-cols-[60px_1fr] gap-1">
                        <span className="font-bold text-slate-800">Telefone:</span>
                        <span>{invoice.clientPhone || '—'}</span>
                      </div>
                      <div className="grid grid-cols-[60px_1fr] gap-1">
                        <span className="font-bold text-slate-800">E-mail:</span>
                        <span>{invoice.clientEmail || '—'}</span>
                      </div>
                      <div className="grid grid-cols-[60px_1fr] gap-1">
                        <span className="font-bold text-slate-800">Endereço:</span>
                        <span>{invoice.clientAddress || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CASO B: RECIBO DE PAGAMENTO */}
            {invoice.docType === 'recibo' && (
              <div className="space-y-4">
                {/* 2 Caixas: Valor Recebido & Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border-2 border-slate-300 p-4 flex items-center gap-4 bg-white">
                    <div className="w-10 h-10 rounded-xl bg-[#0a1e42] text-white flex items-center justify-center">
                      <Coins className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block uppercase">
                        VALOR RECEBIDO (KZ):
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-[#0a1e42] font-mono">
                        KZ {formatKz(invoice.total)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-slate-300 p-4 flex items-center gap-4 bg-white">
                    <div className="w-10 h-10 rounded-xl bg-[#0a1e42] text-white flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block uppercase">
                        DATA DO RECEBIMENTO:
                      </span>
                      <span className="text-lg sm:text-xl font-black text-[#0a1e42] font-mono">
                        {invoice.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Texto do Recibo em Parágrafo com sublinhado */}
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2">
                  <p>
                    Recebi(emos) de <strong className="text-[#0a1e42] underline">{invoice.clientName}</strong>
                  </p>
                  <p>
                    NIF (se aplicável): <strong className="font-mono text-slate-900">{invoice.clientNif || 'Consumidor Final'}</strong>, a importância de{' '}
                    <strong className="text-[#0a1e42]">{formatKz(invoice.total)}</strong> ({invoice.amountInWords || numberToKzWords(invoice.total)}),
                  </p>
                  <p>
                    referente a pagamento de:{' '}
                    <span className="font-semibold text-slate-900">
                      {invoice.receiptReference ||
                        invoice.notes ||
                        'Serviços prestados conforme fatura/especificação acordada.'}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* CASO C: FACTURA, FACTURA PRÓ-FORMA E FACTURA-RECIBO */}
            {invoice.docType !== 'orcamento' && invoice.docType !== 'recibo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Caixa Esquerda: DADOS DO CLIENTE */}
                <div className="rounded-2xl border-2 border-slate-300 overflow-hidden bg-white">
                  <div className="bg-[#0a1e42] text-white px-4 py-1.5 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs font-black tracking-wider uppercase">
                      DADOS DO CLIENTE
                    </span>
                  </div>
                  <div className="p-4 space-y-1.5 text-xs text-slate-700">
                    <div className="grid grid-cols-[65px_1fr] gap-1">
                      <span className="font-bold text-slate-800">Cliente:</span>
                      <span className="font-bold text-[#0a1e42]">{invoice.clientName}</span>
                    </div>
                    <div className="grid grid-cols-[65px_1fr] gap-1">
                      <span className="font-bold text-slate-800">NIF:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {invoice.clientNif || 'Consumidor Final'}
                      </span>
                    </div>
                    <div className="grid grid-cols-[65px_1fr] gap-1">
                      <span className="font-bold text-slate-800">Endereço:</span>
                      <span>{invoice.clientAddress || '—'}</span>
                    </div>
                    <div className="grid grid-cols-[65px_1fr] gap-1">
                      <span className="font-bold text-slate-800">Contacto:</span>
                      <span>{invoice.clientPhone || '—'}</span>
                    </div>
                    <div className="grid grid-cols-[65px_1fr] gap-1">
                      <span className="font-bold text-slate-800">E-mail:</span>
                      <span>{invoice.clientEmail || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Caixa Direita: Datas & Referências */}
                <div className="rounded-2xl border-2 border-slate-300 p-4 space-y-2 text-xs text-slate-700 bg-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0">
                      <Calendar className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-slate-800">Data da Emissão:</span>
                    <span className="font-medium text-slate-900">{invoice.date}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0">
                      <Clock className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-slate-800">
                      {invoice.docType === 'pro-forma'
                        ? 'Validade da Proposta:'
                        : 'Data de Vencimento:'}
                    </span>
                    <span className="font-medium text-amber-700 font-semibold">
                      {invoice.validityDate || invoice.dueDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0">
                      <FileText className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-slate-800">Referência / Orçamento N.º:</span>
                    <span className="font-mono">{invoice.referenceDocNumber || '—'}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center shrink-0">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-slate-800">Responsável:</span>
                    <span className="font-medium">{invoice.responsibleName || 'Patricia Segunda'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Texto Introdutório */}
            {invoice.docType === 'orcamento' && (
              <p className="text-xs sm:text-sm text-slate-700 italic">
                Prezado(a) Cliente,
                <br />
                Apresentamos abaixo nossa proposta comercial para o(s) serviço(s) solicitado(s),
                conforme detalhamento e condições descritas.
              </p>
            )}

            {invoice.docType === 'pro-forma' && (
              <p className="text-xs sm:text-sm text-slate-700 italic">
                Apresentamos abaixo a nossa factura pró-forma referente aos bens/serviços descritos:
              </p>
            )}

            {invoice.docType === 'factura' && (
              <p className="text-xs sm:text-sm text-slate-700 italic">
                Apresentamos abaixo a nossa factura referente aos bens/serviços descritos:
              </p>
            )}

            {invoice.docType === 'factura-recibo' && (
              <p className="text-xs sm:text-sm text-slate-700 italic">
                Apresentamos abaixo a nossa factura-recibo referente aos serviços descritos e devidamente quitados:
              </p>
            )}

            {/* 5. TABELA DE ITENS COM CABEÇALHO AZUL ESCURO (#0a1e42) */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0a1e42] text-white uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-700">N.º</th>
                    <th className="py-2.5 px-3 border-r border-slate-700">
                      {invoice.docType === 'orcamento'
                        ? 'DESCRIÇÃO DO SERVIÇO'
                        : invoice.docType === 'recibo'
                        ? 'DESCRIÇÃO / REFERÊNCIA DO SERVIÇO'
                        : 'DESCRIÇÃO DOS BENS / SERVIÇOS'}
                    </th>
                    {invoice.docType !== 'recibo' && (
                      <th className="py-2.5 px-3 border-r border-slate-700">
                        DETALHAMENTO / ESPECIFICAÇÃO
                      </th>
                    )}
                    <th className="py-2.5 px-3 text-center w-16 border-r border-slate-700">QUANT.</th>
                    <th className="py-2.5 px-3 text-right w-28 border-r border-slate-700">
                      VALOR UNIT. (KZ)
                    </th>
                    <th className="py-2.5 px-3 text-right w-32">VALOR TOTAL (KZ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 border-r border-slate-200">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                          {item.description}
                        </td>
                        {invoice.docType !== 'recibo' && (
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 text-[11px]">
                            {item.specification || '—'}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-center font-mono font-medium border-r border-slate-200">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                          {formatKzDecimal(item.price)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatKzDecimal(item.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={invoice.docType === 'recibo' ? 5 : 6}
                        className="py-4 text-center text-slate-400"
                      >
                        Nenhum item adicionado.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#0a1e42] bg-slate-50 font-black">
                    <td
                      colSpan={invoice.docType === 'recibo' ? 4 : 5}
                      className="py-2.5 px-4 text-right text-xs uppercase tracking-wider text-[#0a1e42]"
                    >
                      TOTAL GERAL (KZ):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-[#0a1e42]">
                      {formatKz(invoice.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 6. BLOCOS DE CONDIÇÕES & RESUMO FINANCEIRO (LADO A LADO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* BLOCO ESQUERDO: CONDIÇÕES / FORMA DE PAGAMENTO */}
              {invoice.docType === 'orcamento' && (
                <div className="rounded-2xl border-2 border-slate-300 p-4 space-y-2 text-xs text-slate-700 bg-white">
                  <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200">
                    <CheckSquare className="w-4 h-4 text-[#0056d6]" />
                    <span>CONDIÇÕES DA PROPOSTA</span>
                  </div>
                  <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-600">
                    <li>Os valores apresentados incluem todos os custos necessários para a execução do serviço.</li>
                    <li>Qualquer serviço adicional será orçado separadamente.</li>
                    <li>
                      Prazo de execução:{' '}
                      <strong className="text-slate-900">{invoice.deliveryTime || '15 dias'}</strong>
                    </li>
                  </ul>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800 text-[11px] block mb-1">
                      Forma de pagamento:
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        {invoice.paymentCondition?.includes('integral') || !invoice.paymentCondition ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>Pagamento integral</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {invoice.paymentCondition?.includes('50%') ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>50% na adjudicação e 50% na entrega</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {invoice.paymentCondition &&
                        !invoice.paymentCondition.includes('integral') &&
                        !invoice.paymentCondition.includes('50%') ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>Outra forma: {invoice.paymentCondition || 'Conforme acordado'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {invoice.docType === 'recibo' && (
                <div className="rounded-2xl border-2 border-slate-300 p-4 space-y-2 text-xs text-slate-700 bg-white">
                  <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200">
                    <CreditCard className="w-4 h-4 text-[#0056d6]" />
                    <span>FORMA DE PAGAMENTO:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                    <div className="flex items-center gap-2">
                      {invoice.paymentMethod === 'Dinheiro' ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Dinheiro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {invoice.paymentMethod?.includes('Depósito') ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Depósito Bancário</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {invoice.paymentMethod?.includes('Transferência') || !invoice.paymentMethod ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Transferência Bancária</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {invoice.paymentMethod?.includes('Cheque') ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Cheque</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      {invoice.paymentMethod?.includes('Multicaixa') ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#0056d6]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Referência Multicaixa / Express</span>
                    </div>
                  </div>
                </div>
              )}

              {invoice.docType !== 'orcamento' && invoice.docType !== 'recibo' && (
                <div className="rounded-2xl border-2 border-slate-300 p-4 space-y-2 text-xs text-slate-700 bg-white">
                  <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200">
                    <CheckSquare className="w-4 h-4 text-[#0056d6]" />
                    <span>CONDIÇÕES COMERCIAIS</span>
                  </div>
                  <ul className="space-y-1 text-[10.5px] list-disc list-inside text-slate-600">
                    <li>Os preços apresentados estão em Kwanzas (KZ).</li>
                    {invoice.docType === 'pro-forma' ? (
                      <li>Esta factura pró-forma não tem valor fiscal.</li>
                    ) : (
                      <li>Documento processado por computador com valor fiscal.</li>
                    )}
                    <li>Os valores poderão sofrer alterações sem aviso prévio.</li>
                    {invoice.docType === 'pro-forma' && (
                      <li>Após a confirmação, será emitida a factura final.</li>
                    )}
                  </ul>
                  <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1">
                    <div>
                      <span className="font-bold text-slate-800">PRAZO DE ENTREGA: </span>
                      <span>{invoice.deliveryTime || '15 dias após aprovação'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">LOCAL DE ENTREGA / PRESTAÇÃO: </span>
                      <span>{invoice.deliveryPlace || 'Instalações do Cliente / Luanda'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* BLOCO DIREITO: RESUMO FINANCEIRO (Para todos exceto recibo simplificado) */}
              {invoice.docType !== 'recibo' ? (
                <div className="rounded-2xl border-2 border-slate-300 overflow-hidden bg-white">
                  <div className="bg-[#0a1e42] text-white px-4 py-1.5 flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-black tracking-wider uppercase">
                      RESUMO FINANCEIRO
                    </span>
                  </div>
                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Subtotal (KZ):</span>
                      <span className="font-mono font-medium">{formatKzDecimal(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Desconto (se aplicável):</span>
                      <span className="font-mono font-medium">
                        {invoice.discountTotal > 0
                          ? `- ${formatKzDecimal(invoice.discountTotal)}`
                          : '0,00 Kz'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Impostos (se aplicável):</span>
                      <span className="font-mono font-medium">{formatKzDecimal(invoice.taxTotal)}</span>
                    </div>
                    <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center font-black text-sm text-[#0a1e42]">
                      <span>TOTAL GERAL (KZ):</span>
                      <span className="font-mono text-base font-black">{formatKz(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Para recibo, a caixa direita é OBSERVAÇÕES */
                <div className="rounded-2xl border-2 border-slate-300 p-4 space-y-2 text-xs text-slate-700 bg-white">
                  <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200">
                    <PenTool className="w-4 h-4 text-[#0056d6]" />
                    <span>OBSERVAÇÕES:</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {invoice.notes ||
                      'O presente recibo confere plena quitação da quantia discriminada.'}
                  </p>
                </div>
              )}
            </div>

            {/* 7. DADOS BANCÁRIOS & OBSERVAÇÕES (Para Factura, Pró-Forma e Factura-Recibo) */}
            {invoice.docType !== 'orcamento' && invoice.docType !== 'recibo' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dados Bancários */}
                <div className="rounded-2xl border-2 border-slate-300 p-4 space-y-1.5 text-xs text-slate-700 bg-white">
                  <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200">
                    <Building className="w-4 h-4 text-[#0056d6]" />
                    <span>DADOS BANCÁRIOS</span>
                  </div>
                  <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]">
                    <span className="font-bold text-slate-800">Banco:</span>
                    <span className="font-semibold text-slate-900">{companyInfo.bankName}</span>
                  </div>
                  <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]">
                    <span className="font-bold text-slate-800">Titular:</span>
                    <span>{companyInfo.name}</span>
                  </div>
                  <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]">
                    <span className="font-bold text-slate-800">Conta:</span>
                    <span className="font-mono">{companyInfo.accountNumber}</span>
                  </div>
                  <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]">
                    <span className="font-bold text-slate-800">IBAN:</span>
                    <span className="font-mono font-bold text-[#0a1e42]">{companyInfo.iban}</span>
                  </div>
                  <div className="grid grid-cols-[55px_1fr] gap-1 text-[11px]">
                    <span className="font-bold text-slate-800">NIF:</span>
                    <span className="font-mono">{companyInfo.nif}</span>
                  </div>
                </div>

                {/* Observações */}
                <div className="rounded-2xl border-2 border-slate-300 p-4 space-y-1.5 text-xs text-slate-700 bg-white">
                  <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200">
                    <PenTool className="w-4 h-4 text-[#0056d6]" />
                    <span>OBSERVAÇÕES</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {invoice.notes ||
                      'Agradecemos a preferência e colocamo-nos à disposição para quaisquer esclarecimentos.'}
                  </p>
                </div>
              </div>
            )}

            {/* OBSERVAÇÕES / INFORMAÇÕES ADICIONAIS (Para Orçamento) */}
            {invoice.docType === 'orcamento' && (
              <div className="rounded-2xl border-2 border-slate-300 p-4 space-y-1.5 text-xs text-slate-700 bg-white">
                <div className="flex items-center gap-2 font-black text-[#0a1e42] uppercase text-xs pb-1 border-b border-slate-200">
                  <PenTool className="w-4 h-4 text-[#0056d6]" />
                  <span>OBSERVAÇÕES / INFORMAÇÕES ADICIONAIS</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-1">
                  {invoice.notes ||
                    companyInfo.defaultNotes ||
                    'Proposta válida pelo período estipulado. Os pagamentos deverão ser efetuados via transferência bancária indicando o n.º da proposta comercial.'}
                </p>
              </div>
            )}

            {/* 8. AGRADECIMENTO & DATA LOCAL */}
            <div className="pt-2 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-700 gap-2">
              <div className="text-center sm:text-left">
                {invoice.docType === 'recibo' ? (
                  <p className="font-medium">Por ser verdade, firmo(amos) o presente recibo.</p>
                ) : (
                  <>
                    <p className="font-semibold text-slate-800">
                      Agradecemos a preferência e confiança em nossos serviços.
                    </p>
                    <p className="text-slate-500">
                      Colocamo-nos à disposição para quaisquer esclarecimentos.
                    </p>
                  </>
                )}
              </div>

              <div className="font-medium text-slate-800">
                Luanda, <span className="underline font-bold px-1">{dateParts.day}</span> de{' '}
                <span className="underline font-bold px-1">{dateParts.monthName}</span> de 20
                <span className="underline font-bold px-1">{dateParts.yearShort}</span>
              </div>
            </div>

            {/* 9. ASSINATURAS & CARIMBO */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="border-t border-slate-900 mx-auto w-4/5 pt-1.5">
                  <span className="font-bold text-xs text-slate-900 block leading-tight">
                    PS – Comércio e Prestação de Serviços
                  </span>
                  <span className="text-[10px] text-slate-500 italic block">
                    (Assinatura e Carimbo)
                  </span>
                </div>
              </div>

              <div>
                <div className="border-t border-slate-900 mx-auto w-4/5 pt-1.5">
                  <span className="font-bold text-xs text-slate-900 block leading-tight">
                    Cliente
                  </span>
                  <span className="text-[10px] text-slate-500 italic block">
                    (Assinatura)
                  </span>
                </div>
              </div>
            </div>

            {/* Mensagem adicional de encerramento para Recibo */}
            {invoice.docType === 'recibo' && (
              <div className="text-center pt-2">
                <span className="text-base font-bold italic text-[#d49419]">
                  Agradecemos a sua preferência!
                </span>
              </div>
            )}
          </div>

          {/* 10. RODAPÉ OFICIAL: BANNER AZUL ESCURO (#0a1e42) COM FAIXA DOURADA CURVADA */}
          <div className="relative bg-[#0a1e42] text-white pt-5 pb-5 px-6 sm:px-10 mt-6">
            {/* Linha de acento dourada curvada no topo do rodapé */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d49419] via-[#f59e0b] to-[#d49419]" />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] sm:text-xs">
              {/* Localização */}
              <div className="flex items-center gap-2 text-slate-200">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span>
                  {companyInfo.address || 'Periferia do Projecto Nova Vida'}, {companyInfo.city || 'Luanda – Angola'}
                </span>
              </div>

              {/* Divisor */}
              <div className="h-4 w-px bg-white/20 hidden sm:block" />

              {/* WhatsApp */}
              <div className="flex items-center gap-2 text-slate-200">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="font-mono font-medium">
                  {companyInfo.phone || '931 032 313'} (WhatsApp)
                </span>
              </div>

              {/* Divisor */}
              <div className="h-4 w-px bg-white/20 hidden sm:block" />

              {/* Email */}
              <div className="flex items-center gap-2 text-slate-200">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="font-medium">
                  {companyInfo.email || 'segundapatricia065@gmail.com'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
