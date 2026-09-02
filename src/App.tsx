/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  initialInvoices,
  initialCompanyInfo,
  initialClients,
  initialProducts,
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
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { InvoicesView } from './components/InvoicesView';
import { InvoiceFormView } from './components/InvoiceFormView';
import { InvoiceA4View } from './components/InvoiceA4View';
import { InvoiceSuccessView } from './components/InvoiceSuccessView';
import { ClientsView } from './components/ClientsView';
import { ProductsServicesView } from './components/ProductsServicesView';
import { SettingsView } from './components/SettingsView';
import { getTodayFormatted, getDueDateFormatted } from './utils/formatters';

const STORAGE_KEY_INVOICES = 'ps_faturas_invoices_v3';
const STORAGE_KEY_COMPANY = 'ps_faturas_company_v3';
const STORAGE_KEY_CLIENTS = 'ps_faturas_clients_v3';
const STORAGE_KEY_PRODUCTS = 'ps_faturas_products_v3';

export default function App() {
  // 1. Estado de autenticação (quando deslogado, tela de login limpa e moderna)
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // 2. Estado do Menu Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 3. Faturas com LocalStorage
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INVOICES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return initialInvoices;
  });

  // 4. Clientes com LocalStorage
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CLIENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return initialClients;
  });

  // 5. Produtos / Serviços com LocalStorage
  const [products, setProducts] = useState<ProductService[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return initialProducts;
  });

  // 6. Dados da Empresa com LocalStorage
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COMPANY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return initialCompanyInfo;
  });

  // Persistência local automática
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } catch {
      // ignore
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
    } catch {
      // ignore
    }
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(companyInfo));
    } catch {
      // ignore
    }
  }, [companyInfo]);

  // 7. Navegação Principal
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

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
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setEditingInvoice(null);
    setActiveTab(tab);
  };

  const handleStartNewInvoice = () => {
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setEditingInvoice(null);
    setActiveTab('nova-fatura');
  };

  // AÇÕES DE FATURAS
  const handleGenerateInvoice = (newOrUpdatedInvoice: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === newOrUpdatedInvoice.id);
      if (exists) {
        return prev.map((inv) =>
          inv.id === newOrUpdatedInvoice.id ? newOrUpdatedInvoice : inv
        );
      }
      return [newOrUpdatedInvoice, ...prev];
    });

    // Se o cliente não existir no cadastro, adicioná-lo automaticamente
    if (newOrUpdatedInvoice.clientName) {
      setClients((prev) => {
        const existing = prev.find(
          (c) =>
            c.name.trim().toLowerCase() === newOrUpdatedInvoice.clientName.trim().toLowerCase()
        );
        if (!existing) {
          const newC: Client = {
            id: `c-${Date.now()}`,
            name: newOrUpdatedInvoice.clientName,
            nif: newOrUpdatedInvoice.clientNif || '',
            email: newOrUpdatedInvoice.clientEmail || '',
            phone: newOrUpdatedInvoice.clientPhone || '',
            address: newOrUpdatedInvoice.clientAddress || '',
            city: 'Luanda',
            invoicesCount: 1,
            totalInvoiced: newOrUpdatedInvoice.total,
          };
          return [...prev, newC];
        } else {
          return prev.map((c) =>
            c.id === existing.id
              ? {
                  ...c,
                  invoicesCount: (c.invoicesCount || 0) + 1,
                  totalInvoiced: (c.totalInvoiced || 0) + newOrUpdatedInvoice.total,
                }
              : c
          );
        }
      });
    }

    setEditingInvoice(null);
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(newOrUpdatedInvoice);
  };

  const handleSaveDraft = (draftInvoice: Invoice) => {
    setInvoices((prev) => {
      const exists = prev.some((inv) => inv.id === draftInvoice.id);
      if (exists) {
        return prev.map((inv) =>
          inv.id === draftInvoice.id ? draftInvoice : inv
        );
      }
      return [draftInvoice, ...prev];
    });

    setEditingInvoice(null);
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setActiveTab('faturas');
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setSelectedInvoiceForA4(invoice);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSuccessInvoice(null);
    setSelectedInvoiceForA4(invoice);
  };

  const handleStartEdit = (inv: Invoice) => {
    setSuccessInvoice(null);
    setSelectedInvoiceForA4(null);
    setEditingInvoice(inv);
    setActiveTab('nova-fatura');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
    if (selectedInvoiceForA4 && selectedInvoiceForA4.id === invoiceId) {
      setSelectedInvoiceForA4(null);
    }
  };

  const handleDuplicateInvoice = (invoice: Invoice) => {
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
    setInvoices((prev) => [duplicated, ...prev]);
    setEditingInvoice(duplicated);
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setActiveTab('nova-fatura');
  };

  const handleToggleStatus = (invoiceId: string, newStatus: InvoiceStatus) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    );
    if (selectedInvoiceForA4 && selectedInvoiceForA4.id === invoiceId) {
      setSelectedInvoiceForA4((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // CLIENTES
  const handleAddClient = (client: Client) => {
    setClients((prev) => [...prev, client]);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  const handleViewClientInvoices = (clientName: string) => {
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setActiveTab('faturas');
  };

  // PRODUTOS
  const handleAddProduct = (product: ProductService) => {
    setProducts((prev) => [...prev, product]);
  };

  const handleUpdateProduct = (updatedProduct: ProductService) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // CONFIGURAÇÕES
  const handleSaveCompanyInfo = (updatedInfo: CompanyInfo) => {
    setCompanyInfo(updatedInfo);
  };

  // LOGOUT
  const handleLogout = () => {
    setSelectedInvoiceForA4(null);
    setSuccessInvoice(null);
    setEditingInvoice(null);
    setIsMobileMenuOpen(false);
    setIsAuthenticated(false);
  };

  // Se não autenticado: tela de login limpa e corporativa
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex selection:bg-[#0056d6] selection:text-white">
      {/* Sidebar Lateral */}
      <Sidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onNewInvoice={handleStartNewInvoice}
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        invoicesCount={invoices.length}
        clientsCount={clients.length}
      />

      {/* Conteúdo Principal com TopBar */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 print:pl-0">
        <TopBar
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNewInvoice={handleStartNewInvoice}
          invoicesCount={invoices.length}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
                  onNavigateToInvoices={() => setActiveTab('faturas')}
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
                />
              )}

              {activeTab === 'nova-fatura' && (
                <InvoiceFormView
                  companyInfo={companyInfo}
                  editingInvoice={editingInvoice}
                  clients={clients}
                  products={products}
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
                />
              )}

              {activeTab === 'produtos' && (
                <ProductsServicesView
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}

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
    </div>
  );
}
