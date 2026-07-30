'use client';

import React from 'react';
import { useUI } from '@/context/UIContext';

export function MarketToggle() {
  const { market, toggleMarket } = useUI();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-md border border-hairline bg-canvas opacity-20 animate-pulse" />;
  }

  const isIndia = market === 'india';

  return (
    <button
      onClick={toggleMarket}
      title={isIndia ? "Market: India (₹ LPA) — Click for Global ($ USD)" : "Market: Global ($ USD) — Click for India (₹ LPA)"}
      aria-label="Toggle Market Currency"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-canvas text-ink transition-all hover:bg-surface-soft hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer font-bold text-sm select-none shadow-sm active:scale-95"
    >
      <span className={`transition-all duration-200 text-sm font-extrabold ${isIndia ? 'scale-100 opacity-100 text-brand-pink' : 'scale-0 opacity-0 absolute'}`}>
        ₹
      </span>
      <span className={`transition-all duration-200 text-sm font-extrabold ${!isIndia ? 'scale-100 opacity-100 text-emerald-500' : 'scale-0 opacity-0 absolute'}`}>
        $
      </span>
    </button>
  );
}
