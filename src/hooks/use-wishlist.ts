import { useCallback, useEffect, useState } from "react";
import {
  WISHLIST_EVENT,
  clearWishlist as clearAll,
  getWishlist,
  removeFromWishlist as removeOne,
  toggleWishlist as toggleOne,
} from "@/lib/wishlist";

export function useWishlist() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setIds(getWishlist());
    sync();
    window.addEventListener(WISHLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: number) => toggleOne(id), []);
  const remove = useCallback((id: number) => removeOne(id), []);
  const clear = useCallback(() => clearAll(), []);
  const has = useCallback((id: number) => ids.includes(id), [ids]);

  return { ids, count: ids.length, has, toggle, remove, clear };
}