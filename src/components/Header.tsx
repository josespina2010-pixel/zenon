import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
}

export function Header({
  cartCount,
  onOpenCart,
  onOpenOrders,
  onOpenAdmin,
}: HeaderProps) {
  const { firebaseUser, profile, signInWithGoogle, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090B]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-8 px-6 py-4">
        {/* Zona 1: Marca (un solo elemento de texto) */}
        <a
          href="#inicio"
          className="font-display text-lg font-bold tracking-wide text-zinc-100 whitespace-nowrap shrink-0 transition-colors hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500"
        >
          Grimorio Carmesí
        </a>

        {/* Zona 2: Enlaces de navegación en una sola línea */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400"
        >
          <a
            href="#catalogo"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-zinc-100 hover:underline hover:underline-offset-4"
          >
            Catálogo
          </a>
          <a
            href="#edicion"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-zinc-100 hover:underline hover:underline-offset-4"
          >
            Colección
          </a>
          <button
            type="button"
            onClick={onOpenOrders}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-zinc-100 hover:underline hover:underline-offset-4"
          >
            Mis pedidos
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="whitespace-nowrap shrink-0 text-red-400 transition-colors hover:text-red-300 hover:underline hover:underline-offset-4"
            >
              Inventario
            </button>
          )}
          {firebaseUser ? (
            <button
              type="button"
              onClick={logout}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-zinc-100 hover:underline hover:underline-offset-4"
            >
              Cerrar sesión
            </button>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-zinc-100 hover:underline hover:underline-offset-4"
            >
              Iniciar sesión
            </button>
          )}
        </nav>

        {/* Zona 3: 1 acción principal */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">Bolsa ({cartCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-800 bg-[#0C0C0F] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-zinc-300">
            <a
              href="#catalogo"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              Catálogo
            </a>
            <a
              href="#edicion"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              Colección
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOrders();
              }}
              className="py-1.5 text-left hover:text-white"
            >
              Mis pedidos
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="py-1.5 text-left text-red-400 hover:text-red-300"
              >
                Inventario
              </button>
            )}
            {firebaseUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="py-1.5 text-left hover:text-white"
              >
                Cerrar sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signInWithGoogle();
                }}
                className="py-1.5 text-left text-red-400 hover:text-red-300"
              >
                Iniciar sesión con Google
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
