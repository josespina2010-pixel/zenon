import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const mangas = pgTable('mangas', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  volumeNumber: integer('volume_number').notNull(),
  title: text('title').notNull(),
  saga: text('saga').notNull(),
  edition: text('edition').notNull(),
  synopsis: text('synopsis').notNull(),
  author: text('author').notNull().default('Yūki Tabata'),
  pages: integer('pages').notNull().default(192),
  isbn: text('isbn').notNull(),
  priceCents: integer('price_cents').notNull(),
  stock: integer('stock').notNull().default(15),
  coverUrl: text('cover_url').notNull(),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  postalCode: text('postal_code').notNull(),
  paymentMethod: text('payment_method').notNull().default('Contra entrega'),
  status: text('status').notNull().default('Confirmado'),
  totalCents: integer('total_cents').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  mangaId: integer('manga_id')
    .references(() => mangas.id)
    .notNull(),
  mangaTitle: text('manga_title').notNull(),
  volumeNumber: integer('volume_number').notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  manga: one(mangas, {
    fields: [orderItems.mangaId],
    references: [mangas.id],
  }),
}));

export const mangasRelations = relations(mangas, ({ many }) => ({
  orderItems: many(orderItems),
}));
