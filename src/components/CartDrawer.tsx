import { useState, type FormEvent } from 'react';
import { CheckCircle2, Minus, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, type CartItem, type Order } from '../types';
import { MangaImage } from './MangaImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (mangaId: number, quantity: number) => void;
  onRemoveItem: (mangaId: number) => void;
  onClearCart: () => void;
  onOrderSuccess: () => void;
}

const FREE_SHIPPING_CENTS = 4500;
const SHIPPING_FEE_CENTS = 490;

export function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}: CartDrawerProps) {
  const { firebaseUser, profile, signInWithGoogle, getToken } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Contra entrega');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!open) return null;

  const subtotalCents = items.reduce(
    (sum, entry) => sum + entry.manga.priceCents * entry.quantity,
    0
  );
  const shippingCents =
    subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_CENTS
      ? 0
      : SHIPPING_FEE_CENTS;
  const totalCents = subtotalCents + shippingCents;
  const missingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_CENTS - subtotalCents
  );

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!firebaseUser) {
      setErrorMsg('Inicia sesión con Google para confirmar tu pedido.');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        setErrorMsg('No se pudo validar tu sesión. Intenta ingresar de nuevo.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: customerName.trim() || profile?.displayName || 'Cliente',
          customerPhone: customerPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          postalCode: postalCode.trim(),
          paymentMethod,
          items: items.map((entry) => ({
            mangaId: entry.manga.id,
            quantity: entry.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo confirmar el pedido.');
        setSubmitting(false);
        return;
      }

      setConfirmedOrder(data);
      onClearCart();
      onOrderSuccess();
      setCustomerPhone('');
      setShippingAddress('');
      setPostalCode('');
    } catch {
      setErrorMsg('Error de red al procesar el pedido. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setConfirmedOrder(null);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bolsa de compra"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      onClick={handleClose}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-[#111114] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del cajón */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-zinc-100">
            {confirmedOrder ? 'Pedido confirmado' : 'Tu bolsa de compra'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar bolsa"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {confirmedOrder ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-zinc-800 bg-[#09090B] p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-mono text-xs font-semibold text-red-400">
                      Pedido #{confirmedOrder.orderNumber} Confirmado —{' '}
                      {confirmedOrder.status}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      El inventario se actualizó en la base de datos. Recibirás
                      tu paquete en{' '}
                      <span className="text-zinc-100">
                        {confirmedOrder.shippingAddress}
                      </span>{' '}
                      ({confirmedOrder.postalCode}).
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-semibold tracking-wide text-zinc-400">
                  Resumen del recibo
                </h3>
                <ul className="divide-y divide-zinc-800/80">
                  {confirmedOrder.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <div className="pr-3">
                        <p className="font-medium text-zinc-100">
                          {item.mangaTitle}
                        </p>
                        <p className="font-mono text-xs text-zinc-500 tabular-nums">
                          {item.quantity} ×{' '}
                          {formatCurrency(item.unitPriceCents)}
                        </p>
                      </div>
                      <span className="font-mono text-sm tabular-nums text-zinc-200">
                        {formatCurrency(item.quantity * item.unitPriceCents)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-1.5 border-t border-zinc-800 pt-3 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Método de pago</span>
                    <span className="text-zinc-200">
                      {confirmedOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-white">
                    <span>Total pagado / por cobrar</span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(confirmedOrder.totalCents)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full min-h-[44px] rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Seguir explorando mangas
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <p className="font-display text-lg font-semibold text-zinc-200">
                Tu bolsa está vacía
              </p>
              <p className="mt-2 max-w-xs text-sm text-zinc-400">
                Explora los volúmenes de Black Clover o el cofre coleccionista
                para comenzar tu pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Umbral de envío gratis */}
              <div className="rounded-lg border border-zinc-800 bg-[#09090B] px-4 py-3 text-xs text-zinc-300">
                {missingForFreeShipping === 0 ? (
                  <span>
                    Envío gratuito desbloqueado en pedidos desde{' '}
                    <span className="font-mono tabular-nums text-zinc-100">
                      {formatCurrency(FREE_SHIPPING_CENTS)}
                    </span>
                    .
                  </span>
                ) : (
                  <span>
                    Te faltan{' '}
                    <span className="font-mono font-semibold tabular-nums text-red-400">
                      {formatCurrency(missingForFreeShipping)}
                    </span>{' '}
                    para envío gratuito.
                  </span>
                )}
              </div>

              {/* Lista de artículos */}
              <ul className="divide-y divide-zinc-800/80">
                {items.map(({ manga, quantity }) => (
                  <li key={manga.id} className="flex gap-4 py-4">
                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded border border-zinc-800 bg-[#09090B]">
                      <MangaImage
                        src={manga.coverUrl}
                        alt={manga.title}
                        title={manga.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">
                            {manga.title}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-400">
                            {manga.volumeNumber >= 100
                              ? 'Cofre Especial'
                              : `Vol. ${String(manga.volumeNumber).padStart(2, '0')}`}{' '}
                            · {manga.edition}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(manga.id)}
                          aria-label={`Quitar ${manga.title}`}
                          className="p-1 text-zinc-500 transition-colors hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded border border-zinc-800 bg-[#09090B]">
                          <button
                            type="button"
                            onClick={() =>
                              quantity > 1
                                ? onUpdateQty(manga.id, quantity - 1)
                                : onRemoveItem(manga.id)
                            }
                            aria-label="Disminuir cantidad"
                            className="inline-flex h-8 w-8 items-center justify-center text-zinc-400 hover:text-white"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center font-mono text-xs tabular-nums text-zinc-100">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            disabled={quantity >= manga.stock}
                            onClick={() => onUpdateQty(manga.id, quantity + 1)}
                            aria-label="Aumentar cantidad"
                            className="inline-flex h-8 w-8 items-center justify-center text-zinc-400 hover:text-white disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <span className="font-mono text-sm font-semibold tabular-nums text-zinc-100">
                          {formatCurrency(manga.priceCents * quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Resumen de costos */}
              <div className="space-y-2 border-t border-zinc-800 pt-4 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums text-zinc-200">
                    {formatCurrency(subtotalCents)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Envío</span>
                  <span className="font-mono tabular-nums text-zinc-200">
                    {shippingCents === 0
                      ? 'Gratis'
                      : formatCurrency(shippingCents)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-2 text-base font-semibold text-white">
                  <span>Total</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(totalCents)}
                  </span>
                </div>
              </div>

              {/* Formulario de envío */}
              <form
                onSubmit={handleCheckout}
                className="space-y-4 border-t border-zinc-800 pt-5"
              >
                <h3 className="text-sm font-semibold text-zinc-100">
                  Datos de envío y pago
                </h3>

                {!firebaseUser && (
                  <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-4">
                    <p className="text-xs leading-relaxed text-zinc-300">
                      Inicia sesión con Google para vincular tu pedido a tu
                      historial y verificar la entrega.
                    </p>
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      className="mt-3 w-full min-h-[40px] rounded-md border border-red-700 bg-red-600/20 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-600 hover:text-white"
                    >
                      Continuar con Google
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="checkout-name"
                      className="block text-xs font-medium text-zinc-400"
                    >
                      Nombre completo
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={profile?.displayName || 'Tu nombre completo'}
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="checkout-phone"
                        className="block text-xs font-medium text-zinc-400"
                      >
                        Teléfono
                      </label>
                      <input
                        id="checkout-phone"
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+52 55 0000 0000"
                        className="mt-1 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="checkout-zip"
                        className="block text-xs font-medium text-zinc-400"
                      >
                        Código postal
                      </label>
                      <input
                        id="checkout-zip"
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="06000"
                        className="mt-1 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-red-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-address"
                      className="block text-xs font-medium text-zinc-400"
                    >
                      Dirección de entrega
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Calle, número, colonia y ciudad"
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-payment"
                      className="block text-xs font-medium text-zinc-400"
                    >
                      Método de pago
                    </label>
                    <select
                      id="checkout-payment"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 focus:border-red-600 focus:outline-none"
                    >
                      <option value="Contra entrega">Contra entrega</option>
                      <option value="Tarjeta en entrega">
                        Tarjeta en entrega
                      </option>
                      <option value="Transferencia bancaria">
                        Transferencia bancaria
                      </option>
                    </select>
                  </div>
                </div>

                {errorMsg && (
                  <p className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !firebaseUser}
                  className="w-full min-h-[44px] rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  {submitting
                    ? 'Confirmando pedido...'
                    : `Confirmar pedido · ${formatCurrency(totalCents)}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
