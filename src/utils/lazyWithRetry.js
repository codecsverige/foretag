import React from "react";

// Wrap React.lazy to auto-retry on transient chunk loading failures (e.g., SW cache mismatch)
export function lazyWithRetry(factory, { retries = 2, delayMs = 1200 } = {}) {
  let attempts = 0;
  const load = () => factory().catch((err) => {
    const message = String(err && (err.message || err.name || err))
      .toLowerCase();
    const isChunkError = message.includes('chunk') || message.includes('loading css') || message.includes('failed to fetch');

    if (!isChunkError || attempts >= retries) {
      throw err;
    }

    attempts += 1;
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => {
            try { reg.update(); } catch {}
            try { reg.active && reg.active.postMessage({ type: 'SKIP_WAITING' }); } catch {}
          });
        }).catch(() => {});
      }
    } catch {}

    return new Promise((resolve) => setTimeout(resolve, delayMs)).then(load);
  });

  return React.lazy(load);
}

export default lazyWithRetry;

