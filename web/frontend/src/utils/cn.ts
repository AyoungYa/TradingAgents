// 类名合并工具
import { clsx, type ClassValue } from 'clsx';

/** 合并 CSS 类名 */
export function cn(...args: ClassValue[]): string {
  return clsx(...args);
}
