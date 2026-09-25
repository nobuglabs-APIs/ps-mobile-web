/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  initialCompanyInfo,
} from './data/initialData';
import {
  Invoice,
  CompanyInfo,
  ActiveTab,
  DocumentType,
  InvoiceStatus,
  Client,
  ProductService,
} from './types';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { TypeSelectorSheet } from './components/TypeSelectorSheet';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { InvoicesView } from './components/InvoicesView';
import { InvoiceFormView } from './components/InvoiceFormView';
import { InvoiceA4View } from './components/InvoiceA4View';
import { InvoiceSuccessView } from './components/InvoiceSuccessView';
import { ClientsView } from './components/ClientsView';
import { ProductsServicesView } from './components/ProductsServicesView';
import { SettingsView } from './components/SettingsView';
import { OrganizacaoView } from './components/OrganizacaoView';
import { getTodayFormatted, getDueDateFormatted } from './utils/formatters';
import {
  isAuthenticated as hasAuthToken,
  clearAuth,
  getUser,
  listClients,
  createClient,
  updateClient,
  deactivateClient,
  listProducts,
  createProduct,
  updateProduct,
  deactivateProduct,
  listSales,
  createSale,
  updateSale,
  issueSale,
  paySale,
  cancelSale,
  mapCompanyFromUser,
  mapErpSale,
  toAppDate,
} from './lib/api';
import type { ErpSale, ErpClient } from './lib/api';
import { getAccessControl } from './lib/permissions';

const STORAGE_KEY_COMPANY = 'ps_faturas_company_v3';

function attachClientInfo(sales: ErpSale[], clients: Client[]): Invoice[] {
  const byId = new Map(clients.map((c) => [c.id, c]));
  return sales.map((s) => {
    const inv = mapErpSale(s);
    const client = s.client_id ? byId.get(s.client_id) : undefined;
    if (client) {
      inv.clientName = client.name;
      inv.clientNif = client.nif || '';
      inv.clientEmail = client.email || '';
      inv.clientPhone = client.phone || '';
      inv.clientAddress = client.address ? `${client.address}, ${client.city}` : '';
    } else {
      inv.clientName = 'Cliente Não Identificado';
    }
    inv.date = toAppDate(inv.date);
    inv.dueDate = toAppDate(inv.dueDate);
    inv.validityDate = toAppDate(inv.dueDate);
    return inv;
  });
}

export default function App() {
  // 1. Estado de autenticação a partir do token guardado no ERP
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasAuthToken());
  const access = getAccessControl(getUser());
  const [loadingData, setLoadingData] = useState(false);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  // 2. TypeSelector sheet (mobile)
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('factura');

  // 3. Faturas vindas do ERP (/api/v1/sales)
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // 4. Clientes vindos do ERP (/api/v1/clients)
  const [clients, setClients] = useState<Client[]>([]);

  // 5. Produtos / Serviços vindos do ERP (/api/v1/products)
  const [products, setProducts] = useState<ProductService[]>([]);

  // 6. Dados da Empresa (base local + dados do utilizador autenticado)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMPANY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return initialCompanyInfo;
  });

  // Carregar todos os dados do ERP após autenticação
  const loadAll = useCallback(async () => {
    setLoadingData(true);
    setDataLoadError(null);
    try {
      const user = getUser();
      const [cl, pr, sl] = await Promise.all([listClients(), listProducts(), listSales()]);
      setClients(cl);
      setProducts(pr);
      setInvoices(attachClientInfo(sl, cl));
      setCompanyInfo((prev) => mapCompanyFromUser(user, prev));
    } catch (err) {
      console.error('Falha ao carregar dados do ERP', err);
      setDataLoadError(
        err instanceof Error
          ? err.message
          : 'Não foi possível ligar ao ERP.'
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Carregar dados assim que autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadAll();
    }
  }, [isAuthenticated, loadAll]);

  // Persistência local da config da empresa
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(companyInfo));
    } catch {
      // ignore
    }
  }, [companyInfo]);

  // 8. Navegação Principal
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [invoiceClientFilter, setInvoiceClientFilter] = useState('');

  // 8. Documento em visualização A4
  const [selectedInvoiceForA4, setSelectedInvoiceForA4] = useState<Invoice | null>(null);

  // 9. Documento em modo de edição
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // 10. Documento recém-emitido (mostra a tela de Sucesso!)
  const [successInvoice, setSuccessInvoice] = useState<Invoice | null>(null);

  // Geração inteligente de número sequencial
  const getNextDocNumber = (type: DocumentType = 'factura'): string => {
    const currentYear = new Date().getFullYear();
    switch (type) {
      case 'orcamento': {
        const prefix = companyInfo.budgetPrefix || 'ORC / 2025';
        const orcInvoices = invoices.filter((i) => i.docType === 'orcamento');
        const nextSeq = String(orcInvoices.length + 1).padStart(4, '0');
        return `${nextSeq} / ${prefix}`;
      }
      case 'recibo': {
        const rcInvoices = invoices.filter((i) => i.docType === 'recibo');
        const nextSeq = String(rcInvoices.length + 1).padStart(4, '0');
        return `${nextSeq} / ${companyInfo.receiptPrefix || currentYear}`;
      }
      case 'pro-forma': {
        const prefix = companyInfo.proformaPrefix || 'PF / 2025';
        const pfInvoices = invoices.filter((i) => i.docType === 'pro-forma');
        const nextSeq = String(pfInvoices.length + 1).padStart(4, '0');
        return `${nextSeq} / ${prefix}`;
      }
      case 'factura-recibo': {
        const prefix = companyInfo.invoiceReceiptPrefix || 'FR / 2025';
        const frInvoices = invoices.filter((i) => i.docType === 'factura-recibo');
        const nextSeq = String(frInvoices.length + 1).padStart(4, '0');
        return `${nextSeq} / ${prefix}`;
      }
      case 'factura':
      default: {
        const prefix = companyInfo.invoicePrefix || `FT-${currentYear}-`;
        const ftInvoices = invoices.filter((i) => (i.docType || 'factura') === 'factura');
        const numbers = ftInvoices
          .map((inv) => {
            const parts = inv.number.split('-');
            return parseInt(parts[parts.length - 1], 10);
          })
          .filter((n) => !isNaN(n));
        const maxNum = numbers.length > 0 ? Math.max(...numbers) : 24;
        const nextSeq = String(maxNum + 1).padStart(4, '0');
        return `${prefix}${nextSeq}`;
      }
    }
  };

  // NAVEGAÇÃO RÁPIDA
  const handleNavigate = (tab: ActiveTab) => {
    if (!access.canAccessTab(tab)) {
      setActiveTab('dashboard');
      return;
    }
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setEditingInvoice(null);
    setInvoiceClientFilter('');
    setActiveTab(tab);
  };

  const handleStartNewInvoice = () => {
    if (!access.can('invoice.create')) return;
    // On mobile, always ask for the document type first (bottom sheet)
    // On desktop, go straight to the form (type grid is visible there)
    if (window.innerWidth < 1024) {
      setTypeSheetOpen(true);
      return;
    }
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setEditingInvoice(null);
    setActiveTab('nova-fatura');
  };

  const handleSelectDocType = (type: DocumentType) => {
    if (!access.can('invoice.create')) return;
    setSelectedDocType(type);
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setEditingInvoice(null);
    setActiveTab('nova-fatura');
  };

  // Garante que o cliente existe no ERP e devolve o seu id
  const resolveClientId = async (inv: Invoice): Promise<{ id: string | null; created?: Client }> => {
    if (!inv.clientName || !inv.clientName.trim()) return { id: null };
    const existing = clients.find(
      (c) => c.name.trim().toLowerCase() === inv.clientName.trim().toLowerCase()
    );
    if (existing) return { id: existing.id };
    const created = await createClient({
      name: inv.clientName,
      nif: inv.clientNif,
      email: inv.clientEmail,
      phone: inv.clientPhone,
      address: inv.clientAddress,
      city: 'Luanda',
    });
    setClients((prev) => [...prev, created]);
    return { id: created.id, created };
  };

  // Persiste a fatura no ERP e atualiza o estado local
  const persistSale = async (invoice: Invoice, emit: boolean): Promise<Invoice | null> => {
    const { id: clientId, created } = await resolveClientId(invoice);
    const alreadyExists = invoices.some((existing) => existing.id === invoice.id);
    const savedSale = alreadyExists
      ? await updateSale(invoice.id, invoice, clientId)
      : await createSale(invoice, clientId);
    // A emissão só é necessária para documentos novos ou rascunhos existentes.
    const final = emit && (!alreadyExists || invoice.status === 'Rascunho')
      ? await issueSale(savedSale.id)
      : savedSale;
    const clientsForMapping = created ? [...clients, created] : clients;
    const refreshed = attachClientInfo([final], clientsForMapping);
    return refreshed[0] || null;
  };

  // AÇÕES DE FATURAS
  const handleGenerateInvoice = async (newOrUpdatedInvoice: Invoice) => {
    const isUpdate = invoices.some((invoice) => invoice.id === newOrUpdatedInvoice.id);
    if (!access.can(isUpdate ? 'invoice.edit' : 'invoice.create')) return;
    try {
      const saved = await persistSale(newOrUpdatedInvoice, true);
      if (saved) {
        setInvoices((prev) => {
          const exists = prev.some((inv) => inv.id === saved.id);
          if (exists) return prev.map((inv) => (inv.id === saved.id ? saved : inv));
          return [saved, ...prev];
        });
        setEditingInvoice(null);
        // Skip success screen — go straight to A4 view (faster mobile flow)
        setSuccessInvoice(null);
        setSelectedInvoiceForA4(saved);
        return;
      }
    } catch (err: any) {
      alert(`Não foi possível emitir o documento no ERP: ${err?.message || 'erro desconhecido'}`);
    }
  };

  const handleSaveDraft = async (draftInvoice: Invoice) => {
    const isUpdate = invoices.some((invoice) => invoice.id === draftInvoice.id);
    if (!access.can(isUpdate ? 'invoice.edit' : 'invoice.create')) return;
    try {
      const saved = await persistSale(draftInvoice, false);
      if (saved) {
        setInvoices((prev) => {
          const exists = prev.some((inv) => inv.id === saved.id);
          if (exists) return prev.map((inv) => (inv.id === saved.id ? saved : inv));
          return [saved, ...prev];
        });
      }
      setEditingInvoice(null);
      setSelectedInvoiceForA4(null);
      setSuccessInvoice(null);
      setActiveTab('faturas');
    } catch (err: any) {
      alert(`Não foi possível guardar o documento no ERP: ${err?.message || 'erro desconhecido'}`);
    }
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setSelectedInvoiceForA4(invoice);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSuccessInvoice(null);
    setSelectedInvoiceForA4(invoice);
  };

  const handleStartEdit = (inv: Invoice) => {
    if (!access.can('invoice.edit')) return;
    setSuccessInvoice(null);
    setSelectedInvoiceForA4(null);
    setEditingInvoice(inv);
    setActiveTab('nova-fatura');
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!access.can('invoice.cancel')) return false;
    try {
      await cancelSale(invoiceId, 'Anulado a partir do PS Faturas');
    } catch {
      alert('Não foi possível anular o documento no ERP.');
      return false;
    }
    setInvoices((prev) => prev.map((invoice) =>
      invoice.id === invoiceId ? { ...invoice, status: 'Cancelada' } : invoice
    ));
    if (selectedInvoiceForA4 && selectedInvoiceForA4.id === invoiceId) {
      setSelectedInvoiceForA4((invoice) => invoice ? { ...invoice, status: 'Cancelada' } : null);
    }
    return true;
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
    if (!access.can('invoice.create')) return;
    const docType = invoice.docType || 'factura';
    const newNumber = getNextDocNumber(docType);
    const duplicated: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      number: newNumber,
      date: getTodayFormatted(),
      dueDate: getDueDateFormatted(15),
      validityDate: getDueDateFormatted(30),
      status: 'Pendente',
      createdAt: new Date().toISOString(),
    };
    setEditingInvoice(duplicated);
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setActiveTab('nova-fatura');
  };

  const handleToggleStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    if (!access.can('invoice.pay')) return;
    // Quando marcada como paga, regista o pagamento no ERP
    if (newStatus === 'Paga') {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (inv && inv.id) {
        try {
          await paySale(inv.id, inv.total || 0, 'TRANSFERENCIA');
        } catch {
          alert('Não foi possível registar o pagamento no ERP.');
          return;
        }
      }
    }
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    );
    if (selectedInvoiceForA4 && selectedInvoiceForA4.id === invoiceId) {
      setSelectedInvoiceForA4((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // CLIENTES
  const handleAddClient = async (client: Client) => {
    if (!access.can('client.manage')) return false;
    try {
      const created = await createClient(client);
      setClients((prev) => [...prev, created]);
      return true;
    } catch (err: any) {
      alert(`Não foi possível criar o cliente no ERP: ${err?.message || 'erro desconhecido'}`);
      return false;
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    if (!access.can('client.manage')) return false;
    try {
      const updated = await updateClient(updatedClient.id, updatedClient);
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      return true;
    } catch (err: any) {
      alert(`Não foi possível atualizar o cliente no ERP: ${err?.message || 'erro desconhecido'}`);
      return false;
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!access.can('client.delete')) return;
    try {
      await deactivateClient(clientId);
    } catch {
      alert('Não foi possível desativar o cliente no ERP.');
      return;
    }
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  const handleViewClientInvoices = (clientName: string) => {
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setInvoiceClientFilter(clientName);
    setActiveTab('faturas');
  };

  // PRODUTOS
  const handleAddProduct = async (product: ProductService) => {
    if (!access.can('product.manage')) return false;
    try {
      const created = await createProduct(product);
      setProducts((prev) => [...prev, created]);
      return true;
    } catch (err: any) {
      alert(`Não foi possível criar o produto no ERP: ${err?.message || 'erro desconhecido'}`);
      return false;
    }
  };

  const handleUpdateProduct = async (updatedProduct: ProductService) => {
    if (!access.can('product.manage')) return false;
    try {
      const updated = await updateProduct(updatedProduct.id, updatedProduct);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      return true;
    } catch (err: any) {
      alert(`Não foi possível atualizar o produto no ERP: ${err?.message || 'erro desconhecido'}`);
      return false;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!access.can('product.delete')) return;
    try {
      await deactivateProduct(productId);
    } catch {
      alert('Não foi possível desativar o produto no ERP.');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // CONFIGURAÇÕES
  const handleSaveCompanyInfo = (updatedInfo: CompanyInfo) => {
    if (!access.can('settings.manage')) return;
    setCompanyInfo(updatedInfo);
  };

  // LOGOUT
  const handleLogout = () => {
    clearAuth();
    setInvoices([]);
    setClients([]);
    setProducts([]);
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setEditingInvoice(null);
    setInvoiceClientFilter('');
    setIsAuthenticated(false);
  };

  const handleLoginDone = () => {
    setIsAuthenticated(true);
  };

  // Se não autenticado: tela de login limpa e corporativa
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLoginDone} />;
  }

  return (
    <div className="min-h-screen app-surface text-slate-800 flex selection:bg-[#0056d6] selection:text-white">
      {/* Sidebar Lateral (desktop only) */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onNewInvoice={handleStartNewInvoice}
        onLogout={handleLogout}
        isOpenMobile={false}
        onCloseMobile={() => {}}
        invoicesCount={invoices.length}
        clientsCount={clients.length}
        canAccessTab={access.canAccessTab}
        canCreateInvoice={access.can('invoice.create')}
        userName={getUser()?.full_name || getUser()?.username || 'Utilizador'}
        roleLabel={access.roleLabel}
      />

      {/* Conteúdo Principal com TopBar */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 print:pl-0">
        <TopBar
          activeTab={activeTab}
          onNewInvoice={handleStartNewInvoice}
          invoicesCount={invoices.length}
          onOpenSettings={() => handleNavigate('definicoes')}
          onLogout={handleLogout}
          canCreateInvoice={access.can('invoice.create')}
          canManageSettings={access.can('settings.manage')}
          userName={getUser()?.full_name || getUser()?.username || 'Utilizador'}
          roleLabel={access.roleLabel}
        />

        {/* Bottom padding on mobile for bottom nav */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
          {dataLoadError && (
            <div
              role="alert"
              className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              <span>Não foi possível carregar os dados do ERP: {dataLoadError}</span>
              <button
                type="button"
                onClick={loadAll}
                disabled={loadingData}
                className="shrink-0 rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-60"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {loadingData && invoices.length === 0 ? (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-[#0a1e42]">
              A carregar faturas, clientes e produtos…
            </div>
          ) : null}

          {/* CASO 1: Documento Visualizado em Formato A4 Profissional */}
          {selectedInvoiceForA4 ? (
            <InvoiceA4View
              invoice={selectedInvoiceForA4}
              companyInfo={companyInfo}
              onBack={() => {
                setSelectedInvoiceForA4(null);
                setActiveTab('faturas');
              }}
              onEdit={handleStartEdit}
              onNewInvoice={handleStartNewInvoice}
              onToggleStatus={(id, status) => handleToggleStatus(id, status)}
              onDelete={handleDeleteInvoice}
              canEdit={access.can('invoice.edit')}
              canCreate={access.can('invoice.create')}
              canToggleStatus={access.can('invoice.pay')}
              canDelete={access.can('invoice.cancel')}
            />
          ) : successInvoice ? (
            /* CASO 2: Tela de Sucesso após Emissão da Fatura */
            <InvoiceSuccessView
              invoice={successInvoice}
              onViewInvoice={() => {
                setSelectedInvoiceForA4(successInvoice);
                setSuccessInvoice(null);
              }}
              onPrintInvoice={() => {
                setSelectedInvoiceForA4(successInvoice);
                setSuccessInvoice(null);
                setTimeout(() => window.print(), 300);
              }}
              onNewInvoice={handleStartNewInvoice}
            />
          ) : (
            /* CASO 3: Telas de Navegação Principal */
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  invoices={invoices}
                  onNewInvoice={handleStartNewInvoice}
                  onViewInvoice={handleViewInvoice}
                  onNavigateToInvoices={() => {
                    setInvoiceClientFilter('');
                    setActiveTab('faturas');
                  }}
                />
              )}

              {(activeTab === 'faturas' || activeTab === 'historico') && (
                <InvoicesView
                  invoices={invoices}
                  onNewInvoice={handleStartNewInvoice}
                  onViewInvoice={handleViewInvoice}
                  onEditInvoice={handleStartEdit}
                  onDuplicateInvoice={handleDuplicateInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  canCreate={access.can('invoice.create')}
                  canEdit={access.can('invoice.edit')}
                  canDelete={access.can('invoice.cancel')}
                  clientFilter={invoiceClientFilter}
                  onClearClientFilter={() => setInvoiceClientFilter('')}
                />
              )}

              {activeTab === 'nova-fatura' && (
                <InvoiceFormView
                  companyInfo={companyInfo}
                  editingInvoice={editingInvoice}
                  clients={clients}
                  products={products}
                  defaultDocType={editingInvoice?.docType || selectedDocType}
                  getNextDocNumber={getNextDocNumber}
                  onGenerateInvoice={handleGenerateInvoice}
                  onSaveDraft={handleSaveDraft}
                  onPreviewInvoice={handlePreviewInvoice}
                  onQuickAddClient={handleAddClient}
                  onCancelEdit={() => {
                    setEditingInvoice(null);
                    setActiveTab('faturas');
                  }}
                />
              )}

              {activeTab === 'clientes' && (
                <ClientsView
                  clients={clients}
                  invoices={invoices}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onViewClientInvoices={handleViewClientInvoices}
                  canManage={access.can('client.manage')}
                  canDelete={access.can('client.delete')}
                />
              )}

              {activeTab === 'produtos' && (
                <ProductsServicesView
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  canManage={access.can('product.manage')}
                  canDelete={access.can('product.delete')}
                />
              )}

              {activeTab === 'organizacao' && access.can('organization.manage') && <OrganizacaoView />}

              {(activeTab === 'definicoes' || activeTab === 'configuracoes') && (
                <SettingsView
                  companyInfo={companyInfo}
                  onSaveCompanyInfo={handleSaveCompanyInfo}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (WhatsApp-style) */}
      <BottomNav
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onNewInvoice={handleStartNewInvoice}
        canCreateInvoice={access.can('invoice.create')}
      />

      {/* Mobile Type Selector Bottom Sheet */}
      <TypeSelectorSheet
        isOpen={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        onSelect={handleSelectDocType}
      />
    </div>
  );
}
