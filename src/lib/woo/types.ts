export interface WooImage {
  src: string;
  alt?: string;
}

export interface WooCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface WooAttribute {
  id: number;
  name: string;
  options: string[];
}

export interface WooProduct {
  id: number;
  slug: string;
  sku: string;
  name: string;
  description: string; // HTML
  short_description: string; // HTML
  price: number;
  regular_price: number;
  sale_price: number | null;
  on_sale: boolean;
  stock_status: "instock" | "outofstock" | "onbackorder";
  in_stock: boolean;
  average_rating: number;
  rating_count: number;
  total_sales: number;
  featured: boolean;
  date_created: string;
  type: string;
  categories: WooCategoryRef[];
  brand?: string;
  images: WooImage[];
  attributes: WooAttribute[];
  permalink: string;
  seo?: SeoMeta;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  parent: number;
  image?: WooImage | null;
}

export interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing?: Record<string, string>;
  shipping?: Record<string, string>;
}

export interface WooOrderSummary {
  id: number;
  number: string;
  status: string;
  total: string;
  currency: string;
  date_created: string;
}

export interface ProductListResult {
  items: WooProduct[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export interface WPPost {
  id: number;
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  author: string | null;
  seo?: SeoMeta;
}

export interface SeoMeta {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robots?: string;
  schema?: unknown;
}

export interface YoastHeadJson {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: Record<string, string | undefined>;
  og_title?: string;
  og_description?: string;
  og_type?: string;
  og_image?: Array<{ url?: string }>;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  schema?: unknown;
}

export function adaptYoast(y?: YoastHeadJson | null): SeoMeta | undefined {
  if (!y || typeof y !== "object") return undefined;
  const robotsParts = y.robots
    ? Object.values(y.robots).filter((v): v is string => typeof v === "string")
    : [];
  return {
    title: y.title,
    description: y.description,
    canonical: y.canonical,
    ogTitle: y.og_title,
    ogDescription: y.og_description,
    ogType: y.og_type,
    ogImage: y.og_image?.[0]?.url,
    twitterCard: y.twitter_card,
    twitterTitle: y.twitter_title,
    twitterDescription: y.twitter_description,
    twitterImage: y.twitter_image,
    robots: robotsParts.length ? robotsParts.join(", ") : undefined,
    schema: y.schema,
  };
}

/** Raw WC product shape we read from the API (subset of fields we use). */
export interface RawWooProduct {
  id: number;
  slug: string;
  sku: string;
  name: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: "instock" | "outofstock" | "onbackorder";
  average_rating: string;
  rating_count: number;
  total_sales: number;
  featured: boolean;
  date_created: string;
  type: string;
  permalink: string;
  categories: WooCategoryRef[];
  images: WooImage[];
  attributes: Array<{ id: number; name: string; options: string[] }>;
  brands?: WooCategoryRef[];
  yoast_head_json?: YoastHeadJson;
}

export function adaptProduct(raw: RawWooProduct): WooProduct {
  const price = Number(raw.price) || 0;
  const regular = Number(raw.regular_price) || price;
  const sale = raw.sale_price ? Number(raw.sale_price) : null;

  // Brand: prefer Woo "brands" taxonomy if present, else attribute pa_brand / Brand, else first category.
  let brand: string | undefined;
  if (raw.brands && raw.brands.length > 0) brand = raw.brands[0].name;
  if (!brand) {
    const attr = raw.attributes?.find(
      (a) =>
        a.name?.toLowerCase() === "brand" ||
        a.name?.toLowerCase() === "pa_brand" ||
        a.name?.toLowerCase() === "marque",
    );
    if (attr && attr.options[0]) brand = attr.options[0];
  }
  if (!brand && raw.categories?.[0]) brand = raw.categories[0].name;

  return {
    id: raw.id,
    slug: raw.slug,
    sku: raw.sku || `WC-${raw.id}`,
    name: raw.name,
    description: raw.description || "",
    short_description: raw.short_description || "",
    price,
    regular_price: regular,
    sale_price: sale,
    on_sale: raw.on_sale,
    stock_status: raw.stock_status,
    in_stock: raw.stock_status !== "outofstock",
    average_rating: Number(raw.average_rating) || 0,
    rating_count: raw.rating_count || 0,
    total_sales: raw.total_sales || 0,
    featured: raw.featured,
    date_created: raw.date_created,
    type: raw.type,
    categories: raw.categories || [],
    brand,
    images: (raw.images || []).map((i) => ({ src: i.src, alt: i.alt })),
    attributes: (raw.attributes || []).map((a) => ({ id: a.id, name: a.name, options: a.options })),
    permalink: raw.permalink,
    seo: adaptYoast(raw.yoast_head_json),
  };
}