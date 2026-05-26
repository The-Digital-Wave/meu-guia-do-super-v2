import { useState } from "react";
import { Search } from "lucide-react";

import type { Product } from "../types/domain";

type ProductSearchControlProps = {
  value: string;
  products: Product[];
  disabled?: boolean;
  onValueChange: (value: string) => void;
  onPickProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  className?: string;
  inputClassName?: string;
  panelClassName?: string;
};

export function ProductSearchControl({
  value,
  products,
  disabled = false,
  onValueChange,
  onPickProduct,
  onAddToCart,
  className,
  inputClassName,
  panelClassName,
}: ProductSearchControlProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={className ?? "relative"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(Boolean(value.trim()))}
        placeholder="Busque um produto"
        disabled={disabled}
        className={inputClassName ?? "w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none disabled:bg-slate-100"}
      />
      {open && value && products.length ? (
        <div className={panelClassName ?? "absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-panel"}>
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-mist">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onPointerDown={(event) => {
                  event.preventDefault();
                  onPickProduct(product);
                  setOpen(false);
                }}
                onClick={() => {
                  onPickProduct(product);
                  setOpen(false);
                }}
              >
                <span className="block truncate font-semibold text-ink">{product.name}</span>
                <span className="text-sm text-slate-500">{product.brand ?? "Marca propria"} · {product.placements[0]?.shelf.sectionName ?? "Sem setor"}</span>
              </button>
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  onAddToCart(product);
                }}
                onClick={() => onAddToCart(product)}
                className="rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white"
              >
                + carrinho
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}