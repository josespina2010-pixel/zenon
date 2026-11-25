import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createManga,
  deleteManga,
  getMangaById,
  listMangas,
  updateManga,
} from './src/db/mangas.ts';
import {
  createOrder,
  listAllOrdersAdmin,
  listOrdersByUserId,
  OrderValidationError,
  updateOrderStatusAdmin,
} from './src/db/orders.ts';
import { requireAdmin, requireAuth } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_SAGA_VALUES = new Set([
  'Reino del Trébol',
  'Noche Blanca',
  'Elfos y Demonios',
  'Reino de la Pica',
  'Box Sets',
]);

const ALLOWED_EDITION_VALUES = new Set([
  'Tankōbon Estándar',
  'Edición Coleccionista',
  'Box Set Completo',
]);

const ALLOWED_ORDER_STATUSES = new Set([
  'Confirmado',
  'Preparando envío',
  'Enviado',
  'Entregado',
]);

const ALLOWED_PAYMENT_METHODS = new Set([
  'Contra entrega',
  'Tarjeta en entrega',
  'Transferencia bancaria',
]);

function isSafeCoverUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith('/src/assets/images/')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Public catalog endpoints
  app.get('/api/mangas', async (req, res) => {
    try {
      const saga =
        typeof req.query.saga === 'string' ? req.query.saga : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const sort =
        typeof req.query.sort === 'string' ? req.query.sort : undefined;

      const items = await listMangas({ saga, q, sort });
      res.json(items);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al consultar el catálogo.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/mangas/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'Identificador de volumen inválido.' });
      return;
    }

    try {
      const item = await getMangaById(id);
      if (!item) {
        res.status(404).json({ error: 'Volumen no encontrado.' });
        return;
      }
      res.json(item);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al obtener volumen.';
      res.status(500).json({ error: message });
    }
  });

  // Authenticated user profile
  app.get('/api/me', requireAuth, (req: AuthRequest, res) => {
    res.json({
      id: req.dbUser?.id,
      uid: req.dbUser?.uid,
      email: req.dbUser?.email,
      displayName: req.dbUser?.displayName,
      role: req.dbUser?.role || 'customer',
    });
  });

  // Authenticated customer orders
  app.get('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    if (!req.dbUser) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }
    try {
      const userOrders = await listOrdersByUserId(req.dbUser.id);
      res.json(userOrders);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al consultar pedidos.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    if (!req.dbUser) {
      res.status(401).json({ error: 'Usuario no autenticado.' });
      return;
    }

    const body = req.body ?? {};
    const customerName =
      typeof body.customerName === 'string' ? body.customerName.trim() : '';
    const customerPhone =
      typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
    const shippingAddress =
      typeof body.shippingAddress === 'string'
        ? body.shippingAddress.trim()
        : '';
    const postalCode =
      typeof body.postalCode === 'string' ? body.postalCode.trim() : '';
    const paymentMethod =
      typeof body.paymentMethod === 'string'
        ? body.paymentMethod.trim()
        : 'Contra entrega';

    if (
      customerName.length < 2 ||
      customerPhone.length < 6 ||
      shippingAddress.length < 5 ||
      postalCode.length < 3
    ) {
      res.status(400).json({
        error:
          'Completa nombre, teléfono, dirección y código postal válidos para confirmar el envío.',
      });
      return;
    }

    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      res.status(400).json({ error: 'Método de pago no válido.' });
      return;
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      res
        .status(400)
        .json({ error: 'El carrito debe contener al menos un manga.' });
      return;
    }

    const validatedItems: Array<{ mangaId: number; quantity: number }> = [];
    for (const rawItem of body.items) {
      const mangaId = Number(rawItem?.mangaId);
      const quantity = Number(rawItem?.quantity);
      if (
        !Number.isInteger(mangaId) ||
        mangaId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 25
      ) {
        res.status(400).json({
          error: 'Cantidad o producto inválido en el carrito (máximo 25 uds.).',
        });
        return;
      }
      validatedItems.push({ mangaId, quantity });
    }

    try {
      const created = await createOrder({
        userId: req.dbUser.id,
        customerName,
        customerPhone,
        shippingAddress,
        postalCode,
        paymentMethod,
        items: validatedItems,
      });
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof OrderValidationError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      const message =
        error instanceof Error ? error.message : 'No se pudo crear el pedido.';
      res.status(500).json({ error: message });
    }
  });

  // Admin inventory & order management
  app.post(
    '/api/mangas',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      const body = req.body ?? {};
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const saga = typeof body.saga === 'string' ? body.saga.trim() : '';
      const edition =
        typeof body.edition === 'string' ? body.edition.trim() : '';
      const synopsis =
        typeof body.synopsis === 'string' ? body.synopsis.trim() : '';
      const isbn = typeof body.isbn === 'string' ? body.isbn.trim() : '';
      const coverUrl =
        typeof body.coverUrl === 'string' ? body.coverUrl.trim() : '';
      const volumeNumber = Number(body.volumeNumber);
      const pages = body.pages ? Number(body.pages) : 192;
      const priceCents = Number(body.priceCents);
      const stock = Number(body.stock);

      if (
        title.length < 2 ||
        synopsis.length < 10 ||
        isbn.length < 6 ||
        !ALLOWED_SAGA_VALUES.has(saga) ||
        !ALLOWED_EDITION_VALUES.has(edition) ||
        !isSafeCoverUrl(coverUrl) ||
        !Number.isInteger(volumeNumber) ||
        volumeNumber <= 0 ||
        !Number.isInteger(pages) ||
        pages <= 0 ||
        !Number.isInteger(priceCents) ||
        priceCents <= 0 ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        res.status(400).json({
          error:
            'Datos inválidos. Verifica título, saga, edición, precio, stock e imagen.',
        });
        return;
      }

      const rawSlug =
        typeof body.slug === 'string' && body.slug.trim().length > 0
          ? body.slug.trim()
          : `black-clover-vol-${volumeNumber}-${Date.now().toString().slice(-4)}`;
      const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      try {
        const created = await createManga({
          slug,
          volumeNumber,
          title,
          saga,
          edition,
          synopsis,
          pages,
          isbn,
          priceCents,
          stock,
          coverUrl,
          featured: Boolean(body.featured),
        });
        res.status(201).json(created);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo crear el manga.';
        res.status(500).json({ error: message });
      }
    }
  );

  app.patch(
    '/api/mangas/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }

      const body = req.body ?? {};
      const patch: Record<string, unknown> = {};

      if (typeof body.title === 'string' && body.title.trim().length >= 2) {
        patch.title = body.title.trim();
      }
      if (typeof body.saga === 'string' && ALLOWED_SAGA_VALUES.has(body.saga)) {
        patch.saga = body.saga;
      }
      if (
        typeof body.edition === 'string' &&
        ALLOWED_EDITION_VALUES.has(body.edition)
      ) {
        patch.edition = body.edition;
      }
      if (
        typeof body.synopsis === 'string' &&
        body.synopsis.trim().length >= 10
      ) {
        patch.synopsis = body.synopsis.trim();
      }
      if (body.priceCents !== undefined) {
        const priceCents = Number(body.priceCents);
        if (!Number.isInteger(priceCents) || priceCents <= 0) {
          res.status(400).json({ error: 'Precio inválido.' });
          return;
        }
        patch.priceCents = priceCents;
      }
      if (body.stock !== undefined) {
        const stock = Number(body.stock);
        if (!Number.isInteger(stock) || stock < 0) {
          res.status(400).json({ error: 'Stock inválido.' });
          return;
        }
        patch.stock = stock;
      }
      if (body.featured !== undefined) {
        patch.featured = Boolean(body.featured);
      }

      if (Object.keys(patch).length === 0) {
        res.status(400).json({ error: 'No hay campos válidos para actualizar.' });
        return;
      }

      try {
        const updated = await updateManga(id, patch);
        if (!updated) {
          res.status(404).json({ error: 'Volumen no encontrado.' });
          return;
        }
        res.json(updated);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar el volumen.';
        res.status(500).json({ error: message });
      }
    }
  );

  app.delete(
    '/api/mangas/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }

      try {
        const deleted = await deleteManga(id);
        if (!deleted) {
          res.status(404).json({ error: 'Volumen no encontrado.' });
          return;
        }
        res.json({ deletedId: deleted.id });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo eliminar el volumen.';
        res.status(409).json({ error: message });
      }
    }
  );

  app.get(
    '/api/admin/orders',
    requireAuth,
    requireAdmin,
    async (_req, res) => {
      try {
        const orders = await listAllOrdersAdmin();
        res.json(orders);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudieron consultar los pedidos.';
        res.status(500).json({ error: message });
      }
    }
  );

  app.patch(
    '/api/admin/orders/:id',
    requireAuth,
    requireAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      const status =
        typeof req.body?.status === 'string' ? req.body.status.trim() : '';

      if (!Number.isInteger(id) || id <= 0 || !ALLOWED_ORDER_STATUSES.has(status)) {
        res.status(400).json({ error: 'Estado o pedido inválido.' });
        return;
      }

      try {
        const updated = await updateOrderStatusAdmin(id, status);
        if (!updated) {
          res.status(404).json({ error: 'Pedido no encontrado.' });
          return;
        }
        res.json(updated);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar el pedido.';
        res.status(500).json({ error: message });
      }
    }
  );

  // Frontend serving: Vite middleware in development, dist/ static in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found');
      }
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
