const KEY = "adl_recently_viewed";
const MAX = 12;

export function getRecentlyViewed(): number[] {
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

export function pushRecentlyViewed(id: number): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const current = getRecentlyViewed().filter((x) => x !== id);
    current.unshift(id);
    window.localStorage.setItem(KEY, JSON.stringify(current.slice(0, MAX)));
  } catch {
    // ignore
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}