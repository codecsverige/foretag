// src/hooks/useFuseAutocomplete.js
import { useMemo } from "react";
import Fuse from "fuse.js";

export default function useFuseAutocomplete(list, keys) {
  const fuse = useMemo(() => new Fuse(list, {
    includeScore:false,
    threshold:0.3,
    keys
  }), [list, keys]);

  return query => query
    ? fuse.search(query).slice(0,8).map(r=>r.item)
    : [];
}
