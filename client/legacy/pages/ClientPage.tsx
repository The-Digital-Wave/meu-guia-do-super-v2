import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, MapPinned, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { CartToggleButton } from "../components/CartToggleButton";
import { GroceryDrawer } from "../components/GroceryDrawer";
import { LayoutCanvas } from "../components/LayoutCanvas";
import { ProductSearchControl } from "../components/ProductSearchControl";
import { ResponsiveHeader } from "../components/ResponsiveHeader";
import {
  fetchSupermarket,
  fetchSupermarkets,
  searchProducts,
} from "../lib/api";
import { optimizeRouteClient, previewRouteClient } from "../lib/clientRouting";
import { useAppStore } from "../store/useAppStore";
import type { Product, Supermarket } from "../types/domain";

export function ClientPage() {
  const [supermarketQuery, setSupermarketQuery] = useState("");
  const [debouncedSupermarketQuery, setDebouncedSupermarketQuery] =
    useState("");
  const [productQuery, setProductQuery] = useState("");
  const [showSupermarketOptions, setShowSupermarketOptions] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const {
    selectedSupermarket,
    currentPosition,
    previewRoute,
    optimizedRoute,
    cart,
    drawerOpen,
    setSelectedSupermarket,
    setCurrentPosition,
    setPreviewRoute,
    setOptimizedRoute,
    addToCart,
    toggleCartItem,
    setDrawerOpen,
    resetRoutes,
  } = useAppStore();

  const supermarketsQuery = useQuery({
    queryKey: ["supermarkets", debouncedSupermarketQuery],
    queryFn: () => fetchSupermarkets(debouncedSupermarketQuery),
    staleTime: 30_000,
  });

  //  Debounce so we don't fire an API call on every keystroke
  useEffect(() => {
    const id = setTimeout(
      () => setDebouncedSupermarketQuery(supermarketQuery),
      300
    );
    return () => clearTimeout(id);
  }, [supermarketQuery]);

  const supermarketDetailQuery = useQuery({
    queryKey: ["supermarket", selectedSupermarket?.id],
    queryFn: () => fetchSupermarket(selectedSupermarket!.id),
    enabled: Boolean(selectedSupermarket?.id),
  });

  const productsQuery = useQuery({
    queryKey: ["products", selectedSupermarket?.id, productQuery],
    queryFn: () => searchProducts(selectedSupermarket!.id, productQuery),
    enabled:
      Boolean(selectedSupermarket?.id) && productQuery.trim().length >= 2,
    staleTime: 30_000,
  });

  const supermarketModel = useMemo(
    () => supermarketDetailQuery.data ?? selectedSupermarket,
    [selectedSupermarket, supermarketDetailQuery.data]
  );

  useEffect(() => {
    if (supermarketDetailQuery.data) {
      setSelectedSupermarket(supermarketDetailQuery.data as Supermarket);
    }
  }, [setSelectedSupermarket, supermarketDetailQuery.data]);

  useEffect(() => {
    if (!navigator.geolocation || !selectedSupermarket) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      () => {
        setCurrentPosition({
          x: selectedSupermarket.entranceX,
          y: selectedSupermarket.entranceY,
        });
      },
      () => {
        setCurrentPosition({
          x: selectedSupermarket.entranceX,
          y: selectedSupermarket.entranceY,
        });
      },
      { enableHighAccuracy: true, maximumAge: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [selectedSupermarket, setCurrentPosition]);

  function handleSelectProduct(product: Product) {
    if (!supermarketModel || !currentPosition) {
      return;
    }

    try {
      const route = previewRouteClient(
        supermarketModel,
        currentPosition,
        product.id
      );
      setOptimizedRoute(undefined);
      setPreviewRoute(route);
      setRouteError(null);
    } catch (error) {
      setRouteError(
        error instanceof Error ? error.message : "Falha ao calcular rota"
      );
    }
  }

  function handleOptimizeRoute() {
    if (!supermarketModel || !currentPosition) {
      return;
    }

    try {
      const route = optimizeRouteClient(
        supermarketModel,
        currentPosition,
        cart.map((item) => item.productId)
      );
      setPreviewRoute(undefined);
      setOptimizedRoute(route);
      setRouteError(null);
    } catch (error) {
      setRouteError(
        error instanceof Error ? error.message : "Falha ao otimizar rota"
      );
    }
  }

  function handleSelectSupermarket(market: Supermarket) {
    setSupermarketQuery(market.name);
    setSelectedSupermarket(market);
    setProductQuery("");
    resetRoutes();
    setRouteError(null);
    setShowSupermarketOptions(false);
  }

  function handlePickProduct(product: Product) {
    handleSelectProduct(product);
  }

  function handleAddToCartFromOptions(product: Product) {
    addToCart(product);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e8f2ff_0%,#dbe9ff_34%,#f4f6fb_66%,#eef3f8_100%)] text-ink">
      <ResponsiveHeader
        headerClassName="border-b border-slate-200/60 bg-white/80 backdrop-blur-xl"
        containerClassName="mx-auto max-w-[1440px] px-6 py-5 lg:px-10"
        mobileTopContent={
          <div>
            <h1 className="font-display text-2xl">Meu Guia do Super</h1>
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
              O seu assistente de compras inteligente
            </p>
          </div>
        }
        mobileMenuContent={
          <nav className="grid gap-2 text-sm font-semibold uppercase tracking-[0.2em]">
            <Link to="/">Home</Link>
            <Link to="/admin">Admin</Link>
          </nav>
        }
        desktopContent={
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl">Meu Guia do Super</h1>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                O seu assistente de compras inteligente
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/"
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
              >
                Home
              </Link>
              <Link
                to="/admin"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Admin
              </Link>
            </div>
          </div>
        }
      />

      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        <div className="mb-6 grid gap-4 rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-panel lg:grid-cols-[1fr_1fr_auto]">
          <div
            className="relative"
            onBlur={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null
                )
              ) {
                setShowSupermarketOptions(false);
              }
            }}
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={supermarketQuery}
              onChange={(event) => {
                setSupermarketQuery(event.target.value);
                setShowSupermarketOptions(true);
              }}
              onFocus={() =>
                setShowSupermarketOptions(Boolean(supermarketQuery.trim()))
              }
              placeholder="Busque um supermercado"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none"
            />
            {showSupermarketOptions &&
            supermarketQuery &&
            // The dropdown opens if either results exist or the query is fetching.
            /**
             * Dropdown behavior:
             * - pending request: dropdown opens and shows loader
             * - finished with results: dropdown stays open and shows options
             * - finished with no results: dropdown closes
             */
            (supermarketsQuery.isFetching || supermarketsQuery.data?.length) ? (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel">
                {supermarketsQuery.isFetching ? (
                  <div className="flex items-center justify-center gap-3 px-4 py-3 text-sm text-slate-600">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sea" />
                    <span>Carregando...</span>
                  </div>
                ) : null}

                {supermarketsQuery.data?.map((market) => (
                  <button
                    key={market.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-mist"
                    onPointerDown={(event) => {
                      // On mobile, blur can hide the list before click; pointerdown runs first.
                      event.preventDefault();
                      handleSelectSupermarket(market);
                    }}
                    onClick={() => handleSelectSupermarket(market)}
                  >
                    <span>
                      <span className="block font-semibold text-ink">
                        {market.name}
                      </span>
                      <span className="text-sm text-slate-500">
                        {market.address} · {market.city}
                      </span>
                    </span>
                    <MapPinned className="h-4 w-4 text-sea" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <ProductSearchControl
            value={productQuery}
            products={productsQuery.data ?? []}
            disabled={!selectedSupermarket}
            onValueChange={setProductQuery}
            onPickProduct={handlePickProduct}
            onAddToCart={handleAddToCartFromOptions}
          />

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={
              !supermarketModel || !currentPosition || cart.length === 0
            }
            onClick={handleOptimizeRoute}
          >
            <Sparkles className="h-4 w-4" /> Otimizar
          </button>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-2">
          {/* <div className="rounded-[22px] border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700">
            <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500"><LocateFixed className="h-4 w-4" /> Posição</p>
            {currentPosition ? `X ${currentPosition.x.toFixed(1)} · Y ${currentPosition.y.toFixed(1)}` : "Sem calibracao"}
          </div> */}
          <div className="rounded-[22px] border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700">
            <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
              <MapPinned className="h-4 w-4" /> Loja
            </p>
            {supermarketModel
              ? supermarketModel.name
              : "Selecione um supermercado"}
          </div>
          <div className="rounded-[22px] border border-white/60 bg-white/80 px-4 py-3 text-sm text-slate-700">
            <p className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-500">
              <Compass className="h-4 w-4" /> Distância
            </p>
            {optimizedRoute
              ? `${optimizedRoute.totalDistance.toFixed(0)} m`
              : previewRoute
              ? `${
                  previewRoute.distance?.toFixed(0) ??
                  previewRoute.points.length
                } m`
              : "Nenhuma rota"}
          </div>
        </div>

        {routeError ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {routeError}
          </div>
        ) : null}

        <section className="grid gap-5">
          <article className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-panel">
            <LayoutCanvas
              supermarket={supermarketModel}
              currentPosition={currentPosition}
              previewRoute={previewRoute}
              optimizedRoute={optimizedRoute}
              pseudoFullscreenToolbarStart={
                <ProductSearchControl
                  value={productQuery}
                  products={productsQuery.data ?? []}
                  disabled={!selectedSupermarket}
                  onValueChange={setProductQuery}
                  onPickProduct={handlePickProduct}
                  onAddToCart={handleAddToCartFromOptions}
                  inputClassName="w-[50%] rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none disabled:bg-slate-100"
                  panelClassName="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-panel"
                />
              }
              pseudoFullscreenToolbarEnd={
                <CartToggleButton
                  count={cart.length}
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="relative"
                  buttonClassName="flex h-10 w-10 items-center justify-center rounded-[10px] border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
                  iconClassName="h-5 w-5"
                  badgeClassName="pointer-events-none absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white"
                />
              }
              onCurrentPositionChange={setCurrentPosition}
            />
          </article>
        </section>
      </main>

      <GroceryDrawer
        open={drawerOpen}
        cart={cart}
        optimizedRoute={optimizedRoute}
        onToggle={() => setDrawerOpen(!drawerOpen)}
        onCheckItem={toggleCartItem}
        onOptimize={handleOptimizeRoute}
        optimizing={false}
      />
    </div>
  );
}
