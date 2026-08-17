// 设置 API
import api from './api';
import type { AppSettings } from '@/types/settings';

/** 获取设置 */
export async function getSettings(): Promise<AppSettings> {
  return api.get('/settings');
}

/** 更新设置 */
export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  return api.put('/settings', settings);
}

/** 重置设置为默认值 */
export async function resetSettings(): Promise<AppSettings> {
  return api.post('/settings/reset');
}
