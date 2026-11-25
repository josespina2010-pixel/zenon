export interface Manga {
  id: number;
  slug: string;
  volumeNumber: number;
  title: string;
  saga: string;
  edition: string;
  synopsis: string;
  author: string;
  pages: number;
  isbn: string;
  priceCents: number;
  stock: number;
  coverUrl: string;
  featured: boolean;
  createdAt?: string | null;
}

export interface CartItem {
  manga: Manga;
  quantity: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  mangaId: number;
  mangaTitle: string;
  volumeNumber: number;
  quantity: number;
  unitPriceCents: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  postalCode: string;
  paymentMethod: string;
  status: string;
  totalCents: number;
  subtotalCents?: number;
  shippingCents?: number;
  createdAt: string;
  userEmail?: string;
  items: OrderItem[];
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'customer' | string;
}

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
