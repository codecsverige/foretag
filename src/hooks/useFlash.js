import { useState, useCallback, useEffect } from "react";

export default function useFlash(timeout = 4000) {
  const [msg, setMsg] = useState(null);
  const flash = useCallback(text => setMsg(text), []);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), timeout);
    return () => clearTimeout(id);
  }, [msg, timeout]);

  return { msg, flash };
}
