const KEY = "adl_wishlist";
const EVENT = "adl:wishlist-change";

function safeRead(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function safeWrite(ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    // ignore
  }
}

export function getWishlist(): number[] {
  return safeRead();
}

export function isInWishlist(id: number): boolean {
  return safeRead().includes(id);
}

export function toggleWishlist(id: number): boolean {
  if (!id) return false;
  const current = safeRead();
  const exists = current.includes(id);
  const next = exists ? current.filter((x) => x !== id) : [id, ...current];
  safeWrite(next);
  return !exists;
}

export function removeFromWishlist(id: number): void {
  safeWrite(safeRead().filter((x) => x !== id));
}

export function clearWishlist(): void {
  safeWrite([]);
}

export const WISHLIST_EVENT = EVENT;