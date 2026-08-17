// 报告 API
import api from './api';
import type { Report, HistoryReport } from '@/types/report';

/** 获取报告详情 */
export async function getReport(id: string): Promise<Report> {
  return api.get(`/reports/${id}`);
}

/** 获取历史报告列表 */
export async function getHistoryReports(params?: {
  search?: string;
  startDate?: string;
  endDate?: string;
  signal?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: HistoryReport[]; total: number }> {
  return api.get('/reports', { params });
}

/** 导出报告为 PDF */
export async function exportReportPDF(id: string): Promise<Blob> {
  return api.get(`/reports/${id}/export/pdf`, { responseType: 'blob' });
}

/** 导出报告为 Markdown */
export async function exportReportMarkdown(id: string): Promise<string> {
  return api.get(`/reports/${id}/export/markdown`);
}
