// 分析任务相关类型定义

/** Agent 状态 */
export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/** Agent 信息 */
export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
}

/** Agent 分组 */
export interface AgentGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  agents: Agent[];
}

/** 消息类型 */
export type MessageType = 'tool' | 'agent' | 'data' | 'system';

/** 实时消息 */
export interface Message {
  id: string;
  type: MessageType;
  agent: string;
  content: string;
  timestamp: string;
}

/** 研究深度 */
export type DepthLevel = 'shallow' | 'medium' | 'deep';

/** LLM Provider */
export type LLMProvider = 'openai' | 'google' | 'anthropic' | 'deepseek';

/** 分析配置 */
export interface AnalysisConfig {
  ticker: string;
  date: string;
  language: 'en' | 'zh' | 'ja';
  analysts: string[];
  depth: DepthLevel;
  provider: LLMProvider;
  quickModel: string;
  deepModel: string;
}

/** 分析任务状态 */
export type AnalysisStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

/** 分析任务 */
export interface AnalysisTask {
  id: string;
  config: AnalysisConfig;
  status: AnalysisStatus;
  progress: number;
  createdAt: string;
  completedAt?: string;
  llmCalls: number;
  toolCalls: number;
  tokenUsage: number;
  elapsedTime: string;
  agentGroups: AgentGroup[];
  messages: Message[];
  reportPreview: string;
}

/** 仪表盘统计 */
export interface DashboardStats {
  totalAnalyses: number;
  monthlyAnalyses: number;
  activeStrategies: number;
  avgDuration: number;
  totalChange: number;
  monthlyChange: number;
  durationChange: number;
}

/** 最近分析记录 */
export interface RecentAnalysis {
  id: string;
  ticker: string;
  companyName: string;
  date: string;
  signal: 'buy' | 'hold' | 'sell';
  confidence: number;
  status: AnalysisStatus;
}
