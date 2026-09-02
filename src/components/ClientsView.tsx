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
} from 'lucide-react';
import { Client, Invoice } from '../types';

interface ClientsViewProps {
  clients: Client[];
  invoices: Invoice[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onViewClientInvoices: (clientName: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  invoices,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onViewClientInvoices,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        name: name.trim(),
        nif: nif.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
      });
    } else {
      onAddClient({
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

    setIsModalOpen(false);
  };

  // Contar faturas reais de cada cliente
  const getClientInvoicesCount = (clientName: string) => {
    return invoices.filter(
      (i) => i.clientName.toLowerCase().trim() === clientName.toLowerCase().trim()
    ).length;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a1e42] tracking-tight">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastro e histórico de clientes para seleção automática em faturas
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="px-5 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white text-sm font-bold border border-blue-400/25 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0 select-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, NIF, telefone ou email do cliente..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Nome / Empresa</th>
                <th className="py-3.5 px-4">NIF</th>
                <th className="py-3.5 px-4">Telefone</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-center">Nº de Faturas</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
              {filteredClients.map((client) => {
                const count = getClientInvoicesCount(client.name);
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Nome */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-extrabold text-[#0a1e42] group-hover:text-[#0056d6] transition-colors">
                        {client.name}
                      </div>
                      {client.address && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                          {client.address}, {client.city}
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

                    {/* Telefone */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {client.phone || '—'}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[200px]">
                      {client.email || '—'}
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

                    {/* Ações */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(client)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#0a1e42] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar cliente"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteClient(client.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredClients.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    Nenhum cliente encontrado. Clique em "+ Novo Cliente" para adicionar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-[#0a1e42]">
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
                  className="px-5 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#0047b3] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {editingClient ? 'Guardar Alterações' : 'Adicionar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
