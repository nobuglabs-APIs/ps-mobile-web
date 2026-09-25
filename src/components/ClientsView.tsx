import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Client, Invoice } from '../types';
import { formatKz } from '../utils/formatters';

interface ClientsViewProps {
  clients: Client[];
  invoices: Invoice[];
  onAddClient: (client: Client) => Promise<boolean>;
  onUpdateClient: (client: Client) => Promise<boolean>;
  onDeleteClient: (clientId: string) => void;
  onViewClientInvoices: (clientName: string) => void;
  canManage: boolean;
  canDelete: boolean;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  invoices,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onViewClientInvoices,
  canManage,
  canDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Luanda');

  const openNewModal = () => {
    setEditingClient(null);
    setName('');
    setNif('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('Luanda');
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setNif(client.nif || '');
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setAddress(client.address || '');
    setCity(client.city || 'Luanda');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    let saved: boolean;
    if (editingClient) {
      saved = await onUpdateClient({
        ...editingClient,
        name: name.trim(),
        nif: nif.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
      });
    } else {
      saved = await onAddClient({
        id: `c-${Date.now()}`,
        name: name.trim(),
        nif: nif.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        invoicesCount: 0,
        totalInvoiced: 0,
      });
    }

    setIsSaving(false);
    if (saved) setIsModalOpen(false);
  };

  // Contar faturas reais de cada cliente
  const getClientInvoicesCount = (clientName: string) => {
    return invoices.filter(
      (i) => i.clientName.toLowerCase().trim() === clientName.toLowerCase().trim()
    ).length;
  };

  // Soma dos valores das faturas (pagas + pendentes) de um cliente
  const getClientTotalInvoiced = (clientName: string) => {
    return invoices
      .filter(
        (i) =>
          i.clientName.toLowerCase().trim() === clientName.toLowerCase().trim() &&
          (i.status === 'Paga' || i.status === 'Pendente')
      )
      .reduce((sum, i) => sum + (i.total || 0), 0);
  };

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      c.name.toLowerCase().includes(term) ||
      (c.nif && c.nif.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Topo: Título + Botão Novo Cliente */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg lg:text-2xl font-extrabold text-[#0a1e42] tracking-tight">
            Clientes
          </h1>
          <p className="text-[11px] lg:text-sm text-slate-500 mt-0.5 hidden lg:block">
            Cadastro e histórico de clientes para seleção automática em faturas
          </p>
        </div>

        {canManage && <button
            type="button"
            onClick={openNewModal}
            className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white text-xs lg:text-sm font-bold border border-blue-400/25 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0 select-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="lg:inline">Novo</span>
        </button>}
      </div>

      {/* Barra de Pesquisa */}
      <div className="bg-white lg:p-4 lg:rounded-2xl lg:border lg:border-slate-200/90">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl lg:border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      {filteredClients.length === 0 ? (
        <div className="bg-white lg:rounded-3xl lg:border lg:border-slate-200/90 lg:shadow-xs px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            {searchTerm ? 'Nenhum cliente corresponde à pesquisa' : 'Ainda não existem clientes'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Tenta alterar o termo de pesquisa.'
              : 'Adicione o primeiro cliente para o poder selecionar automaticamente ao emitir faturas.'}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={openNewModal}
              className="mt-5 px-4 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Adicionar Cliente
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tabela de Clientes — Desktop */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Nome / Empresa</th>
                    <th className="py-3.5 px-4">NIF</th>
                    <th className="py-3.5 px-4">Contacto</th>
                    <th className="py-3.5 px-4 text-center">Faturas</th>
                    <th className="py-3.5 px-4 text-right">Total Faturado</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
                  {filteredClients.map((client) => {
                    const count = getClientInvoicesCount(client.name);
                    const total = getClientTotalInvoiced(client.name);
                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Nome */}
                        <td className="py-3.5 px-6">
                          <div className="font-extrabold text-[#0a1e42] group-hover:text-[#0056d6] transition-colors">
                            {client.name}
                          </div>
                          {client.address && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-[240px]">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {client.address}, {client.city}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* NIF */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                          {client.nif ? (
                            <span className="font-mono">{client.nif}</span>
                          ) : (
                            <span className="text-slate-400 italic">Consumidor Final</span>
                          )}
                        </td>

                        {/* Contacto */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {client.phone && (
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          {!client.phone && !client.email && <span>—</span>}
                        </td>

                        {/* Nº de Faturas */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => onViewClientInvoices(client.name)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              count > 0
                                ? 'bg-blue-50 text-[#0056d6] hover:bg-[#0056d6] hover:text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                            title="Ver faturas deste cliente"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{count}</span>
                          </button>
                        </td>

                        {/* Total Faturado */}
                        <td className="py-3.5 px-4 text-right font-bold text-[#0a1e42] whitespace-nowrap">
                          {formatKz(total)}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => onViewClientInvoices(client.name)}
                              className="p-2 rounded-lg text-slate-500 hover:text-[#0056d6] hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Ver faturas"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            {canManage && <button
                              onClick={() => openEditModal(client)}
                              className="p-2 rounded-lg text-slate-500 hover:text-[#0a1e42] hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Editar cliente"
                            >
                              <Edit className="w-4 h-4" />
                            </button>}
                            {canDelete && <button
                              onClick={() => onDeleteClient(client.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet: flat list */}
          <div className="lg:hidden">
            {filteredClients.map((client, idx) => {
              const count = getClientInvoicesCount(client.name);
              const total = getClientTotalInvoiced(client.name);
              return (
                <div key={client.id} className={`bg-white ${idx < filteredClients.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[#0a1e42]/5 flex items-center justify-center">
                      <Building className="w-4 h-4 text-[#0056d6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-[#0a1e42] truncate">{client.name}</span>
                        {count > 0 && (
                          <span className="text-[10px] font-bold text-[#0056d6] bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">{count} faturas</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 truncate">{client.nif || 'Consumidor Final'}{client.phone ? ` · ${client.phone}` : ''}</span>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{formatKz(total)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onViewClientInvoices(client.name)}
                        aria-label={`Ver faturas de ${client.name}`}
                        className="p-2 rounded-lg text-[#0056d6] hover:bg-blue-50 active:bg-blue-100"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {canManage && <button
                        type="button"
                        onClick={() => openEditModal(client)}
                        aria-label={`Editar ${client.name}`}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>}
                      {canDelete && <button
                        type="button"
                        onClick={() => onDeleteClient(client.id)}
                        aria-label={`Eliminar ${client.name}`}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 active:bg-rose-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Adicionar / Editar Cliente */}
      {isModalOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="client-modal-title" className="modal-panel bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 id="client-modal-title" className="text-lg font-extrabold text-[#0a1e42]">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Nome */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Empresa ABC, Lda ou João da Silva"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                />
              </div>

              {/* NIF & Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    NIF
                  </label>
                  <input
                    type="text"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    placeholder="Ex: 5401928471"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +244 923 111 222"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: financeiro@cliente.ao"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                />
              </div>

              {/* Morada & Cidade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Morada
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: Av. 4 de Fevereiro, nº 142"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#0047b3] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isSaving ? 'A guardar...' : editingClient ? 'Guardar Alterações' : 'Adicionar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
