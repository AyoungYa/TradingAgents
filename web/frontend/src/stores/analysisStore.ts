// 分析任务状态管理
import { create } from 'zustand';
import type {
  AnalysisConfig,
  AnalysisStatus,
  AgentGroup,
  Message,
  DepthLevel,
  LLMProvider,
} from '@/types/analysis';

interface AnalysisState {
  /** 当前分析任务 ID */
  taskId: string | null;
  /** 分析状态 */
  status: AnalysisStatus;
  /** 分析进度 (0-100) */
  progress: number;
  /** Agent 分组 */
  agentGroups: AgentGroup[];
  /** 实时消息 */
  messages: Message[];
  /** 报告预览内容 */
  reportPreview: string;
  /** 统计数据 */
  llmCalls: number;
  toolCalls: number;
  tokenUsage: number;
  elapsedTime: string;
  /** 表单配置 */
  config: AnalysisConfig;
  /** 当前步骤 */
  currentStep: number;

  // Actions
  setTaskId: (id: string) => void;
  setStatus: (status: AnalysisStatus) => void;
  setProgress: (progress: number) => void;
  setAgentGroups: (groups: AgentGroup[]) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setReportPreview: (content: string) => void;
  setStats: (stats: { llmCalls: number; toolCalls: number; tokenUsage: number; elapsedTime: string }) => void;
  updateConfig: (partial: Partial<AnalysisConfig>) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

const defaultConfig: AnalysisConfig = {
  ticker: '',
  date: new Date().toISOString().split('T')[0],
  language: 'en',
  analysts: ['market', 'social', 'news', 'fundamentals'],
  depth: 'medium',
  provider: 'openai',
  quickModel: 'gpt-4o-mini',
  deepModel: 'gpt-4o',
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  taskId: null,
  status: 'pending',
  progress: 0,
  agentGroups: [],
  messages: [],
  reportPreview: '',
  llmCalls: 0,
  toolCalls: 0,
  tokenUsage: 0,
  elapsedTime: '00:00',
  config: { ...defaultConfig },
  currentStep: 1,

  setTaskId: (id) => set({ taskId: id }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setAgentGroups: (agentGroups) => set({ agentGroups }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setReportPreview: (reportPreview) => set({ reportPreview }),
  setStats: (stats) => set(stats),
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  setCurrentStep: (currentStep) => set({ currentStep }),
  reset: () =>
    set({
      taskId: null,
      status: 'pending',
      progress: 0,
      agentGroups: [],
      messages: [],
      reportPreview: '',
      llmCalls: 0,
      toolCalls: 0,
      tokenUsage: 0,
      elapsedTime: '00:00',
      config: { ...defaultConfig },
      currentStep: 1,
    }),
}));
