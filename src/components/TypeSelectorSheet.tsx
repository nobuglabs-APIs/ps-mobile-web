import React from 'react';
import {
  X,
  ReceiptText,
  FileClock,
  ClipboardList,
  PenLine,
  FileCheck,
} from 'lucide-react';
import { DocumentType } from '../types';

interface TypeSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: DocumentType) => void;
}

const docTypes: Array<{
  type: DocumentType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    type: 'factura',
    label: 'Factura',
    desc: 'Documento fiscal definitivo',
    icon: <ReceiptText className="w-5 h-5" />,
    color: 'text-[#0056d6]',
  },
  {
    type: 'factura-recibo',
    label: 'Factura-Recibo',
    desc: 'Factura com quitação imediata',
    icon: <FileCheck className="w-5 h-5" />,
    color: 'text-indigo-600',
  },
  {
    type: 'pro-forma',
    label: 'Pró-Forma',
    desc: 'Cotação formal sem valor fiscal',
    icon: <FileClock className="w-5 h-5" />,
    color: 'text-purple-600',
  },
  {
    type: 'orcamento',
    label: 'Orçamento',
    desc: 'Proposta comercial',
    icon: <ClipboardList className="w-5 h-5" />,
    color: 'text-amber-600',
  },
  {
    type: 'recibo',
    label: 'Recibo',
    desc: 'Comprovativo de pagamento',
    icon: <PenLine className="w-5 h-5" />,
    color: 'text-emerald-600',
  },
];

export const TypeSelectorSheet: React.FC<TypeSelectorSheetProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-200">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-[#0a1e42]">Novo Documento</h3>
            <p className="text-[11px] text-slate-500">Escolha o tipo de documento</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Options */}
        <div className="px-2 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {docTypes.map((doc, idx) => (
            <button
              key={doc.type}
              type="button"
              onClick={() => {
                onSelect(doc.type);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left active:bg-slate-50 cursor-pointer transition-colors ${
                idx < docTypes.length - 1 ? 'border-b border-slate-50' : ''
              }`}
            >
              <span className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 ${doc.color}`}>
                {doc.icon}
              </span>
              <div className="min-w-0">
                <span className="text-sm font-bold text-[#0a1e42] block">{doc.label}</span>
                <span className="text-[11px] text-slate-500 block">{doc.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
