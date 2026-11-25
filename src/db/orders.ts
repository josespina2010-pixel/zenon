import crypto from 'crypto';
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { mangas, orderItems, orders, users } from './schema.ts';

export interface OrderCartItemInput {
  mangaId: number;
  quantity: number;
}

export interface CreateOrderInput {
  userId: number;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  postalCode: string;
  paymentMethod: string;
  items: OrderCartItemInput[];
}

export class OrderValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function createOrder(input: CreateOrderInput) {
  try {
    return await db.transaction(async (tx) => {
      const mergedItems = new Map<number, number>();
      for (const item of input.items) {
        const qty = mergedItems.get(item.mangaId) ?? 0;
        mergedItems.set(item.mangaId, qty + item.quantity);
      }

      const mangaIds = Array.from(mergedItems.keys());
      const catalogRows = await tx
        .select()
        .from(mangas)
        .where(inArray(mangas.id, mangaIds));

      const catalogMap = new Map(catalogRows.map((m) => [m.id, m]));

      let subtotalCents = 0;
      const preparedLineItems: Array<{
        mangaId: number;
        mangaTitle: string;
        volumeNumber: number;
        quantity: number;
        unitPriceCents: number;
      }> = [];

      for (const [mangaId, quantity] of mergedItems.entries()) {
        const manga = catalogMap.get(mangaId);
        if (!manga) {
          throw new OrderValidationError(
            `El volumen solicitado (#${mangaId}) no existe en el catálogo.`,
            404
          );
        }

        const updatedRows = await tx
          .update(mangas)
          .set({
            stock: sql`${mangas.stock} - ${quantity}`,
          })
          .where(and(eq(mangas.id, mangaId), gte(mangas.stock, quantity)))
          .returning({ id: mangas.id });

        if (updatedRows.length === 0) {
          throw new OrderValidationError(
            `Stock insuficiente para "${manga.title}". Disponibles: ${manga.stock}.`,
            409
          );
        }

        subtotalCents += manga.priceCents * quantity;
        preparedLineItems.push({
          mangaId: manga.id,
          mangaTitle: manga.title,
          volumeNumber: manga.volumeNumber,
          quantity,
          unitPriceCents: manga.priceCents,
        });
      }

      const shippingCents = subtotalCents >= 4500 ? 0 : 490;
      const totalCents = subtotalCents + shippingCents;
      const orderNumber = `BC-${crypto.randomInt(1000, 9999)}-${Date.now().toString().slice(-3)}`;

      const [insertedOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: input.userId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          postalCode: input.postalCode,
          paymentMethod: input.paymentMethod,
          status: 'Confirmado',
          totalCents,
        })
        .returning();

      const insertedItems = await tx
        .insert(orderItems)
        .values(
          preparedLineItems.map((line) => ({
            orderId: insertedOrder.id,
            mangaId: line.mangaId,
            mangaTitle: line.mangaTitle,
            volumeNumber: line.volumeNumber,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
          }))
        )
        .returning();

      return {
        ...insertedOrder,
        subtotalCents,
        shippingCents,
        items: insertedItems,
      };
    });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      throw error;
    }
    console.error('Database transaction failed in createOrder:', error);
    throw new Error('No se pudo procesar el pedido en la base de datos.', {
      cause: error,
    });
  }
}

export async function listOrdersByUserId(userId: number) {
  try {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
      return [];
    }

    const orderIds = userOrders.map((o) => o.id);
    const items = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrder = new Map<number, typeof items>();
    for (const item of items) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    return userOrders.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) ?? [],
    }));
  } catch (error) {
    console.error('Database query failed in listOrdersByUserId:', error);
    throw new Error('No se pudieron cargar tus pedidos.', { cause: error });
  }
}

export async function listAllOrdersAdmin() {
  try {
    const allOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        shippingAddress: orders.shippingAddress,
        postalCode: orders.postalCode,
        paymentMethod: orders.paymentMethod,
        status: orders.status,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
        userEmail: users.email,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    if (allOrders.length === 0) {
      return [];
    }

    const orderIds = allOrders.map((o) => o.id);
    const items = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrder = new Map<number, typeof items>();
    for (const item of items) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    return allOrders.map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) ?? [],
    }));
  } catch (error) {
    console.error('Database query failed in listAllOrdersAdmin:', error);
    throw new Error('No se pudieron cargar los pedidos de la tienda.', {
      cause: error,
    });
  }
}

export async function updateOrderStatusAdmin(orderId: number, status: string) {
  try {
    const rows = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in updateOrderStatusAdmin:', error);
    throw new Error('No se pudo actualizar el estado del pedido.', {
      cause: error,
    });
  }
}
