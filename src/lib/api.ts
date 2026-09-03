import type {
  Client,
  CompanyInfo,
  DocumentType,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  ProductService,
} from '../types';

/**
 * Base URL do ERP da Nobug Labs.
 *
 * - Produção (Vercel/HTTPS): a app chama SEMPRE o mesmo-origin `/api/*`, que o
 *   `vercel.json` faz proxy para o ERP. Isto evita mixed content e CORS, e
 *   ignora qualquer VITE_ERP_BASE_URL que apenas serviria para apontar
 *   diretamente para o IP (o que falha em HTTPS).
 * - Desenvolvimento local: liga diretamente ao ERP (via env ou default).
 */
export const ERP_DEV_BASE_URL = (
  import.meta.env.VITE_ERP_BASE_URL || 'http://3.92.235.72'
).replace(/\/+$/, '');

export const ERP_BASE_URL = import.meta.env.PROD ? '' : ERP_DEV_BASE_URL;
export const ERP_VIA_PROXY = import.meta.env.PROD;

const TOKEN_KEY = 'ps_faturas_erp_token';
const USER_KEY = 'ps_faturas_erp_user';

// ---------------------------------------------------------------------------
// Token / auth helpers
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getUser(): any | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user: any | null): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function clearAuth(): void {
  setToken(null);
  setUser(null);
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${ERP_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = await res.json();
      detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err);
    } catch {
      // ignore
    }
    throw new Error(`${res.status}: ${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginResult {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserRead {
  id: string;
  company_id: string;
  username: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export async function login(username: string, password: string): Promise<UserRead> {
  const res = await request<LoginResult>('/api/v1/auth/login', {
    method: 'POST',
    body: { username, password },
    auth: false,
  });
  setToken(res.access_token);
  const me = await getMe();
  setUser(me);
  return me;
}

export async function getMe(): Promise<UserRead> {
  return request<UserRead>('/api/v1/auth/me');
}

// ---------------------------------------------------------------------------
// Types (ERP payloads)
// ---------------------------------------------------------------------------

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export type ErpVatRate = '14' | '5' | '0' | 'EX' | 'NS';

export interface ErpClient {
  id: string;
  partner_type: 'PARTICULAR' | 'EMPRESA';
  name: string;
  nif: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  municipality?: string | null;
  province?: string | null;
  country?: string | null;
  price_list: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export interface ErpProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  unit_id: string | null;
  cost_price: string;
  sale_price: string;
  discount_price: string | null;
  vat_rate: ErpVatRate;
  is_exempt: boolean;
  is_service: boolean;
  is_active: boolean;
  variants: Array<{ id: string; name: string; sale_price: string }>;
  created_at: string;
}

export interface ErpSaleItem {
  id: string;
  line_number: number;
  description: string;
  quantity: string;
  unit_price: string;
  discount_percent: string;
  vat_rate: ErpVatRate;
  line_total: string;
  vat_amount: string;
  line_total_with_vat: string;
}

export interface ErpPayment {
  id: string;
  sale_id: string;
  amount: string;
  payment_method: string;
  payment_date: string;
  reference: string | null;
  notes: string | null;
}

export type ErpDocumentType =
  | 'ORCAMENTO'
  | 'PROFORMA'
  | 'ENCOMENDA'
  | 'GUIA'
  | 'FACTURA'
  | 'FACTURA_RECIBO'
  | 'RECIBO'
  | 'NOTA_CREDITO'
  | 'NOTA_DEBITO';

export type ErpDocumentStatus =
  | 'RASCUNHO'
  | 'EMITIDO'
  | 'ANULADO'
  | 'PARCIALMENTE_PAGO'
  | 'PAGO'
  | 'VENCIDO';

export interface ErpSale {
  id: string;
  company_id: string;
  client_id: string | null;
  project_id: string | null;
  document_type: ErpDocumentType;
  status: ErpDocumentStatus;
  document_number: string | null;
  issue_date: string;
  due_date: string | null;
  subtotal: string;
  discount_amount: string;
  vat_amount: string;
  retention_amount: string;
  total: string;
  amount_paid: string;
  amount_due: string;
  hash: string | null;
  previous_hash: string | null;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  items: ErpSaleItem[];
  payments: ErpPayment[];
}

export interface DashboardSummary {
  sales_today: string;
  sales_this_month: string;
  estimated_profit: string;
  accounts_receivable: string;
  accounts_payable: string;
  stock_value: string;
  low_stock_count: number;
  clients_count: number;
  open_invoices: number;
  total_invoices_issued: number;
  total_invoices_cancelled: number;
  pending_documents: number;
}

export interface ErpUnit {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Mappers: ERP -> internal types
// ---------------------------------------------------------------------------

const DOC_TYPE_MAP: Record<ErpDocumentType, DocumentType> = {
  ORCAMENTO: 'orcamento',
  PROFORMA: 'pro-forma',
  ENCOMENDA: 'factura',
  GUIA: 'factura',
  FACTURA: 'factura',
  FACTURA_RECIBO: 'factura-recibo',
  RECIBO: 'recibo',
  NOTA_CREDITO: 'factura',
  NOTA_DEBITO: 'factura',
};

const INVERSE_DOC_TYPE_MAP: Record<DocumentType, ErpDocumentType> = {
  orcamento: 'ORCAMENTO',
  'pro-forma': 'PROFORMA',
  factura: 'FACTURA',
  'factura-recibo': 'FACTURA_RECIBO',
  recibo: 'RECIBO',
};

export function mapErpStatus(status: ErpDocumentStatus): InvoiceStatus {
  switch (status) {
    case 'PAGO':
      return 'Paga';
    case 'PARCIALMENTE_PAGO':
    case 'EMITIDO':
      return 'Pendente';
    case 'VENCIDO':
      return 'Vencida';
    case 'ANULADO':
      return 'Cancelada';
    case 'RASCUNHO':
    default:
      return 'Rascunho';
  }
}

export function mapStatusToErp(status: InvoiceStatus): ErpDocumentStatus {
  switch (status) {
    case 'Paga':
      return 'PAGO';
    case 'Vencida':
      return 'VENCIDO';
    case 'Cancelada':
      return 'ANULADO';
    case 'Rascunho':
      return 'RASCUNHO';
    case 'Pendente':
    default:
      return 'EMITIDO';
  }
}

function toNumber(str?: string | null): number {
  const n = parseFloat(str || '');
  return isNaN(n) ? 0 : n;
}

export function mapErpClient(c: ErpClient): Client {
  return {
    id: c.id,
    name: c.name,
    nif: c.nif || '',
    email: c.email || '',
    phone: c.phone || '',
    address: c.address || '',
    city: c.municipality || c.province || 'Luanda',
    invoicesCount: 0,
    totalInvoiced: 0,
  };
}

export function mapErpProduct(p: ErpProduct): ProductService {
  const isService = p.is_service;
  return {
    id: p.id,
    name: p.name,
    code: p.sku,
    category: isService ? 'Serviço' : 'Produto',
    type: isService ? 'Serviço' : 'Produto',
    price: toNumber(p.sale_price),
    taxPercent: erpVatToPercent(p.vat_rate),
    unit: 'un',
    description: p.description || '',
  };
}

export function erpVatToPercent(vat: ErpVatRate | undefined): number {
  switch (vat) {
    case '5':
      return 5;
    case '0':
    case 'EX':
    case 'NS':
      return 0;
    case '14':
    default:
      return 14;
  }
}

export function percentToErpVat(pct: number): ErpVatRate {
  if (pct <= 0) return '0';
  if (pct <= 5) return '5';
  return '14';
}

export function mapErpSale(s: ErpSale): Invoice {
  const items: InvoiceItem[] = (s.items || []).map((it) => ({
    id: it.id,
    description: it.description,
    specification: '',
    quantity: toNumber(it.quantity),
    price: toNumber(it.unit_price),
    discountPercent: toNumber(it.discount_percent),
    taxPercent: erpVatToPercent(it.vat_rate),
    total: toNumber(it.line_total_with_vat),
  }));

  return {
    id: s.id,
    docType: DOC_TYPE_MAP[s.document_type] || 'factura',
    number: s.document_number || s.document_type,
    clientName: '',
    clientNif: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    date: s.issue_date,
    dueDate: s.due_date || s.issue_date,
    status: mapErpStatus(s.status),
    items,
    subtotal: toNumber(s.subtotal),
    discountTotal: toNumber(s.discount_amount),
    taxTotal: toNumber(s.vat_amount),
    total: toNumber(s.total),
    currency: 'Kz',
    notes: s.notes || '',
    createdAt: s.created_at,
  };
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export async function listClients(search = '', page = 1, pageSize = 100): Promise<Client[]> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set('search', search);
  const data = await request<Page<ErpClient>>(`/api/v1/clients?${params.toString()}`);
  return (data.items || []).filter((c) => c.active).map(mapErpClient);
}

export async function createClient(data: Partial<Client>): Promise<Client> {
  const payload = {
    partner_type: 'EMPRESA',
    name: data.name,
    nif: data.nif || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    municipality: data.city && data.city !== 'Luanda' ? data.city : null,
    province: null,
    country: 'Angola',
    active: true,
  };
  const created = await request<ErpClient>('/api/v1/clients', { method: 'POST', body: payload });
  return mapErpClient(created);
}

export async function updateClient(clientId: string, data: Partial<Client>): Promise<Client> {
  const payload = {
    name: data.name,
    nif: data.nif || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    municipality: data.city && data.city !== 'Luanda' ? data.city : null,
  };
  const updated = await request<ErpClient>(`/api/v1/clients/${clientId}`, {
    method: 'PATCH',
    body: payload,
  });
  return mapErpClient(updated);
}

export async function deactivateClient(clientId: string): Promise<void> {
  await request<ErpClient>(`/api/v1/clients/${clientId}`, {
    method: 'PATCH',
    body: { active: false },
  });
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function listProducts(search = '', page = 1, pageSize = 100): Promise<ProductService[]> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (search) params.set('search', search);
  const data = await request<Page<ErpProduct>>(`/api/v1/products?${params.toString()}`);
  return (data.items || []).filter((p) => p.is_active).map(mapErpProduct);
}

export async function createProduct(data: Partial<ProductService>): Promise<ProductService> {
  const isService = (data.category || data.type) === 'Serviço';
  const payload = {
    sku: data.code || `SKU-${Date.now()}`,
    name: data.name,
    description: data.description || null,
    sale_price: String(data.price || 0),
    cost_price: '0',
    vat_rate: percentToErpVat(data.taxPercent ?? 14),
    is_service: isService,
    is_active: true,
  };
  const created = await request<ErpProduct>('/api/v1/products', { method: 'POST', body: payload });
  return mapErpProduct(created);
}

export async function updateProduct(productId: string, data: Partial<ProductService>): Promise<ProductService> {
  const isService = (data.category || data.type) === 'Serviço';
  const payload = {
    name: data.name,
    description: data.description || null,
    sale_price: String(data.price ?? 0),
    vat_rate: percentToErpVat(data.taxPercent ?? 14),
    is_service: isService,
    is_active: true,
  };
  const updated = await request<ErpProduct>(`/api/v1/products/${productId}`, {
    method: 'PATCH',
    body: payload,
  });
  return mapErpProduct(updated);
}

export async function deactivateProduct(productId: string): Promise<void> {
  await request<ErpProduct>(`/api/v1/products/${productId}`, {
    method: 'PATCH',
    body: { is_active: false },
  });
}

// ---------------------------------------------------------------------------
// Sales (invoices)
// ---------------------------------------------------------------------------

export async function listSales(page = 1, pageSize = 100): Promise<ErpSale[]> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  const data = await request<Page<ErpSale>>(`/api/v1/sales?${params.toString()}`);
  const firstPageItems = data.items || [];

  // O ERP pagina os resultados. Sem carregar as páginas seguintes, faturas
  // mais antigas desaparecem e a lista parece incompleta/corrompida.
  const remainingPages = Math.max(0, (data.pages || 1) - page);
  if (!remainingPages) return firstPageItems;

  const pages = await Promise.all(
    Array.from({ length: remainingPages }, (_, index) => {
      const nextPage = page + index + 1;
      const nextParams = new URLSearchParams({
        page: String(nextPage),
        page_size: String(pageSize),
      });
      return request<Page<ErpSale>>(`/api/v1/sales?${nextParams.toString()}`);
    })
  );

  return firstPageItems.concat(...pages.map((result) => result.items || []));
}

export async function getSale(saleId: string): Promise<ErpSale> {
  return request<ErpSale>(`/api/v1/sales/${saleId}`);
}

export async function createSale(invoice: Invoice, clientId?: string | null): Promise<ErpSale> {
  const payload = {
    document_type: INVERSE_DOC_TYPE_MAP[invoice.docType || 'factura'],
    client_id: clientId || null,
    issue_date: toErpDate(invoice.date),
    due_date: invoice.dueDate ? toErpDate(invoice.dueDate) : null,
    discount_amount: String(invoice.discountTotal || 0),
    notes: invoice.notes || null,
    items: invoice.items.map((it) => ({
      description: it.description,
      quantity: String(it.quantity),
      unit_price: String(it.price),
      discount_percent: String(it.discountPercent || 0),
      vat_rate: percentToErpVat(it.taxPercent ?? 14),
    })),
  };
  return request<ErpSale>('/api/v1/sales', { method: 'POST', body: payload });
}

export async function issueSale(saleId: string): Promise<ErpSale> {
  return request<ErpSale>(`/api/v1/sales/${saleId}/issue`, { method: 'POST', body: {} });
}

export async function paySale(
  saleId: string,
  amount: number,
  method = 'DINHEIRO',
  reference?: string
): Promise<ErpPayment> {
  return request<ErpPayment>(`/api/v1/sales/${saleId}/pay`, {
    method: 'POST',
    body: { amount: String(amount), payment_method: method, reference: reference || null },
  });
}

export async function cancelSale(saleId: string, reason: string): Promise<ErpSale> {
  return request<ErpSale>(`/api/v1/sales/${saleId}/cancel`, {
    method: 'POST',
    body: { reason },
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardRead {
  summary: DashboardSummary;
  sales_trend: Array<{ date: string; total: string }>;
  top_products: Array<{ product_id: string; product_name: string; quantity: string; revenue: string }>;
}

export async function getDashboard(): Promise<DashboardRead> {
  return request<DashboardRead>('/api/v1/dashboard');
}

// ---------------------------------------------------------------------------
// Company (mapped from the authenticated user context; kept local)
// ---------------------------------------------------------------------------

export function mapCompanyFromUser(user: UserRead | null, fallback: CompanyInfo): CompanyInfo {
  if (!user) return fallback;
  return {
    ...fallback,
    name: user.full_name || fallback.name,
    email: user.email || fallback.email,
  };
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Convert an ERP "YYYY-MM-DD" (or ISO) string to the app's "DD/MM/YYYY" format. */
export function toAppDate(value?: string): string {
  if (!value) return '';
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

/** Convert the app's "DD/MM/YYYY" (or ISO) string to ERP "YYYY-MM-DD". */
export function toErpDate(value?: string): string {
  if (!value) return '';
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}
