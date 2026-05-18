const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('token');
}

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, ...rest } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Ошибка запроса');
  }
  return data as T;
}

export const authApi = {
  login: (phone: string, password: string) =>
    api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { phone, password } }),
  me: () => api<{ user: User }>('/auth/me'),
};

export type User = {
  id: number;
  name: string;
  phone: string;
  role: 'admin' | 'seller' | 'worker';
};

export type Product = {
  id: number;
  name: string;
  size?: string;
  sale_price: number;
  cost_price: number;
  unit?: string;
  min_stock?: number;
  status: string;
};

export type DashboardStats = {
  produced_today: number;
  sold_today: number;
  stock_total: number;
  sales_amount_today: number;
  orders_today: number;
};

export type StockRow = {
  id: number;
  name: string;
  size?: string;
  unit?: string;
  produced: number;
  sold: number;
  balance: number;
  min_stock?: number;
};

export type SaleRow = {
  id: number;
  created_at: string;
  client_name?: string;
  client_phone?: string;
  total_amount: number;
  debt_amount: number;
  payment_type: string;
  seller_name: string;
  items?: { id: number; product_name: string; quantity: number; price: number }[];
};
