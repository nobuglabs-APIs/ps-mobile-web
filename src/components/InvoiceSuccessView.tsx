import React, { useState } from 'react';
import {
  CheckCircle2,
  Eye,
  FileDown,
  Printer,
  Share2,
  Plus,
  ArrowRight,
  Mail,
  MessageCircle,
  Copy,
  Check,
  Building,
} from 'lucide-react';
import { Invoice } from '../types';
import { formatKz } from '../utils/formatters';

interface InvoiceSuccessViewProps {
  invoice: Invoice;
  onViewInvoice: () => void;
  onPrintInvoice: () => void;
  onNewInvoice: () => void;
}

export const InvoiceSuccessView: React.FC<InvoiceSuccessViewProps> = ({
  invoice,
  onViewInvoice,
  onPrintInvoice,
  onNewInvoice,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `Prezado(a) ${invoice.clientName},\n\nSegue a Factura nº ${invoice.number} emitida pela PS Comércio & Prestação de Serviços no valor total de ${formatKz(invoice.total)}.\nData de vencimento: ${invoice.dueDate}.\n\nCoordenadas para pagamento:\nBanco BAI: AO06 0040 0000 9284 1029 1014 9\n\nObrigado pela preferência!`;

  const handleCopyShareText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const phone = invoice.clientPhone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phone ? (phone.startsWith('244') ? phone : '244' + phone) : ''}?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Factura ${invoice.number} - PS Comércio & Prestação de Serviços`);
    const body = encodeURIComponent(shareText);
    window.open(`mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/80 p-6 sm:p-10 text-center relative overflow-hidden">
        {/* Faixa decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0056d6] via-[#d49419] to-[#0a1e42]" />

        {/* Ícone de Sucesso */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm animate-bounce-short">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Mensagem e Número da Fatura */}
        <h2 className="text-2xl sm:text-3xl font-black text-[#0a1e42] tracking-tight">
          Fatura emitida com sucesso!
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          O documento fiscal foi gerado e arquivado no sistema da PS Comércio &amp; Serviços.
        </p>

        {/* Card Resumo do Documento */}
        <div className="my-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Número do Documento
            </div>
            <div className="text-lg font-black text-[#0056d6] font-mono mt-0.5">
              {invoice.number}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Cliente: <span className="font-bold text-slate-800">{invoice.clientName}</span>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Valor Total
            </div>
            <div className="text-xl font-black text-[#0a1e42] mt-0.5">
              {formatKz(invoice.total)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Vencimento: <span className="font-semibold text-slate-700">{invoice.dueDate}</span>
            </div>
          </div>
        </div>

        {/* As Ações Obrigatórias: Visualizar, Baixar PDF, Imprimir, Enviar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          {/* Visualizar Fatura */}
          <button
            type="button"
            onClick={onViewInvoice}
            className="py-3 px-4 rounded-xl bg-[#0a1e42] hover:bg-[#0056d6] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#0a1e42] transition-all duration-150 active:scale-[0.98] cursor-pointer select-none"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar Fatura (A4)</span>
          </button>

          {/* Baixar PDF / Imprimir */}
          <button
            type="button"
            onClick={onPrintInvoice}
            className="py-3 px-4 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-400/25 transition-all duration-150 active:scale-[0.98] cursor-pointer select-none"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Baixar PDF</span>
          </button>

          {/* Enviar */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="py-3 px-4 rounded-xl border border-[#d49419]/50 bg-amber-50 hover:bg-amber-100/80 active:bg-amber-200/60 text-[#0a1e42] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] cursor-pointer select-none"
          >
            <Share2 className="w-4 h-4 text-[#d49419]" />
            <span>Enviar ao Cliente</span>
          </button>

          {/* Nova Fatura */}
          <button
            type="button"
            onClick={onNewInvoice}
            className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 text-[#0056d6]" />
            <span>Emitir Nova Fatura</span>
          </button>
        </div>
      </div>

      {/* Modal Enviar ao Cliente */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-extrabold text-[#0a1e42] mb-1">
              Enviar Fatura ao Cliente
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Transmita os dados do documento comercial e as coordenadas de liquidação instantaneamente.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSendWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar via WhatsApp ({invoice.clientPhone || 'Contacto'})</span>
              </button>

              <button
                onClick={handleSendEmail}
                className="w-full py-3 px-4 rounded-xl bg-[#0056d6] hover:bg-[#0047b3] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar por Email ({invoice.clientEmail || 'Email'})</span>
              </button>

              <button
                onClick={handleCopyShareText}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Mensagem Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto da Fatura</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
