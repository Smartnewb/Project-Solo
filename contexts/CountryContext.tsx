'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Country = 'kr' | 'jp';

interface CountryContextType {
  country: Country;
  setCountry: (country: Country) => void;
  countryLabel: string;
  countryFlag: string;
}

const STORAGE_KEY = 'admin_selected_country';
const DEFAULT_COUNTRY: Country = 'kr';

const COUNTRY_CONFIG: Record<Country, { label: string; flag: string }> = {
  kr: { label: '대한민국', flag: '🇰🇷' },
  jp: { label: '日本', flag: '🇯🇵' },
};

const CountryContext = createContext<CountryContextType | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<Country>(DEFAULT_COUNTRY);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'kr' || saved === 'jp') {
      setCountryState(saved);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'kr' || e.newValue === 'jp')) {
        setCountryState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setCountry = (newCountry: Country) => {
    localStorage.setItem(STORAGE_KEY, newCountry);
    setCountryState(newCountry);
  };

  const config = COUNTRY_CONFIG[country];

  return (
    <CountryContext.Provider
      value={{
        country,
        setCountry,
        countryLabel: config.label,
        countryFlag: config.flag,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry must be used within CountryProvider');
  }
  return context;
}
