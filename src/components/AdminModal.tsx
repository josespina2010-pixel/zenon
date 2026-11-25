import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, type Manga, type Order } from '../types';

interface AdminModalProps {
  open: boolean;
  mangas: Manga[];
  onClose: () => void;
  onRefreshCatalog: () => void;
}

const COVER_PRESETS = [
  {
    label: 'Portada Grimorio Negro',
    url: '/src/assets/images/manga_cover_grimorio_negro_1795615152661.jpg',
  },
  {
    label: 'Portada Toros Negros',
    url: '/src/assets/images/manga_cover_toros_negros_1795615152743.jpg',
  },
  {
    label: 'Portada Reino de la Pica',
    url: '/src/assets/images/manga_cover_reino_pica_1795615153712.jpg',
  },
  {
    label: 'Cofre Coleccionista',
    url: '/src/assets/images/manga_boxset_coleccion_1795615154540.jpg',
  },
];

export function AdminModal({
  open,
  mangas,
  onClose,
  onRefreshCatalog,
}: AdminModalProps) {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<'inventory' | 'orders'>('inventory');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Formulario nuevo volumen
  const [volumeNumber, setVolumeNumber] = useState('34');
  const [title, setTitle] = useState('');
  const [saga, setSaga] = useState('Reino de la Pica');
  const [edition, setEdition] = useState('Tankōbon Estándar');
  const [priceUsd, setPriceUsd] = useState('14.90');
  const [stock, setStock] = useState('15');
  const [isbn, setIsbn] = useState('978-84-168-8934-9');
  const [coverUrl, setCoverUrl] = useState(COVER_PRESETS[0].url);
  const [synopsis, setSynopsis] = useState('');
  const [creating, setCreating] = useState(false);

  const loadAdminOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } finally {
      setLoadingOrders(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (open && tab === 'orders') {
      loadAdminOrders();
    }
  }, [open, tab, loadAdminOrders]);

  if (!open) return null;

  const handleCreateManga = async (e: FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setCreating(true);
    try {
      const token = await getToken();
      if (!token) return;

      const parsedPriceCents = Math.round(Number(priceUsd) * 100);
      const res = await fetch('/api/mangas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          volumeNumber: Number(volumeNumber),
          title: title.trim(),
          saga,
          edition,
          priceCents: parsedPriceCents,
          stock: Number(stock),
          isbn: isbn.trim(),
          coverUrl,
          synopsis: synopsis.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage(data.error || 'No se pudo registrar el volumen.');
      } else {
        setTitle('');
        setSynopsis('');
        setStatusMessage(`Volumen "${data.title}" guardado en PostgreSQL.`);
        onRefreshCatalog();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleStockAdjust = async (manga: Manga, nextStock: number) => {
    if (nextStock < 0) return;
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/mangas/${manga.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stock: nextStock }),
    });
    if (res.ok) {
      onRefreshCatalog();
    }
  };

  const handleDeleteManga = async (manga: Manga) => {
    setStatusMessage(null);
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/mangas/${manga.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMessage(data.error || 'No se pudo eliminar.');
    } else {
      setStatusMessage(`Eliminado "${manga.title}".`);
      onRefreshCatalog();
    }
  };

  const handleOrderStatusChange = async (orderId: number, status: string) => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      loadAdminOrders();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#111114] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-6">
            <h2
              id="admin-title"
              className="font-display text-lg font-bold text-zinc-100"
            >
              Gestión de tienda
            </h2>
            <div className="flex items-center gap-1 rounded-md bg-[#09090B] p-1">
              <button
                type="button"
                onClick={() => setTab('inventory')}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === 'inventory'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Inventario
              </button>
              <button
                type="button"
                onClick={() => setTab('orders')}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === 'orders'
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                Pedidos recibidos
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de gestión"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {statusMessage && (
            <div className="mb-5 rounded-md border border-zinc-700 bg-[#09090B] px-4 py-2.5 text-xs text-zinc-200">
              {statusMessage}
            </div>
          )}

          {tab === 'inventory' ? (
            <div className="space-y-8">
              {/* Tabla de inventario actual */}
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-[#09090B] text-xs text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Vol.</th>
                      <th className="px-4 py-3 font-medium">Título</th>
                      <th className="px-4 py-3 font-medium">Saga</th>
                      <th className="px-4 py-3 font-medium">Precio</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {mangas.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-900/40">
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-zinc-400">
                          {m.volumeNumber >= 100
                            ? 'BOX'
                            : String(m.volumeNumber).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3 font-medium text-zinc-100">
                          {m.title}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400">
                          {m.saga}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs tabular-nums text-zinc-200">
                          {formatCurrency(m.priceCents)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStockAdjust(m, m.stock - 1)}
                              className="h-7 w-7 rounded border border-zinc-800 bg-[#09090B] font-mono text-xs text-zinc-300 hover:border-zinc-700"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-mono text-xs tabular-nums text-zinc-100">
                              {m.stock}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStockAdjust(m, m.stock + 1)}
                              className="h-7 w-7 rounded border border-zinc-800 bg-[#09090B] font-mono text-xs text-zinc-300 hover:border-zinc-700"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteManga(m)}
                            aria-label={`Eliminar ${m.title}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-red-950/40 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Formulario para agregar nuevo tomo */}
              <form
                onSubmit={handleCreateManga}
                className="rounded-lg border border-zinc-800 bg-[#09090B] p-5"
              >
                <h3 className="font-display text-base font-semibold text-zinc-100">
                  Añadir nuevo volumen al catálogo
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs text-zinc-400">
                      Número de volumen
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={volumeNumber}
                      onChange={(e) => setVolumeNumber(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 font-mono text-sm text-zinc-100 focus:border-red-600 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-zinc-400">
                      Título del volumen
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej. La Espada del Rey Mago"
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400">Saga</label>
                    <select
                      value={saga}
                      onChange={(e) => setSaga(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 text-sm text-zinc-100 focus:border-red-600 focus:outline-none"
                    >
                      <option value="Reino del Trébol">Reino del Trébol</option>
                      <option value="Noche Blanca">Noche Blanca</option>
                      <option value="Elfos y Demonios">Elfos y Demonios</option>
                      <option value="Reino de la Pica">Reino de la Pica</option>
                      <option value="Box Sets">Box Sets</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400">
                      Edición
                    </label>
                    <select
                      value={edition}
                      onChange={(e) => setEdition(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 text-sm text-zinc-100 focus:border-red-600 focus:outline-none"
                    >
                      <option value="Tankōbon Estándar">
                        Tankōbon Estándar
                      </option>
                      <option value="Edición Coleccionista">
                        Edición Coleccionista
                      </option>
                      <option value="Box Set Completo">Box Set Completo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400">
                      Portada de estudio
                    </label>
                    <select
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 text-sm text-zinc-100 focus:border-red-600 focus:outline-none"
                    >
                      {COVER_PRESETS.map((preset) => (
                        <option key={preset.url} value={preset.url}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400">
                      Precio (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 font-mono text-sm text-zinc-100 focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400">
                      Stock inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 font-mono text-sm text-zinc-100 focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400">ISBN</label>
                    <input
                      type="text"
                      required
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 font-mono text-sm text-zinc-100 focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs text-zinc-400">
                      Sinopsis
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={synopsis}
                      onChange={(e) => setSynopsis(e.target.value)}
                      placeholder="Resumen editorial del volumen..."
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#111114] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={creating}
                    className="min-h-[40px] rounded-md bg-red-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {creating ? 'Guardando...' : 'Publicar volumen'}
                  </button>
                </div>
              </form>
            </div>
          ) : loadingOrders ? (
            <div className="space-y-3 py-4">
              <div className="h-20 animate-pulse rounded-lg bg-zinc-900" />
              <div className="h-20 animate-pulse rounded-lg bg-zinc-900" />
            </div>
          ) : orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">
              No hay pedidos registrados todavía.
            </p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-zinc-800 bg-[#09090B] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-zinc-100">
                        #{order.orderNumber} · {order.customerName}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {order.userEmail} · {order.shippingAddress} (
                        {order.postalCode})
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold tabular-nums text-white">
                        {formatCurrency(order.totalCents)}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleOrderStatusChange(order.id, e.target.value)
                        }
                        className="rounded border border-zinc-700 bg-[#111114] px-2.5 py-1.5 text-xs text-zinc-100 focus:border-red-600 focus:outline-none"
                      >
                        <option value="Confirmado">Confirmado</option>
                        <option value="Preparando envío">
                          Preparando envío
                        </option>
                        <option value="Enviado">Enviado</option>
                        <option value="Entregado">Entregado</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
