import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, Expand, LayoutGrid, Move3d, PlusCircle, Shrink, Store } from "lucide-react";
import { Link } from "react-router-dom";

import { LayoutCanvas } from "../components/LayoutCanvas";
import { ResponsiveHeader } from "../components/ResponsiveHeader";
import { createProduct, createShelf, downloadLayout, fetchSupermarket, fetchSupermarkets, updateShelf } from "../lib/api";

export function AdminPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [shelfForm, setShelfForm] = useState({ name: "", sectionName: "", color: "#1f6f5f", x: 10, y: 10, width: 18, height: 6, racks: 1, sections: 3 });
  const [productForm, setProductForm] = useState({ name: "", brand: "", category: "", shelfId: "", sectionIndex: 1, quantity: 10 });
  const queryClient = useQueryClient();

  const supermarketsQuery = useQuery({
    queryKey: ["admin-supermarkets"],
    queryFn: () => fetchSupermarkets(),
  });

  const selectedSupermarketId = selectedId || supermarketsQuery.data?.[0]?.id || "";

  const supermarketQuery = useQuery({
    queryKey: ["admin-supermarket", selectedSupermarketId],
    queryFn: () => fetchSupermarket(selectedSupermarketId),
    enabled: Boolean(selectedSupermarketId),
  });

  const createShelfMutation = useMutation({
    mutationFn: createShelf,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-supermarket", selectedSupermarketId] });
      setShelfForm({ name: "", sectionName: "", color: "#1f6f5f", x: 10, y: 10, width: 18, height: 6, racks: 1, sections: 3 });
    },
  });

  const moveShelfMutation = useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number }) => updateShelf(id, { x, y }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-supermarket", selectedSupermarketId] });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-supermarket", selectedSupermarketId] });
      setProductForm({ name: "", brand: "", category: "", shelfId: supermarketQuery.data?.layout?.shelves[0]?.id ?? "", sectionIndex: 1, quantity: 10 });
    },
  });

  const shelves = supermarketQuery.data?.layout?.shelves ?? [];

  const shelfOptions = useMemo(() => shelves.map((shelf) => ({ id: shelf.id, label: `${shelf.name} · ${shelf.sectionName}` })), [shelves]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#102a43_0%,#15395b_55%,#f6f1e8_55%,#f6f1e8_100%)] text-ink">
      <ResponsiveHeader
        headerClassName="border-b border-white/10 bg-ink/90 text-white backdrop-blur-xl"
        containerClassName="mx-auto max-w-7xl px-6 py-5 lg:px-10"
        mobileTopContent={(
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-citrus">Modo admin</p>
            <h1 className="font-display text-2xl">Editor de layout e estoque</h1>
          </div>
        )}
        mobileMenuContent={(
          <nav className="grid gap-2 text-sm font-semibold uppercase tracking-[0.2em]">
            <Link to="/">Home</Link>
            <Link to="/app">Cliente</Link>
          </nav>
        )}
        desktopContent={(
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-citrus">Modo admin</p>
              <h1 className="font-display text-4xl">Editor de layout e estoque</h1>
            </div>
            <div className="flex gap-3">
              <Link to="/" className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold">Home</Link>
              <Link to="/app" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">Cliente</Link>
            </div>
          </div>
        )}
      />

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <div className="mb-6 grid gap-4 rounded-[32px] bg-white/10 p-5 text-white shadow-panel lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm"><LayoutGrid className="h-4 w-4" /> Dotted grid</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm"><Move3d className="h-4 w-4" /> Drag shelves</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm"><Store className="h-4 w-4" /> Download JSON layout</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold" onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}><Shrink className="inline h-4 w-4" /> Zoom out</button>
            <button type="button" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold" onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))}><Expand className="inline h-4 w-4" /> Zoom in</button>
            <button type="button" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold" onClick={() => setZoom(1)}>Center grid</button>
            <button
              type="button"
              className="rounded-full bg-citrus px-4 py-2 text-sm font-semibold text-ink"
              onClick={async () => {
                if (!supermarketQuery.data?.layout?.id) {
                  return;
                }

                const data = await downloadLayout(supermarketQuery.data.layout.id);
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `layout-${supermarketQuery.data.name}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <ArrowDownToLine className="inline h-4 w-4" /> Download layout
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
          <aside className="rounded-[32px] bg-white p-5 shadow-panel">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Ferramentas</p>
            <h2 className="mt-2 font-display text-3xl">Painel lateral</h2>
            <select value={selectedSupermarketId} onChange={(event) => setSelectedId(event.target.value)} className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none">
              {supermarketsQuery.data?.map((market) => (
                <option key={market.id} value={market.id}>{market.name}</option>
              ))}
            </select>

            <form
              className="mt-6 space-y-3 rounded-[24px] bg-mist p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!supermarketQuery.data?.layout?.id) {
                  return;
                }

                createShelfMutation.mutate({
                  layoutId: supermarketQuery.data.layout.id,
                  rotation: 0,
                  ...shelfForm,
                });
              }}
            >
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-500"><PlusCircle className="h-4 w-4" /> Nova estante</p>
              <input value={shelfForm.name} onChange={(event) => setShelfForm((state) => ({ ...state, name: event.target.value }))} placeholder="Nome da estante" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <input value={shelfForm.sectionName} onChange={(event) => setShelfForm((state) => ({ ...state, sectionName: event.target.value }))} placeholder="Setor" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={shelfForm.x} onChange={(event) => setShelfForm((state) => ({ ...state, x: Number(event.target.value) }))} placeholder="X" className="rounded-2xl border border-slate-200 px-4 py-3" />
                <input type="number" value={shelfForm.y} onChange={(event) => setShelfForm((state) => ({ ...state, y: Number(event.target.value) }))} placeholder="Y" className="rounded-2xl border border-slate-200 px-4 py-3" />
                <input type="number" value={shelfForm.width} onChange={(event) => setShelfForm((state) => ({ ...state, width: Number(event.target.value) }))} placeholder="Largura" className="rounded-2xl border border-slate-200 px-4 py-3" />
                <input type="number" value={shelfForm.height} onChange={(event) => setShelfForm((state) => ({ ...state, height: Number(event.target.value) }))} placeholder="Altura" className="rounded-2xl border border-slate-200 px-4 py-3" />
              </div>
              <button type="submit" disabled={createShelfMutation.isPending} className="w-full rounded-full bg-ink px-5 py-3 font-semibold text-white">Criar estante</button>
            </form>
          </aside>

          <section>
            <LayoutCanvas
              supermarket={supermarketQuery.data}
              currentPosition={{ x: supermarketQuery.data?.entranceX ?? 0, y: supermarketQuery.data?.entranceY ?? 0 }}
              editable
              scale={zoom}
              onShelfMove={(shelf, point) => moveShelfMutation.mutate({ id: shelf.id, x: Number(point.x.toFixed(1)), y: Number(point.y.toFixed(1)) })}
            />
          </section>

          <aside className="rounded-[32px] bg-white p-5 shadow-panel">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Produtos</p>
            <h2 className="mt-2 font-display text-3xl">Novo produto</h2>
            <form
              className="mt-5 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                createProductMutation.mutate(productForm);
              }}
            >
              <input value={productForm.name} onChange={(event) => setProductForm((state) => ({ ...state, name: event.target.value }))} placeholder="Nome do produto" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <input value={productForm.brand} onChange={(event) => setProductForm((state) => ({ ...state, brand: event.target.value }))} placeholder="Marca" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <input value={productForm.category} onChange={(event) => setProductForm((state) => ({ ...state, category: event.target.value }))} placeholder="Categoria" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
              <select value={productForm.shelfId} onChange={(event) => setProductForm((state) => ({ ...state, shelfId: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3">
                <option value="">Selecione a estante</option>
                {shelfOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min={1} value={productForm.sectionIndex} onChange={(event) => setProductForm((state) => ({ ...state, sectionIndex: Number(event.target.value) }))} placeholder="Secao" className="rounded-2xl border border-slate-200 px-4 py-3" />
                <input type="number" min={0} value={productForm.quantity} onChange={(event) => setProductForm((state) => ({ ...state, quantity: Number(event.target.value) }))} placeholder="Quantidade" className="rounded-2xl border border-slate-200 px-4 py-3" />
              </div>
              <button type="submit" disabled={createProductMutation.isPending || !productForm.shelfId} className="w-full rounded-full bg-coral px-5 py-3 font-semibold text-white">Criar produto</button>
            </form>

            <div className="mt-6 rounded-[24px] bg-mist p-4 text-sm text-slate-600">
              Arraste as estantes no grid para atualizar o layout visualmente. O backend persiste a nova coordenada via `PUT /shelves/:id`.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
