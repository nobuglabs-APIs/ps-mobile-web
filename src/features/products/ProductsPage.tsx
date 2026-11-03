import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Archive, Boxes, Camera, Edit3, ImagePlus, Plus, Search, Star, Trash2, Upload } from 'lucide-react';
import { adjustStock, createProduct, deactivateProduct, deleteProductImage, listProductImages, listProducts, setProductImageCover, updateProduct, uploadProductImages, type Product, type ProductImage, type ProductInput } from '../../api/psMobile';
import { Feedback, formatMoney, PageHeading } from '../../components/feedback/Feedback';
import { mediaUrl } from '../../api/client';

const newProduct = (): ProductInput => ({
  name: '',
  code: '',
  price_cents: 0,
  cost_cents: 0,
  track_stock: true,
  min_stock: 0,
  initial_stock: 0,
  pinned: false,
  tax_code: 'NOR',
  tax_percentage_bps: 1400,
  tax_exemption_code: '',
});

export function ProductsPage({
  workspaceId,
  currency,
  canManage,
}: {
  workspaceId: string;
  currency: string;
  canManage: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(newProduct());
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [stockDelta, setStockDelta] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const selectedPreviews = useMemo(() => selectedImages.map((file) => ({ file, url: URL.createObjectURL(file) })), [selectedImages]);
  useEffect(() => () => selectedPreviews.forEach(({ url }) => URL.revokeObjectURL(url)), [selectedPreviews]);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const page = await listProducts(workspaceId);
      setProducts(page.items);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível carregar o catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [workspaceId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return products.filter((product) => !term || product.name.toLocaleLowerCase().includes(term) || product.code?.toLocaleLowerCase().includes(term));
  }, [products, search]);

  const startCreate = () => {
    setEditing(null);
    setForm(newProduct());
    setSelectedImages([]);
    setExistingImages([]);
    setError('');
    setNotice('');
  };

  const startEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      code: product.code || '',
      price_cents: product.price_cents,
      cost_cents: product.cost_cents,
      track_stock: product.track_stock,
      min_stock: product.min_stock,
      initial_stock: 0,
      pinned: product.pinned,
      tax_code: product.tax_code,
      tax_percentage_bps: product.tax_percentage_bps,
      tax_exemption_code: product.tax_exemption_code || '',
    });
    setSelectedImages([]);
    void listProductImages(workspaceId, product.id)
      .then(setExistingImages)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar as imagens do produto.'));
    setError('');
    setNotice('');
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void (async () => {
      setBusy(true);
      setError('');
      setNotice('');
      try {
        const payload = {
          ...form,
          name: form.name.trim(),
          code: form.code?.trim() || undefined,
          tax_exemption_code: form.tax_exemption_code?.trim() || undefined,
        };
        const saved = editing
          ? await updateProduct(workspaceId, editing.id, payload)
          : await createProduct(workspaceId, payload);
        setEditing(saved);
        if (selectedImages.length) {
          await uploadProductImages(workspaceId, saved.id, selectedImages);
        }
        setNotice(editing ? 'Produto atualizado.' : 'Produto adicionado ao catálogo.');
        startCreate();
        await load();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Não foi possível guardar o produto.');
      } finally {
        setBusy(false);
      }
    })();
  };

  const addImages = (files: FileList | null) => {
    if (!files) return;
    const additions = Array.from(files);
    if (existingImages.length + selectedImages.length + additions.length > 8) {
      setError('Cada produto pode ter no máximo 8 imagens.');
      return;
    }
    setError('');
    setSelectedImages((current) => [...current, ...additions]);
  };

  const removeProductImage = async (image: ProductImage) => {
    if (!editing) return;
    setError('');
    try {
      await deleteProductImage(workspaceId, editing.id, image.id);
      setExistingImages(await listProductImages(workspaceId, editing.id));
      setNotice('Imagem removida.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível remover a imagem.');
    }
  };

  const makeCover = async (image: ProductImage) => {
    if (!editing) return;
    setError('');
    try {
      await setProductImageCover(workspaceId, editing.id, image.id);
      setExistingImages(await listProductImages(workspaceId, editing.id));
      setNotice('Imagem de capa atualizada.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar a capa.');
    }
  };

  const archive = async (product: Product) => {
    if (!window.confirm(`Desativar “${product.name}”? O histórico de vendas será preservado.`)) return;
    setError('');
    setNotice('');
    try {
      await deactivateProduct(workspaceId, product.id);
      setProducts((items) => items.filter((item) => item.id !== product.id));
      setNotice('Produto desativado; o histórico de vendas foi mantido.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível desativar o produto.');
    }
  };

  const changeStock = async (product: Product) => {
    const delta = Number(stockDelta[product.id]);
    if (!Number.isSafeInteger(delta) || delta === 0) {
      setError('Indique uma variação de stock diferente de zero.');
      return;
    }
    setError('');
    setNotice('');
    try {
      const updated = await adjustStock(workspaceId, product.id, {
        delta,
        reason: delta > 0 ? 'purchase' : 'adjustment',
        note: 'Atualização efetuada no catálogo PS Faturas',
      });
      setProducts((items) => items.map((item) => item.id === updated.id ? updated : item));
      setStockDelta((items) => ({ ...items, [product.id]: '' }));
      setNotice(`Stock de “${product.name}” atualizado.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível ajustar o stock.');
    }
  };

  const setField = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="CATÁLOGO"
        title="Produtos"
        description="Gerencie preços, impostos e níveis de stock usados nas vendas."
        action={canManage ? <button className="button button--primary" type="button" onClick={startCreate}><Plus size={17} /> Novo produto</button> : undefined}
      />
      {error && <Feedback message={error} />}
      {notice && <Feedback kind="success" message={notice} />}

      {canManage && <section className="surface-card product-editor">
        <div className="section-heading">
          <div>
            <h2>{editing ? 'Editar produto' : 'Adicionar ao catálogo'}</h2>
            <p>Os valores são guardados no PS-Mobile e utilizados no cálculo das vendas.</p>
          </div>
          {editing && <button className="button button--subtle" type="button" onClick={startCreate}>Cancelar edição</button>}
        </div>
        <form className="form-grid" onSubmit={save}>
          <div className="form-field form-field--wide product-image-editor">
            <span>Imagens do produto</span>
            <p className="form-hint">Adicione até 8 fotografias. A primeira imagem fica como capa e aparece no catálogo e nas vendas.</p>
            <div className="product-image-actions">
              <label className="button button--subtle"><ImagePlus size={16} /> Escolher do dispositivo<input accept="image/jpeg,image/png,image/webp" className="sr-only" multiple onChange={(event) => { addImages(event.target.files); event.currentTarget.value = ''; }} type="file" /></label>
              <label className="button button--subtle"><Camera size={16} /> Tirar fotografia<input accept="image/*" capture="environment" className="sr-only" onChange={(event) => { addImages(event.target.files); event.currentTarget.value = ''; }} type="file" /></label>
            </div>
            {(existingImages.length > 0 || selectedPreviews.length > 0) && (
              <div className="product-image-grid">
                {existingImages.map((image) => (
                  <div className={`product-image-tile${image.position === 0 ? ' product-image-tile--cover' : ''}`} key={image.id}>
                    <img alt={image.position === 0 ? 'Imagem de capa do produto' : 'Imagem do produto'} src={mediaUrl(image.url) || undefined} />
                    {image.position === 0 && <span className="product-image-cover-label">Capa</span>}
                    <div className="product-image-tile__actions">
                      {image.position !== 0 && <button aria-label="Definir como capa" className="icon-button" onClick={() => void makeCover(image)} title="Definir como capa" type="button"><Star size={14} /></button>}
                      <button aria-label="Remover imagem" className="icon-button icon-button--danger" onClick={() => void removeProductImage(image)} title="Remover imagem" type="button"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {selectedPreviews.map(({ file, url }, index) => (
                  <div className="product-image-tile product-image-tile--pending" key={`${file.name}-${file.lastModified}-${index}`}>
                    <img alt={`Pré-visualização: ${file.name}`} src={url} />
                    <button aria-label={`Remover ${file.name}`} className="icon-button icon-button--danger" onClick={() => setSelectedImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} title="Remover imagem" type="button"><Trash2 size={14} /></button>
                    <span className="product-image-pending-label">Por carregar</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Field label="Nome do produto" wide>
            <input maxLength={200} onChange={(event) => setField('name', event.target.value)} required value={form.name} />
          </Field>
          <Field label="Código / referência">
            <input maxLength={64} onChange={(event) => setField('code', event.target.value)} value={form.code || ''} />
          </Field>
          <Field label={`Preço (${currency})`}>
            <input min={0} onChange={(event) => setField('price_cents', Math.round(Number(event.target.value || 0) * 100))} required step="0.01" type="number" value={(form.price_cents / 100).toFixed(2)} />
          </Field>
          <Field label={`Custo (${currency})`}>
            <input min={0} onChange={(event) => setField('cost_cents', Math.round(Number(event.target.value || 0) * 100))} step="0.01" type="number" value={(form.cost_cents / 100).toFixed(2)} />
          </Field>
          <Field label="Código fiscal">
            <select onChange={(event) => setField('tax_code', event.target.value)} value={form.tax_code}>
              <option value="NOR">NOR — Tributação normal</option>
              <option value="NS">NS — Não sujeito</option>
              <option value="ISE">ISE — Isento</option>
            </select>
          </Field>
          <Field label="IVA (%)">
            <input max={100} min={0} onChange={(event) => setField('tax_percentage_bps', Math.round(Number(event.target.value || 0) * 100))} step="0.01" type="number" value={(form.tax_percentage_bps / 100).toFixed(2)} />
          </Field>
          <Field label="Stock mínimo">
            <input disabled={!form.track_stock} min={0} onChange={(event) => setField('min_stock', Number(event.target.value || 0))} type="number" value={form.min_stock} />
          </Field>
          {!editing && <Field label="Stock inicial">
            <input disabled={!form.track_stock} min={0} onChange={(event) => setField('initial_stock', Number(event.target.value || 0))} type="number" value={form.initial_stock} />
          </Field>}
          <label className="check-field"><input checked={form.track_stock} onChange={(event) => setField('track_stock', event.target.checked)} type="checkbox" /> Controlar stock</label>
          <label className="check-field"><input checked={form.pinned} onChange={(event) => setField('pinned', event.target.checked)} type="checkbox" /> Destacar em venda rápida</label>
          <div className="form-actions">
            <button className="button button--primary" disabled={busy} type="submit">{busy ? 'A guardar…' : editing ? 'Guardar alterações' : 'Adicionar produto'}</button>
          </div>
        </form>
      </section>}

      <section className="surface-card">
        <div className="section-heading section-heading--wrap">
          <div><h2>Catálogo ativo <span className="count-pill">{products.length}</span></h2><p>Produtos disponíveis para registo de vendas.</p></div>
          <label className="search-field"><Search size={17} /><input aria-label="Pesquisar produtos" onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome ou código" value={search} /></label>
        </div>
        {loading ? <div className="loading-panel">A carregar produtos…</div> : filtered.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Produto</th><th>Preço</th><th>IVA</th><th>Stock</th><th>Estado</th>{canManage && <th><span className="sr-only">Ações</span></th>}</tr></thead>
              <tbody>
                {filtered.map((product) => {
                  const low = product.track_stock && product.stock_quantity <= product.min_stock;
                  return (
                    <tr key={product.id}>
                      <td><span className="product-table-identity">{product.cover_url ? <img alt="" src={mediaUrl(product.cover_url) || undefined} /> : <span className="product-table-placeholder"><Boxes size={16} /></span>}<span><span className="table-primary">{product.name}</span><small className="table-secondary">{product.code || 'Sem código'}{product.image_count > 0 ? ` · ${product.image_count} ${product.image_count === 1 ? 'imagem' : 'imagens'}` : ''}</small></span></span></td>
                      <td>{formatMoney(product.price_cents, currency)}</td>
                      <td>{product.tax_percentage_bps / 100}% · {product.tax_code}</td>
                      <td>{product.track_stock ? <><span className={`status-pill${low ? ' status-pill--warning' : ' status-pill--success'}`}>{product.stock_quantity} un.</span>{canManage && <div className="stock-adjust"><input aria-label={`Variação do stock de ${product.name}`} onChange={(event) => setStockDelta((items) => ({ ...items, [product.id]: event.target.value }))} placeholder="+/-" type="number" value={stockDelta[product.id] || ''} /><button className="icon-button" onClick={() => void changeStock(product)} title="Aplicar ajuste de stock" type="button"><Archive size={15} /></button></div>}</> : <span className="status-pill">Sem controlo</span>}</td>
                      <td>{product.pinned ? <span className="status-pill status-pill--blue">Venda rápida</span> : <span className="table-secondary">Normal</span>}</td>
                      {canManage && <td><div className="table-actions"><button className="icon-button" onClick={() => startEdit(product)} title={`Editar ${product.name}`} type="button"><Edit3 size={16} /></button><button className="icon-button icon-button--danger" onClick={() => void archive(product)} title={`Desativar ${product.name}`} type="button"><Trash2 size={16} /></button></div></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><span><Boxes size={20} /></span><strong>{search ? 'Nenhum resultado' : 'O catálogo está vazio'}</strong><p>{search ? 'Altere os termos da pesquisa.' : 'Adicione o primeiro produto para começar a registar vendas.'}</p></div>}
      </section>
    </div>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`form-field${wide ? ' form-field--wide' : ''}`}><span>{label}</span>{children}</label>;
}
