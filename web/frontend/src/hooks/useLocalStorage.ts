// localStorage Hook
import { useState, useEffect } from 'react';

/**
 * localStorage 状态 Hook
 * @param key 存储键
 * @param initialValue 初始值
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      console.error('Failed to save to localStorage');
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
