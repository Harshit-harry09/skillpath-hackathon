// updated
/* src/context/UIContext.tsx */
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type MarketType = 'india' | 'global';

type UIContextProps = {
  loaded: boolean;
  setLoaded: (v: boolean) => void;
  market: MarketType;
  currency: 'INR' | 'USD';
  setMarket: (m: MarketType) => void;
  toggleMarket: () => void;
};

const UIContext = createContext<UIContextProps | undefined>(undefined);
const PRELOADER_KEY = "preloader_shown_v7";
const MARKET_KEY = "skillpath_market_preference";

export const UIProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [market, setMarketState] = useState<MarketType>('india');

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedMarket = window.localStorage.getItem(MARKET_KEY) as MarketType;
      if (savedMarket === 'india' || savedMarket === 'global') {
        setMarketState(savedMarket);
      }
    } catch (e) {
      console.warn("[UIProvider] storage error:", e);
    }
  }, []);

  const setMarket = (m: MarketType) => {
    setMarketState(m);
    try {
      window.localStorage.setItem(MARKET_KEY, m);
    } catch (e) {
      console.warn("[UIProvider] storage set error:", e);
    }
  };

  const toggleMarket = () => {
    setMarket(market === 'india' ? 'global' : 'india');
  };

  const currency = market === 'india' ? 'INR' : 'USD';

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (loaded) {
        window.sessionStorage.setItem(PRELOADER_KEY, "true");
      } else {
        window.sessionStorage.removeItem(PRELOADER_KEY);
      }
    } catch (e) {
      console.warn("[UIProvider] storage error:", e);
    }
  }, [loaded]);

  return (
    <UIContext.Provider value={{ loaded, setLoaded, market, currency, setMarket, toggleMarket }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextProps => {
  const ctx = useContext(UIContext);
  if (!ctx) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return ctx;
};

