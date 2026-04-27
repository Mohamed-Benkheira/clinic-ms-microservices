import { useEffect, useState } from "react";

export function AnimatedCounter({ value, storageKey }: { value: number; storageKey?: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const seen = window.sessionStorage.getItem(storageKey);
      if (seen === String(value)) {
        setDisplay(value);
        return;
      }
      window.sessionStorage.setItem(storageKey, String(value));
    }
    const start = 0;
    const duration = 800;
    const startTime = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, storageKey]);
  return <>{display.toLocaleString()}</>;
}