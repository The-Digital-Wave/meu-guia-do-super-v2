import { Sparkles } from "lucide-react";

import { CartToggleButton } from "./CartToggleButton";
import type { OptimizedRoute } from "../types/domain";

type GroceryDrawerProps = {
  open: boolean;
  cart: Array<{ productId: string; name: string; shelfName: string; picked: boolean }>;
  optimizedRoute?: OptimizedRoute;
  onToggle: () => void;
  onCheckItem: (productId: string) => void;
  onOptimize: () => void;
  optimizing: boolean;
};

export function GroceryDrawer({ open, cart, optimizedRoute, onToggle, onCheckItem, onOptimize, optimizing }: GroceryDrawerProps) {
  return (
    <>
      <CartToggleButton count={cart.length} onClick={onToggle} className="fixed bottom-6 right-6 z-20" />

      <aside
        className={`fixed right-6 top-28 z-[10000] w-[360px] rounded-[28px] border border-white/60 bg-white/95 p-5 shadow-panel transition-all duration-300 ${open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-8 opacity-0"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Lista</p>
            <h3 className="font-display text-2xl text-ink">Carrinho inteligente</h3>
          </div>
          <button type="button" onClick={onOptimize} disabled={cart.length === 0 || optimizing} className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            {optimizing ? "Otimizando..." : "Otimizar"}
          </button>
        </div>

        <div className="space-y-3">
          {cart.length === 0 ? (
            <div className="rounded-2xl bg-mist p-4 text-sm text-slate-600">Adicione produtos pela busca para gerar a rota otimizada.</div>
          ) : (
            cart.map((item) => (
              <label key={item.productId} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <div>
                  <p className={`font-semibold text-ink ${item.picked ? "line-through opacity-50" : ""}`}>{item.name}</p>
                  <p className="text-slate-500">{item.shelfName}</p>
                </div>
                <input type="checkbox" checked={item.picked} onChange={() => onCheckItem(item.productId)} className="h-4 w-4 accent-coral" />
              </label>
            ))
          )}
        </div>

        {optimizedRoute ? (
          <div className="mt-5 rounded-[24px] bg-ink p-4 text-white">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">Sequencia otimizada</span>
            </div>
            <div className="space-y-2 text-sm">
              {optimizedRoute.orderedItems.map((item) => (
                <div key={item.productId} className="rounded-2xl bg-white/10 px-3 py-2">
                  {item.step}. {item.productName} · {item.sectionName} · {item.distance}m
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-white/80">Distancia total estimada: {optimizedRoute.totalDistance}m</p>
          </div>
        ) : null}
      </aside>
    </>
  );
}
