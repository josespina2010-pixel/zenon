import { useCallback, useEffect, useState } from 'react';
import { Package, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, type Order } from '../types';

interface OrdersModalProps {
  open: boolean;
  onClose: () => void;
}

export function OrdersModal({ open, onClose }: OrdersModalProps) {
  const { firebaseUser, signInWithGoogle, getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await getToken();
      if (!token) {
        setErrorMsg('No se pudo validar tu sesión.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudieron cargar los pedidos.');
      } else {
        setOrders(data);
      }
    } catch {
      setErrorMsg('Error de conexión al consultar tus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, getToken]);

  useEffect(() => {
    if (open && firebaseUser) {
      loadOrders();
    }
  }, [open, firebaseUser, loadOrders]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="orders-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#111114] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2
            id="orders-title"
            className="font-display text-lg font-bold text-zinc-100"
          >
            Mis pedidos
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar historial de pedidos"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!firebaseUser ? (
            <div className="py-10 text-center">
              <Package
                className="mx-auto mb-3 h-8 w-8 text-red-500"
                aria-hidden="true"
              />
              <p className="font-display text-base font-semibold text-zinc-100">
                Consulta el estado de tus envíos
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-400">
                Inicia sesión con tu cuenta de Google para revisar los pedidos
                registrados en la base de datos.
              </p>
              <button
                type="button"
                onClick={signInWithGoogle}
                className="mt-5 min-h-[40px] rounded-md bg-red-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
              >
                Iniciar sesión con Google
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-3 py-6">
              <div className="h-24 animate-pulse rounded-lg bg-zinc-900" />
              <div className="h-24 animate-pulse rounded-lg bg-zinc-900" />
            </div>
          ) : errorMsg ? (
            <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
              {errorMsg}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-display text-base font-semibold text-zinc-200">
                Aún no tienes pedidos registrados
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                Cuando confirmes una compra en la bolsa aparecerá aquí con su
                número de seguimiento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-lg border border-zinc-800 bg-[#09090B] p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-mono font-semibold text-zinc-100">
                        #{order.orderNumber}
                      </span>
                      <span className="text-zinc-600" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs font-medium text-red-400">
                        {order.status}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-white">
                      {formatCurrency(order.totalCents)}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-sm">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between text-zinc-300"
                      >
                        <span>
                          {item.quantity} × {item.mangaTitle}
                        </span>
                        <span className="font-mono tabular-nums text-zinc-400">
                          {formatCurrency(item.quantity * item.unitPriceCents)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-zinc-800/80 pt-3 text-xs text-zinc-500">
                    <span>Envío: {order.shippingAddress}</span>
                    <span aria-hidden="true">·</span>
                    <span>Pago: {order.paymentMethod}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
