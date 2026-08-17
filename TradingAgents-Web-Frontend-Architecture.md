# TradingAgents Web 平台 Phase 1 MVP 前端技术方案

## 概述

本文档为 TradingAgents Web 平台 Phase 1 MVP 提供完整的前端技术架构设计。TradingAgents 是一个基于 LangGraph + 多 Agent LLM 的金融交易决策框架，从 CLI 应用向 Web 平台演进。

**技术栈约束：**
- 框架：React 18 + TypeScript 5
- 构建工具：Vite 5
- 样式：Tailwind CSS 3.4
- 状态管理：Zustand（推荐）
- 路由：React Router 6
- HTTP 客户端：Axios
- WebSocket：socket.io-client
- Markdown：react-markdown
- UI 组件库：Headless UI / Radix UI（无样式优先）

---

## 1. 项目结构设计

```
tradingagents-web/
├── public/                      # 静态资源
│   ├── favicon.svg
│   └── icons/                   # SVG 图标资源
├── src/
│   ├── assets/                  # 静态资源文件
│   │   └── images/
│   ├── components/              # 通用组件（可复用）
│   │   ├── ui/                  # 基础 UI 组件（原子级别）
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Select/
│   │   │   ├── Toggle/
│   │   │   ├── Badge/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Tooltip/
│   │   │   └── Spinner/
│   │   └── common/              # 业务通用组件
│   │       ├── GlassCard/
│   │       ├── StatCard/
│   │       ├── ProgressBar/
│   │       ├── Collapsible/
│   │       ├── Tabs/
│   │       └── SearchableList/
│   ├── layouts/                 # 布局组件
│   │   ├── MainLayout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── MainLayout.module.css
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── pages/                   # 页面组件（路由级别组件）
│   │   ├── Dashboard/
│   │   ├── NewAnalysis/
│   │   ├── LiveAnalysis/
│   │   ├── Report/
│   │   ├── History/
│   │   └── Settings/
│   ├── features/               # 功能模块（按领域组织）
│   │   ├── analysis/            # 分析相关
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── stores/
│   │   │   └── types/
│   │   ├── report/              # 报告相关
│   │   ├── settings/            # 设置相关
│   │   └── auth/                # 认证相关（如需要）
│   ├── hooks/                   # 全局自定义 Hooks
│   │   ├── useWebSocket.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useAutoComplete.ts
│   │   └── useResponsive.ts
│   ├── services/                # API 服务层
│   │   ├── apiClient.ts         # Axios 实例配置
│   │   ├── analysisApi.ts
│   │   ├── reportApi.ts
│   │   ├── settingsApi.ts
│   │   └── websocketService.ts
│   ├── stores/                  # Zustand 全局状态
│   │   ├── analysisStore.ts
│   │   ├── settingsStore.ts
│   │   ├── uiStore.ts
│   │   └── websocketStore.ts
│   ├── types/                   # 全局 TypeScript 类型
│   │   ├── analysis.ts
│   │   ├── report.ts
│   │   ├── settings.ts
│   │   ├── websocket.ts
│   │   └── common.ts
│   ├── utils/                   # 工具函数
│   │   ├── formatters.ts        # 数据格式化
│   │   ├── validators.ts        # 表单验证
│   │   ├── constants.ts         # 常量定义
│   │   └── helpers.ts           # 通用辅助函数
│   ├── styles/                  # 全局样式
│   │   ├── globals.css          # Tailwind 入口 + CSS 变量
│   │   └── animations.css        # 动画定义
│   ├── App.tsx                  # 应用根组件
│   ├── main.tsx                 # 入口文件
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── .env.example
```

### 目录职责说明

| 目录 | 职责 | 预期文件 |
|------|------|----------|
| `components/ui` | 原子级别 UI 组件，提供基础 HTML 元素封装 | Button, Input, Select, Toggle, Badge, Card, Modal, Tooltip, Spinner |
| `components/common` | 分子级别可复用组件，多个 UI 组件组合 | GlassCard, StatCard, ProgressBar, Collapsible, Tabs, SearchableList |
| `layouts` | 应用整体布局结构 | MainLayout（侧边栏 + 内容区） |
| `pages` | 路由级别页面组件，直接对应路由 | Dashboard, NewAnalysis, LiveAnalysis, Report, History, Settings |
| `features/analysis` | 分析功能领域模块，包含组件、hooks、store、types | StepForm, StockInput, AnalystSelector, DepthSelector, LLMSelector, ConfigSummary |
| `hooks` | 全局自定义 Hooks，可在任何地方使用 | useWebSocket, useLocalStorage, useDebounce, useAutoComplete, useResponsive |
| `services` | API 服务层封装，与后端交互 | apiClient, analysisApi, reportApi, settingsApi, websocketService |
| `stores` | Zustand 全局状态管理 | analysisStore, settingsStore, uiStore, websocketStore |
| `types` | TypeScript 类型定义 | analysis.ts, report.ts, settings.ts, websocket.ts, common.ts |
| `utils` | 工具函数库 | formatters, validators, constants, helpers |

---

## 2. 核心组件设计

### 2.1 布局组件

#### Layout (主布局)

**文件位置：** `src/layouts/MainLayout/`

```typescript
// src/layouts/MainLayout/MainLayout.tsx
import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="ml-[260px] min-h-screen p-6 lg:p-8">
        <Header />
        <main className="mt-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
```

**响应式行为：**
- 桌面端 (>= 1024px)：侧边栏展开 (260px)
- 平板端 (768px - 1024px)：侧边栏折叠 (72px)，仅显示图标
- 移动端 (< 768px)：侧边栏隐藏，顶部汉堡菜单

#### Sidebar (导航侧边栏)

**文件位置：** `src/layouts/MainLayout/Sidebar.tsx`

```typescript
// src/layouts/MainLayout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface NavItem {
  path: string;
  icon: string;        // FontAwesome class
  label: string;
  section?: string;    // 导航分组
}

const navItems: NavItem[] = [
  { path: '/', icon: 'fa-th-large', label: '仪表盘', section: 'main' },
  { path: '/analysis/new', icon: 'fa-plus-circle', label: '新建分析', section: 'main' },
  { path: '/analysis/live', icon: 'fa-play-circle', label: '实时分析', section: 'main' },
  { path: '/report/current', icon: 'fa-file-alt', label: '分析报告', section: 'main' },
  { path: '/reports', icon: 'fa-history', label: '历史报告', section: 'manage' },
  { path: '/settings', icon: 'fa-cog', label: '系统设置', section: 'manage' },
];

export default function Sidebar() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col z-40 transition-all duration-300">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00d4aa] to-[#00b894] flex items-center justify-center">
            <i className="fa-solid fa-chart-line text-[#0a0e1a] text-base" />
          </div>
          <div className="logo-text">
            <div className="font-bold text-base text-[var(--text-primary)]">TradingAgents</div>
            <div className="text-[11px] text-[var(--text-muted)]">Multi-Agent Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {['main', 'manage'].map((section) => (
          <div key={section} className="mb-4">
            <div className="nav-text px-2 py-2 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              {section === 'main' ? 'Main' : 'Manage'}
            </div>
            {navItems
              .filter((item) => item.section === section)
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'nav-item',
                    isActive(item.path) && 'active'
                  )}
                >
                  <i className={cn('fa-solid', item.icon, 'w-[18px] text-center')} />
                  <span className="nav-text">{item.label}</span>
                </Link>
              ))}
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center text-sm font-semibold">
            A
          </div>
          <div className="user-info">
            <div className="text-[13px] font-semibold">Admin</div>
            <div className="text-[11px] text-[var(--text-muted)]">Pro Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

**状态：**
- 无内部状态（受控于路由）
- 使用 `useLocation` 获取当前路径

**事件：**
- 导航点击：使用 React Router 的 `Link` 组件处理

#### Header (顶部栏)

**文件位置：** `src/layouts/MainLayout/Header.tsx`

```typescript
// src/layouts/MainLayout/Header.tsx
import { useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: '仪表盘', subtitle: '欢迎回来，这是您的交易分析概览' },
  '/analysis/new': { title: '新建分析', subtitle: '配置分析参数，启动多 Agent 协作分析' },
  '/reports': { title: '历史报告', subtitle: '查看和管理所有历史分析报告' },
  '/settings': { title: '系统设置', subtitle: '配置 LLM Provider、数据源和用户偏好' },
};

export default function Header() {
  const location = useLocation();
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore();
  
  // 动态获取页面标题
  const getPageInfo = () => {
    if (location.pathname.startsWith('/analysis/') && location.pathname !== '/analysis/new') {
      return { title: '实时分析', subtitle: '多 Agent 协作分析进行中...' };
    }
    if (location.pathname.startsWith('/report/') && location.pathname !== '/report/current') {
      return { title: '分析报告', subtitle: '查看完整分析报告' };
    }
    return pageTitles[location.pathname] || { title: 'TradingAgents', subtitle: '' };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-1">{pageInfo.title}</h1>
        <p className="text-[var(--text-secondary)] text-sm">{pageInfo.subtitle}</p>
      </div>
      
      {/* Mobile Menu Toggle */}
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-card)]"
        onClick={toggleMobileMenu}
      >
        <i className={cn(
          'fa-solid fa-bars text-lg',
          isMobileMenuOpen ? 'hidden' : 'block'
        )} />
      </button>
    </header>
  );
}
```

---

### 2.2 分析相关组件

#### StepForm (8步向导容器)

**文件位置：** `src/features/analysis/components/StepForm.tsx`

```typescript
// src/features/analysis/components/StepForm.tsx
import { useState, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface StepFormProps {
  steps: {
    title: string;
    description?: string;
    content: ReactNode;
  }[];
  onComplete: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export default function StepForm({ steps, onComplete, onCancel }: StepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleDataChange = (stepKey: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [stepKey]: value }));
  };

  const handleComplete = () => {
    onComplete(formData);
  };

  return (
    <div className="max-w-[720px] mx-auto">
      {/* Step Indicators */}
      <div className="flex items-center justify-center mb-9">
        {steps.map((_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                'step-dot',
                index + 1 < currentStep && 'completed',
                index + 1 === currentStep && 'active'
              )}
            >
              {index + 1 < currentStep ? (
                <i className="fa-solid fa-check text-[10px]" />
              ) : (
                index + 1
              )}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={cn(
                  'step-line',
                  index + 1 < currentStep && 'completed'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass-card p-8 min-h-[360px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {steps[currentStep - 1]?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          className={cn('btn-secondary', isFirstStep && 'invisible')}
          onClick={handlePrev}
        >
          <i className="fa-solid fa-arrow-left" />
          上一步
        </button>
        
        <div className="flex-1" />
        
        {isLastStep ? (
          <button className="btn-primary" onClick={handleComplete}>
            <i className="fa-solid fa-rocket" />
            启动分析
          </button>
        ) : (
          <button className="btn-primary" onClick={handleNext}>
            下一步
            <i className="fa-solid fa-arrow-right" />
          </button>
        )}
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| steps | Step[] | 是 | 步骤配置数组 |
| onComplete | (data: Record) => void | 是 | 完成回调 |
| onCancel | () => void | 否 | 取消回调 |

**状态：**
- `currentStep`: number - 当前步骤 (1-8)
- `formData`: Record<string, unknown> - 表单数据收集

**事件：**
- `onNext`: 下一步
- `onPrev`: 上一步
- `onComplete`: 完成并提交
- `onDataChange`: 数据变更

#### StockInput (带自动补全的股票输入)

**文件位置：** `src/features/analysis/components/StockInput.tsx`

```typescript
// src/features/analysis/components/StockInput.tsx
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { useDebounce } from '@/hooks/useDebounce';

interface StockInfo {
  ticker: string;
  name: string;
}

interface StockInputProps {
  value: string;
  onChange: (ticker: string, stockInfo?: StockInfo) => void;
  onSearch?: (query: string) => Promise<StockInfo[]>;
  placeholder?: string;
  className?: string;
}

const popularStocks: StockInfo[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corp' },
  { ticker: 'AAPL', name: 'Apple Inc' },
  { ticker: 'TSLA', name: 'Tesla Inc' },
  { ticker: 'MSFT', name: 'Microsoft Corp' },
  { ticker: 'GOOGL', name: 'Alphabet Inc' },
  { ticker: 'AMZN', name: 'Amazon.com Inc' },
  { ticker: 'META', name: 'Meta Platforms' },
];

export default function StockInput({
  value,
  onChange,
  onSearch,
  placeholder = '例如: AAPL, NVDA, TSLA...',
  className,
}: StockInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const debouncedValue = useDebounce(value, 300);

  // 搜索建议
  useEffect(() => {
    if (!debouncedValue) {
      setSuggestions([]);
      return;
    }

    const searchStocks = async () => {
      setLoading(true);
      try {
        if (onSearch) {
          const results = await onSearch(debouncedValue);
          setSuggestions(results);
        } else {
          // 本地过滤
          const filtered = popularStocks.filter(
            (s) =>
              s.ticker.toLowerCase().includes(debouncedValue.toLowerCase()) ||
              s.name.toLowerCase().includes(debouncedValue.toLowerCase())
          );
          setSuggestions(filtered);
        }
      } catch (error) {
        console.error('Stock search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    searchStocks();
  }, [debouncedValue, onSearch]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listRef.current &&
        !listRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stock: StockInfo) => {
    onChange(stock.ticker, stock);
    setIsOpen(false);
  };

  const showSuggestions = isOpen && (suggestions.length > 0 || loading);

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="input-field font-mono text-lg p-4"
        autoComplete="off"
      />

      {/* Autocomplete List */}
      {showSuggestions && (
        <div ref={listRef} className="autocomplete-list show">
          {loading ? (
            <div className="p-4 text-center text-[var(--text-muted)]">
              <i className="fa-solid fa-spinner fa-spin" />
            </div>
          ) : (
            suggestions.map((stock) => (
              <div
                key={stock.ticker}
                className="autocomplete-item"
                onClick={() => handleSelect(stock)}
              >
                <span className="font-mono font-semibold">{stock.ticker}</span>
                <span className="text-[var(--text-muted)] text-[13px]">{stock.name}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Popular Stocks */}
      {!value && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-[12px] text-[var(--text-muted)] mr-1 leading-7">热门:</span>
          {popularStocks.slice(0, 6).map((stock) => (
            <button
              key={stock.ticker}
              className="btn-secondary py-1 px-3 text-[12px]"
              onClick={() => handleSelect(stock)}
            >
              {stock.ticker}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| value | string | 是 | 当前输入值 |
| onChange | (ticker, info?) => void | 是 | 值变更回调 |
| onSearch | (query) => Promise | 否 | 自定义搜索函数 |
| placeholder | string | 否 | 占位符文本 |

**状态：**
- `isOpen`: boolean - 下拉框是否展开
- `suggestions`: StockInfo[] - 搜索建议列表
- `loading`: boolean - 加载状态

#### AnalystSelector (分析师多选卡片)

**文件位置：** `src/features/analysis/components/AnalystSelector.tsx`

```typescript
// src/features/analysis/components/AnalystSelector.tsx
import { cn } from '@/utils/cn';

export interface AnalystType {
  id: string;
  name: string;
  description: string;
  icon: string;       // FontAwesome class
  color: string;      // Tailwind color class
}

const defaultAnalysts: AnalystType[] = [
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
];

interface AnalystSelectorProps {
  value: string[];
  onChange: (selected: string[]) => void;
  analysts?: AnalystType[];
}

export default function AnalystSelector({
  value,
  onChange,
  analysts = defaultAnalysts,
}: AnalystSelectorProps) {
  const toggleAnalyst = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((a) => a !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const isSelected = (id: string) => value.includes(id);

  return (
    <div className="grid grid-cols-2 gap-4">
      {analysts.map((analyst) => (
        <div
          key={analyst.id}
          className={cn('check-card', isSelected(analyst.id) && 'selected')}
          onClick={() => toggleAnalyst(analyst.id)}
        >
          <i
            className={cn('fa-solid', analyst.icon)}
            style={{ fontSize: '28px', color: analyst.color, marginBottom: '12px', display: 'block' }}
          />
          <div className="font-semibold mb-1">{analyst.name}</div>
          <div className="text-[13px] text-[var(--text-muted)]">{analyst.description}</div>
        </div>
      ))}
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| value | string[] | 是 | 已选中的分析师 ID 数组 |
| onChange | (selected) => void | 是 | 选择变更回调 |
| analysts | AnalystType[] | 否 | 分析师配置数组 |

#### DepthSelector (深度选择器)

**文件位置：** `src/features/analysis/components/DepthSelector.tsx`

```typescript
// src/features/analysis/components/DepthSelector.tsx
import { cn } from '@/utils/cn';

export type DepthLevel = 'shallow' | 'medium' | 'deep';

interface DepthOption {
  id: DepthLevel;
  label: string;
  labelCn: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
  bgColor: string;
}

const depthOptions: DepthOption[] = [
  {
    id: 'shallow',
    label: 'Shallow',
    labelCn: '快速扫描',
    description: '基础数据收集和快速分析，适合日常快速决策。',
    duration: '2-3 分钟',
    icon: 'fa-bolt',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'medium',
    label: 'Medium',
    labelCn: '标准分析',
    description: '全面数据收集和多维度分析，适合大多数投资决策。',
    duration: '4-6 分钟',
    icon: 'fa-search',
    color: '#818cf8',
    bgColor: 'rgba(99, 102, 241, 0.15)',
  },
  {
    id: 'deep',
    label: 'Deep',
    labelCn: '深度研究',
    description: '极致深度分析，包含历史回测和详细推理。',
    duration: '8-12 分钟',
    icon: 'fa-microscope',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
  },
];

interface DepthSelectorProps {
  value: DepthLevel;
  onChange: (depth: DepthLevel) => void;
}

export default function DepthSelector({ value, onChange }: DepthSelectorProps) {
  return (
    <div className="grid gap-4">
      {depthOptions.map((option) => (
        <div
          key={option.id}
          className={cn('depth-card', value === option.id && 'selected')}
          onClick={() => onChange(option.id)}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: option.bgColor }}
          >
            <i
              className={cn('fa-solid', option.icon)}
              style={{ color: option.color, fontSize: '22px' }}
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold mb-1">
              {option.label}{' '}
              <span className="text-[12px] text-[var(--text-muted)] font-normal">
                {option.labelCn}
              </span>
            </div>
            <div className="text-[13px] text-[var(--text-secondary)]">
              {option.description}预计耗时 {option.duration}。
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| value | 'shallow' \| 'medium' \| 'deep' | 是 | 当前选中深度 |
| onChange | (depth) => void | 是 | 深度变更回调 |

#### LLMSelector (LLM/模型选择)

**文件位置：** `src/features/analysis/components/LLMSelector.tsx`

```typescript
// src/features/analysis/components/LLMSelector.tsx
import { cn } from '@/utils/cn';

export type LLMProvider = 'openai' | 'google' | 'anthropic' | 'deepseek';

interface ProviderOption {
  id: LLMProvider;
  name: string;
  models: string[];
  icon: string;
  color: string;
  bgColor: string;
}

const providers: ProviderOption[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['GPT-4o', 'GPT-4o-mini'],
    icon: 'fa-brain',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'google',
    name: 'Google',
    models: ['Gemini 2.5 Pro', 'Gemini Flash'],
    icon: 'fa-cloud',
    color: '#818cf8',
    bgColor: 'rgba(99, 102, 241, 0.15)',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['Claude 4 Sonnet', 'Claude Haiku'],
    icon: 'fa-shield-alt',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: ['DeepSeek-V3', 'DeepSeek-R1'],
    icon: 'fa-atom',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
  },
];

interface LLMSelectorProps {
  provider: LLMProvider;
  quickModel: string;
  deepModel: string;
  onProviderChange: (provider: LLMProvider) => void;
  onQuickModelChange: (model: string) => void;
  onDeepModelChange: (model: string) => void;
}

export default function LLMSelector({
  provider,
  quickModel,
  deepModel,
  onProviderChange,
  onQuickModelChange,
  onDeepModelChange,
}: LLMSelectorProps) {
  const selectedProvider = providers.find((p) => p.id === provider) || providers[0];

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <h3 className="text-base font-semibold mb-4">LLM Provider</h3>
        <div className="grid grid-cols-2 gap-4">
          {providers.map((p) => (
            <div
              key={p.id}
              className={cn('depth-card', provider === p.id && 'selected')}
              onClick={() => onProviderChange(p.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: p.bgColor }}
                >
                  <i className={cn('fa-solid', p.icon)} style={{ color: p.color }} />
                </div>
                <div className="font-semibold">{p.name}</div>
              </div>
              <div className="text-[13px] text-[var(--text-muted)]">
                {p.models.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div className="grid gap-5">
        {/* Quick-thinking Model */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            <i className="fa-solid fa-bolt" style={{ color: '#f59e0b' }} />
            Quick-thinking Model
          </div>
          <select
            className="input-field"
            value={quickModel}
            onChange={(e) => onQuickModelChange(e.target.value)}
          >
            {selectedProvider.models.map((model) => (
              <option key={model} value={model.toLowerCase().replace(/\s+/g, '-')}>
                {model}
              </option>
            ))}
          </select>
          <div className="text-[12px] text-[var(--text-muted)] mt-2">
            用于快速数据处理和初步分析
          </div>
        </div>

        {/* Deep-thinking Model */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            <i className="fa-solid fa-brain" style={{ color: 'var(--accent)' }} />
            Deep-thinking Model
          </div>
          <select
            className="input-field"
            value={deepModel}
            onChange={(e) => onDeepModelChange(e.target.value)}
          >
            {providers.flatMap((p) =>
              p.models.map((model) => (
                <option key={model} value={model.toLowerCase().replace(/\s+/g, '-')}>
                  {p.name} - {model}
                </option>
              ))
            )}
          </select>
          <div className="text-[12px] text-[var(--text-muted)] mt-2">
            用于复杂推理和最终决策
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| provider | LLMProvider | 是 | 当前 LLM 提供商 |
| quickModel | string | 是 | 快速思考模型 |
| deepModel | string | 是 | 深度思考模型 |
| onProviderChange | (provider) => void | 是 | 提供商变更回调 |
| onQuickModelChange | (model) => void | 是 | 快速模型变更回调 |
| onDeepModelChange | (model) => void | 是 | 深度模型变更回调 |

#### ConfigSummary (配置确认)

**文件位置：** `src/features/analysis/components/ConfigSummary.tsx`

```typescript
// src/features/analysis/components/ConfigSummary.tsx
import { AnalysisConfig } from '@/features/analysis/types';

interface ConfigSummaryProps {
  config: Partial<AnalysisConfig>;
}

export default function ConfigSummary({ config }: ConfigSummaryProps) {
  const formatAnalysts = (ids: string[]) => {
    const names: Record<string, string> = {
      market: 'Market',
      social: 'Social',
      news: 'News',
      fundamentals: 'Fundamentals',
    };
    return ids.map((id) => names[id] || id).join(', ');
  };

  const formatDepth = (depth: string) => {
    const depths: Record<string, string> = {
      shallow: 'Shallow',
      medium: 'Medium',
      deep: 'Deep',
    };
    return depths[depth] || depth;
  };

  const formatProvider = (provider: string) => {
    const providers: Record<string, string> = {
      openai: 'OpenAI',
      google: 'Google',
      anthropic: 'Anthropic',
      deepseek: 'DeepSeek',
    };
    return providers[provider] || provider;
  };

  const formatModel = (model: string) => {
    return model
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-[rgba(148,163,184,0.05)] rounded-xl p-5 grid gap-4">
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">股票代码</span>
        <span className="font-mono font-semibold">{config.ticker || '-'}</span>
      </div>
      <div className="border-t border-[var(--border)]" />
      
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">分析日期</span>
        <span className="font-mono font-medium">{config.date || '-'}</span>
      </div>
      <div className="border-t border-[var(--border)]" />
      
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">输出语言</span>
        <span className="font-medium">{config.language === 'zh' ? '中文' : config.language === 'ja' ? '日本語' : 'English'}</span>
      </div>
      <div className="border-t border-[var(--border)]" />
      
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">分析师团队</span>
        <span className="font-medium">{config.analysts ? formatAnalysts(config.analysts) : '-'}</span>
      </div>
      <div className="border-t border-[var(--border)]" />
      
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">研究深度</span>
        <span className="font-medium">{config.depth ? formatDepth(config.depth) : '-'}</span>
      </div>
      <div className="border-t border-[var(--border)]" />
      
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">LLM Provider</span>
        <span className="font-medium">{config.provider ? formatProvider(config.provider) : '-'}</span>
      </div>
      <div className="border-t border-[var(--border)]" />
      
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">Quick Model</span>
        <span className="font-mono text-[13px]">{config.quickModel ? formatModel(config.quickModel) : '-'}</span>
      </div>
      <div className="border-t border-[var(--border)]" />
      
      <div className="flex justify-between items-center">
        <span className="text-[var(--text-muted)] text-sm">Deep Model</span>
        <span className="font-mono text-[13px]">{config.deepModel ? formatModel(config.deepModel) : '-'}</span>
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| config | Partial<AnalysisConfig> | 是 | 分析配置对象 |

---

### 2.3 实时分析组件

#### AgentProgressPanel (左侧 Agent 进度面板)

**文件位置：** `src/features/analysis/components/AgentProgressPanel.tsx`

```typescript
// src/features/analysis/components/AgentProgressPanel.tsx
import { cn } from '@/utils/cn';
import AgentStatusCard from './AgentStatusCard';
import { Agent, AgentStatus } from '@/types/analysis';

interface AgentGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  agents: Agent[];
}

interface AgentProgressPanelProps {
  agentGroups: AgentGroup[];
  className?: string;
}

export default function AgentProgressPanel({
  agentGroups,
  className,
}: AgentProgressPanelProps) {
  const getGroupStatus = (group: AgentGroup): AgentStatus => {
    const completed = group.agents.filter((a) => a.status === 'completed').length;
    const total = group.agents.length;
    
    if (completed === total) return 'completed';
    if (completed > 0) return 'in_progress';
    return 'pending';
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {agentGroups.map((group) => {
        const completed = group.agents.filter((a) => a.status === 'completed').length;
        const total = group.agents.length;
        const groupStatus = getGroupStatus(group);

        return (
          <div key={group.id} className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <i
                className={cn('fa-solid', group.icon)}
                style={{ color: group.color, fontSize: '14px' }}
              />
              <span className="text-sm font-semibold">{group.name}</span>
              <span
                className={cn('agent-status ml-auto', `status-${groupStatus}`)}
                style={{ fontSize: '11px' }}
              >
                {completed}/{total}
              </span>
            </div>
            <div className="grid gap-2">
              {group.agents.map((agent) => (
                <AgentStatusCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agentGroups | AgentGroup[] | 是 | Agent 分组列表 |
| className | string | 否 | 额外的 CSS 类 |

**AgentGroup 类型：**
```typescript
interface AgentGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  agents: Agent[];
}
```

#### AgentStatusCard (单个 Agent 状态卡片)

**文件位置：** `src/features/analysis/components/AgentStatusCard.tsx`

```typescript
// src/features/analysis/components/AgentStatusCard.tsx
import { cn } from '@/utils/cn';
import { Agent, AgentStatus } from '@/types/analysis';

interface AgentStatusCardProps {
  agent: Agent;
}

const statusConfig: Record<AgentStatus, { text: string; showSpinner: boolean }> = {
  pending: { text: '等待中', showSpinner: false },
  in_progress: { text: '进行中', showSpinner: true },
  completed: { text: '完成', showSpinner: false },
  failed: { text: '失败', showSpinner: false },
};

export default function AgentStatusCard({ agent }: AgentStatusCardProps) {
  const config = statusConfig[agent.status];

  return (
    <div className="agent-item flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className={cn('status-dot', agent.status === 'in_progress' && 'animate-pulse-dot')}
          style={{
            backgroundColor:
              agent.status === 'completed'
                ? '#10b981'
                : agent.status === 'in_progress'
                ? '#00d4aa'
                : '#64748b',
          }}
        />
        <span className="text-[13px]">{agent.name}</span>
      </div>
      <span className={cn('agent-status', `status-${agent.status}`)} style={{ fontSize: '11px' }}>
        {config.showSpinner && <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '9px' }} />}
        {!config.showSpinner && agent.status === 'completed' && (
          <i className="fa-solid fa-check" style={{ fontSize: '9px' }} />
        )}
        {config.text}
      </span>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| agent | Agent | 是 | Agent 对象 |

#### MessageStream (实时消息流)

**文件位置：** `src/features/analysis/components/MessageStream.tsx`

```typescript
// src/features/analysis/components/MessageStream.tsx
import { useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';
import MessageItem from './MessageItem';
import { Message } from '@/types/analysis';

interface MessageStreamProps {
  messages: Message[];
  filter?: Message['type'][];
  className?: string;
}

export default function MessageStream({
  messages,
  filter,
  className,
}: MessageStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredMessages = filter
    ? messages.filter((m) => filter.includes(m.type))
    : messages;

  return (
    <div className={cn('glass-card p-0 flex flex-col overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-stream" style={{ color: 'var(--accent)', fontSize: '13px' }} />
          <span className="text-sm font-semibold">实时消息流</span>
        </div>
        <div className="flex gap-1.5">
          <span className="filter-badge" data-type="tool">Tool</span>
          <span className="filter-badge" data-type="agent">Agent</span>
          <span className="filter-badge" data-type="data">Data</span>
        </div>
      </div>

      {/* Message List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 grid gap-2"
        style={{ minHeight: '200px' }}
      >
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <i className="fa-solid fa-inbox mr-2" />
            暂无消息
          </div>
        ) : (
          filteredMessages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| messages | Message[] | 是 | 消息列表 |
| filter | Message['type'][] | 否 | 消息类型过滤器 |
| className | string | 否 | 额外的 CSS 类 |

**特性：**
- 自动滚动到最新消息
- 支持消息类型过滤
- 虚拟滚动优化（大量消息时）

#### MessageItem (消息条目)

**文件位置：** `src/features/analysis/components/MessageItem.tsx`

```typescript
// src/features/analysis/components/MessageItem.tsx
import { Message } from '@/types/analysis';

interface MessageItemProps {
  message: Message;
}

const messageConfig = {
  tool: {
    className: 'msg-tool',
    icon: 'fa-wrench',
    color: '#818cf8',
  },
  agent: {
    className: 'msg-agent',
    icon: 'fa-robot',
    color: 'var(--accent)',
  },
  data: {
    className: 'msg-data',
    icon: 'fa-database',
    color: 'var(--warning)',
  },
  system: {
    className: 'msg-system',
    icon: 'fa-info-circle',
    color: 'var(--text-muted)',
  },
};

export default function MessageItem({ message }: MessageItemProps) {
  const config = messageConfig[message.type];
  const timestamp = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className={`msg-item ${config.className} animate-slide-up`}>
      <div className="flex justify-between mb-1">
        <span
          className="font-semibold text-[12px]"
          style={{ color: config.color }}
        >
          <i className={`fa-solid ${config.icon} mr-1`} />
          {message.agent}
        </span>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">
          {timestamp}
        </span>
      </div>
      <div className="text-[var(--text-secondary)] text-[13px]">
        {message.content}
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | Message | 是 | 消息对象 |

#### ReportPreview (报告预览)

**文件位置：** `src/features/analysis/components/ReportPreview.tsx`

```typescript
// src/features/analysis/components/ReportPreview.tsx
import ReactMarkdown from 'react-markdown';
import { cn } from '@/utils/cn';

interface ReportPreviewProps {
  content: string;
  isLoading?: boolean;
  className?: string;
}

export default function ReportPreview({
  content,
  isLoading = false,
  className,
}: ReportPreviewProps) {
  if (isLoading) {
    return (
      <div className={cn('glass-card p-0 flex flex-col overflow-hidden', className)}>
        <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-file-alt" style={{ color: 'var(--warning)', fontSize: '13px' }} />
            <span className="text-sm font-semibold">报告预览</span>
          </div>
          <span className="text-[12px] text-[var(--text-muted)]">实时更新中...</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
          <div className="text-center text-[var(--text-muted)]">
            <i className="fa-solid fa-spinner fa-spin text-2xl mb-3 block" />
            等待分析数据生成报告...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glass-card p-0 flex flex-col overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-file-alt" style={{ color: 'var(--warning)', fontSize: '13px' }} />
          <span className="text-sm font-semibold">报告预览</span>
        </div>
        <span className="text-[12px] text-[var(--accent)]">已生成</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {content ? (
          <div className="report-content">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-[var(--text-muted)] py-8">
            <i className="fa-solid fa-file-lines text-2xl mb-3 block" />
            暂无报告内容
          </div>
        )}
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | Markdown 格式的报告内容 |
| isLoading | boolean | 否 | 加载状态 |
| className | string | 否 | 额外的 CSS 类 |

#### StatsBar (底部状态栏)

**文件位置：** `src/features/analysis/components/StatsBar.tsx`

```typescript
// src/features/analysis/components/StatsBar.tsx
import { cn } from '@/utils/cn';

interface StatsBarProps {
  llmCalls: number;
  toolCalls: number;
  tokenUsage: number;
  elapsedTime: string;
  progress: number;
  className?: string;
}

export default function StatsBar({
  llmCalls,
  toolCalls,
  tokenUsage,
  elapsedTime,
  progress,
  className,
}: StatsBarProps) {
  return (
    <div className={cn('glass-card flex items-center justify-between p-4', className)}>
      {/* Stats */}
      <div className="flex gap-7">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-robot" style={{ color: '#818cf8', fontSize: '13px' }} />
          <span className="text-[12px] text-[var(--text-muted)]">LLM 调用</span>
          <span className="font-mono text-sm font-semibold">{llmCalls}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-wrench" style={{ color: 'var(--warning)', fontSize: '13px' }} />
          <span className="text-[12px] text-[var(--text-muted)]">Tool 调用</span>
          <span className="font-mono text-sm font-semibold">{toolCalls}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-coins" style={{ color: 'var(--accent)', fontSize: '13px' }} />
          <span className="text-[12px] text-[var(--text-muted)]">Token 用量</span>
          <span className="font-mono text-sm font-semibold">{tokenUsage.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-clock" style={{ color: '#ec4899', fontSize: '13px' }} />
          <span className="text-[12px] text-[var(--text-muted)]">已用时间</span>
          <span className="font-mono text-sm font-semibold">{elapsedTime}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <span className="text-[12px] text-[var(--text-muted)]">报告进度</span>
        <div className="progress-bar flex-1">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="font-mono text-[13px] font-semibold text-[var(--accent)]">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| llmCalls | number | 是 | LLM 调用次数 |
| toolCalls | number | 是 | Tool 调用次数 |
| tokenUsage | number | 是 | Token 使用量 |
| elapsedTime | string | 是 | 已用时间 (MM:SS) |
| progress | number | 是 | 报告生成进度 (0-100) |
| className | string | 否 | 额外的 CSS 类 |

---

### 2.4 报告组件

#### ReportViewer (报告查看器)

**文件位置：** `src/features/report/components/ReportViewer.tsx`

```typescript
// src/features/report/components/ReportViewer.tsx
import { useState } from 'react';
import { Report, ReportSection as ReportSectionType } from '@/types/report';
import ReportSection from './ReportSection';
import SignalCard from './SignalCard';

interface ReportViewerProps {
  report: Report;
  onExportPDF?: () => void;
  onExportMarkdown?: () => void;
}

export default function ReportViewer({
  report,
  onExportPDF,
  onExportMarkdown,
}: ReportViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['analyst'])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            <span className="font-mono text-[var(--accent)]">{report.ticker}</span> 分析报告
          </h1>
          <p className="text-[var(--text-secondary)] text-[13px]">
            生成时间: {report.createdAt} | 耗时: {report.duration}
          </p>
        </div>
        <div className="flex gap-2.5">
          <button className="btn-secondary" onClick={onExportPDF}>
            <i className="fa-solid fa-file-pdf" />
            导出 PDF
          </button>
          <button className="btn-secondary" onClick={onExportMarkdown}>
            <i className="fa-solid fa-file-code" />
            导出 Markdown
          </button>
        </div>
      </div>

      {/* Signal Card */}
      <SignalCard
        signal={report.signal}
        confidence={report.confidence}
        ticker={report.ticker}
        companyName={report.companyName}
        recommendedPrice={report.recommendedPrice}
        className="mb-6"
      />

      {/* Report Sections */}
      <div className="grid gap-3">
        {report.sections.map((section) => (
          <ReportSection
            key={section.id}
            section={section}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| report | Report | 是 | 完整报告对象 |
| onExportPDF | () => void | 否 | 导出 PDF 回调 |
| onExportMarkdown | () => void | 否 | 导出 Markdown 回调 |

#### SignalCard (交易信号卡片)

**文件位置：** `src/features/report/components/SignalCard.tsx`

```typescript
// src/features/report/components/SignalCard.tsx
import { cn } from '@/utils/cn';
import { TradingSignal } from '@/types/report';

type SignalType = 'buy' | 'hold' | 'sell';

interface SignalCardProps {
  signal: TradingSignal;
  confidence: number;
  ticker: string;
  companyName: string;
  recommendedPrice?: number;
  className?: string;
}

const signalConfig: Record<SignalType, { bgClass: string; textColor: string; label: string }> = {
  buy: {
    bgClass: 'signal-buy',
    textColor: '#10b981',
    label: 'BUY',
  },
  hold: {
    bgClass: 'signal-hold',
    textColor: '#f59e0b',
    label: 'HOLD',
  },
  sell: {
    bgClass: 'signal-sell',
    textColor: '#ef4444',
    label: 'SELL',
  },
};

export default function SignalCard({
  signal,
  confidence,
  ticker,
  companyName,
  recommendedPrice,
  className,
}: SignalCardProps) {
  const config = signalConfig[signal];

  return (
    <div className={cn('rounded-2xl p-7 flex items-center justify-between', config.bgClass, className)}>
      {/* Left: Signal */}
      <div>
        <div className="text-[13px] text-[var(--text-muted)] mb-1">最终交易信号</div>
        <div
          className="text-[36px] font-extrabold tracking-wider"
          style={{ color: config.textColor }}
        >
          {config.label}
        </div>
        <div className="text-[var(--text-secondary)] text-sm mt-1">
          {companyName} ({ticker})
        </div>
      </div>

      {/* Right: Confidence */}
      <div className="text-right">
        <div className="text-[13px] text-[var(--text-muted)] mb-2">置信度</div>
        <div
          className="font-mono text-[48px] font-bold"
          style={{ color: config.textColor }}
        >
          {confidence}
          <span className="text-[24px]">%</span>
        </div>
        {recommendedPrice && (
          <div className="text-[13px] text-[var(--text-secondary)] mt-1">
            建议入场价: ${recommendedPrice.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| signal | 'buy' \| 'hold' \| 'sell' | 是 | 交易信号类型 |
| confidence | number | 是 | 置信度百分比 (0-100) |
| ticker | string | 是 | 股票代码 |
| companyName | string | 是 | 公司名称 |
| recommendedPrice | number | 否 | 推荐入场价格 |
| className | string | 否 | 额外的 CSS 类 |

#### ReportSection (可折叠报告区域)

**文件位置：** `src/features/report/components/ReportSection.tsx`

```typescript
// src/features/report/components/ReportSection.tsx
import { cn } from '@/utils/cn';
import ReportTab from './ReportTab';
import { ReportSection as ReportSectionType } from '@/types/report';

interface ReportSectionProps {
  section: ReportSectionType;
  isExpanded: boolean;
  onToggle: () => void;
}

const sectionColors: Record<string, { bgColor: string; textColor: string }> = {
  analyst: { bgColor: 'var(--accent-dim)', textColor: 'var(--accent)' },
  research: { bgColor: 'rgba(99, 102, 241, 0.15)', textColor: '#818cf8' },
  trading: { bgColor: 'rgba(245, 158, 11, 0.15)', textColor: '#f59e0b' },
  risk: { bgColor: 'rgba(236, 72, 153, 0.15)', textColor: '#ec4899' },
  portfolio: { bgColor: 'rgba(16, 185, 129, 0.15)', textColor: '#10b981' },
};

export default function ReportSection({
  section,
  isExpanded,
  onToggle,
}: ReportSectionProps) {
  const colors = sectionColors[section.id] || sectionColors.analyst;
  const sectionLabels: Record<string, string> = {
    analyst: 'Analyst Team Reports',
    research: 'Research Team Decision',
    trading: 'Trading Team Plan',
    risk: 'Risk Management Team Decision',
    portfolio: 'Portfolio Manager Decision',
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="collapsible-header" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.bgColor }}
          >
            <span className="font-bold text-[14px]" style={{ color: colors.textColor }}>
              {section.index}
            </span>
          </div>
          <span className="font-semibold">{sectionLabels[section.id] || section.title}</span>
        </div>
        <i
          className={cn(
            'fa-solid fa-chevron-down text-[var(--text-muted)] transition-transform duration-300',
            isExpanded && 'rotate-180'
          )}
        />
      </div>

      {/* Body */}
      <div
        className={cn(
          'collapsible-body overflow-hidden transition-all duration-400',
          isExpanded ? 'max-h-[5000px]' : 'max-h-0'
        )}
      >
        <div className="px-5 pb-5">
          {/* Tabs (if multiple tabs) */}
          {section.tabs && section.tabs.length > 1 && (
            <ReportTab
              tabs={section.tabs}
              activeTab={section.activeTab}
              onTabChange={(tabId) => section.onTabChange?.(tabId)}
            />
          )}
          
          {/* Content */}
          <div
            className={cn('report-content', section.tabs && section.tabs.length > 1 && 'mt-4')}
          >
            {section.content}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| section | ReportSection | 是 | 报告区块数据 |
| isExpanded | boolean | 是 | 是否展开 |
| onToggle | () => void | 是 | 展开/收起回调 |

#### ReportTab (Tab 切换)

**文件位置：** `src/features/report/components/ReportTab.tsx`

```typescript
// src/features/report/components/ReportTab.tsx
import { cn } from '@/utils/cn';

interface Tab {
  id: string;
  label: string;
}

interface ReportTabProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function ReportTab({ tabs, activeTab, onTabChange }: ReportTabProps) {
  return (
    <div className="flex gap-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn('tab-btn', activeTab === tab.id && 'active')}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tabs | Tab[] | 是 | Tab 列表 |
| activeTab | string | 是 | 当前激活的 Tab ID |
| onTabChange | (tabId) => void | 是 | Tab 切换回调 |

---

### 2.5 历史报告组件

#### ReportList (报告列表)

**文件位置：** `src/features/report/components/ReportList.tsx`

```typescript
// src/features/report/components/ReportList.tsx
import { useState, useMemo } from 'react';
import ReportCard from './ReportCard';
import SearchFilters from './SearchFilters';
import { Report } from '@/types/report';

interface ReportListProps {
  reports: Report[];
  onReportClick?: (report: Report) => void;
  onCompare?: (reports: Report[]) => void;
  isLoading?: boolean;
}

export default function ReportList({
  reports,
  onReportClick,
  onCompare,
  isLoading = false,
}: ReportListProps) {
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    signal: 'all' as 'all' | 'buy' | 'hold' | 'sell',
  });
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  // 过滤报告
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // 搜索过滤
      if (
        filters.search &&
        !report.ticker.toLowerCase().includes(filters.search.toLowerCase()) &&
        !report.companyName.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // 日期过滤
      if (filters.startDate && new Date(report.createdAt) < new Date(filters.startDate)) {
        return false;
      }
      if (filters.endDate && new Date(report.createdAt) > new Date(filters.endDate)) {
        return false;
      }

      // 信号过滤
      if (filters.signal !== 'all' && report.signal !== filters.signal) {
        return false;
      }

      return true;
    });
  }, [reports, filters]);

  const handleSelectReport = (reportId: string) => {
    setSelectedReports((prev) => {
      if (prev.includes(reportId)) {
        return prev.filter((id) => id !== reportId);
      }
      if (prev.length >= 4) {
        return prev; // 最多选择 4 个
      }
      return [...prev, reportId];
    });
  };

  const handleCompare = () => {
    if (onCompare && selectedReports.length >= 2) {
      const selectedReportObjs = reports.filter((r) => selectedReports.includes(r.id));
      onCompare(selectedReportObjs);
    }
  };

  return (
    <div>
      {/* Filters */}
      <SearchFilters
        filters={filters}
        onChange={setFilters}
        className="mb-5"
      />

      {/* Report Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-5 shimmer" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-card p-8 text-center text-[var(--text-muted)]">
          <i className="fa-solid fa-inbox text-3xl mb-3 block" />
          暂无报告
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={selectedReports.includes(report.id)}
                onSelect={() => handleSelectReport(report.id)}
                onClick={() => onReportClick?.(report)}
              />
            ))}
          </div>
        )}

      {/* Compare Button */}
      {selectedReports.length >= 2 && (
        <div className="mt-5 text-center">
          <button className="btn-secondary" onClick={handleCompare}>
            <i className="fa-solid fa-columns" />
            对比分析 (已选 {selectedReports.length} 个报告)
          </button>
        </div>
      )}
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| reports | Report[] | 是 | 报告列表 |
| onReportClick | (report) => void | 否 | 报告点击回调 |
| onCompare | (reports) => void | 否 | 对比分析回调 |
| isLoading | boolean | 否 | 加载状态 |

#### ReportCard (报告卡片)

**文件位置：** `src/features/report/components/ReportCard.tsx`

```typescript
// src/features/report/components/ReportCard.tsx
import { cn } from '@/utils/cn';
import { Report } from '@/types/report';

interface ReportCardProps {
  report: Report;
  isSelected?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
}

const signalBadgeClass: Record<string, string> = {
  buy: 'badge-buy',
  hold: 'badge-hold',
  sell: 'badge-sell',
};

export default function ReportCard({
  report,
  isSelected = false,
  onSelect,
  onClick,
}: ReportCardProps) {
  return (
    <div
      className={cn(
        'glass-card p-5 cursor-pointer transition-all',
        isSelected && 'ring-2 ring-[var(--accent)]'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold">{report.ticker}</span>
            <span className={cn('badge', signalBadgeClass[report.signal])}>
              {report.signal.toUpperCase()}
            </span>
          </div>
          <div className="text-[13px] text-[var(--text-muted)] mt-0.5">
            {report.companyName}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-bold" style={{
            color: report.signal === 'buy' ? '#10b981' : report.signal === 'sell' ? '#ef4444' : '#f59e0b'
          }}>
            {report.confidence}%
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">置信度</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
        <span className="text-[13px] text-[var(--text-secondary)]">
          <i className="fa-solid fa-calendar mr-1.5" />
          {report.createdAt.split(' ')[0]}
        </span>
        <span className="text-[13px] text-[var(--text-secondary)]">
          <i className="fa-solid fa-clock mr-1.5" />
          {report.duration}
        </span>
        <span className="badge badge-completed">已完成</span>
      </div>

      {/* Selection Checkbox */}
      {onSelect && (
        <div
          className={cn(
            'absolute top-3 right-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-[var(--accent)] border-[var(--accent)]'
              : 'border-[var(--text-muted)]'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected && <i className="fa-solid fa-check text-[10px] text-[#0a0e1a]" />}
        </div>
      )}
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| report | Report | 是 | 报告对象 |
| isSelected | boolean | 否 | 是否选中 |
| onSelect | () => void | 否 | 选中回调 |
| onClick | () => void | 否 | 点击回调 |

#### SearchFilters (搜索筛选)

**文件位置：** `src/features/report/components/SearchFilters.tsx`

```typescript
// src/features/report/components/SearchFilters.tsx

interface SearchFiltersProps {
  filters: {
    search: string;
    startDate: string;
    endDate: string;
    signal: 'all' | 'buy' | 'hold' | 'sell';
  };
  onChange: (filters: SearchFiltersProps['filters']) => void;
  className?: string;
}

export default function SearchFilters({ filters, onChange, className }: SearchFiltersProps) {
  return (
    <div className={cn('glass-card p-5', className)}>
      <div className="grid grid-cols-4 gap-3 items-end">
        {/* Search */}
        <div>
          <label className="text-[12px] text-[var(--text-muted)] block mb-1.5">搜索</label>
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[13px]" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="搜索股票代码或公司名称..."
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="text-[12px] text-[var(--text-muted)] block mb-1.5">开始日期</label>
          <input
            type="date"
            className="input-field"
            value={filters.startDate}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="text-[12px] text-[var(--text-muted)] block mb-1.5">结束日期</label>
          <input
            type="date"
            className="input-field"
            value={filters.endDate}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
          />
        </div>

        {/* Signal Filter */}
        <div>
          <label className="text-[12px] text-[var(--text-muted)] block mb-1.5">决策类型</label>
          <select
            className="input-field"
            value={filters.signal}
            onChange={(e) => onChange({ ...filters, signal: e.target.value as SearchFiltersProps['filters']['signal'] })}
          >
            <option value="all">全部</option>
            <option value="buy">BUY</option>
            <option value="hold">HOLD</option>
            <option value="sell">SELL</option>
          </select>
        </div>
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| filters | FilterState | 是 | 当前筛选条件 |
| onChange | (filters) => void | 是 | 筛选条件变更回调 |
| className | string | 否 | 额外的 CSS 类 |

---

### 2.6 设置组件

#### SettingsForm (设置表单)

**文件位置：** `src/features/settings/components/SettingsForm.tsx`

```typescript
// src/features/settings/components/SettingsForm.tsx
import { useForm } from 'react-hook-form';
import APIKeyInput from './APIKeyInput';
import ToggleSwitch from './ToggleSwitch';
import { Settings } from '@/types/settings';

interface SettingsFormProps {
  initialValues: Settings;
  onSave: (settings: Settings) => void;
  onReset?: () => void;
}

export default function SettingsForm({
  initialValues,
  onSave,
  onReset,
}: SettingsFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm<Settings>({
    defaultValues: initialValues,
  });

  const formData = watch();

  const handleSave = (data: Settings) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="grid gap-5 max-w-[800px]">
      {/* LLM Provider Config */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <i className="fa-solid fa-brain" style={{ color: 'var(--accent)', fontSize: '18px' }} />
          <h2 className="text-lg font-semibold">LLM Provider 配置</h2>
        </div>
        <div className="grid gap-4">
          <APIKeyInput
            label="OpenAI API Key"
            value={formData.apiKeys.openai}
            onChange={(value) => setValue('apiKeys.openai', value)}
          />
          <APIKeyInput
            label="Google API Key"
            value={formData.apiKeys.google}
            onChange={(value) => setValue('apiKeys.google', value)}
          />
          <APIKeyInput
            label="Anthropic API Key"
            value={formData.apiKeys.anthropic}
            onChange={(value) => setValue('apiKeys.anthropic', value)}
          />
          <APIKeyInput
            label="DeepSeek API Key"
            value={formData.apiKeys.deepseek}
            onChange={(value) => setValue('apiKeys.deepseek', value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium block mb-1.5">
                默认 Quick-thinking 模型
              </label>
              <select className="input-field" {...register('defaultQuickModel')}>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="claude-haiku-3.5">claude-haiku-3.5</option>
                <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium block mb-1.5">
                默认 Deep-thinking 模型
              </label>
              <select className="input-field" {...register('defaultDeepModel')}>
                <option value="gpt-4o">gpt-4o</option>
                <option value="claude-sonnet-4">claude-sonnet-4</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                <option value="deepseek-r1">deepseek-r1</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Config */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <i className="fa-solid fa-database" style={{ color: '#818cf8', fontSize: '18px' }} />
          <h2 className="text-lg font-semibold">数据源配置</h2>
        </div>
        <div className="grid gap-4">
          {(['yfinance', 'alphaVantage'] as const).map((source) => (
            <div
              key={source}
              className="flex justify-between items-center p-4 rounded-xl border border-[var(--border)]"
            >
              <div>
                <div className="font-semibold">
                  {source === 'yfinance' ? 'Yahoo Finance (yfinance)' : 'Alpha Vantage'}
                </div>
                <div className="text-[13px] text-[var(--text-muted)]">
                  {source === 'yfinance' ? '免费股票数据，延迟 15 分钟' : '高级金融数据 API，实时行情'}
                </div>
              </div>
              <ToggleSwitch
                enabled={formData.dataSources[source]}
                onChange={(enabled) => setValue(`dataSources.${source}`, enabled)}
              />
            </div>
          ))}
          {formData.dataSources.alphaVantage && (
            <APIKeyInput
              label="Alpha Vantage API Key (可选)"
              value={formData.apiKeys.alphaVantage}
              onChange={(value) => setValue('apiKeys.alphaVantage', value)}
              placeholder="输入 API Key..."
            />
          )}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <i className="fa-solid fa-bell" style={{ color: 'var(--warning)', fontSize: '18px' }} />
          <h2 className="text-lg font-semibold">通知设置</h2>
        </div>
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">分析完成通知</div>
              <div className="text-[13px] text-[var(--text-muted)]">分析完成时发送桌面通知</div>
            </div>
            <ToggleSwitch
              enabled={formData.notifications.desktop}
              onChange={(enabled) => setValue('notifications.desktop', enabled)}
            />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">声音提醒</div>
              <div className="text-[13px] text-[var(--text-muted)]">分析完成时播放提示音</div>
            </div>
            <ToggleSwitch
              enabled={formData.notifications.sound}
              onChange={(enabled) => setValue('notifications.sound', enabled)}
            />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">邮件通知</div>
              <div className="text-[13px] text-[var(--text-muted)]">将报告摘要发送至邮箱</div>
            </div>
            <ToggleSwitch
              enabled={formData.notifications.email}
              onChange={(enabled) => setValue('notifications.email', enabled)}
            />
          </div>
        </div>
      </div>

      {/* User Preferences */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <i className="fa-solid fa-sliders-h" style={{ color: '#ec4899', fontSize: '18px' }} />
          <h2 className="text-lg font-semibold">用户偏好</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[13px] font-medium block mb-1.5">默认分析师团队</label>
            <select className="input-field" {...register('defaultAnalysts')}>
              <option value="all">全部 (Market + Social + News + Fundamentals)</option>
              <option value="market">仅技术分析 (Market)</option>
              <option value="market+fundamentals">基本面分析 (Market + Fundamentals)</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-medium block mb-1.5">默认研究深度</label>
            <select className="input-field" {...register('defaultDepth')}>
              <option value="medium">Medium (标准分析)</option>
              <option value="shallow">Shallow (快速扫描)</option>
              <option value="deep">Deep (深度研究)</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-medium block mb-1.5">默认输出语言</label>
            <select className="input-field" {...register('defaultLanguage')}>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-medium block mb-1.5">默认 LLM Provider</label>
            <select className="input-field" {...register('defaultProvider')}>
              <option value="openai">OpenAI</option>
              <option value="google">Google</option>
              <option value="anthropic">Anthropic</option>
              <option value="deepseek">DeepSeek</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onReset}>
          重置默认
        </button>
        <button type="submit" className="btn-primary">
          <i className="fa-solid fa-save" />
          保存设置
        </button>
      </div>
    </form>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| initialValues | Settings | 是 | 初始设置值 |
| onSave | (settings) => void | 是 | 保存回调 |
| onReset | () => void | 否 | 重置回调 |

#### APIKeyInput (API Key 输入)

**文件位置：** `src/features/settings/components/APIKeyInput.tsx`

```typescript
// src/features/settings/components/APIKeyInput.tsx
import { useState } from 'react';
import { cn } from '@/utils/cn';

interface APIKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function APIKeyInput({
  label,
  value,
  onChange,
  placeholder = '未设置',
}: APIKeyInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  const displayValue = value
    ? isVisible
      ? value
      : value.slice(0, 3) + 'x'.repeat(Math.min(value.length - 6, 20)) + value.slice(-3)
    : '';

  return (
    <div>
      <label className="text-[13px] font-medium block mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          type={isVisible ? 'text' : 'password'}
          className="input-field flex-1"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="btn-secondary py-2 px-4"
          onClick={() => setIsVisible(!isVisible)}
        >
          <i className={cn('fa-solid', isVisible ? 'fa-eye-slash' : 'fa-eye')} />
        </button>
      </div>
    </div>
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| label | string | 是 | 输入框标签 |
| value | string | 是 | 当前值 |
| onChange | (value) => void | 是 | 值变更回调 |
| placeholder | string | 否 | 占位符文本 |

#### ToggleSwitch (开关控件)

**文件位置：** `src/components/ui/ToggleSwitch.tsx`

```typescript
// src/components/ui/ToggleSwitch/ToggleSwitch.tsx
import { cn } from '@/utils/cn';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function ToggleSwitch({
  enabled,
  onChange,
  disabled = false,
  size = 'md',
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      className={cn(
        'toggle-switch',
        enabled && 'active',
        disabled && 'opacity-50 cursor-not-allowed',
        size === 'sm' ? 'w-8 h-4 [&::after]:w-4 [&::after]:h-4 [&.active::after]:translate-x-4' : ''
      )}
      onClick={() => !disabled && onChange(!enabled)}
    />
  );
}
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enabled | boolean | 是 | 是否启用 |
| onChange | (enabled) => void | 是 | 状态变更回调 |
| disabled | boolean | 否 | 是否禁用 |
| size | 'sm' \| 'md' | 否 | 尺寸大小 |

---

## 3. 状态管理设计

### 3.1 推荐方案：Zustand

**选择理由：**
- 轻量级（无 Provider 嵌套）
- TypeScript 原生支持
- DevTools 支持
- 简单的 API（比 Redux 少 80% 代码）
- 适合中型应用

### 3.2 状态 Store 设计

#### 分析状态 Store

**文件位置：** `src/stores/analysisStore.ts`

```typescript
// src/stores/analysisStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Analysis, AnalysisConfig, AnalysisStatus, Agent, Message } from '@/types/analysis';

// 分析配置状态
interface AnalysisConfigState {
  config: Partial<AnalysisConfig>;
  setConfig: (config: Partial<AnalysisConfig>) => void;
  resetConfig: () => void;
}

// 实时分析状态
interface LiveAnalysisState {
  status: AnalysisStatus;
  currentAnalysisId: string | null;
  agents: Agent[];
  messages: Message[];
  stats: {
    llmCalls: number;
    toolCalls: number;
    tokenUsage: number;
    elapsedTime: number;
    progress: number;
  };
  reportPreview: string;
  
  // Actions
  startAnalysis: (analysisId: string) => void;
  updateAgentStatus: (agentId: string, status: Agent['status']) => void;
  addMessage: (message: Message) => void;
  updateStats: (stats: Partial<LiveAnalysisState['stats']>) => void;
  updateReportPreview: (content: string) => void;
  completeAnalysis: () => void;
  failAnalysis: (error: string) => void;
  resetAnalysis: () => void;
}

// 历史分析列表
interface AnalysisHistoryState {
  analyses: Analysis[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAnalyses: () => Promise<void>;
  addAnalysis: (analysis: Analysis) => void;
  updateAnalysis: (id: string, updates: Partial<Analysis>) => void;
}

// Config Store
export const useAnalysisConfigStore = create<AnalysisConfigState>()(
  persist(
    (set) => ({
      config: {},
      setConfig: (config) =>
        set((state) => ({ config: { ...state.config, ...config } })),
      resetConfig: () => set({ config: {} }),
    }),
    { name: 'analysis-config' }
  )
);

// Live Analysis Store
export const useLiveAnalysisStore = create<LiveAnalysisState>()((set) => ({
  status: 'idle',
  currentAnalysisId: null,
  agents: [],
  messages: [],
  stats: {
    llmCalls: 0,
    toolCalls: 0,
    tokenUsage: 0,
    elapsedTime: 0,
    progress: 0,
  },
  reportPreview: '',

  startAnalysis: (analysisId) =>
    set({
      status: 'running',
      currentAnalysisId: analysisId,
      agents: [],
      messages: [],
      stats: {
        llmCalls: 0,
        toolCalls: 0,
        tokenUsage: 0,
        elapsedTime: 0,
        progress: 0,
      },
      reportPreview: '',
    }),

  updateAgentStatus: (agentId, status) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, status } : agent
      ),
    })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateStats: (stats) =>
    set((state) => ({
      stats: { ...state.stats, ...stats },
    })),

  updateReportPreview: (content) =>
    set({ reportPreview: content }),

  completeAnalysis: () =>
    set({ status: 'completed' }),

  failAnalysis: (error) =>
    set({ status: 'failed' }),

  resetAnalysis: () =>
    set({
      status: 'idle',
      currentAnalysisId: null,
      agents: [],
      messages: [],
      stats: {
        llmCalls: 0,
        toolCalls: 0,
        tokenUsage: 0,
        elapsedTime: 0,
        progress: 0,
      },
      reportPreview: '',
    }),
}));

// History Store
export const useAnalysisHistoryStore = create<AnalysisHistoryState>()((set) => ({
  analyses: [],
  isLoading: false,
  error: null,

  fetchAnalyses: async () => {
    set({ isLoading: true, error: null });
    try {
      const analyses = await analysisApi.getList();
      set({ analyses, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addAnalysis: (analysis) =>
    set((state) => ({
      analyses: [analysis, ...state.analyses],
    })),

  updateAnalysis: (id, updates) =>
    set((state) => ({
      analyses: state.analyses.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
}));
```

### 3.3 分析状态机

```
                    ┌─────────────┐
                    │    idle     │
                    └──────┬──────┘
                           │ startAnalysis()
                           ▼
                    ┌─────────────┐
              ┌─────│ configuring │─────┐
              │     └─────────────┘     │
              │ error                   │ success
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │   failed    │          │   running   │
       └─────────────┘          └──────┬──────┘
                                       │
              ┌────────────────────────┼────────────────┐
              │                        │                │
              ▼                        ▼                ▼
       ┌─────────────┐          ┌─────────────┐  ┌─────────────┐
       │ completed   │          │   paused    │  │   waiting   │
       └─────────────┘          └─────────────┘  └─────────────┘
```

**状态定义：**

| 状态 | 说明 | 可转换到 |
|------|------|----------|
| `idle` | 初始状态，无活动分析 | `configuring` |
| `configuring` | 正在配置分析参数 | `running`, `failed` |
| `running` | 分析执行中 | `paused`, `completed`, `failed` |
| `paused` | 分析暂停 | `running`, `failed` |
| `completed` | 分析完成 | `idle` |
| `failed` | 分析失败 | `idle` |

### 3.4 WebSocket 状态 Store

**文件位置：** `src/stores/websocketStore.ts`

```typescript
// src/stores/websocketStore.ts
import { create } from 'zustand';

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface WebSocketState {
  status: WebSocketStatus;
  lastConnectedAt: number | null;
  reconnectAttempts: number;
  error: string | null;
  
  // Actions
  setStatus: (status: WebSocketStatus) => void;
  setConnected: () => void;
  setDisconnected: () => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  setError: (error: string | null) => void;
}

export const useWebSocketStore = create<WebSocketState>()((set) => ({
  status: 'disconnected',
  lastConnectedAt: null,
  reconnectAttempts: 0,
  error: null,

  setStatus: (status) => set({ status }),
  
  setConnected: () =>
    set({
      status: 'connected',
      lastConnectedAt: Date.now(),
      reconnectAttempts: 0,
      error: null,
    }),

  setDisconnected: () =>
    set({ status: 'disconnected' }),

  incrementReconnectAttempts: () =>
    set((state) => ({
      reconnectAttempts: state.reconnectAttempts + 1,
      status: 'reconnecting',
    })),

  resetReconnectAttempts: () =>
    set({ reconnectAttempts: 0 }),

  setError: (error) => set({ error }),
}));
```

### 3.5 设置状态 Store

**文件位置：** `src/stores/settingsStore.ts`

```typescript
// src/stores/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '@/types/settings';

const defaultSettings: Settings = {
  apiKeys: {
    openai: '',
    google: '',
    anthropic: '',
    deepseek: '',
    alphaVantage: '',
  },
  dataSources: {
    yfinance: true,
    alphaVantage: false,
  },
  notifications: {
    desktop: true,
    sound: false,
    email: false,
  },
  defaultAnalysts: 'all',
  defaultDepth: 'medium',
  defaultLanguage: 'en',
  defaultProvider: 'openai',
  defaultQuickModel: 'gpt-4o-mini',
  defaultDeepModel: 'gpt-4o',
};

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  isDirty: boolean;
  
  // Actions
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,
      isDirty: false,

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
          isDirty: true,
        })),

      resetSettings: () =>
        set({ settings: defaultSettings, isDirty: true }),

      loadSettings: async () => {
        set({ isLoading: true });
        try {
          const settings = await settingsApi.get();
          set({ settings, isLoading: false, isDirty: false });
        } catch (error) {
          console.error('Failed to load settings:', error);
          set({ isLoading: false });
        }
      },

      saveSettings: async () => {
        const { settings } = get();
        set({ isLoading: true });
        try {
          await settingsApi.save(settings);
          set({ isLoading: false, isDirty: false });
        } catch (error) {
          console.error('Failed to save settings:', error);
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'tradingagents-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
```

---

## 4. 路由设计

### 4.1 路由配置

**文件位置：** `src/router/index.tsx`

```typescript
// src/router/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';

// Lazy loaded pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NewAnalysis = lazy(() => import('@/pages/NewAnalysis'));
const LiveAnalysis = lazy(() => import('@/pages/LiveAnalysis'));
const Report = lazy(() => import('@/pages/Report'));
const History = lazy(() => import('@/pages/History'));
const ReportDetail = lazy(() => import('@/pages/ReportDetail'));
const Settings = lazy(() => import('@/pages/Settings'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'analysis',
        children: [
          {
            path: 'new',
            element: <NewAnalysis />,
          },
          {
            path: ':id',
            element: <LiveAnalysis />,
          },
          {
            path: ':id/result',
            element: <ReportDetail />,
          },
        ],
      },
      {
        path: 'report',
        children: [
          {
            path: 'current',
            element: <Report />,
          },
        ],
      },
      {
        path: 'reports',
        children: [
          {
            index: true,
            element: <History />,
          },
          {
            path: ':id',
            element: <ReportDetail />,
          },
        ],
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

### 4.2 路由映射表

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | Dashboard | 仪表盘首页 |
| `/analysis/new` | NewAnalysis | 新建分析向导 |
| `/analysis/:id` | LiveAnalysis | 实时分析页面 |
| `/analysis/:id/result` | ReportDetail | 分析报告详情 |
| `/report/current` | Report | 当前报告查看 |
| `/reports` | History | 历史报告列表 |
| `/reports/:id` | ReportDetail | 报告详情（带 ID） |
| `/settings` | Settings | 系统设置 |
| `*` | Dashboard | 404 重定向 |

### 4.3 路由守卫

**文件位置：** `src/router/guards.tsx`

```typescript
// src/router/guards.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAnalysisConfigStore } from '@/stores/analysisStore';

// 需要分析进行中的守卫
export function requireActiveAnalysis({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { status, currentAnalysisId } = useLiveAnalysisStore();
  
  // 如果 URL 中有 analysis ID 但状态不是 running，重定向到历史
  const urlAnalysisId = location.pathname.split('/')[2];
  if (urlAnalysisId && !currentAnalysisId) {
    return <Navigate to="/reports" replace />;
  }
  
  return <>{children}</>;
}

// 已完成分析后才能查看报告
export function requireCompletedAnalysis({ children }: { children: React.ReactNode }) {
  const { status } = useLiveAnalysisStore();
  
  if (status !== 'completed') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
```

---

## 5. API 服务层设计

### 5.1 API 客户端配置

**文件位置：** `src/services/apiClient.ts`

```typescript
// src/services/apiClient.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 创建 Axios 实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证 Token（如需要）
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 处理未授权
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 通用请求方法
export const request = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((res) => res.data),
  
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),
  
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};
```

### 5.2 分析 API

**文件位置：** `src/services/analysisApi.ts`

```typescript
// src/services/analysisApi.ts
import { request } from './apiClient';
import type { Analysis, AnalysisConfig, CreateAnalysisResponse } from '@/types/analysis';

export const analysisApi = {
  // 创建新分析
  create: (config: AnalysisConfig): Promise<CreateAnalysisResponse> =>
    request.post('/analysis', config),

  // 获取分析详情
  getById: (id: string): Promise<Analysis> =>
    request.get(`/analysis/${id}`),

  // 获取分析状态
  getStatus: (id: string): Promise<{ status: string; progress: number }> =>
    request.get(`/analysis/${id}/status`),

  // 获取分析列表
  getList: (params?: {
    page?: number;
    pageSize?: number;
    ticker?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Analysis[]; total: number }> =>
    request.get('/analysis', { params }),

  // 取消分析
  cancel: (id: string): Promise<void> =>
    request.post(`/analysis/${id}/cancel`),

  // 暂停分析
  pause: (id: string): Promise<void> =>
    request.post(`/analysis/${id}/pause`),

  // 恢复分析
  resume: (id: string): Promise<void> =>
    request.post(`/analysis/${id}/resume`),

  // 删除分析
  delete: (id: string): Promise<void> =>
    request.delete(`/analysis/${id}`),

  // 获取报告
  getReport: (id: string): Promise<Analysis['report']> =>
    request.get(`/analysis/${id}/report`),

  // 导出报告
  exportReport: (id: string, format: 'pdf' | 'markdown'): Promise<Blob> =>
    request.get(`/analysis/${id}/export/${format}`, {
      responseType: 'blob',
    }),
};
```

### 5.3 报告 API

**文件位置：** `src/services/reportApi.ts`

```typescript
// src/services/reportApi.ts
import { request } from './apiClient';
import type { Report } from '@/types/report';

export const reportApi = {
  // 获取报告列表
  getList: (params?: {
    page?: number;
    pageSize?: number;
    ticker?: string;
    startDate?: string;
    endDate?: string;
    signal?: 'buy' | 'hold' | 'sell';
  }): Promise<{ data: Report[]; total: number }> =>
    request.get('/reports', { params }),

  // 获取报告详情
  getById: (id: string): Promise<Report> =>
    request.get(`/reports/${id}`),

  // 导出报告
  export: (id: string, format: 'pdf' | 'markdown' | 'json'): Promise<Blob> =>
    request.get(`/reports/${id}/export/${format}`, {
      responseType: 'blob',
    }),

  // 对比报告
  compare: (ids: string[]): Promise<ReportComparison> =>
    request.post('/reports/compare', { ids }),

  // 删除报告
  delete: (id: string): Promise<void> =>
    request.delete(`/reports/${id}`),
};
```

### 5.4 设置 API

**文件位置：** `src/services/settingsApi.ts`

```typescript
// src/services/settingsApi.ts
import { request } from './apiClient';
import type { Settings } from '@/types/settings';

export const settingsApi = {
  // 获取设置
  get: (): Promise<Settings> =>
    request.get('/settings'),

  // 保存设置
  save: (settings: Settings): Promise<void> =>
    request.put('/settings', settings),

  // 重置为默认
  reset: (): Promise<Settings> =>
    request.post('/settings/reset'),

  // 验证 API Key
  validateApiKey: (provider: string, key: string): Promise<{ valid: boolean; message: string }> =>
    request.post('/settings/validate-key', { provider, key }),
};
```

### 5.5 WebSocket 服务

**文件位置：** `src/services/websocketService.ts`

```typescript
// src/services/websocketService.ts
import { io, Socket } from 'socket.io-client';
import { useLiveAnalysisStore } from '@/stores/analysisStore';
import { useWebSocketStore } from '@/stores/websocketStore';
import type { WebSocketMessage } from '@/types/websocket';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 3000;

  connect(analysisId: string) {
    if (this.socket?.connected) {
      this.disconnect();
    }

    const webSocketStore = useWebSocketStore.getState();
    const liveAnalysisStore = useLiveAnalysisStore.getState();

    webSocketStore.setStatus('connecting');

    this.socket = io(WS_URL, {
      path: '/ws',
      query: { analysisId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    // 连接成功
    this.socket.on('connect', () => {
      webSocketStore.setConnected();
      console.log('[WebSocket] Connected');
    });

    // 连接错误
    this.socket.on('connect_error', (error) => {
      webSocketStore.setError(error.message);
      console.error('[WebSocket] Connection error:', error);
    });

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      webSocketStore.setDisconnected();
      console.log('[WebSocket] Disconnected:', reason);
    });

    // 重连中
    this.socket.on('reconnecting', (attemptNumber) => {
      webSocketStore.incrementReconnectAttempts();
      console.log(`[WebSocket] Reconnecting... attempt ${attemptNumber}`);
    });

    // 消息处理
    this.socket.on('message', (data: WebSocketMessage) => {
      this.handleMessage(data);
    });

    // Agent 状态更新
    this.socket.on('agent_status', (data: { agentId: string; status: string }) => {
      liveAnalysisStore.updateAgentStatus(data.agentId, data.status as any);
    });

    // 统计数据更新
    this.socket.on('stats_update', (stats: any) => {
      liveAnalysisStore.updateStats(stats);
    });

    // 报告预览更新
    this.socket.on('report_preview', (data: { content: string }) => {
      liveAnalysisStore.updateReportPreview(data.content);
    });

    // 分析完成
    this.socket.on('analysis_complete', () => {
      liveAnalysisStore.completeAnalysis();
    });

    // 分析失败
    this.socket.on('analysis_error', (data: { error: string }) => {
      liveAnalysisStore.failAnalysis(data.error);
    });
  }

  private handleMessage(message: WebSocketMessage) {
    const liveAnalysisStore = useLiveAnalysisStore.getState();
    liveAnalysisStore.addMessage({
      id: message.id || crypto.randomUUID(),
      type: message.type,
      agent: message.agent,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    useWebSocketStore.getState().setDisconnected();
  }

  // 发送消息到服务器
  send(event: string, data?: unknown) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
```

---

## 6. WebSocket 集成设计

### 6.1 连接管理

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useCallback } from 'react';
import { websocketService } from '@/services/websocketService';
import { useWebSocketStore } from '@/stores/websocketStore';

export function useWebSocket(analysisId?: string) {
  const { status, error } = useWebSocketStore();

  useEffect(() => {
    if (analysisId) {
      websocketService.connect(analysisId);
    }

    return () => {
      websocketService.disconnect();
    };
  }, [analysisId]);

  const send = useCallback((event: string, data?: unknown) => {
    websocketService.send(event, data);
  }, []);

  return {
    status,
    error,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting' || status === 'reconnecting',
    send,
    disconnect: () => websocketService.disconnect(),
  };
}
```

### 6.2 消息类型定义

```typescript
// src/types/websocket.ts
export type MessageType = 'tool' | 'agent' | 'data' | 'system';

export interface WebSocketMessage {
  id?: string;
  type: MessageType;
  agent: string;
  content: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentStatusUpdate {
  agentId: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
}

export interface StatsUpdate {
  llmCalls: number;
  toolCalls: number;
  tokenUsage: number;
  elapsedTime: number;
  progress: number;
}

export interface AnalysisComplete {
  analysisId: string;
  signal: 'buy' | 'hold' | 'sell';
  confidence: number;
  reportId: string;
}
```

### 6.3 重连策略

```typescript
// 重连配置
const RECONNECT_CONFIG = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 1.5,
};

// 计算重连延迟
function getReconnectDelay(attemptNumber: number): number {
  const delay = RECONNECT_CONFIG.baseDelay * 
    Math.pow(RECONNECT_CONFIG.backoffMultiplier, attemptNumber - 1);
  return Math.min(delay, RECONNECT_CONFIG.maxDelay);
}
```

---

## 7. 样式与主题

### 7.1 CSS 变量定义

**文件位置：** `src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Background */
  --bg-primary: #0a0e1a;
  --bg-secondary: #111827;
  --bg-card: rgba(17, 24, 39, 0.7);
  --bg-glass: rgba(17, 24, 39, 0.5);
  
  /* Accent */
  --accent: #00d4aa;
  --accent-dim: rgba(0, 212, 170, 0.15);
  --accent-glow: rgba(0, 212, 170, 0.3);
  
  /* Semantic */
  --warning: #f59e0b;
  --danger: #ef4444;
  --success: #10b981;
  
  /* Text */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  
  /* Border */
  --border: rgba(148, 163, 184, 0.1);
  --border-accent: rgba(0, 212, 170, 0.3);
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-glow: 0 0 20px rgba(0, 212, 170, 0.2);
}

/* Base styles */
body {
  @apply font-sans antialiased;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Font families */
.font-sans {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

.font-mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
```

### 7.2 组件样式规范

#### Glass Card
```css
.glass-card {
  @apply rounded-2xl border backdrop-blur-xl;
  background: var(--bg-glass);
  border-color: var(--border);
  transition: all 0.3s ease;
}

.glass-card:hover {
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow: var(--shadow-md);
}
```

#### Navigation Item
```css
.nav-item {
  @apply flex items-center gap-2.5 rounded-xl py-2.5 px-4 cursor-pointer;
  @apply text-[var(--text-secondary)] text-sm font-medium;
  transition: all 0.2s ease;
}

.nav-item:hover {
  @apply text-[var(--text-primary)] bg-[rgba(148,163,184,0.08)];
}

.nav-item.active {
  @apply text-[var(--accent)] bg-[var(--accent-dim)];
  box-shadow: 0 0 20px rgba(0, 212, 170, 0.05);
}
```

#### Buttons
```css
.btn-primary {
  @apply inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm;
  @apply text-[#0a0e1a] transition-all duration-200;
  background: linear-gradient(135deg, var(--accent), #00b894);
}

.btn-primary:hover {
  @apply -translate-y-0.5;
  box-shadow: 0 4px 20px rgba(0, 212, 170, 0.3);
}

.btn-secondary {
  @apply inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm;
  @apply text-[var(--text-primary)] border transition-all duration-200;
  background: rgba(148, 163, 184, 0.1);
  border-color: var(--border);
}

.btn-secondary:hover {
  background: rgba(148, 163, 184, 0.15);
  border-color: rgba(148, 163, 184, 0.3);
}
```

#### Input Fields
```css
.input-field {
  @apply w-full px-4 py-3 rounded-xl text-sm;
  @apply bg-[rgba(148,163,184,0.08)] border border-[var(--border)];
  @apply text-[var(--text-primary)] placeholder-[var(--text-muted)];
  @apply outline-none transition-all duration-200;
}

.input-field:focus {
  @apply border-[var(--accent)] shadow-[0_0_0_3px_rgba(0,212,170,0.1)];
}
```

### 7.3 响应式断点

| 断点 | 宽度 | 说明 |
|------|------|------|
| `sm` | 640px | 小屏幕 |
| `md` | 768px | 平板竖屏 |
| `lg` | 1024px | 平板横屏/小桌面 |
| `xl` | 1280px | 桌面 |
| `2xl` | 1536px | 大桌面 |

**响应式布局示例：**
```typescript
// 侧边栏响应式
<div className="fixed left-0 top-0 h-screen w-[260px] lg:w-[260px] md:w-[72px] hidden md:block">
  {/* ... */}
</div>

// 网格响应式
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* ... */}
</div>
```

### 7.4 动画规范

```css
/* Pulse Glow */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(0, 212, 170, 0); }
}

/* Pulse Dot */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.5); }
}

/* Slide Up */
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Fade In */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Utility Classes */
.animate-pulse-glow { animation: pulse-glow 2s infinite; }
.animate-pulse-dot { animation: pulse-dot 1.5s infinite; }
.animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
.animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
.animate-shimmer {
  background: linear-gradient(90deg, transparent 25%, rgba(148,163,184,0.05) 50%, transparent 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## 8. 性能优化

### 8.1 懒加载策略

#### 路由懒加载
```typescript
// 使用 React.lazy 进行路由级别代码分割
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NewAnalysis = lazy(() => import('@/pages/NewAnalysis'));
const LiveAnalysis = lazy(() => import('@/pages/LiveAnalysis'));
// ...

// 配合 Suspense 使用
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    {/* ... */}
  </Routes>
</Suspense>
```

#### 组件懒加载
```typescript
// 使用 dynamic import 懒加载非关键组件
const ReportChart = dynamic(() => import('@/components/ReportChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // 禁用服务端渲染（如果使用 SSR）
});
```

### 8.2 虚拟列表

**文件位置：** `src/components/common/VirtualList.tsx`

```typescript
// src/components/common/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight = 60,
  overscan = 5,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
  });

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**在 MessageStream 中使用：**
```typescript
// 对于大量消息，使用虚拟列表优化
const VirtualMessageList = () => {
  return (
    <VirtualList
      items={messages}
      itemHeight={80}
      renderItem={(message) => <MessageItem message={message} />}
    />
  );
};
```

### 8.3 缓存策略

#### React Query 配置
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 缓存时间
      staleTime: 1000 * 60 * 5, // 5 分钟
      gcTime: 1000 * 60 * 30, // 30 分钟（之前是 cacheTime）
      
      // 重试配置
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // 背景刷新
      refetchOnWindowFocus: false,
    },
  },
});

// 使用示例
const { data, isLoading } = useQuery({
  queryKey: ['analysis', analysisId],
  queryFn: () => analysisApi.getById(analysisId),
  enabled: !!analysisId,
});
```

### 8.4 打包优化

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@headlessui/react', 'framer-motion'],
          'vendor-data': ['@tanstack/react-query', 'axios', 'zustand'],
        },
      },
    },
    
    // 压缩配置
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // 资源内联
    assetsInlineLimit: 4096, // 4kb 以下的资源内联
    
    // CSS 代码分割
    cssCodeSplit: true,
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
});
```

---

## 9. 代码规范

### 9.1 TypeScript 类型定义规范

**文件位置：** `src/types/analysis.ts`

```typescript
// src/types/analysis.ts

// 基础枚举
export type AnalysisStatus = 'idle' | 'configuring' | 'running' | 'paused' | 'completed' | 'failed';
export type AgentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type DepthLevel = 'shallow' | 'medium' | 'deep';
export type LLMProvider = 'openai' | 'google' | 'anthropic' | 'deepseek';
export type Language = 'en' | 'zh' | 'ja';

// 分析配置
export interface AnalysisConfig {
  ticker: string;
  date: string;
  language: Language;
  analysts: string[];
  depth: DepthLevel;
  provider: LLMProvider;
  quickModel: string;
  deepModel: string;
}

// Agent
export interface Agent {
  id: string;
  name: string;
  group: string;
  status: AgentStatus;
  progress?: number;
  startedAt?: string;
  completedAt?: string;
}

// 消息
export interface Message {
  id: string;
  type: 'tool' | 'agent' | 'data' | 'system';
  agent: string;
  content: string;
  timestamp: string;
}

// 分析记录
export interface Analysis {
  id: string;
  ticker: string;
  companyName: string;
  config: AnalysisConfig;
  status: AnalysisStatus;
  signal?: 'buy' | 'hold' | 'sell';
  confidence?: number;
  report?: Report;
  createdAt: string;
  completedAt?: string;
  duration?: string;
}

// 创建分析响应
export interface CreateAnalysisResponse {
  analysisId: string;
  status: 'created' | 'queued';
}
```

**文件位置：** `src/types/report.ts`

```typescript
// src/types/report.ts

export type TradingSignal = 'buy' | 'hold' | 'sell';

export interface Report {
  id: string;
  analysisId: string;
  ticker: string;
  companyName: string;
  signal: TradingSignal;
  confidence: number;
  recommendedPrice?: number;
  sections: ReportSection[];
  createdAt: string;
  duration: string;
}

export interface ReportSection {
  id: string;
  index: string; // I, II, III, IV, V
  title: string;
  tabs?: ReportTab[];
  content: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export interface ReportTab {
  id: string;
  label: string;
}
```

**文件位置：** `src/types/settings.ts`

```typescript
// src/types/settings.ts

export interface Settings {
  apiKeys: {
    openai: string;
    google: string;
    anthropic: string;
    deepseek: string;
    alphaVantage: string;
  };
  dataSources: {
    yfinance: boolean;
    alphaVantage: boolean;
  };
  notifications: {
    desktop: boolean;
    sound: boolean;
    email: boolean;
  };
  defaultAnalysts: 'all' | 'market' | 'market+fundamentals';
  defaultDepth: 'shallow' | 'medium' | 'deep';
  defaultLanguage: 'en' | 'zh' | 'ja';
  defaultProvider: 'openai' | 'google' | 'anthropic' | 'deepseek';
  defaultQuickModel: string;
  defaultDeepModel: string;
}
```

### 9.2 组件命名规范

| 类型 | 命名规范 | 示例 |
|------|----------|------|
| 页面组件 | PascalCase | `Dashboard.tsx`, `NewAnalysis.tsx` |
| 布局组件 | PascalCase | `MainLayout.tsx`, `Sidebar.tsx` |
| UI 组件 | PascalCase | `Button.tsx`, `Modal.tsx` |
| 业务组件 | PascalCase | `StockInput.tsx`, `SignalCard.tsx` |
| Hooks | camelCase, use 前缀 | `useWebSocket.ts`, `useDebounce.ts` |
| 工具函数 | camelCase | `formatters.ts`, `validators.ts` |
| 类型定义 | PascalCase | `AnalysisConfig`, `AgentStatus` |
| Store | camelCase, store 后缀 | `analysisStore.ts`, `settingsStore.ts` |
| API 服务 | camelCase, api 后缀 | `analysisApi.ts`, `reportApi.ts` |

### 9.3 Git 提交规范

```
<type>(<scope>): <subject>

[可选 body]

[可选 footer]
```

**Type 类型：**
| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（不是新功能或修复） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建系统相关 |
| `ci` | CI 配置相关 |
| `chore` | 其他更改 |

**示例：**
```
feat(analysis): 添加股票自动补全功能

- 集成本地股票数据库
- 支持模糊搜索
- 显示公司名称和代码

Closes #123
```

```
fix(message-stream): 修复大量消息时滚动卡顿问题

- 引入虚拟列表优化
- 限制 DOM 节点数量

Closes #456
```

```
perf(report): 优化报告渲染性能

- 使用 React.memo 避免不必要的重渲染
- 延迟加载非关键 Tab 内容
```

---

## 附录 A：依赖清单

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0",
    "zustand": "^4.5.2",
    "@tanstack/react-query": "^5.45.0",
    "axios": "^1.7.2",
    "socket.io-client": "^4.7.5",
    "react-markdown": "^9.0.1",
    "framer-motion": "^11.2.10",
    "react-hook-form": "^7.51.5",
    "@headlessui/react": "^2.1.2",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.4.5",
    "vite": "^5.2.13",
    "tailwindcss": "^3.4.4",
    "postcss": "^8.4.38",
    "autoprefixer": "^10.4.19",
    "@tanstack/react-virtual": "^3.5.1",
    "eslint": "^8.57.0",
    "prettier": "^3.3.2"
  }
}
```

---

## 附录 B：环境变量示例

**`.env.example`:**
```env
# API 配置
VITE_API_BASE_URL=http://localhost:8000/api

# WebSocket 配置
VITE_WS_URL=ws://localhost:8000

# 应用配置
VITE_APP_NAME=TradingAgents
VITE_APP_VERSION=1.0.0

# 功能开关
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
```

---

## 附录 C：待后端确认接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 创建分析 | POST | `/api/analysis` | 创建新分析任务 |
| 获取分析状态 | GET | `/api/analysis/:id/status` | 获取分析实时状态 |
| 取消分析 | POST | `/api/analysis/:id/cancel` | 取消运行中的分析 |
| 暂停分析 | POST | `/api/analysis/:id/pause` | 暂停分析 |
| 恢复分析 | POST | `/api/analysis/:id/resume` | 恢复暂停的分析 |
| 获取报告 | GET | `/api/analysis/:id/report` | 获取完整报告 |
| 导出报告 | GET | `/api/analysis/:id/export/:format` | 导出报告 |
| WebSocket 事件 | - | `/ws` | 实时消息推送 |

---

*文档版本：1.0*
*最后更新：2026-04-24*
*作者：TradingAgents 前端团队