// 常量定义

/** 热门股票列表 */
export const POPULAR_STOCKS = [
  { ticker: 'NVDA', name: 'NVIDIA Corp' },
  { ticker: 'AAPL', name: 'Apple Inc' },
  { ticker: 'TSLA', name: 'Tesla Inc' },
  { ticker: 'MSFT', name: 'Microsoft Corp' },
  { ticker: 'GOOGL', name: 'Alphabet Inc' },
  { ticker: 'AMZN', name: 'Amazon.com Inc' },
  { ticker: 'META', name: 'Meta Platforms' },
  { ticker: 'NFLX', name: 'Netflix Inc' },
  { ticker: 'AMD', name: 'Advanced Micro Devices' },
  { ticker: 'BABA', name: 'Alibaba Group' },
  { ticker: 'JPM', name: 'JPMorgan Chase' },
  { ticker: 'V', name: 'Visa Inc' },
] as const;

/** 分析师类型列表 */
export const ANALYST_TYPES = [
  {
    id: 'market',
    name: 'Market Analyst',
    description: '技术分析、价格趋势、交易量',
    icon: 'fa-chart-line',
    color: '#00d4aa',
  },
  {
    id: 'social',
    name: 'Social Media Analyst',
    description: '社交媒体情绪、舆情分析',
    icon: 'fa-users',
    color: '#818cf8',
  },
  {
    id: 'news',
    name: 'News Analyst',
    description: '新闻事件、公告、行业动态',
    icon: 'fa-newspaper',
    color: '#f59e0b',
  },
  {
    id: 'fundamentals',
    name: 'Fundamentals Analyst',
    description: '财务报表、估值、基本面',
    icon: 'fa-balance-scale',
    color: '#ec4899',
  },
] as const;

/** LLM Provider 列表 */
export const LLM_PROVIDERS = [
  {
    id: 'openai' as const,
    name: 'OpenAI',
    models: ['GPT-5.4', 'GPT-5.2', 'GPT-4.1'],
    icon: 'fa-brain',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'anthropic' as const,
    name: 'Anthropic',
    models: ['Claude Opus 4.6', 'Claude Sonnet 4.6', 'Claude Haiku 4.5'],
    icon: 'fa-shield-alt',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  {
    id: 'google' as const,
    name: 'Google',
    models: ['Gemini 3.1 Pro', 'Gemini 3 Flash', 'Gemini 2.5 Pro'],
    icon: 'fa-cloud',
    color: '#818cf8',
    bgColor: 'rgba(99, 102, 241, 0.15)',
  },
  {
    id: 'xai' as const,
    name: 'xAI',
    models: ['Grok 4', 'Grok 4.1 Fast'],
    icon: 'fa-bolt',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
  },
  {
    id: 'deepseek' as const,
    name: 'DeepSeek',
    models: ['DeepSeek V4 Flash', 'DeepSeek V4 Pro'],
    icon: 'fa-atom',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
  },
  {
    id: 'qwen' as const,
    name: 'Qwen',
    models: ['Qwen 3.6 Plus', 'Qwen 3 Max'],
    icon: 'fa-star',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
  },
  {
    id: 'glm' as const,
    name: 'GLM',
    models: ['GLM-5.1', 'GLM-5'],
    icon: 'fa-globe',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
  },
  {
    id: 'ollama' as const,
    name: 'Ollama (Local)',
    models: ['Qwen3', 'GPT-OSS', 'GLM-4.7-Flash'],
    icon: 'fa-server',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.15)',
  },
] as const;

/** 各 Provider 的 Quick/Deep 模型选项（与后端 model_catalog.py 保持一致） */
export interface ModelOption {
  label: string;
  value: string;
}

export const PROVIDER_MODELS: Record<string, { quick: ModelOption[]; deep: ModelOption[] }> = {
  openai: {
    quick: [
      { label: 'GPT-5.4 Mini - Fast, strong coding and tool use', value: 'gpt-5.4-mini' },
      { label: 'GPT-5.4 Nano - Cheapest, high-volume tasks', value: 'gpt-5.4-nano' },
      { label: 'GPT-5.4 - Latest frontier, 1M context', value: 'gpt-5.4' },
      { label: 'GPT-4.1 - Smartest non-reasoning model', value: 'gpt-4.1' },
    ],
    deep: [
      { label: 'GPT-5.4 Pro - Most capable ($30/$180 per 1M tokens)', value: 'gpt-5.4-pro' },
      { label: 'GPT-5.4 - Latest frontier, 1M context', value: 'gpt-5.4' },
      { label: 'GPT-5.2 - Strong reasoning, cost-effective', value: 'gpt-5.2' },
      { label: 'GPT-5.4 Mini - Fast, strong coding and tool use', value: 'gpt-5.4-mini' },
    ],
  },
  anthropic: {
    quick: [
      { label: 'Claude Sonnet 4.6 - Best speed and intelligence balance', value: 'claude-sonnet-4-6' },
      { label: 'Claude Haiku 4.5 - Fast, near-instant responses', value: 'claude-haiku-4-5' },
      { label: 'Claude Sonnet 4.5 - Agents and coding', value: 'claude-sonnet-4-5' },
    ],
    deep: [
      { label: 'Claude Opus 4.6 - Most intelligent, agents and coding', value: 'claude-opus-4-6' },
      { label: 'Claude Opus 4.5 - Premium, max intelligence', value: 'claude-opus-4-5' },
      { label: 'Claude Sonnet 4.6 - Best speed and intelligence balance', value: 'claude-sonnet-4-6' },
      { label: 'Claude Sonnet 4.5 - Agents and coding', value: 'claude-sonnet-4-5' },
    ],
  },
  google: {
    quick: [
      { label: 'Gemini 3 Flash - Next-gen fast', value: 'gemini-3-flash-preview' },
      { label: 'Gemini 2.5 Flash - Balanced, stable', value: 'gemini-2.5-flash' },
      { label: 'Gemini 3.1 Flash Lite - Most cost-efficient', value: 'gemini-3.1-flash-lite-preview' },
      { label: 'Gemini 2.5 Flash Lite - Fast, low-cost', value: 'gemini-2.5-flash-lite' },
    ],
    deep: [
      { label: 'Gemini 3.1 Pro - Reasoning-first, complex workflows', value: 'gemini-3.1-pro-preview' },
      { label: 'Gemini 3 Flash - Next-gen fast', value: 'gemini-3-flash-preview' },
      { label: 'Gemini 2.5 Pro - Stable pro model', value: 'gemini-2.5-pro' },
      { label: 'Gemini 2.5 Flash - Balanced, stable', value: 'gemini-2.5-flash' },
    ],
  },
  xai: {
    quick: [
      { label: 'Grok 4.1 Fast (Non-Reasoning) - Speed optimized, 2M ctx', value: 'grok-4-1-fast-non-reasoning' },
      { label: 'Grok 4 Fast (Non-Reasoning) - Speed optimized', value: 'grok-4-fast-non-reasoning' },
      { label: 'Grok 4.1 Fast (Reasoning) - High-performance, 2M ctx', value: 'grok-4-1-fast-reasoning' },
    ],
    deep: [
      { label: 'Grok 4 - Flagship model', value: 'grok-4-0709' },
      { label: 'Grok 4.1 Fast (Reasoning) - High-performance, 2M ctx', value: 'grok-4-1-fast-reasoning' },
      { label: 'Grok 4 Fast (Reasoning) - High-performance', value: 'grok-4-fast-reasoning' },
      { label: 'Grok 4.1 Fast (Non-Reasoning) - Speed optimized, 2M ctx', value: 'grok-4-1-fast-non-reasoning' },
    ],
  },
  deepseek: {
    quick: [
      { label: 'DeepSeek V4 Flash', value: 'deepseek-v4-flash' },
    ],
    deep: [
      { label: 'DeepSeek V4 Pro', value: 'deepseek-v4-pro' },
    ],
  },
  qwen: {
    quick: [
      { label: 'Qwen 3.5 Flash', value: 'qwen3.5-flash' },
      { label: 'Qwen Plus', value: 'qwen-plus' },
      { label: 'Custom model ID', value: 'custom' },
    ],
    deep: [
      { label: 'Qwen 3.6 Plus', value: 'qwen3.6-plus' },
      { label: 'Qwen 3.5 Plus', value: 'qwen3.5-plus' },
      { label: 'Qwen 3 Max', value: 'qwen3-max' },
      { label: 'Custom model ID', value: 'custom' },
    ],
  },
  glm: {
    quick: [
      { label: 'GLM-4.7', value: 'glm-4.7' },
      { label: 'GLM-5', value: 'glm-5' },
      { label: 'Custom model ID', value: 'custom' },
    ],
    deep: [
      { label: 'GLM-5.1', value: 'glm-5.1' },
      { label: 'GLM-5', value: 'glm-5' },
      { label: 'Custom model ID', value: 'custom' },
    ],
  },
  ollama: {
    quick: [
      { label: 'Qwen3:latest (8B, local)', value: 'qwen3:latest' },
      { label: 'GPT-OSS:latest (20B, local)', value: 'gpt-oss:latest' },
      { label: 'GLM-4.7-Flash:latest (30B, local)', value: 'glm-4.7-flash:latest' },
    ],
    deep: [
      { label: 'GLM-4.7-Flash:latest (30B, local)', value: 'glm-4.7-flash:latest' },
      { label: 'GPT-OSS:latest (20B, local)', value: 'gpt-oss:latest' },
      { label: 'Qwen3:latest (8B, local)', value: 'qwen3:latest' },
    ],
  },
};

/** 研究深度选项 */
export const DEPTH_OPTIONS = [
  {
    id: 'shallow' as const,
    label: 'Shallow',
    labelCn: '快速扫描',
    description: '基础数据收集和快速分析，适合日常快速决策。',
    duration: '2-3 分钟',
    icon: 'fa-bolt',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'medium' as const,
    label: 'Medium',
    labelCn: '标准分析',
    description: '全面数据收集和多维度分析，适合大多数投资决策。',
    duration: '4-6 分钟',
    icon: 'fa-search',
    color: '#818cf8',
    bgColor: 'rgba(99, 102, 241, 0.15)',
  },
  {
    id: 'deep' as const,
    label: 'Deep',
    labelCn: '深度研究',
    description: '极致深度分析，包含历史回测和详细推理。',
    duration: '8-12 分钟',
    icon: 'fa-microscope',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
  },
] as const;

/** 语言选项 */
export const LANGUAGE_OPTIONS = [
  { id: 'en' as const, label: 'English', flag: '🇺🇸' },
  { id: 'zh' as const, label: '中文', flag: '🇨🇳' },
  { id: 'ja' as const, label: '日本語', flag: '🇯🇵' },
] as const;
