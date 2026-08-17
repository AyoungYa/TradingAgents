// 分析任务 API
import api from './api';
import type { AnalysisConfig, AnalysisTask, DashboardStats, RecentAnalysis } from '@/types/analysis';

/** 获取仪表盘统计数据 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return api.get('/dashboard/stats');
}

/** 获取最近分析列表 */
export async function getRecentAnalyses(): Promise<RecentAnalysis[]> {
  return api.get('/analyses/recent');
}

/** 创建新分析任务 */
export async function createAnalysis(config: AnalysisConfig): Promise<AnalysisTask> {
  return api.post('/analyses', config);
}

/** 获取分析任务详情 */
export async function getAnalysis(id: string): Promise<AnalysisTask> {
  return api.get(`/analyses/${id}`);
}

/** 暂停分析任务 */
export async function pauseAnalysis(id: string): Promise<void> {
  return api.post(`/analyses/${id}/pause`);
}

/** 恢复分析任务 */
export async function resumeAnalysis(id: string): Promise<void> {
  return api.post(`/analyses/${id}/resume`);
}

/** 终止分析任务 */
export async function terminateAnalysis(id: string): Promise<void> {
  return api.post(`/analyses/${id}/terminate`);
}

/** 搜索股票 */
export async function searchStocks(query: string): Promise<Array<{ ticker: string; name: string }>> {
  return api.get('/stocks/search', { params: { q: query } });
}
