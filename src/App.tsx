import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { AdminModal } from './components/AdminModal';
import { CartDrawer } from './components/CartDrawer';
import { Header } from './components/Header';
import { MangaImage } from './components/MangaImage';
import { OrdersModal } from './components/OrdersModal';
import { ProductModal } from './components/ProductModal';
import { formatCurrency, type CartItem, type Manga } from './types';

const SAGA_TABS = [
  'Todas',
  'Reino del Trébol',
  'Noche Blanca',
  'Elfos y Demonios',
  'Reino de la Pica',
  'Box Sets',
];

function Storefront() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedSaga, setSelectedSaga] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('vol_asc');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (selectedSaga !== 'Todas') params.set('saga', selectedSaga);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (sortOrder) params.set('sort', sortOrder);

      const res = await fetch(`/api/mangas?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'No se pudo cargar el catálogo.');
      } else {
        setMangas(data);
      }
    } catch {
      setFetchError('No se pudo conectar con el servidor de catálogo.');
    } finally {
      setLoading(false);
    }
  }, [selectedSaga, searchQuery, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCatalog();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadCatalog]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const handleAddToCart = (manga: Manga, quantity = 1) => {
    if (manga.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.manga.id === manga.id);
      if (existing) {
        const nextQty = Math.min(manga.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.manga.id === manga.id ? { ...item, quantity: nextQty } : item
        );
      }
      return [...prev, { manga, quantity: Math.min(manga.stock, quantity) }];
    });
    showToast(`Añadido a tu bolsa: ${manga.title}`);
  };

  const handleUpdateQty = (mangaId: number, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.manga.id === mangaId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (mangaId: number) => {
    setCart((prev) => prev.filter((item) => item.manga.id !== mangaId));
  };

  const cartCount = useMemo(
    () => cart.reduce((sum, entry) => sum + entry.quantity, 0),
    [cart]
  );

  const boxSetManga = useMemo(
    () => mangas.find((m) => m.saga === 'Box Sets') || null,
    [mangas]
  );

  return (
    <div id="inicio" className="min-h-screen bg-[#09090B] text-zinc-100">
      <Header
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      {/* Aviso sutil al añadir producto */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-40 rounded-md border border-red-800/80 bg-[#141418] px-4 py-3 text-xs font-medium text-zinc-100 shadow-xl"
        >
          {toastMessage}
        </div>
      )}

      <main>
        {/* 1. Hero Showcase (Split asimétrico con scrim carmesí-obsidiana) */}
        <section className="border-b border-zinc-800/80 bg-[#09090B]">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-stretch gap-8 px-6 py-12 lg:grid-cols-12 lg:py-16">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-medium tracking-wide text-red-400">
                Colección Black Clover · Yūki Tabata
              </p>
              <h1 className="mt-3 font-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-white [text-wrap:balance]">
                El Grimorio Carmesí en Edición Definitiva
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
                Volúmenes tankōbon originales, ediciones coleccionistas de la
                Tríada Oscura y cofres rígidos en negro mate y rojo carmesí con
                inventario conectado en tiempo real.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#catalogo"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-red-700 whitespace-nowrap"
                >
                  <span>Explorar catálogo</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href="#edicion"
                  className="inline-flex min-h-[44px] items-center rounded-md border border-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white whitespace-nowrap"
                >
                  Ver cofre coleccionista
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[300px] overflow-hidden rounded-xl border border-zinc-800 bg-[#141418]">
                <MangaImage
                  src="/src/assets/images/hero_grimorio_showcase_1795615152146.jpg"
                  alt="Colección de mangas Black Clover en edición negra y carmesí junto al grimorio de cinco hojas"
                  title="Colección Black Clover"
                  className="h-full w-full object-cover lg:h-full"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tira de 4 columnas debajo del hero */}
          <div className="border-t border-zinc-800/80 bg-[#0C0C0E]">
            <div className="mx-auto grid max-w-[1200px] grid-cols-2 divide-y divide-zinc-800/80 px-6 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
              <div className="py-5 sm:pr-6">
                <p className="text-xs text-zinc-500">Disponibilidad</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">
                  Stock real en PostgreSQL
                </p>
              </div>
              <div className="py-5 sm:px-6">
                <p className="text-xs text-zinc-500">Envío gratuito</p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-zinc-100">
                  Pedidos desde $45.00
                </p>
              </div>
              <div className="py-5 sm:px-6">
                <p className="text-xs text-zinc-500">Encuadernación</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">
                  Sobrecubierta mate y foil
                </p>
              </div>
              <div className="py-5 sm:pl-6">
                <p className="text-xs text-zinc-500">Métodos de pago</p>
                <p className="mt-1 text-sm font-semibold text-zinc-100">
                  Contra entrega o tarjeta
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Catálogo Interactivo */}
        <section id="catalogo" className="mx-auto max-w-[1200px] px-6 py-16">
          <div className="flex flex-col gap-6 border-b border-zinc-800/80 pb-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Catálogo de volúmenes
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Selecciona una saga o busca por título, volumen o código ISBN.
                </p>
              </div>

              {/* Buscador y orden */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar tomo o saga..."
                    aria-label="Buscar manga"
                    className="h-10 w-full rounded-md border border-zinc-800 bg-[#141418] pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-red-600 focus:outline-none sm:w-64"
                  />
                </div>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  aria-label="Ordenar catálogo"
                  className="h-10 rounded-md border border-zinc-800 bg-[#141418] px-3 text-sm text-zinc-200 focus:border-red-600 focus:outline-none"
                >
                  <option value="vol_asc">Volumen (menor a mayor)</option>
                  <option value="price_asc">Precio (menor a mayor)</option>
                  <option value="price_desc">Precio (mayor a menor)</option>
                </select>
              </div>
            </div>

            {/* Pestañas de filtro por Saga */}
            <div
              role="tablist"
              aria-label="Filtrar por saga"
              className="flex flex-wrap items-center gap-2"
            >
              {SAGA_TABS.map((saga) => {
                const active = selectedSaga === saga;
                return (
                  <button
                    key={saga}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedSaga(saga)}
                    className={`min-h-[38px] rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-red-600 text-white'
                        : 'border border-zinc-800 bg-[#141418] text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
                    }`}
                  >
                    {saga}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de 3 columnas */}
          {loading ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-[460px] animate-pulse rounded-xl border border-zinc-800/60 bg-[#141418]"
                />
              ))}
            </div>
          ) : fetchError ? (
            <div className="mt-8 rounded-lg border border-red-900 bg-red-950/20 p-6 text-center">
              <p className="text-sm text-red-300">{fetchError}</p>
              <button
                type="button"
                onClick={loadCatalog}
                className="mt-4 rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                Reintentar carga
              </button>
            </div>
          ) : mangas.length === 0 ? (
            <div className="mt-8 rounded-lg border border-zinc-800 bg-[#141418] p-10 text-center">
              <p className="font-display text-lg font-semibold text-zinc-200">
                No se encontraron volúmenes con ese filtro
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSaga('Todas');
                  setSearchQuery('');
                }}
                className="mt-4 rounded-md border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500"
              >
                Mostrar todo el catálogo
              </button>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mangas.map((manga) => {
                const isOutOfStock = manga.stock <= 0;
                const volLabel =
                  manga.volumeNumber >= 100
                    ? 'Cofre 1–10'
                    : `Vol. ${String(manga.volumeNumber).padStart(2, '0')}`;

                return (
                  <article
                    key={manga.id}
                    className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-[#141418] transition-transform duration-200 hover:-translate-y-0.5 hover:border-zinc-700"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedManga(manga)}
                      className="relative aspect-[3/4] w-full overflow-hidden bg-[#09090B] text-left focus-visible:outline-2 focus-visible:outline-red-500"
                    >
                      <MangaImage
                        src={manga.coverUrl}
                        alt={`Manga Black Clover ${volLabel} — ${manga.title}`}
                        title={manga.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </button>

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        {/* Metadatos sin píldoras, separados con punto medio */}
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span className="font-mono text-red-400">
                            {volLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{manga.saga}</span>
                        </div>

                        <h3 className="mt-1.5 text-base font-semibold leading-snug text-zinc-100">
                          <button
                            type="button"
                            onClick={() => setSelectedManga(manga)}
                            className="text-left transition-colors hover:text-red-400"
                          >
                            {manga.title}
                          </button>
                        </h3>

                        <p className="mt-1 text-xs text-zinc-500">
                          {manga.edition} ·{' '}
                          <span className="tabular-nums">
                            {isOutOfStock
                              ? 'Agotado'
                              : `${manga.stock} disponibles`}
                          </span>
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-zinc-800/80 pt-4">
                        <span className="font-mono text-base font-semibold tabular-nums text-white">
                          {formatCurrency(manga.priceCents)}
                        </span>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(manga, 1)}
                          className="min-h-[38px] rounded-md bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 whitespace-nowrap"
                        >
                          {isOutOfStock ? 'Agotado' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Sección Editorial / Cofre Coleccionista */}
        <section
          id="edicion"
          className="border-t border-zinc-800/80 bg-[#0C0C0E]"
        >
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-stretch gap-10 px-6 py-16 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="h-full overflow-hidden rounded-xl border border-zinc-800 bg-[#141418]">
                <MangaImage
                  src="/src/assets/images/manga_boxset_coleccion_1795615154540.jpg"
                  alt="Cofre coleccionista de Black Clover en tela negra y estampado carmesí"
                  title="Cofre Coleccionista Vol. 1–10"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-medium tracking-wide text-red-400">
                Edición de archivo
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl [text-wrap:balance]">
                Cofre Coleccionista del Reino del Trébol
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-300">
                Diseñado para bibliotecas exigentes: estuche rígido forrado en
                tela negra de alto gramaje con grabado carmesí, papel marfil
                libre de ácido de 90 g/m² y traducción íntegra sin censura de
                los primeros diez volúmenes.
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-6 border-y border-zinc-800/80 py-5 text-xs">
                <div>
                  <dt className="text-zinc-500">Formato del cofre</dt>
                  <dd className="mt-1 font-medium text-zinc-100">
                    10 tomos + lámina metálica
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Acabado de cubierta</dt>
                  <dd className="mt-1 font-medium text-zinc-100">
                    Sobrecubierta mate carmesí
                  </dd>
                </div>
              </dl>

              {boxSetManga && (
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(boxSetManga, 1)}
                    disabled={boxSetManga.stock <= 0}
                    className="min-h-[44px] rounded-md bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 whitespace-nowrap"
                  >
                    Añadir cofre · {formatCurrency(boxSetManga.priceCents)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedManga(boxSetManga)}
                    className="min-h-[44px] rounded-md border border-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-700 hover:text-white whitespace-nowrap"
                  >
                    Ver ficha técnica
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 4. Footer limpio y sobrio */}
      <footer className="border-t border-zinc-800/80 bg-[#09090B]">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-base font-bold text-zinc-100">
              Grimorio Carmesí
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Tienda especializada en mangas de Black Clover · Catálogo e
              inventario en PostgreSQL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400">
            <a href="#catalogo" className="hover:text-zinc-100">
              Catálogo
            </a>
            <a href="#edicion" className="hover:text-zinc-100">
              Cofre Coleccionista
            </a>
            <button
              type="button"
              onClick={() => setOrdersOpen(true)}
              className="hover:text-zinc-100"
            >
              Mis pedidos
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="hover:text-zinc-100"
            >
              Bolsa ({cartCount})
            </button>
          </div>
        </div>
      </footer>

      <ProductModal
        manga={selectedManga}
        onClose={() => setSelectedManga(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
        onOrderSuccess={loadCatalog}
      />

      <OrdersModal open={ordersOpen} onClose={() => setOrdersOpen(false)} />

      <AdminModal
        open={adminOpen}
        mangas={mangas}
        onClose={() => setAdminOpen(false)}
        onRefreshCatalog={loadCatalog}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Storefront />
    </AuthProvider>
  );
}
