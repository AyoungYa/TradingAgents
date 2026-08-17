// 设置相关类型定义

/** LLM Provider API Key 配置 */
export interface LLMProviderConfig {
  openai: string;
  google: string;
  anthropic: string;
  deepseek: string;
}

/** 默认模型配置 */
export interface DefaultModelConfig {
  quickModel: string;
  deepModel: string;
}

/** 数据源配置 */
export interface DataSourceConfig {
  yahooFinance: boolean;
  alphaVantage: boolean;
  alphaVantageKey: string;
}

/** 通知设置 */
export interface NotificationConfig {
  analysisComplete: boolean;
  soundAlert: boolean;
  emailNotify: boolean;
}

/** 用户偏好 */
export interface UserPreferences {
  defaultAnalysts: string;
  defaultDepth: string;
  defaultLanguage: string;
  defaultProvider: string;
}

/** 完整设置 */
export interface AppSettings {
  llmProviders: LLMProviderConfig;
  defaultModels: DefaultModelConfig;
  dataSources: DataSourceConfig;
  notifications: NotificationConfig;
  preferences: UserPreferences;
}
