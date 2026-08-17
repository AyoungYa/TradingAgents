// 用户设置状态管理
import { create } from 'zustand';
import type { AppSettings } from '@/types/settings';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setSettings: (settings: AppSettings) => void;
  updateLLMProvider: (provider: string, apiKey: string) => void;
  updateDefaultModels: (quickModel: string, deepModel: string) => void;
  updateDataSource: (key: keyof AppSettings['dataSources'], value: boolean | string) => void;
  updateNotification: (key: keyof AppSettings['notifications'], value: boolean) => void;
  updatePreference: (key: keyof AppSettings['preferences'], value: string) => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  resetToDefault: () => void;
}

const defaultSettings: AppSettings = {
  llmProviders: {
    openai: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
    google: 'AIzaSyxxxxxxxxxxxxxxxx',
    anthropic: '',
    deepseek: '',
  },
  defaultModels: {
    quickModel: 'gpt-4o-mini',
    deepModel: 'gpt-4o',
  },
  dataSources: {
    yahooFinance: true,
    alphaVantage: false,
    alphaVantageKey: '',
  },
  notifications: {
    analysisComplete: true,
    soundAlert: false,
    emailNotify: false,
  },
  preferences: {
    defaultAnalysts: 'all',
    defaultDepth: 'medium',
    defaultLanguage: 'en',
    defaultProvider: 'openai',
  },
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { ...defaultSettings },
  isLoading: false,
  isSaving: false,

  setSettings: (settings) => set({ settings }),
  updateLLMProvider: (provider, apiKey) =>
    set((state) => ({
      settings: {
        ...state.settings,
        llmProviders: {
          ...state.settings.llmProviders,
          [provider]: apiKey,
        },
      },
    })),
  updateDefaultModels: (quickModel, deepModel) =>
    set((state) => ({
      settings: {
        ...state.settings,
        defaultModels: { quickModel, deepModel },
      },
    })),
  updateDataSource: (key, value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        dataSources: {
          ...state.settings.dataSources,
          [key]: value,
        },
      },
    })),
  updateNotification: (key, value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        notifications: {
          ...state.settings.notifications,
          [key]: value,
        },
      },
    })),
  updatePreference: (key, value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        preferences: {
          ...state.settings.preferences,
          [key]: value,
        },
      },
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setSaving: (isSaving) => set({ isSaving }),
  resetToDefault: () => set({ settings: { ...defaultSettings } }),
}));
