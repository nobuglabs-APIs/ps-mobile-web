export type DocumentType =
  | 'factura'
  | 'pro-forma'
  | 'factura-recibo'
  | 'orcamento'
  | 'recibo';

export type InvoiceStatus = 'Paga' | 'Pendente' | 'Vencida' | 'Rascunho' | 'Cancelada';

export interface InvoiceItem {
  id: string;
  description: string;
  specification?: string; // Detalhamento / Especificação
  quantity: number;
  price: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
}

export interface Invoice {
  id: string;
  docType?: DocumentType;
  number: string;
  clientName: string;
  clientNif: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  date: string; // DD/MM/YYYY
  dueDate: string; // DD/MM/YYYY
  validityDate?: string; // Validade da Proposta / Orçamento
  referenceDocNumber?: string; // Referência / Orçamento N.º
  responsibleName?: string; // Responsável pela emissão
  deliveryTime?: string; // Prazo de execução / entrega
  deliveryPlace?: string; // Local de entrega / prestação
  paymentCondition?: string; // Forma de pagamento (Integral / 50% adjudicação + 50% entrega / Outra)
  amountInWords?: string; // Valor por extenso (para Recibos)
  receiptReceivedFrom?: string; // Recebi de (para Recibo)
  receiptReference?: string; // Referente ao pagamento de (para Recibo)
  paymentMethod?: string; // Dinheiro, Depósito Bancário, Transferência Bancária, Multicaixa, etc.
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  notes: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  totalInvoiced?: number;
  invoicesCount?: number;
}

export interface ProductService {
  id: string;
  name: string;
  code?: string;
  category: 'Serviço' | 'Produto';
  type?: 'Serviço' | 'Produto';
  price: number;
  taxPercent: number;
  unit?: string;
  description?: string;
}

export interface CompanyInfo {
  name: string;
  commercialName: string;
  slogan: string;
  subSlogan: string;
  nif: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  iban: string;
  accountNumber: string;
  swift: string;
  currency: string;
  defaultTaxPercent: number;
  invoicePrefix: string;
  proformaPrefix?: string;
  receiptPrefix?: string;
  budgetPrefix?: string;
  invoiceReceiptPrefix?: string;
  defaultNotes: string;
  defaultConditions: string;
  logoUrl?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'faturas'
  | 'nova-fatura'
  | 'clientes'
  | 'produtos'
  | 'definicoes'
  | 'historico'
  | 'configuracoes';

