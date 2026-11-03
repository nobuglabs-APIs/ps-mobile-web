import {
  deleteResource,
  request,
  requestFile,
  uploadFiles,
  type LoginChallenge,
  type TokenResponse,
} from './client';

export type Page<T> = {
  items: T[];
  page: number;
  per_page: number;
  total: number;
};

export type Membership = {
  workspace_id: string;
  workspace_name: string;
  role: 'owner' | 'manager' | 'seller';
};

export type UserProfile = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  email_verified: boolean;
  pending_email: string | null;
  is_admin: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  notify_whatsapp: boolean;
  notify_push: boolean;
  workspaces: Membership[];
};

export type Workspace = {
  id: string;
  name: string;
  currency: string;
  cash_control: boolean;
  logo_url: string | null;
  trial_ends_at: string;
  is_active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  code: string | null;
  price_cents: number;
  cost_cents: number;
  track_stock: boolean;
  stock_quantity: number;
  min_stock: number;
  pinned: boolean;
  is_active: boolean;
  cover_url: string | null;
  image_count: number;
  tax_code: string;
  tax_percentage_bps: number;
  tax_exemption_code: string | null;
  created_at: string;
};

export type ProductImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  position: number;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerInput = {
  name: string;
  tax_id?: string;
  address?: string;
  phone?: string;
  email?: string;
};

export type ProductInput = {
  name: string;
  code?: string;
  price_cents: number;
  cost_cents: number;
  track_stock: boolean;
  min_stock: number;
  initial_stock: number;
  pinned: boolean;
  tax_code: string;
  tax_percentage_bps: number;
  tax_exemption_code?: string;
};

export type Sale = {
  id: string;
  number: number;
  status: 'paid' | 'cancelled';
  total_cents: number;
  payment_method: string;
  customer_id: string | null;
  cash_session_id: string | null;
  created_by: string;
  created_at: string;
  cancelled_at: string | null;
};

export type SaleItem = {
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  tax_code: string;
  tax_percentage_bps: number;
  tax_exemption_code: string | null;
};

export type SaleDetail = Sale & { items: SaleItem[] };

export type InvoiceDocument = {
  id: string;
  doc_type: 'invoice' | 'receipt' | 'credit_note' | 'debit_note';
  series: string;
  number: number;
  display_number: string;
  status: string;
  customer_name: string;
  customer_tax_id: string | null;
  customer_address: string | null;
  currency: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  hash: string;
  hash_control: string;
  source_document_id: string | null;
  sale_id: string | null;
  billing_charge_id: string | null;
  issued_at: string;
  cancelled_at: string | null;
  created_by: string;
};

export type InvoiceLine = {
  line_number: number;
  product_code: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  tax_type: string;
  tax_code: string;
  tax_percentage_bps: number;
  tax_exemption_code: string | null;
  tax_base_cents: number;
  tax_amount_cents: number;
  line_total_cents: number;
};

export type InvoiceDetail = InvoiceDocument & { lines: InvoiceLine[] };

export type FiscalSettings = {
  workspace_id: string;
  company_name: string | null;
  tax_id: string | null;
  address: string | null;
  city: string;
  country: string;
  phone: string | null;
  email: string | null;
  software_validation_number: string | null;
  product_id: string;
  product_version: string;
  invoice_prefix: string;
  credit_note_prefix: string;
  default_tax_code: string;
  default_tax_percentage_bps: number;
  hash_control: string;
  updated_at: string;
};

export type Summary = {
  from: string;
  to: string;
  sales_count: number;
  revenue_cents: number;
  estimated_profit_cents: number;
  by_payment_method: Array<{ payment_method: string; total_cents: number }>;
  top_products: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    revenue_cents: number;
  }>;
};

export type TwoFactorStatus = {
  enabled: boolean;
  required: boolean;
  required_at: string;
};

export type Plan = {
  code: string;
  name: string;
  description: string | null;
  kind: string;
  price_cents: number;
  currency: string;
  usage_percent_bps: number;
  trial_days: number;
  features: unknown;
  is_active: boolean;
  sort_order: number;
};

export type Charge = {
  id: string;
  workspace_id: string;
  subscription_id: string | null;
  kind: string;
  plan_code: string | null;
  description: string;
  amount_cents: number;
  currency: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  workspace_id: string;
  plan_code: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
};

export type BillingOverview = {
  workspace_id: string;
  status: string;
  trial_ends_at: string;
  trial_days_left: number;
  can_write: boolean;
  plan: Plan | null;
  subscription: Subscription | null;
  outstanding_cents: number;
  charges: Charge[];
};

export type NotificationPreferences = {
  notify_email: boolean;
  notify_sms: boolean;
  notify_whatsapp: boolean;
  notify_push: boolean;
};

export type AdminOverview = {
  users: number;
  active_users: number;
  workspaces: number;
  active_workspaces: number;
  active_subscriptions: number;
  revenue_cents: number;
  outstanding_cents: number;
  sales_30d: number;
};

export type AdminUser = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  workspace_count: number;
};

export type AdminWorkspace = {
  id: string;
  name: string;
  owner_id: string;
  owner_email: string | null;
  is_active: boolean;
  trial_ends_at: string;
  created_at: string;
  member_count: number;
  plan_code: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
};

export type AdminPlan = Plan & {
  created_at: string;
  updated_at: string;
};

export type AdminPayment = {
  id: string;
  workspace_id: string;
  charge_id: string | null;
  provider: string;
  payer_phone: string | null;
  provider_ref: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  external_url: string | null;
  metadata: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
};

export function getAdminOverview() {
  return request<AdminOverview>('/admin/overview');
}

export function listAdminUsers(q = '') {
  const search = new URLSearchParams({ per_page: '100' });
  if (q.trim()) search.set('q', q.trim());
  return request<Page<AdminUser>>(`/admin/users?${search}`);
}

export function updateAdminUser(id: string, input: Partial<Pick<AdminUser, 'is_active' | 'is_admin'>>) {
  return request<AdminUser>(`/admin/users/${id}`, { method: 'PATCH', body: input });
}

export function listAdminWorkspaces(q = '') {
  const search = new URLSearchParams({ per_page: '100' });
  if (q.trim()) search.set('q', q.trim());
  return request<Page<AdminWorkspace>>(`/admin/workspaces?${search}`);
}

export function updateAdminWorkspace(
  id: string,
  input: { is_active?: boolean; trial_days?: number; plan_code?: string; period_days?: number },
) {
  return request<AdminWorkspace>(`/admin/workspaces/${id}`, { method: 'PATCH', body: input });
}

export function listAdminPlans() {
  return request<AdminPlan[]>('/admin/plans');
}

export function updateAdminPlan(
  code: string,
  input: Partial<Pick<AdminPlan, 'name' | 'description' | 'price_cents' | 'usage_percent_bps' | 'is_active' | 'sort_order'>>,
) {
  return request<AdminPlan>(`/admin/plans/${encodeURIComponent(code)}`, { method: 'PATCH', body: input });
}

export function listAdminPayments() {
  return request<Page<AdminPayment>>('/admin/payments?per_page=100');
}

export function listAdminCharges() {
  return request<Page<Charge>>('/admin/charges?per_page=100');
}

type Registration = {
  user_id: string;
  workspace_id: string;
  tokens: TokenResponse;
  email_verification_token?: string;
};

export function login(email: string, password: string) {
  return request<TokenResponse | LoginChallenge>('/auth/login', {
    method: 'POST',
    authenticated: false,
    body: { email, password },
  });
}

export function verifyLogin(challenge_id: string, code: string) {
  return request<TokenResponse>('/auth/login/verify', {
    method: 'POST',
    authenticated: false,
    body: { challenge_id, code },
  });
}

export function register(input: {
  full_name: string;
  email: string;
  password: string;
  workspace_name: string;
}) {
  return request<Registration>('/auth/register', {
    method: 'POST',
    authenticated: false,
    body: input,
  });
}

export function verifyEmail(token: string) {
  return request<void>('/auth/email/verify', {
    method: 'POST',
    authenticated: false,
    body: { token },
  });
}

export function resendEmailVerification(email: string) {
  return request<{ message: string; debug_token?: string }>('/auth/email/resend', {
    method: 'POST',
    authenticated: false,
    body: { email },
  });
}

export function getMe() {
  return request<UserProfile>('/auth/me');
}

export function getWorkspace(id: string) {
  return request<Workspace>(`/workspaces/${id}`);
}

export function createWorkspace(name: string) {
  return request<Workspace>('/workspaces', { method: 'POST', body: { name } });
}

export function updateWorkspace(
  id: string,
  input: Partial<Pick<Workspace, 'name' | 'currency' | 'cash_control'>>,
) {
  return request<Workspace>(`/workspaces/${id}`, { method: 'PATCH', body: input });
}

export function uploadAvatar(file: File) {
  return uploadFiles<{ url: string }>('/auth/me/avatar', [file], 'PUT');
}

export function deleteAvatar() {
  return deleteResource('/auth/me/avatar');
}

export function uploadWorkspaceLogo(workspaceId: string, file: File) {
  return uploadFiles<{ url: string }>(`/workspaces/${workspaceId}/logo`, [file], 'PUT');
}

export function deleteWorkspaceLogo(workspaceId: string) {
  return deleteResource(`/workspaces/${workspaceId}/logo`);
}

export function changePassword(current_password: string, new_password: string) {
  return request<void>('/auth/change-password', {
    method: 'POST',
    body: { current_password, new_password },
  });
}

export function requestEmailChange(email: string) {
  return request<{ email: string; expires_in_secs: number; debug_token?: string }>('/auth/me/email/request', {
    method: 'POST',
    body: { email },
  });
}

export function verifyEmailChange(token: string) {
  return request<void>('/auth/email/change/verify', { method: 'POST', body: { token } });
}

export function getSummary(workspaceId: string) {
  return request<Summary>(`/workspaces/${workspaceId}/reports/summary`);
}

export function listProducts(workspaceId: string, page = 1) {
  return request<Page<Product>>(
    `/workspaces/${workspaceId}/products?page=${page}&per_page=100`,
  );
}

export function createProduct(workspaceId: string, input: ProductInput) {
  return request<Product>(`/workspaces/${workspaceId}/products`, {
    method: 'POST',
    body: input,
  });
}

export function updateProduct(workspaceId: string, id: string, input: ProductInput) {
  return request<Product>(`/workspaces/${workspaceId}/products/${id}`, {
    method: 'PUT',
    body: input,
  });
}

export function deactivateProduct(workspaceId: string, id: string) {
  return request<void>(`/workspaces/${workspaceId}/products/${id}`, {
    method: 'DELETE',
  });
}

export function adjustStock(
  workspaceId: string,
  id: string,
  input: { delta: number; reason: 'adjustment' | 'purchase'; note?: string },
) {
  return request<Product>(`/workspaces/${workspaceId}/products/${id}/stock`, {
    method: 'POST',
    body: input,
  });
}

export function listCustomers(workspaceId: string, q = '', page = 1) {
  const search = new URLSearchParams({ page: String(page), per_page: '100' });
  if (q.trim()) search.set('q', q.trim());
  return request<Page<Customer>>(`/workspaces/${workspaceId}/customers?${search}`);
}

export function createCustomer(workspaceId: string, input: CustomerInput) {
  return request<Customer>(`/workspaces/${workspaceId}/customers`, { method: 'POST', body: input });
}

export function updateCustomer(workspaceId: string, id: string, input: CustomerInput) {
  return request<Customer>(`/workspaces/${workspaceId}/customers/${id}`, { method: 'PUT', body: input });
}

export function archiveCustomer(workspaceId: string, id: string) {
  return deleteResource(`/workspaces/${workspaceId}/customers/${id}`);
}

export function uploadProductImages(workspaceId: string, productId: string, files: File[]) {
  return uploadFiles<ProductImage[]>(`/workspaces/${workspaceId}/products/${productId}/images`, files);
}

export function listProductImages(workspaceId: string, productId: string) {
  return request<ProductImage[]>(`/workspaces/${workspaceId}/products/${productId}/images`);
}

export function deleteProductImage(workspaceId: string, productId: string, imageId: string) {
  return deleteResource(`/workspaces/${workspaceId}/products/${productId}/images/${imageId}`);
}

export function setProductImageCover(workspaceId: string, productId: string, imageId: string) {
  return request<void>(`/workspaces/${workspaceId}/products/${productId}/images/${imageId}/cover`, {
    method: 'PUT',
  });
}

export function listSales(workspaceId: string, page = 1) {
  return request<Page<Sale>>(
    `/workspaces/${workspaceId}/sales?page=${page}&per_page=100`,
  );
}

export function createSale(
  workspaceId: string,
  input: {
    items: Array<{ product_id: string; quantity: number }>;
    payment_method: string;
    customer_id?: string;
  },
) {
  return request<SaleDetail>(`/workspaces/${workspaceId}/sales`, {
    method: 'POST',
    body: input,
  });
}

export type CashSession = {
  id: string;
  opened_by: string;
  opening_float_cents: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  expected_cents: number | null;
  counted_cents: number | null;
  difference_cents: number | null;
  note: string | null;
};

export type CashSummary = CashSession & {
  cash_sales_cents: number;
  deposits_cents: number;
  expenses_cents: number;
  withdrawals_cents: number;
  current_expected_cents: number;
};

export type CashMovement = {
  id: string;
  kind: 'expense' | 'withdrawal' | 'deposit';
  amount_cents: number;
  note: string | null;
  created_at: string;
};

export function getCurrentCash(workspaceId: string) {
  return request<CashSummary>(`/workspaces/${workspaceId}/cash/sessions/current`);
}

export function openCash(workspaceId: string, opening_float_cents: number) {
  return request<CashSession>(`/workspaces/${workspaceId}/cash/sessions`, { method: 'POST', body: { opening_float_cents } });
}

export function addCashMovement(workspaceId: string, input: { kind: CashMovement['kind']; amount_cents: number; note?: string }) {
  return request<CashMovement>(`/workspaces/${workspaceId}/cash/sessions/current/movements`, { method: 'POST', body: input });
}

export function closeCash(workspaceId: string, counted_cents: number, note?: string) {
  return request<CashSummary>(`/workspaces/${workspaceId}/cash/sessions/current/close`, { method: 'POST', body: { counted_cents, note } });
}

export function listCashSessions(workspaceId: string) {
  return request<Page<CashSession>>(`/workspaces/${workspaceId}/cash/sessions?per_page=50`);
}

export type WorkspaceMember = {
  user_id: string;
  full_name: string;
  email: string | null;
  role: 'owner' | 'manager' | 'seller';
  is_active: boolean;
};

export type Invitation = {
  id: string;
  role: 'manager' | 'seller';
  email: string | null;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

export function listWorkspaceMembers(workspaceId: string) {
  return request<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
}

export function updateWorkspaceMember(workspaceId: string, id: string, input: { role?: 'manager' | 'seller'; is_active?: boolean }) {
  return request<WorkspaceMember>(`/workspaces/${workspaceId}/members/${id}`, { method: 'PATCH', body: input });
}

export function listInvitations(workspaceId: string) {
  return request<Invitation[]>(`/workspaces/${workspaceId}/invitations`);
}

export function createInvitation(workspaceId: string, role: 'manager' | 'seller', email?: string) {
  return request<{ id: string; code: string; role: string; expires_at: string }>(`/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    body: { role, email },
  });
}

export function revokeInvitation(workspaceId: string, id: string) {
  return deleteResource(`/workspaces/${workspaceId}/invitations/${id}`);
}

export function acceptInvitation(code: string) {
  return request<Workspace>('/invitations/accept', {
    method: 'POST',
    body: { code },
  });
}

export function cancelSale(workspaceId: string, id: string) {
  return request<SaleDetail>(`/workspaces/${workspaceId}/sales/${id}/cancel`, {
    method: 'POST',
  });
}

export function listInvoices(workspaceId: string, page = 1) {
  return request<Page<InvoiceDocument>>(
    `/workspaces/${workspaceId}/invoices?page=${page}&per_page=100`,
  );
}

export function getInvoice(workspaceId: string, id: string) {
  return request<InvoiceDetail>(`/workspaces/${workspaceId}/invoices/${id}`);
}

export function createCreditNote(workspaceId: string, id: string, reason: string) {
  return request<InvoiceDetail>(
    `/workspaces/${workspaceId}/invoices/${id}/credit-note`,
    { method: 'POST', body: { reason } },
  );
}

export function getFiscalSettings(workspaceId: string) {
  return request<FiscalSettings>(`/workspaces/${workspaceId}/fiscal/settings`);
}

export function updateFiscalSettings(
  workspaceId: string,
  input: Partial<Omit<FiscalSettings, 'workspace_id' | 'updated_at'>>,
) {
  return request<FiscalSettings>(`/workspaces/${workspaceId}/fiscal/settings`, {
    method: 'PUT',
    body: input,
  });
}

export function downloadSaft(workspaceId: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.size ? `?${params}` : '';
  return requestFile(`/workspaces/${workspaceId}/fiscal/saft${query}`);
}

export function listPlans() {
  return request<Plan[]>('/billing/plans');
}

export function getBillingOverview(workspaceId: string) {
  return request<BillingOverview>(`/workspaces/${workspaceId}/billing`);
}

export function startCheckout(workspaceId: string, plan_code: string, provider: string, payer_phone?: string) {
  return request<{
    charge: Charge | null;
    payment: { external_url: string | null; status: string } | null;
    subscription: Subscription | null;
  }>(`/workspaces/${workspaceId}/billing/checkout`, {
    method: 'POST',
    body: { plan_code, provider, payer_phone },
  });
}

export function payCharge(workspaceId: string, chargeId: string, provider: string, payer_phone?: string) {
  return request<{ external_url: string | null; status: string }>(
    `/workspaces/${workspaceId}/billing/charges/${chargeId}/pay`,
    { method: 'POST', body: { provider, payer_phone } },
  );
}

export function cancelSubscription(workspaceId: string) {
  return request<Subscription>(`/workspaces/${workspaceId}/billing/cancel`, { method: 'POST' });
}

export function getNotificationPreferences() {
  return request<NotificationPreferences>('/notifications/preferences');
}

export function updateNotificationPreferences(input: Partial<NotificationPreferences>) {
  return request<NotificationPreferences>('/notifications/preferences', { method: 'PUT', body: input });
}

export function getTwoFactorStatus() {
  return request<TwoFactorStatus>('/auth/me/two-factor');
}

export function setupTwoFactor() {
  return request<LoginChallenge>('/auth/me/two-factor/setup', { method: 'POST' });
}

export function enableTwoFactor(challenge_id: string, code: string) {
  return request<void>('/auth/me/two-factor/enable', {
    method: 'POST',
    body: { challenge_id, code },
  });
}

export function requestTwoFactorDisable() {
  return request<LoginChallenge>('/auth/me/two-factor/disable/request', { method: 'POST' });
}

export function disableTwoFactor(challenge_id: string, code: string) {
  return request<void>('/auth/me/two-factor/disable', {
    method: 'POST',
    body: { challenge_id, code },
  });
}

export function logout(refresh_token: string) {
  return request<void>('/auth/logout', {
    method: 'POST',
    body: { refresh_token },
    retry: false,
  });
}
