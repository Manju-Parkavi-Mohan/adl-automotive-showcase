import { createServerFn } from "@tanstack/react-start";
import { wcFetch } from "./client.server";
import { getAppSession } from "@/lib/auth/session.server";

export interface CustomerAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface CustomerDetail {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  date_created: string;
  orders_count: number;
  total_spent: string;
  avatar_url: string;
  billing: CustomerAddress | null;
  shipping: CustomerAddress | null;
}

export const getMyCustomer = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAppSession();
  const id = session.data?.customerId;
  if (!id) return null;
  const res = await wcFetch<CustomerDetail>(`/customers/${id}`);
  return res.data;
});

export interface OrderLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  total: string;
  image?: { src: string };
}

export interface OrderDetail {
  id: number;
  number: string;
  status: string;
  total: string;
  subtotal?: string;
  currency: string;
  date_created: string;
  payment_method_title: string;
  line_items: OrderLineItem[];
  billing: Record<string, string>;
  shipping: Record<string, string>;
}

export const getMyOrder = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    if (typeof input !== "object" || input === null || !("id" in input)) throw new Error("id required");
    const id = Number((input as { id: unknown }).id);
    if (!Number.isFinite(id) || id <= 0) throw new Error("invalid id");
    return { id };
  })
  .handler(async ({ data }) => {
    const session = await getAppSession();
    const customerId = session.data?.customerId;
    const email = session.data?.email?.toLowerCase();
    if (!customerId && !email) throw new Error("Not signed in");
    const res = await wcFetch<OrderDetail & { customer_id: number; billing: Record<string, string> }>(`/orders/${data.id}`);
    const order = res.data;
    const orderEmail = (order.billing?.email || "").toLowerCase();
    const owns =
      (customerId && order.customer_id === customerId) ||
      (email && orderEmail && orderEmail === email);
    if (!owns) throw new Error("Not authorized to view this order");
    return order;
  });