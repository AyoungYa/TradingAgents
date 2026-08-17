// 防抖 Hook
import { useState, useEffect } from 'react';

/**
 * 防抖值 Hook
 * @param value 原始值
 * @param delay 延迟毫秒数
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
