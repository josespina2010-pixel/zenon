import { useEffect, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { formatCurrency, type Manga } from '../types';
import { MangaImage } from './MangaImage';

interface ProductModalProps {
  manga: Manga | null;
  onClose: () => void;
  onAddToCart: (manga: Manga, quantity: number) => void;
}

export function ProductModal({
  manga,
  onClose,
  onAddToCart,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [manga?.id]);

  useEffect(() => {
    if (!manga) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [manga, onClose]);

  if (!manga) return null;

  const isOutOfStock = manga.stock <= 0;
  const volLabel =
    manga.volumeNumber >= 100
      ? 'Cofre Especial'
      : `Vol. ${String(manga.volumeNumber).padStart(2, '0')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative grid w-full max-w-3xl grid-cols-1 overflow-hidden rounded-xl border border-zinc-800 bg-[#111114] shadow-2xl md:grid-cols-12"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-[#09090B]/90 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Columna izquierda: Portada */}
        <div className="bg-[#09090B] p-6 md:col-span-5 md:flex md:items-center md:justify-center">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950">
            <MangaImage
              src={manga.coverUrl}
              alt={`Portada de Black Clover ${volLabel}: ${manga.title}`}
              title={manga.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Columna derecha: Módulo contiguo de compra */}
        <div className="flex flex-col justify-between p-6 md:col-span-7 md:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="font-mono">{volLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{manga.saga}</span>
              <span aria-hidden="true">·</span>
              <span>{manga.edition}</span>
            </div>

            <h2
              id="pdp-title"
              className="mt-2 font-display text-2xl font-bold leading-tight text-zinc-100"
            >
              {manga.title}
            </h2>

            <div className="mt-4 flex items-baseline justify-between border-y border-zinc-800/80 py-4">
              <span className="font-mono text-2xl font-semibold tabular-nums text-white">
                {formatCurrency(manga.priceCents)}
              </span>
              <span
                className={`text-xs font-medium tabular-nums ${
                  isOutOfStock
                    ? 'text-zinc-500'
                    : manga.stock <= 5
                      ? 'text-red-400'
                      : 'text-zinc-300'
                }`}
              >
                {isOutOfStock
                  ? 'Agotado temporalmente'
                  : manga.stock <= 5
                    ? `Últimas ${manga.stock} unidades`
                    : `En stock (${manga.stock} uds.)`}
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              {manga.synopsis}
            </p>

            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-zinc-800/80 pt-4 text-xs">
              <div>
                <dt className="text-zinc-500">Autor</dt>
                <dd className="mt-1 font-medium text-zinc-200">
                  {manga.author}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Páginas</dt>
                <dd className="mt-1 font-mono tabular-nums text-zinc-200">
                  {manga.pages} pp.
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">ISBN</dt>
                <dd className="mt-1 font-mono tabular-nums text-zinc-200 truncate">
                  {manga.isbn}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex h-11 items-center justify-between rounded-md border border-zinc-800 bg-[#09090B] px-2">
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Reducir cantidad"
                className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition-colors hover:text-white disabled:opacity-40"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="w-10 text-center font-mono text-sm font-semibold tabular-nums text-zinc-100">
                {quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || quantity >= manga.stock}
                onClick={() => setQuantity((q) => Math.min(manga.stock, q + 1))}
                aria-label="Aumentar cantidad"
                className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-400 transition-colors hover:text-white disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                onAddToCart(manga, quantity);
                onClose();
              }}
              className="flex-1 min-h-[44px] rounded-md bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 whitespace-nowrap"
            >
              {isOutOfStock ? 'Sin existencias' : 'Agregar a la bolsa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
