// 报告相关类型定义

/** 交易信号 */
export type TradingSignal = 'buy' | 'hold' | 'sell';

/** 报告区块 Tab */
export interface ReportTab {
  id: string;
  label: string;
}

/** 报告区块 */
export interface ReportSection {
  id: string;
  index: string;
  title: string;
  tabs?: ReportTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  content: React.ReactNode;
}

/** 完整报告 */
export interface Report {
  id: string;
  ticker: string;
  companyName: string;
  signal: TradingSignal;
  confidence: number;
  recommendedPrice?: number;
  createdAt: string;
  duration: string;
  sections: ReportSection[];
}

/** 历史报告列表项 */
export interface HistoryReport {
  id: string;
  ticker: string;
  companyName: string;
  signal: TradingSignal;
  confidence: number;
  date: string;
  duration: string;
  status: 'completed' | 'running' | 'failed';
}
