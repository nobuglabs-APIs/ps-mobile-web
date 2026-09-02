import React, { useState } from 'react';
import {
  Building2,
  Landmark,
  FileSpreadsheet,
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Receipt,
  Hash,
} from 'lucide-react';
import { CompanyInfo } from '../types';
import { initialCompanyInfo } from '../data/initialData';
import { PSLogo } from './PSLogo';

interface SettingsViewProps {
  companyInfo: CompanyInfo;
  onSaveCompanyInfo: (updated: CompanyInfo) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyInfo,
  onSaveCompanyInfo,
}) => {
  const [formData, setFormData] = useState<CompanyInfo>({ ...companyInfo });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field: keyof CompanyInfo, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompanyInfo(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Deseja restaurar as configurações padrão da PS – Comércio e Prestação de Serviços?'
      )
    ) {
      setFormData({ ...initialCompanyInfo });
      onSaveCompanyInfo(initialCompanyInfo);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056d6] flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0a1e42] tracking-tight">
              Configurações da Empresa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Gestão de dados fiscais, coordenadas bancárias e prefixos dos tipos de faturas
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configurações guardadas!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SEÇÃO 1: Identidade da Empresa */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <PSLogo variant="icon" size="sm" />
            <div>
              <h2 className="font-black text-base sm:text-lg text-[#0a1e42]">
                1. Identidade & Dados Fiscais da Empresa
              </h2>
              <p className="text-xs text-slate-500">
                Informações impressas no topo de todos os documentos (Facturas, Pró-Formas, Orçamentos, Recibos)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nome Oficial da Empresa
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-medium text-sm text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NIF (Número de Identificação Fiscal)
              </label>
              <input
                type="text"
                value={formData.nif}
                onChange={(e) => handleChange('nif', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-mono text-sm text-slate-800"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Slogan Oficial
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => handleChange('slogan', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 italic text-sm text-amber-700 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Subtítulo de Serviços (Áreas de Atuação)
              </label>
              <input
                type="text"
                value={formData.subSlogan}
                onChange={(e) => handleChange('subSlogan', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-700 font-medium"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: Contactos e Localização */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-[#0a1e42]">
                2. Contactos & Localização (Rodapé Oficial)
              </h2>
              <p className="text-xs text-slate-500">
                Endereço, WhatsApp e e-mail que figuram na faixa inferior do documento A4
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Endereço / Sede
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800"
                placeholder="Periferia do Projecto Nova Vida"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cidade / País
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800"
                placeholder="Luanda – Angola"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                WhatsApp / Telefone de Contacto
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-mono text-sm text-slate-800"
                  placeholder="931 032 313"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                E-mail para Faturação / Geral
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800"
                  placeholder="segundapatricia065@gmail.com"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: Coordenadas Bancárias */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-[#0a1e42]">
                3. Coordenadas Bancárias para Pagamentos
              </h2>
              <p className="text-xs text-slate-500">
                Apresentadas nas Facturas, Pró-Formas e Orçamentos para liquidação por transferência
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nome do Banco
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800"
                placeholder="Banco Angolano de Investimentos (BAI)"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Número de Conta
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-mono text-sm text-slate-800"
                placeholder="1827364510"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                IBAN (International Bank Account Number)
              </label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) => handleChange('iban', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0056d6] focus:ring-2 focus:ring-blue-100 font-mono text-sm text-slate-800 tracking-wider"
                placeholder="AO06.0040.0000.1827.3645.1012.4"
                required
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: Séries dos Tipos de Fatura & Impostos */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-[#0a1e42]">
                4. Séries e Prefixos dos Tipos de Documentos
              </h2>
              <p className="text-xs text-slate-500">
                Formato padrão de numeração gerado automaticamente para cada tipo de documento
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Factura (FT)
              </label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800"
                placeholder="FT-2025-"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Factura Pró-Forma (PF)
              </label>
              <input
                type="text"
                value={formData.proformaPrefix}
                onChange={(e) => handleChange('proformaPrefix', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800"
                placeholder="PF / 2025"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Factura-Recibo (FR)
              </label>
              <input
                type="text"
                value={formData.invoiceReceiptPrefix}
                onChange={(e) => handleChange('invoiceReceiptPrefix', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800"
                placeholder="FR / 2025"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Orçamento / Proposta (ORC)
              </label>
              <input
                type="text"
                value={formData.budgetPrefix}
                onChange={(e) => handleChange('budgetPrefix', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800"
                placeholder="ORC / 2025"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Recibo de Pagamento (RC)
              </label>
              <input
                type="text"
                value={formData.receiptPrefix}
                onChange={(e) => handleChange('receiptPrefix', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800"
                placeholder="2025"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Taxa Padrão de IVA (%)
              </label>
              <input
                type="number"
                value={formData.defaultTaxPercent}
                onChange={(e) => handleChange('defaultTaxPercent', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-800"
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 5: Termos e Observações Padrão */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-[#0a1e42]">
                5. Termos, Condições & Observações Padrão
              </h2>
              <p className="text-xs text-slate-500">
                Textos sugeridos automaticamente nos novos orçamentos e faturas
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Condições Comerciais Gerais
            </label>
            <textarea
              rows={2}
              value={formData.defaultConditions}
              onChange={(e) => handleChange('defaultConditions', e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:border-[#0056d6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Observações / Mensagem de Agradecimento Padrão
            </label>
            <textarea
              rows={2}
              value={formData.defaultNotes}
              onChange={(e) => handleChange('defaultNotes', e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:border-[#0056d6]"
            />
          </div>
        </div>

        {/* Action Bar Bottom */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrões PS</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#0047b3] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
};
