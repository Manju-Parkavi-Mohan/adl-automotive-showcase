import { decodeHtml } from "@/lib/html";

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
  order_key?: string;
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
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  ogLocale?: string;
  ogSiteName?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string[];
  author?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCreator?: string;
  twitterSite?: string;
  twitterLabels?: Array<{ label: string; data: string }>;
  robots?: string;
  /** Pre-serialised JSON-LD schema (@graph) that Yoast emits. */
  schemaJson?: string;
}

export interface YoastHeadJson {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  robots?: Record<string, string | undefined>;
  og_title?: string;
  og_description?: string;
  og_type?: string;
  og_url?: string;
  og_locale?: string;
  og_site_name?: string;
  og_image?: Array<{ url?: string }>;
  article_published_time?: string;
  article_modified_time?: string;
  article_author?: string;
  article_section?: string;
  article_tag?: string[] | string;
  author?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_creator?: string;
  twitter_site?: string;
  twitter_misc?: Record<string, string>;
  schema?: unknown;
}

export function adaptYoast(y?: YoastHeadJson | null): SeoMeta | undefined {
  if (!y || typeof y !== "object") return undefined;
  const robotsParts = y.robots
    ? Object.values(y.robots).filter((v): v is string => typeof v === "string")
    : [];
  const tags = Array.isArray(y.article_tag)
    ? y.article_tag
    : typeof y.article_tag === "string"
      ? [y.article_tag]
      : undefined;
  const twitterLabels =
    y.twitter_misc && typeof y.twitter_misc === "object"
      ? Object.entries(y.twitter_misc).map(([label, data], i) => ({
          label,
          data,
          _i: i,
        }))
      : undefined;
  return {
    title: y.title,
    description: y.description,
    keywords: y.keywords,
    canonical: y.canonical,
    ogTitle: y.og_title,
    ogDescription: y.og_description,
    ogType: y.og_type,
    ogUrl: y.og_url,
    ogLocale: y.og_locale,
    ogSiteName: y.og_site_name,
    ogImage: y.og_image?.[0]?.url,
    articlePublishedTime: y.article_published_time,
    articleModifiedTime: y.article_modified_time,
    articleAuthor: y.article_author,
    articleSection: y.article_section,
    articleTags: tags,
    author: y.author,
    twitterCard: y.twitter_card,
    twitterTitle: y.twitter_title,
    twitterDescription: y.twitter_description,
    twitterImage: y.twitter_image,
    twitterCreator: y.twitter_creator,
    twitterSite: y.twitter_site,
    twitterLabels: twitterLabels?.map(({ label, data }) => ({ label, data })),
    robots: robotsParts.length ? robotsParts.join(", ") : undefined,
    schemaJson: y.schema ? safeStringify(y.schema) : undefined,
  };
}

function safeStringify(v: unknown): string | undefined {
  try {
    return JSON.stringify(v);
  } catch {
    return undefined;
  }
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
    name: decodeHtml(raw.name),
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
    categories: (raw.categories || []).map((c) => ({ ...c, name: decodeHtml(c.name) })),
    brand: brand ? decodeHtml(brand) : brand,
    images: (raw.images || []).map((i) => ({ src: i.src, alt: i.alt })),
    attributes: (raw.attributes || []).map((a) => ({ id: a.id, name: a.name, options: a.options })),
    permalink: raw.permalink,
    seo: adaptYoast(raw.yoast_head_json),
  };
}