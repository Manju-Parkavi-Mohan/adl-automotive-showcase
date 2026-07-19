import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { wcFetch } from "./client.server";
import { getAppSession } from "@/lib/auth/session.server";

export interface SavedAddress {
  id: string;
  label?: string;
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state?: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

const META_KEY = "adl_addresses";

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  company: z.string().optional().default(""),
  address_1: z.string().min(1),
  address_2: z.string().optional().default(""),
  city: z.string().min(1),
  state: z.string().optional().default(""),
  postcode: z.string().min(1),
  country: z.string().length(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().default(""),
});

type CustomerRaw = {
  id: number;
  billing?: Partial<SavedAddress> & { country?: string };
  shipping?: Partial<SavedAddress> & { country?: string };
  meta_data?: Array<{ id?: number; key: string; value: unknown }>;
};

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `a_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

function parseSaved(meta: CustomerRaw["meta_data"]): SavedAddress[] {
  const entry = meta?.find((m) => m.key === META_KEY);
  if (!entry) return [];
  const raw = entry.value;
  let list: unknown = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const out: SavedAddress[] = [];
  for (const item of list) {
    if (item && typeof item === "object" && "address_1" in item && "id" in item) {
      out.push(item as SavedAddress);
    }
  }
  return out;
}

function seedFromDefault(customer: CustomerRaw): SavedAddress | null {
  const b = customer.billing;
  if (!b || !b.address_1 || !b.city || !b.country) return null;
  return {
    id: newId(),
    label: "Default",
    first_name: b.first_name ?? "",
    last_name: b.last_name ?? "",
    company: b.company ?? "",
    address_1: b.address_1 ?? "",
    address_2: b.address_2 ?? "",
    city: b.city ?? "",
    state: b.state ?? "",
    postcode: b.postcode ?? "",
    country: (b.country ?? "").toUpperCase(),
    email: b.email ?? "",
    phone: b.phone ?? "",
  };
}

async function readCustomer(customerId: number): Promise<CustomerRaw> {
  const res = await wcFetch<CustomerRaw>(`/customers/${customerId}`);
  return res.data;
}

async function writeAddresses(customerId: number, list: SavedAddress[]): Promise<void> {
  await wcFetch(`/customers/${customerId}`, {
    method: "PUT",
    body: {
      meta_data: [{ key: META_KEY, value: JSON.stringify(list) }],
    },
  });
}

export const listMyAddresses = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAppSession();
  const id = session.data?.customerId;
  if (!id) return [] as SavedAddress[];
  try {
    const customer = await readCustomer(id);
    let list = parseSaved(customer.meta_data);
    if (list.length === 0) {
      const seed = seedFromDefault(customer);
      if (seed) {
        list = [seed];
        try {
          await writeAddresses(id, list);
        } catch {
          // best-effort seed; still return in-memory list
        }
      }
    }
    return list;
  } catch {
    return [] as SavedAddress[];
  }
});

export const saveAddress = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ address: addressSchema }).parse(input))
  .handler(async ({ data }) => {
    const session = await getAppSession();
    const id = session.data?.customerId;
    if (!id) throw new Error("Not signed in");
    const customer = await readCustomer(id);
    const list = parseSaved(customer.meta_data);
    const incoming: SavedAddress = {
      ...data.address,
      id: data.address.id || newId(),
      country: data.address.country.toUpperCase(),
    } as SavedAddress;
    const idx = list.findIndex((a) => a.id === incoming.id);
    if (idx >= 0) list[idx] = incoming;
    else list.push(incoming);
    await writeAddresses(id, list);
    return list;
  });

export const deleteAddress = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const session = await getAppSession();
    const id = session.data?.customerId;
    if (!id) throw new Error("Not signed in");
    const customer = await readCustomer(id);
    const list = parseSaved(customer.meta_data).filter((a) => a.id !== data.id);
    await writeAddresses(id, list);
    return list;
  });