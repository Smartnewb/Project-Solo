import { useState, useEffect } from 'react';

type LocalStorageKey = 'userToken' | 'theme' | 'language' | 'before-toss-payment-url';

interface LocalStorageValue {
  userToken: string | null;
  theme: 'light' | 'dark';
  language: 'en' | 'ko';
  'before-toss-payment-url': string | null;
}

function useLocalStorage<K extends LocalStorageKey>(
  key: K,
  initialValue: LocalStorageValue[K]
): [LocalStorageValue[K], (value: LocalStorageValue[K]) => void] {
  const [storedValue, setStoredValue] = useState<LocalStorageValue[K]>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage key:', key, error);
      return initialValue;
    }
  });

  const setValue = (value: LocalStorageValue[K]) => {
    try {
      setStoredValue(value);
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error setting localStorage key:', key, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        if (typeof window === 'undefined') {
          return initialValue;
        }
        const item = window.localStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValue);
      } catch (error) {
        console.error('Error reading localStorage key:', key, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
