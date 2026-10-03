"use client";
import { useEffect, useState } from "react";
// Re-reads whenever any repository changes. `read` may be sync or async.
export function useLiveData(read, deps = []) {
  const [data, setData] = useState(undefined);
  useEffect(() => {
    let alive = true;
    const run = async () => { try { const v = await read(); if (alive) setData(v); } catch { if (alive) setData(null); } };
    run(); window.addEventListener("psm:change", run);
    return () => { alive = false; window.removeEventListener("psm:change", run); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return data;
}
