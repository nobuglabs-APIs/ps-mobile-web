import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  User,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileCheck,
  FileText,
  Percent,
  FileSpreadsheet,
  Receipt,
  Building,
  Info,
  MapPin,
  Clock3,
  HelpCircle,
  Eye,
  Package,
  Users,
  Search,
  X,
  Check,
  Calculator,
} from 'lucide-react';
import { Select } from './Select';
import {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  CompanyInfo,
  DocumentType,
  Client,
  ProductService,
} from '../types';
import {
  formatKz,
  formatKzDecimal,
  getTodayFormatted,
  getDueDateFormatted,
  numberToKzWords,
} from '../utils/formatters';

interface InvoiceFormViewProps {
  companyInfo: CompanyInfo;
  editingInvoice?: Invoice | null;
  clients?: Client[];
  products?: ProductService[];
  getNextDocNumber: (type: DocumentType) => string;
  onGenerateInvoice: (invoice: Invoice) => void;
  onSaveDraft: (invoice: Invoice) => void;
  onPreviewInvoice?: (invoice: Invoice) => void;
  onQuickAddClient?: (client: Client) => void;
  onCancelEdit?: () => void;
}

interface DocTypeConfig {
  id: DocumentType;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DOC_TYPE_CONFIGS: DocTypeConfig[] = [
  {
    id: 'factura',
    code: 'FT',
    name: 'Factura',
    subtitle: 'Venda a Prazo',
    description: 'Documento fiscal definitivo com obrigação de pagamento.',
    icon: FileText,
  },
  {
    id: 'pro-forma',
    code: 'PF',
    name: 'Pró-Forma',
    subtitle: 'Proposta Prévia',
    description: 'Documento informativo para aprovação prévia de fornecimento.',
    icon: FileSpreadsheet,
  },
  {
    id: 'factura-recibo',
    code: 'FR',
    name: 'Factura-Recibo',
    subtitle: 'Venda & Quitação',
    description: 'Fatura liquidada no ato da emissão (pronto pagamento).',
    icon: Receipt,
  },
  {
    id: 'orcamento',
    code: 'ORC',
    name: 'Orçamento',
    subtitle: 'Proposta Comercial',
    description: 'Estimativa de valores e prazos para aprovação do cliente.',
    icon: Calculator,
  },
  {
    id: 'recibo',
    code: 'RC',
    name: 'Recibo',
    subtitle: 'Comprovativo',
    description: 'Comprovativo de quitação total ou parcial de pagamentos efetuados.',
    icon: CheckCircle2,
  },
];

export const InvoiceFormView: React.FC<InvoiceFormViewProps> = ({
  companyInfo,
  editingInvoice,
  clients = [],
  products = [],
  getNextDocNumber,
  onGenerateInvoice,
  onSaveDraft,
  onPreviewInvoice,
  onQuickAddClient,
  onCancelEdit,
}) => {
  // Tipo de Documento Selecionado
  const [docType, setDocType] = useState<DocumentType>(
    editingInvoice?.docType || 'factura'
  );

  // SEÇÃO 1: Dados da fatura / documento
  const [number, setNumber] = useState('');
  const [date, setDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [validityDate, setValidityDate] = useState('');
  const [referenceDocNumber, setReferenceDocNumber] = useState('');
  const [responsibleName, setResponsibleName] = useState('Patricia Segunda');
  const [status, setStatus] = useState<InvoiceStatus>('Pendente');

  // Condições comerciais específicas
  const [deliveryTime, setDeliveryTime] = useState('15 dias');
  const [deliveryPlace, setDeliveryPlace] = useState('Instalações do Cliente');
  const [paymentCondition, setPaymentCondition] = useState('Pagamento integral');
  const [paymentMethod, setPaymentMethod] = useState('Transferência Bancária');
  const [receiptReference, setReceiptReference] = useState('');

  // SEÇÃO 2: Dados do cliente
  const [clientName, setClientName] = useState('');
  const [clientNif, setClientNif] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');

  // Estados dos seletores rápidos de cliente e catálogo
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientNif, setQuickClientNif] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientEmail, setQuickClientEmail] = useState('');
  const [quickClientAddress, setQuickClientAddress] = useState('');
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Selecionar cliente pré-cadastrado
  const handleSelectClient = (clientId: string) => {
    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      setClientName(selected.name);
      setClientNif(selected.nif || '');
      setClientPhone(selected.phone || '');
      setClientEmail(selected.email || '');
      setClientAddress(selected.address ? `${selected.address}, ${selected.city}` : '');
    }
  };

  // Criar cliente rápido
  const handleSaveQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClientName.trim()) return;

    const newClient: Client = {
      id: `c-${Date.now()}`,
      name: quickClientName.trim(),
      nif: quickClientNif.trim(),
      phone: quickClientPhone.trim(),
      email: quickClientEmail.trim(),
      address: quickClientAddress.trim(),
      city: 'Luanda',
      invoicesCount: 1,
      totalInvoiced: 0,
    };

    if (onQuickAddClient) {
      onQuickAddClient(newClient);
    }

    setClientName(newClient.name);
    setClientNif(newClient.nif);
    setClientPhone(newClient.phone);
    setClientEmail(newClient.email);
    setClientAddress(newClient.address);

    setIsQuickClientOpen(false);
    setQuickClientName('');
    setQuickClientNif('');
    setQuickClientPhone('');
    setQuickClientEmail('');
    setQuickClientAddress('');
  };

  // Adicionar produto/serviço selecionado do catálogo aos itens
  const handleAddProductFromCatalog = (product: ProductService) => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        description: product.name,
        specification: product.description || '',
        quantity: 1,
        price: product.price,
        discountPercent: 0,
        taxPercent: product.taxPercent ?? 14,
      },
    ]);
    setIsCatalogPickerOpen(false);
  };

  // SEÇÃO 3: Produtos e serviços (Tabela dinâmica com descrição e detalhamento)
  const [items, setItems] = useState<
    Array<{
      id: string;
      description: string;
      specification: string;
      quantity: number;
      price: number;
      discountPercent: number;
      taxPercent: number;
    }>
  >([
    {
      id: `item-${Date.now()}-1`,
      description: '',
      specification: '',
      quantity: 1,
      price: 0,
      discountPercent: 0,
      taxPercent: 14,
    },
  ]);

  // Taxa global de imposto padrão
  const [applyTax, setApplyTax] = useState(true);
  const taxRate = applyTax ? companyInfo.defaultTaxPercent || 14 : 0;

  // SEÇÃO 4: Observações
  const [notes, setNotes] = useState(companyInfo.defaultNotes || '');

  // Preenchimento inicial ou quando muda o tipo de documento
  useEffect(() => {
    if (editingInvoice) {
      setDocType(editingInvoice.docType || 'factura');
      setNumber(editingInvoice.number);
      setDate(editingInvoice.date);
      setDueDate(editingInvoice.dueDate);
      setValidityDate(editingInvoice.validityDate || editingInvoice.dueDate);
      setReferenceDocNumber(editingInvoice.referenceDocNumber || '');
      setResponsibleName(editingInvoice.responsibleName || 'Patricia Segunda');
      setDeliveryTime(editingInvoice.deliveryTime || '15 dias');
      setDeliveryPlace(editingInvoice.deliveryPlace || 'Instalações do Cliente');
      setPaymentCondition(editingInvoice.paymentCondition || 'Pagamento integral');
      setPaymentMethod(editingInvoice.paymentMethod || 'Transferência Bancária');
      setReceiptReference(editingInvoice.receiptReference || '');
      setStatus(editingInvoice.status);
      setClientName(editingInvoice.clientName);
      setClientNif(editingInvoice.clientNif || '');
      setClientPhone(editingInvoice.clientPhone || '');
      setClientEmail(editingInvoice.clientEmail || '');
      setClientAddress(editingInvoice.clientAddress || '');
      setNotes(editingInvoice.notes || '');
      if (editingInvoice.items && editingInvoice.items.length > 0) {
        setItems(
          editingInvoice.items.map((it) => ({
            id: it.id || `item-${Math.random()}`,
            description: it.description,
            specification: it.specification || '',
            quantity: it.quantity,
            price: it.price,
            discountPercent: it.discountPercent || 0,
            taxPercent: it.taxPercent ?? 14,
          }))
        );
      }
    } else {
      // Nova emissão
      setDate(getTodayFormatted());
      setDueDate(getDueDateFormatted(15));
      setValidityDate(getDueDateFormatted(30));
      setNumber(getNextDocNumber(docType));
    }
  }, [editingInvoice]);

  // Atualizar o número sugerido quando o utilizador muda o tipo de documento (se não estiver em edição)
  const handleDocTypeChange = (newType: DocumentType) => {
    setDocType(newType);
    if (!editingInvoice) {
      setNumber(getNextDocNumber(newType));
    }
  };

  // Funções para manipular a tabela dinâmica de itens
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        description: '',
        specification: '',
        quantity: 1,
        price: 0,
        discountPercent: 0,
        taxPercent: taxRate,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('A fatura deve ter pelo menos um item.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: 'description' | 'specification' | 'quantity' | 'price' | 'discountPercent' | 'taxPercent',
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          return updated;
        }
        return item;
      })
    );
  };

  // Cálculos financeiros em tempo real
  const calculatedItems: InvoiceItem[] = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.price) || 0;
    const gross = qty * price;
    const discountAmount = (gross * (Number(it.discountPercent) || 0)) / 100;
    const afterDiscount = Math.max(0, gross - discountAmount);
    const taxAmount = (afterDiscount * (Number(it.taxPercent) || 0)) / 100;
    const lineTotal = afterDiscount + taxAmount;

    return {
      id: it.id,
      description: it.description,
      specification: it.specification,
      quantity: qty,
      price: price,
      discountPercent: Number(it.discountPercent) || 0,
      taxPercent: Number(it.taxPercent) || 0,
      total: lineTotal,
    };
  });

  const subtotal = calculatedItems.reduce((sum, it) => {
    const gross = it.quantity * it.price;
    const discount = (gross * it.discountPercent) / 100;
    return sum + (gross - discount);
  }, 0);

  const discountTotal = items.reduce((sum, it) => {
    const gross = (Number(it.quantity) || 0) * (Number(it.price) || 0);
    return sum + (gross * (Number(it.discountPercent) || 0)) / 100;
  }, 0);

  const taxTotal = calculatedItems.reduce((sum, it) => {
    const gross = it.quantity * it.price;
    const discount = (gross * it.discountPercent) / 100;
    const afterDiscount = gross - discount;
    return sum + (afterDiscount * it.taxPercent) / 100;
  }, 0);

  const total = subtotal + taxTotal;

  // Montar o objeto Invoice para persistir
  const buildInvoiceObject = (invoiceStatus: InvoiceStatus): Invoice => {
    return {
      id: editingInvoice ? editingInvoice.id : `inv-${Date.now()}`,
      docType,
      number: number.trim() || getNextDocNumber(docType),
      clientName: clientName.trim() || 'Cliente Não Identificado',
      clientNif: clientNif.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      date: date || getTodayFormatted(),
      dueDate: dueDate || getDueDateFormatted(15),
      validityDate: validityDate || getDueDateFormatted(30),
      referenceDocNumber: referenceDocNumber.trim(),
      responsibleName: responsibleName.trim() || 'Patricia Segunda',
      deliveryTime: deliveryTime.trim() || '15 dias',
      deliveryPlace: deliveryPlace.trim() || 'Instalações do Cliente',
      paymentCondition: paymentCondition.trim() || 'Pagamento integral',
      paymentMethod: paymentMethod.trim() || 'Transferência Bancária',
      receiptReference:
        receiptReference.trim() ||
        (items[0]?.description
          ? `Pagamento de ${items[0].description}`
          : 'Prestação de Serviços'),
      amountInWords: numberToKzWords(total),
      status: invoiceStatus,
      items: calculatedItems,
      subtotal,
      discountTotal,
      taxTotal,
      total,
      currency: 'Kz',
      notes: notes.trim(),
      createdAt: editingInvoice ? editingInvoice.createdAt : new Date().toISOString(),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Por favor, introduza o Nome / Razão Social do cliente.');
      return;
    }
    const hasInvalidItem = items.some((it) => !it.description.trim() || it.price <= 0);
    if (hasInvalidItem) {
      if (
        !window.confirm(
          'Existem itens sem descrição ou com valor 0 Kz. Deseja continuar e gerar o documento mesmo assim?'
        )
      ) {
        return;
      }
    }

    const finalInvoice = buildInvoiceObject(status);
    onGenerateInvoice(finalInvoice);
  };

  const handleDraftClick = () => {
    const draftInvoice = buildInvoiceObject('Pendente');
    onSaveDraft(draftInvoice);
  };

  const getDocTypeLabel = (t: DocumentType) => {
    switch (t) {
      case 'orcamento':
        return 'Orçamento / Proposta';
      case 'pro-forma':
        return 'Factura Pró-Forma';
      case 'factura-recibo':
        return 'Factura-Recibo';
      case 'recibo':
        return 'Recibo de Pagamento';
      case 'factura':
      default:
        return 'Factura Comercial';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Top Bar com Aviso de Edição e Seletor dos Tipos de Faturas */}
      {editingInvoice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              !
            </div>
            <div>
              <span className="font-bold text-amber-900 text-sm block">
                Modo de Edição do Documento {editingInvoice.number}
              </span>
              <span className="text-xs text-amber-700">
                Altere os dados necessários e clique em Atualizar e Gerar.
              </span>
            </div>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-amber-100"
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      {/* SELETOR PRINCIPAL DO TIPO DE DOCUMENTO (5 Modelos Comerciais e Fiscais de Angola) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0a1e42] text-white flex items-center justify-center font-bold text-xs">
                ★
              </span>
              <h2 className="font-black text-sm sm:text-base text-[#0a1e42] uppercase tracking-wide">
                Tipo de Documento a Emitir
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione o modelo pretendido. A série, prefixo e regras fiscais ajustam-se automaticamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Modelo Ativo:
            </span>
            <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-[#0a1e42] text-[#d49419] border border-slate-800 shadow-2xs">
              {DOC_TYPE_CONFIGS.find((c) => c.id === docType)?.code || 'FT'} • {getDocTypeLabel(docType)}
            </span>
          </div>
        </div>

        {/* Grelha Estruturada dos 5 Tipos de Documento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {DOC_TYPE_CONFIGS.map((cfg) => {
            const isSelected = docType === cfg.id;
            const IconComponent = cfg.icon;

            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => handleDocTypeChange(cfg.id)}
                className={`relative p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between group select-none active:scale-[0.98] ${
                  isSelected
                    ? 'bg-[#0a1e42] text-white border-[#0a1e42]'
                    : 'bg-white hover:bg-slate-50/80 text-slate-700 border-slate-200 hover:border-slate-300 active:bg-slate-100'
                }`}
              >
                {/* Topo do cartão: Código e Indicador de Seleção */}
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-md tracking-wider transition-colors ${
                      isSelected
                        ? 'bg-[#d49419] text-[#0a1e42]'
                        : 'bg-slate-100 text-slate-700 border border-slate-200/80 group-hover:bg-slate-200'
                    }`}
                  >
                    {cfg.code}
                  </span>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#d49419] text-[#0a1e42]'
                        : 'border-2 border-slate-300 group-hover:border-slate-400'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                    )}
                  </div>
                </div>

                {/* Nome e subtítulo estruturados */}
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <IconComponent
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#d49419]' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span
                      className={`text-sm font-black tracking-tight leading-snug ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {cfg.name}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] block font-medium leading-tight ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {cfg.subtitle}
                  </span>
                </div>

                {/* Pequena nota de rodapé no cartão */}
                <div className="mt-3 pt-2 border-t border-dashed border-white/15 dark:border-slate-100">
                  <span
                    className={`text-[10px] block line-clamp-1 leading-tight ${
                      isSelected ? 'text-slate-300/90' : 'text-slate-400'
                    }`}
                  >
                    {cfg.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Barra de Resumo Informativo do Documento Ativo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-bold text-[#0a1e42] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#d49419]" />
              Finalidade:
            </span>
            <span className="text-slate-600">
              {DOC_TYPE_CONFIGS.find((c) => c.id === docType)?.description || ''}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shrink-0">
            Série Ativa: <span className="font-bold text-[#0a1e42]">{number || 'Automática'}</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: Dados do Documento */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#0056d6] text-white flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h2 className="font-black text-sm sm:text-base text-[#0a1e42] uppercase tracking-wide">
              Dados de Identificação do Documento ({getDocTypeLabel(docType)})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Número do documento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Número do Documento
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-mono font-bold text-sm text-slate-800"
              required
            />
          </div>

          {/* Data de Emissão */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Data de Emissão
            </label>
            <div className="relative">
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-800"
                required
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Validade / Vencimento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {docType === 'orcamento' || docType === 'pro-forma'
                ? 'Validade da Proposta'
                : 'Data de Vencimento'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={docType === 'orcamento' || docType === 'pro-forma' ? validityDate : dueDate}
                onChange={(e) => {
                  if (docType === 'orcamento' || docType === 'pro-forma') {
                    setValidityDate(e.target.value);
                  } else {
                    setDueDate(e.target.value);
                  }
                }}
                placeholder="DD/MM/AAAA"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-800"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Estado da Fatura */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Estado do Documento
            </label>
            <Select
              value={status}
              onChange={(v) => setStatus(v as InvoiceStatus)}
              options={[
                { value: 'Pendente', label: docType === 'orcamento' ? 'Pendente de Aprovação' : 'Pendente de Pagamento' },
                { value: 'Paga', label: docType === 'orcamento' ? 'Aprovado pelo Cliente' : 'Pago / Liquidado' },
                { value: 'Cancelada', label: 'Cancelado' },
              ]}
            />
          </div>
        </div>

        {/* Campos Específicos para Pró-Forma / Orçamento / Recibo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Referência / Orçamento N.º
            </label>
            <input
              type="text"
              value={referenceDocNumber}
              onChange={(e) => setReferenceDocNumber(e.target.value)}
              placeholder="ex: REF-2025/08 ou 0001/ORC"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Responsável pela Emissão
            </label>
            <input
              type="text"
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              placeholder="Patricia Segunda"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {docType === 'orcamento' ? 'Prazo de Execução' : 'Prazo de Entrega'}
            </label>
            <input
              type="text"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder="ex: 15 dias após aprovação"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium text-xs sm:text-sm text-slate-800"
            />
          </div>
        </div>

        {/* Forma de Pagamento para Recibo e Orçamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Forma de Pagamento Principal
            </label>
            <Select
              value={paymentMethod}
              onChange={setPaymentMethod}
              options={[
                { value: 'Transferência Bancária', label: 'Transferência Bancária (BAI)' },
                { value: 'Referência Multicaixa', label: 'Referência Multicaixa / Express' },
                { value: 'Depósito Bancário', label: 'Depósito Bancário' },
                { value: 'Dinheiro', label: 'Dinheiro (Numerário)' },
                { value: 'Cheque', label: 'Cheque' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {docType === 'orcamento'
                ? 'Condição de Pagamento da Proposta'
                : 'Local de Entrega / Prestação'}
            </label>
            <input
              type="text"
              value={docType === 'orcamento' ? paymentCondition : deliveryPlace}
              onChange={(e) => {
                if (docType === 'orcamento') setPaymentCondition(e.target.value);
                else setDeliveryPlace(e.target.value);
              }}
              placeholder={
                docType === 'orcamento'
                  ? 'ex: Pagamento integral ou 50% adjudicação + 50% entrega'
                  : 'ex: Instalações do Cliente / Luanda'
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 font-medium"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: Dados do Cliente */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#0056d6] text-white flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h2 className="font-black text-sm sm:text-base text-[#0a1e42] uppercase tracking-wide">
              Dados do Cliente
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {clients.length > 0 && (
              <div className="relative flex-1 sm:w-64">
                <Select
                  value=""
                  onChange={(v) => handleSelectClient(v)}
                  placeholder="Selecionar cliente existente..."
                  options={[
                    ...clients.map((c) => ({
                      value: c.id,
                      label: `${c.name}${c.nif ? ` (${c.nif})` : ''}`,
                    })),
                  ]}
                  icon={<Users className="w-3.5 h-3.5" />}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsQuickClientOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0a1e42] hover:bg-[#07152e] active:bg-[#050e1f] text-white font-bold text-xs transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-[0.98] select-none border border-[#0a1e42]"
            >
              <Plus className="w-3.5 h-3.5 text-[#d49419]" />
              <span>Novo Cliente</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nome do Cliente / Razão Social *
            </label>
            <div className="relative">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="ex: Empresa ABC, Lda ou Dr. Manuel Santos"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-bold text-sm text-slate-800"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              NIF (se aplicável)
            </label>
            <input
              type="text"
              value={clientNif}
              onChange={(e) => setClientNif(e.target.value)}
              placeholder="ex: 5401928471 ou Consumidor Final"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-mono text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="ex: +244 923 111 222"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              E-mail do Cliente
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="ex: contacto@empresa.ao"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Endereço / Localização
            </label>
            <input
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              placeholder="ex: Talatona, Luanda"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: Produtos e Serviços com Detalhamento / Especificação */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#0056d6] text-white flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h2 className="font-black text-sm sm:text-base text-[#0a1e42] uppercase tracking-wide">
              Bens, Serviços & Detalhamento Técnico
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyTax}
                onChange={(e) => {
                  setApplyTax(e.target.checked);
                  const newTax = e.target.checked ? companyInfo.defaultTaxPercent || 14 : 0;
                  setItems((prev) => prev.map((it) => ({ ...it, taxPercent: newTax })));
                }}
                className="w-4 h-4 text-[#0056d6] rounded border-slate-300 focus:ring-[#0056d6]"
              />
              <span>Aplicar IVA 14% aos itens</span>
            </label>

            {products.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-[#0a1e42] font-bold text-xs transition-all duration-150 cursor-pointer active:scale-[0.98] active:bg-slate-100 select-none"
              >
                <Package className="w-4 h-4 text-[#d49419]" />
                <span>Do Catálogo</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0a1e42] hover:bg-[#07152e] active:bg-[#050e1f] text-white font-bold text-xs transition-all duration-150 cursor-pointer active:scale-[0.98] select-none border border-[#0a1e42]"
            >
              <Plus className="w-4 h-4 text-[#d49419]" />
              <span>Linha em Branco</span>
            </button>
          </div>
        </div>

        {/* Tabela de Itens Editável */}
        <div className="space-y-3">
          {items.map((item, index) => {
            const gross = (Number(item.quantity) || 0) * (Number(item.price) || 0);
            const disc = (gross * (Number(item.discountPercent) || 0)) / 100;
            const afterDisc = gross - disc;
            const tax = (afterDisc * (Number(item.taxPercent) || 0)) / 100;
            const lineTotal = afterDisc + tax;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Item #{String(index + 1).padStart(2, '0')}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Remover este item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Descrição Principal */}
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Descrição do Serviço / Bem *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="ex: Assistência em Contabilidade e Auditoria Fiscal"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#0056d6] font-semibold text-xs text-slate-800 bg-white"
                      required
                    />
                  </div>

                  {/* Detalhamento / Especificação (como no modelo físico!) */}
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Detalhamento / Especificação Técnica
                    </label>
                    <input
                      type="text"
                      value={item.specification}
                      onChange={(e) => handleItemChange(item.id, 'specification', e.target.value)}
                      placeholder="ex: Apuramento de IRC, fecho de contas e mapa de amortizações"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#0056d6] text-xs text-slate-700 bg-white"
                    />
                  </div>

                  {/* Quantidade */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Quant.</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, 'quantity', Math.max(1, Number(e.target.value)))
                      }
                      min="1"
                      step="1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#0056d6] font-mono text-center text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* Preço Unitário */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Preço Unitário (Kz) *
                    </label>
                    <input
                      type="number"
                      value={item.price || ''}
                      onChange={(e) =>
                        handleItemChange(item.id, 'price', Math.max(0, Number(e.target.value)))
                      }
                      min="0"
                      step="100"
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#0056d6] font-mono text-right text-xs font-bold text-slate-800 bg-white"
                      required
                    />
                  </div>

                  {/* Desconto */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Desc. (%)
                    </label>
                    <input
                      type="number"
                      value={item.discountPercent}
                      onChange={(e) =>
                        handleItemChange(
                          item.id,
                          'discountPercent',
                          Math.max(0, Math.min(100, Number(e.target.value)))
                        )
                      }
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-center text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* Imposto IVA % */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      IVA (%)
                    </label>
                    <input
                      type="number"
                      value={item.taxPercent}
                      onChange={(e) =>
                        handleItemChange(item.id, 'taxPercent', Math.max(0, Number(e.target.value)))
                      }
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-center text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* Total da Linha */}
                  <div className="sm:col-span-2 flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Total Linha
                    </span>
                    <span className="font-mono font-black text-xs sm:text-sm text-[#0a1e42] py-2">
                      {formatKz(lineTotal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Outro Serviço ou Bem</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO 4 & RESUMO: Observações e Totais lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Observações */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-[#0056d6] text-white flex items-center justify-center font-bold text-xs">
              4
            </span>
            <h2 className="font-black text-sm sm:text-base text-[#0a1e42] uppercase tracking-wide">
              Observações & Informações Adicionais
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Texto impresso na seção de observações do documento A4
          </p>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Indique quaisquer termos específicos, detalhes sobre entregas ou condições contratuais..."
            className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-800 leading-relaxed"
          />
        </div>

        {/* Resumo Financeiro & Botões de Ação */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border-2 border-slate-200/90 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-sm sm:text-base text-[#0a1e42] uppercase tracking-wide">
              Resumo Financeiro
            </h3>
            <span className="text-xs text-slate-500">Total calculado em Kwanzas (Kz)</span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-slate-800">{formatKzDecimal(subtotal)}</span>
            </div>

            {discountTotal > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>Desconto Total:</span>
                <span className="font-mono font-bold">- {formatKzDecimal(discountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-600">
              <span>IVA ({companyInfo.defaultTaxPercent || 14}%):</span>
              <span className="font-mono font-bold text-slate-800">{formatKzDecimal(taxTotal)}</span>
            </div>

            <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-baseline">
              <span className="font-black text-sm sm:text-base text-[#0a1e42] uppercase tracking-wide">
                Total Geral:
              </span>
              <div className="text-right">
                <span className="font-mono font-black text-xl sm:text-2xl text-[#0056d6] block">
                  {formatKz(total)}
                </span>
                <span className="text-[10px] text-slate-400 italic">
                  ({numberToKzWords(total)})
                </span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 space-y-2.5 border-t border-slate-100">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white py-3.5 px-5 rounded-xl font-bold text-sm border border-blue-400/25 transition-all duration-150 cursor-pointer group select-none active:scale-[0.98]"
            >
              <FileCheck className="w-5 h-5 text-white" />
              <span>
                {editingInvoice
                  ? `Atualizar & Emitir ${getDocTypeLabel(docType)}`
                  : `EMITIR ${getDocTypeLabel(docType).toUpperCase()}`}
              </span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>

            {onPreviewInvoice && (
              <button
                type="button"
                onClick={() => {
                  if (!clientName.trim()) {
                    alert('Por favor, introduza o Nome / Razão Social do cliente antes de pré-visualizar.');
                    return;
                  }
                  const previewInv = buildInvoiceObject(status);
                  onPreviewInvoice(previewInv);
                }}
                className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-[#0a1e42] border border-slate-300 py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer select-none active:scale-[0.98]"
              >
                <Eye className="w-4 h-4 text-[#0a1e42]" />
                <span>Pré-visualizar Documento A4</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDraftClick}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer select-none active:scale-[0.98]"
            >
              <span>Guardar como Rascunho / Pendente</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Cadastro Rápido de Novo Cliente */}
      {isQuickClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0a1e42] text-[#d49419] flex items-center justify-center font-bold shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-[#0a1e42]">Cadastrar Novo Cliente</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickClientOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Cliente / Razão Social *
                </label>
                <input
                  type="text"
                  value={quickClientName}
                  onChange={(e) => setQuickClientName(e.target.value)}
                  placeholder="ex: Empresa XPTO, Lda"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#0056d6]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIF</label>
                  <input
                    type="text"
                    value={quickClientNif}
                    onChange={(e) => setQuickClientNif(e.target.value)}
                    placeholder="ex: 5401982736"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:border-[#0056d6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={quickClientPhone}
                    onChange={(e) => setQuickClientPhone(e.target.value)}
                    placeholder="ex: +244 923 000 111"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#0056d6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={quickClientEmail}
                  onChange={(e) => setQuickClientEmail(e.target.value)}
                  placeholder="ex: contacto@empresa.ao"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#0056d6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Endereço / Cidade</label>
                <input
                  type="text"
                  value={quickClientAddress}
                  onChange={(e) => setQuickClientAddress(e.target.value)}
                  placeholder="ex: Talatona, Luanda"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#0056d6]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQuickClientOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuickClient}
                className="px-5 py-2 rounded-xl bg-[#0056d6] hover:bg-[#0047b3] text-white text-xs font-bold"
              >
                Guardar e Selecionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Selecionar do Catálogo de Produtos e Serviços */}
      {isCatalogPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#d49419] flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#0a1e42]">Catálogo de Produtos & Serviços</h3>
                  <p className="text-xs text-slate-500">Clique num item para adicionar à fatura</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pesquisa rápida */}
            <div className="relative">
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Pesquisar por nome ou código..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#0056d6]"
                autoFocus
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Lista dos produtos */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
              {products
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                    (p.code && p.code.toLowerCase().includes(catalogSearch.toLowerCase()))
                )
                .map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleAddProductFromCatalog(product)}
                    className="p-3 hover:bg-slate-100/80 rounded-xl cursor-pointer flex items-center justify-between transition-colors group border border-transparent hover:border-slate-200"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#0056d6]">
                          {product.name}
                        </span>
                        {product.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                            {product.category}
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right pl-3">
                      <span className="font-mono font-black text-xs sm:text-sm text-[#0a1e42] block">
                        {formatKz(product.price)}
                      </span>
                      <span className="text-[10px] text-slate-400">IVA {product.taxPercent ?? 14}%</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCatalogPickerOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
