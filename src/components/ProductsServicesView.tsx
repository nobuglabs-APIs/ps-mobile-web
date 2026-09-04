import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Wrench,
  Tag,
  Percent,
  X,
  Check,
} from 'lucide-react';
import { ProductService } from '../types';
import { formatKz } from '../utils/formatters';
import { Select } from './Select';

interface ProductsServicesViewProps {
  products: ProductService[];
  onAddProduct: (product: ProductService) => void;
  onUpdateProduct: (product: ProductService) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductsServicesView: React.FC<ProductsServicesViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'Todos' | 'Serviço' | 'Produto'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductService | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(14);
  const [category, setCategory] = useState<'Serviço' | 'Produto'>('Serviço');
  const [unit, setUnit] = useState('un');

  const openNewModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice(0);
    setTaxPercent(14);
    setCategory('Serviço');
    setUnit('un');
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductService) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setPrice(p.price);
    setTaxPercent(p.taxPercent);
    setCategory(p.category || (p.type as 'Serviço' | 'Produto') || 'Serviço');
    setUnit(p.unit || 'un');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: name.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        taxPercent: Number(taxPercent) || 0,
        category,
        type: category,
        unit,
      });
    } else {
      onAddProduct({
        id: `p-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        price: Number(price) || 0,
        taxPercent: Number(taxPercent) || 0,
        category,
        type: category,
        unit,
      });
    }

    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.code && p.code.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterCategory === 'Todos') return true;
    return p.category === filterCategory || p.type === filterCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Topo: Título + Botão Novo Produto/Serviço */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a1e42] tracking-tight">
            Produtos &amp; Serviços
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Catálogo de itens para inserção direta durante a emissão de faturas
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="px-5 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] active:bg-[#003ca0] text-white text-sm font-bold border border-blue-400/25 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shrink-0 select-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Produto / Serviço</span>
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros de Categoria */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou descrição do item..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Alternador de Categoria */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
          {(['Todos', 'Serviço', 'Produto'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-white text-[#0a1e42] shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-[#0a1e42]'
              }`}
            >
              {cat === 'Todos' ? 'Todos' : cat === 'Serviço' ? 'Serviços' : 'Produtos'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Produtos / Serviços */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs px-6 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-800">
            {searchTerm || filterCategory !== 'Todos'
              ? 'Nenhum item corresponde aos filtros'
              : 'Ainda não existem produtos ou serviços'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || filterCategory !== 'Todos'
              ? 'Tenta alterar o termo de pesquisa ou a categoria.'
              : 'Adicione um produto ou serviço para poder inseri-lo diretamente nas faturas.'}
          </p>
          {!searchTerm && filterCategory === 'Todos' && (
            <button
              type="button"
              onClick={openNewModal}
              className="mt-5 px-4 py-2.5 rounded-xl bg-[#0056d6] hover:bg-[#004dc0] text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Adicionar Item
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Tabela — Desktop */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Nome / Descrição</th>
                    <th className="py-3.5 px-4 text-center">Tipo</th>
                    <th className="py-3.5 px-4 text-right">Preço Unitário</th>
                    <th className="py-3.5 px-4 text-center">IVA</th>
                    <th className="py-3.5 px-4 text-right">Total c/ IVA</th>
                    <th className="py-3.5 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm font-medium text-slate-700">
                  {filteredProducts.map((p) => {
                    const totalWithTax = p.price * (1 + (p.taxPercent || 0) / 100);
                    const isService = p.category === 'Serviço' || p.type === 'Serviço';

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Nome & Descrição */}
                        <td className="py-3.5 px-6">
                          <div className="font-extrabold text-[#0a1e42] group-hover:text-[#0056d6] transition-colors">
                            {p.name}
                          </div>
                          {p.code && (
                            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-mono">
                              {p.code}
                            </div>
                          )}
                          {p.description && (
                            <div className="text-[11px] text-slate-400 max-w-[320px] line-clamp-1">
                              {p.description}
                            </div>
                          )}
                        </td>

                        {/* Tipo */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isService
                                ? 'bg-blue-50 text-[#0056d6] border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isService ? (
                              <Wrench className="w-3 h-3" />
                            ) : (
                              <Package className="w-3 h-3" />
                            )}
                            <span>{isService ? 'Serviço' : 'Produto'}</span>
                          </span>
                        </td>

                        {/* Preço Unitário */}
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                          {formatKz(p.price)}
                        </td>

                        {/* IVA */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap text-slate-600 font-semibold">
                          {p.taxPercent}%
                        </td>

                        {/* Total com IVA */}
                        <td className="py-3.5 px-4 text-right font-extrabold text-[#0a1e42] whitespace-nowrap">
                          {formatKz(totalWithTax)}
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-2 rounded-lg text-slate-500 hover:text-[#0a1e42] hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Editar item"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cartões — Mobile / Tablet */}
          <div className="lg:hidden space-y-3">
            {filteredProducts.map((p) => {
              const totalWithTax = p.price * (1 + (p.taxPercent || 0) / 100);
              const isService = p.category === 'Serviço' || p.type === 'Serviço';

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${
                            isService
                              ? 'bg-blue-50 text-[#0056d6] border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isService ? (
                            <Wrench className="w-5 h-5" />
                          ) : (
                            <Package className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-[#0a1e42] text-sm truncate">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {isService ? 'Serviço' : 'Produto'}
                            {p.taxPercent > 0 ? ` • IVA ${p.taxPercent}%` : ' • Isento'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase text-slate-400 font-semibold">
                          C/ IVA
                        </div>
                        <div className="font-extrabold text-[#0a1e42] text-sm whitespace-nowrap">
                          {formatKz(totalWithTax)}
                        </div>
                      </div>
                    </div>

                    {p.description && (
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 line-clamp-2">
                        {p.description}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold">
                        Preço unitário
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {formatKz(p.price)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => openEditModal(p)}
                      className="py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => onDeleteProduct(p.id)}
                      className="py-2.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Adicionar / Editar Produto/Serviço */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-[#0a1e42]">
                {editingProduct ? 'Editar Item' : 'Novo Produto / Serviço'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Tipo: Serviço ou Produto */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tipo de Item *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('Serviço')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      category === 'Serviço'
                        ? 'bg-blue-50 border-[#0056d6] text-[#0056d6]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Serviço</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('Produto')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      category === 'Produto'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Produto</span>
                  </button>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome do Produto / Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Consultoria em TI ou Fornecimento de Servidor"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70"
                />
              </div>

              {/* Descrição Detalhada */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição / Especificação
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhamento técnico ou âmbito de execução..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 resize-none"
                />
              </div>

              {/* Preço e IVA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preço Unitário (Kz) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={price || ''}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 font-semibold text-[#0a1e42]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Taxa de IVA (%)
                  </label>
                  <Select
                    value={String(taxPercent)}
                    onChange={(v) => setTaxPercent(parseInt(v, 10))}
                    options={[
                      { value: '14', label: '14% (Regime Geral)' },
                      { value: '7', label: '7% (Regime Especial)' },
                      { value: '5', label: '5% (Bens Essenciais)' },
                      { value: '0', label: '0% (Isento)' },
                    ]}
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
                  {editingProduct ? 'Guardar Alterações' : 'Adicionar ao Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
