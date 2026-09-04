import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Landmark,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  ErpCompany,
  ErpBranch,
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  listBranches,
  createBranch,
} from '../lib/api';
import { Select } from './Select';

export const OrganizacaoView: React.FC = () => {
  const [companies, setCompanies] = useState<ErpCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ErpCompany | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Branches state
  const [selectedCompany, setSelectedCompany] = useState<ErpCompany | null>(null);
  const [branches, setBranches] = useState<ErpBranch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchEmail, setBranchEmail] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [nif, setNif] = useState('');
  const [taxRegime, setTaxRegime] = useState<string>('GERAL');
  const [vatRate, setVatRate] = useState<string>('14');
  const [address, setAddress] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [province, setProvince] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankSwift, setBankSwift] = useState('');
  const [currency, setCurrency] = useState('AOA');
  const [eInvoicing, setEInvoicing] = useState(false);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar organizações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const openNewModal = () => {
    setEditingCompany(null);
    setName('');
    setTradingName('');
    setNif('');
    setTaxRegime('GERAL');
    setVatRate('14');
    setAddress('');
    setMunicipality('');
    setProvince('');
    setPhone('');
    setEmail('');
    setWebsite('');
    setBankName('');
    setBankIban('');
    setBankSwift('');
    setCurrency('AOA');
    setEInvoicing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (company: ErpCompany) => {
    setEditingCompany(company);
    setName(company.name);
    setTradingName(company.trading_name || '');
    setNif(company.nif);
    setTaxRegime(company.tax_regime);
    setVatRate(company.vat_rate);
    setAddress(company.address || '');
    setMunicipality(company.municipality || '');
    setProvince(company.province || '');
    setPhone(company.phone || '');
    setEmail(company.email || '');
    setWebsite(company.website || '');
    setBankName(company.bank_name || '');
    setBankIban(company.bank_iban || '');
    setBankSwift(company.bank_swift || '');
    setCurrency(company.currency || 'AOA');
    setEInvoicing(company.is_e_invoicing_enabled);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nif.trim()) return;

    try {
      const payload: Partial<ErpCompany> = {
        name: name.trim(),
        trading_name: tradingName.trim() || undefined,
        nif: nif.trim(),
        tax_regime: taxRegime as any,
        vat_rate: vatRate as any,
        address: address.trim() || undefined,
        municipality: municipality.trim() || undefined,
        province: province.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        bank_name: bankName.trim() || undefined,
        bank_iban: bankIban.trim() || undefined,
        bank_swift: bankSwift.trim() || undefined,
        currency: currency.trim() || 'AOA',
        is_e_invoicing_enabled: eInvoicing,
      };

      if (editingCompany) {
        const updated = await updateCompany(editingCompany.id, payload);
        setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showSuccess('Organização atualizada com sucesso!');
      } else {
        const created = await createCompany(payload);
        setCompanies((prev) => [created, ...prev]);
        showSuccess('Organização criada com sucesso!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Erro: ${err?.message || 'Não foi possível guardar a organização'}`);
    }
  };

  const handleDelete = async (companyId: string) => {
    if (!window.confirm('Tem certeza que deseja eliminar esta organização?')) return;
    try {
      await deleteCompany(companyId);
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      showSuccess('Organização eliminada');
    } catch (err: any) {
      alert(`Erro: ${err?.message || 'Não foi possível eliminar'}`);
    }
  };

  // Branches
  const openCompanyBranches = async (company: ErpCompany) => {
    setSelectedCompany(company);
    setLoadingBranches(true);
    try {
      const data = await listBranches(company.id);
      setBranches(data);
    } catch {
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !branchName.trim()) return;
    try {
      const created = await createBranch(selectedCompany.id, {
        name: branchName.trim(),
        address: branchAddress.trim() || undefined,
        phone: branchPhone.trim() || undefined,
        email: branchEmail.trim() || undefined,
      });
      setBranches((prev) => [...prev, created]);
      setBranchName('');
      setBranchAddress('');
      setBranchPhone('');
      setBranchEmail('');
      setIsBranchModalOpen(false);
      showSuccess('Filial criada com sucesso!');
    } catch (err: any) {
      alert(`Erro: ${err?.message || 'Não foi possível criar a filial'}`);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      !term ||
      c.name.toLowerCase().includes(term) ||
      c.nif.toLowerCase().includes(term) ||
      (c.trading_name && c.trading_name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a1e42] tracking-tight">Organização</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gestão de empresas, filiais e dados fiscais do ERP
          </p>
        </div>
        <button
          type="button"
          onClick={openNewModal}
          className="px-5 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white text-sm font-bold border border-blue-400/25 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0 select-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Organização</span>
        </button>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, NIF, nome comercial ou email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">A carregar organizações...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertCircle className="w-10 h-10 text-rose-400" />
          <p className="text-sm text-rose-600 font-medium max-w-md">{error}</p>
          <button
            type="button"
            onClick={loadCompanies}
            className="mt-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredCompanies.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            {searchTerm ? 'Nenhuma organização corresponde à pesquisa' : 'Ainda não existem organizações'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Tenta alterar o termo de pesquisa.'
              : 'Adicione a primeira organização (empresa) para gerir filiais e dados fiscais.'}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={openNewModal}
              className="mt-5 px-4 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Adicionar Organização
            </button>
          )}
        </div>
      )}

      {/* ===================== LISTA ===================== */}
      {!loading && !error && filteredCompanies.length > 0 && (
        <>
          {/* ---------- Tabela Desktop ---------- */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Organização</th>
                    <th className="py-3.5 px-4">NIF</th>
                    <th className="py-3.5 px-4">Contacto</th>
                    <th className="py-3.5 px-4 text-center">Regime</th>
                    <th className="py-3.5 px-4 text-center">IVA</th>
                    <th className="py-3.5 px-4 text-center">e-Fact.</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
                  {filteredCompanies.map((company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Organização */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 shrink-0 rounded-xl bg-[#0a1e42]/5 border border-slate-200 flex items-center justify-center">
                            {company.logo_url ? (
                              <img src={company.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain" />
                            ) : (
                              <Building2 className="w-5 h-5 text-[#0056d6]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#0a1e42] group-hover:text-[#0056d6] transition-colors truncate">
                              {company.name}
                            </div>
                            {company.trading_name && (
                              <div className="text-[11px] text-slate-400 italic truncate max-w-[200px]">
                                {company.trading_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* NIF */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        <span className="font-mono">{company.nif}</span>
                      </td>

                      {/* Contacto */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {company.phone && (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{company.phone}</span>
                          </div>
                        )}
                        {company.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{company.email}</span>
                          </div>
                        )}
                        {!company.phone && !company.email && <span>—</span>}
                      </td>

                      {/* Regime */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {company.tax_regime}
                        </span>
                      </td>

                      {/* IVA */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-slate-700">
                        {company.vat_rate === 'EX' ? 'Isento' : `${company.vat_rate}%`}
                      </td>

                      {/* e-Factura */}
                      <td className="py-3.5 px-4 text-center">
                        {company.is_e_invoicing_enabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Sim
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openCompanyBranches(company)}
                            className="p-2 rounded-lg text-slate-500 hover:text-[#0056d6] hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Ver filiais"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(company)}
                            className="p-2 rounded-lg text-slate-500 hover:text-[#0a1e42] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Editar organização"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar organização"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------- Cartões Mobile / Tablet ---------- */}
          <div className="lg:hidden space-y-3">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 shrink-0 rounded-full bg-[#0a1e42]/5 border border-slate-200 flex items-center justify-center">
                        {company.logo_url ? (
                          <img src={company.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain" />
                        ) : (
                          <Building2 className="w-5 h-5 text-[#0056d6]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[#0a1e42] text-sm truncate">
                          {company.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate font-mono">
                          NIF: {company.nif}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        company.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {company.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    {company.trading_name && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 italic">
                        <span>Nome comercial: {company.trading_name}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{company.phone}</span>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{company.email}</span>
                      </div>
                    )}
                    {company.address && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {company.address}
                          {company.municipality ? `, ${company.municipality}` : ''}
                          {company.province ? ` - ${company.province}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {company.tax_regime}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 text-slate-600">
                      IVA: {company.vat_rate === 'EX' ? 'Isento' : `${company.vat_rate}%`}
                    </span>
                    {company.is_e_invoicing_enabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        e-Factura
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => openCompanyBranches(company)}
                    className="py-2.5 text-[11px] font-bold text-[#0056d6] hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Filiais
                  </button>
                  <button
                    onClick={() => openEditModal(company)}
                    className="py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="py-2.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ---------- Filiais Expandida (compartilhada desktop+mobile) ---------- */}
          {selectedCompany && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-[#0a1e42] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0056d6]" />
                    Filiais de {selectedCompany.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCompany(null)}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Fechar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBranchModalOpen(true)}
                      className="text-[11px] font-bold text-[#0056d6] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Filial
                    </button>
                  </div>
                </div>
                {loadingBranches ? (
                  <div className="flex items-center gap-2 text-slate-500 text-xs py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> A carregar filiais...
                  </div>
                ) : branches.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    Nenhuma filial registada para esta organização.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {branches.map((branch) => (
                      <div
                        key={branch.id}
                        className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#0a1e42]">{branch.name}</span>
                          {branch.address && (
                            <span className="text-[11px] text-slate-500 ml-2 truncate">
                              — {branch.address}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            branch.active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {branch.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================== MODAL: Add / Edit Company ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center p-4 pt-12 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-[#0a1e42]">
                {editingCompany ? 'Editar Organização' : 'Nova Organização'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Identidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nome Oficial da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: PS – Comércio e Prestação de Serviços"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nome Comercial
                  </label>
                  <input
                    type="text"
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    placeholder="Ex: PS SERVICES"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    NIF *
                  </label>
                  <input
                    type="text"
                    required
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    placeholder="Ex: 5417082910"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 font-mono bg-slate-50/70"
                  />
                </div>
              </div>

              {/* Fiscal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Regime Fiscal
                  </label>
                  <Select
                    value={taxRegime}
                    onChange={setTaxRegime}
                    options={[
                      { value: 'GERAL', label: 'Geral' },
                      { value: 'SIMPLIFICADO', label: 'Simplificado' },
                      { value: 'EXCLUIDO', label: 'Excluído' },
                      { value: 'ISENTO', label: 'Isento' },
                      { value: 'NAO_SUJEITO', label: 'Não Sujeito' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Taxa IVA
                  </label>
                  <Select
                    value={vatRate}
                    onChange={setVatRate}
                    options={[
                      { value: '14', label: '14%' },
                      { value: '5', label: '5%' },
                      { value: '0', label: '0%' },
                      { value: 'EX', label: 'Isento' },
                      { value: 'NS', label: 'Não Sujeito' },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Moeda
                  </label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 font-mono bg-slate-50/70"
                  />
                </div>
              </div>

              {/* Localização */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Endereço / Sede
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
                    Município
                  </label>
                  <input
                    type="text"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Província
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Ex: Luanda"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
              </div>

              {/* Contactos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: geral@empresa.ao"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Ex: www.empresa.ao"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
              </div>

              {/* Banco */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Banco
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ex: BAI"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value)}
                    placeholder="AO06.0040.0000..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 font-mono bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    SWIFT
                  </label>
                  <input
                    type="text"
                    value={bankSwift}
                    onChange={(e) => setBankSwift(e.target.value)}
                    placeholder="BAIAO2LU"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 font-mono bg-slate-50/70"
                  />
                </div>
              </div>

              {/* e-Factura */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eInvoicing}
                    onChange={(e) => setEInvoicing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-[#0056d6]/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0056d6]"></div>
                </label>
                <span className="text-xs font-bold text-slate-700">
                  Facturação Electrónica (e-Factura AGT)
                </span>
              </div>

              {/* Buttons */}
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
                  {editingCompany ? 'Guardar Alterações' : 'Criar Organização'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: Add Branch ===================== */}
      {isBranchModalOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-[#0a1e42]">
                Nova Filial — {selectedCompany.name}
              </h3>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBranch} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Ex: Filial de Benguela"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Endereço</label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="Ex: Rua Major Kanhangulo, 45"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefone</label>
                  <input
                    type="text"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    placeholder="Ex: +244 923 000 111"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={branchEmail}
                    onChange={(e) => setBranchEmail(e.target.value)}
                    placeholder="Ex: filial@empresa.ao"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#0047b3] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Criar Filial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
