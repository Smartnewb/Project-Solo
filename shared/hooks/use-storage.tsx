import { useState, useEffect } from 'react';

type LocalStorageKey = 
'userToken' |
'theme' |
'language' |
'before-toss-payment-url' |
'before-url' |
'redirect-payload';

type LocalStorageSchema = {
  userToken: string | null;
  theme: 'light' | 'dark';
  language: 'en' | 'ko';
  'before-toss-payment-url': string | null;
  'before-url': string | null;
  'redirect-payload': Record<string, unknown> | null;
}

function useLocalStorage<
  K extends LocalStorageKey,
  T extends LocalStorageSchema[K] = LocalStorageSchema[K]
>(
  key: K,
  initialValue: T | null 
): [T, (value: T | null) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
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

  const setValue = (value: T | null) => {
    try {
      setStoredValue(value as T);
      if (typeof window === 'undefined') {
        return;
      }
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
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
