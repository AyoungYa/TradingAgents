# TradingAgents Web 后端技术方案 (Phase 1 MVP)

## 文档信息
- **版本**: 1.0
- **日期**: 2026-04-24
- **项目**: TradingAgents Web Platform
- **范围**: Phase 1 MVP 后端架构设计

---

## 1. 整体架构设计

### 1.1 架构图描述

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                    前端 (Frontend)                       │
                                    │  prototype.html + React/Vue SPA (Future)                  │
                                    └───────────────────────┬─────────────────────────────────┘
                                                            │
                                        ┌───────────────────┴───────────────────┐
                                        │         HTTPS / WebSocket              │
                                        │         (REST API + WS)                │
                                        ▼                                       ▼
┌───────────────────────┐    ┌───────────────────────────────────────────────────────────────────┐
│   用户浏览器/客户端    │    │                      API Gateway / Load Balancer                  │
└───────────────────────┘    └───────────────────────────────┬───────────────────────────────────┘
                                                               │
                    ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
                    │                                          │                                          │
                    ▼                                          ▼                                          ▼
    ┌───────────────────────────┐      ┌──────────────────────────────────────┐      ┌───────────────────────────┐
    │   FastAPI Backend (Web)   │      │       Celery Worker (异步任务)        │      │     Redis (消息队列)       │
    │   - REST API Endpoints    │      │       - TradingAgents Graph 执行     │      │     - 任务队列            │
    │   - WebSocket Manager      │◄────►│       - LangGraph Streaming         │◄────►│     - Pub/Sub 实时推送     │
    │   - Session Management     │      │       - 报告生成与存储               │      │     - 缓存                │
    └───────────┬───────────────┘      └──────────────────────┬───────────────┘      └───────────────────────────┘
                │                                             │
                │                                             │
                ▼                                             ▼
    ┌───────────────────────────┐      ┌──────────────────────────────────────┐
    │     PostgreSQL / SQLite   │      │       TradingAgents Core             │
    │     - 分析任务记录          │      │       (复用现有代码)                    │
    │     - 报告内容             │      │       - TradingAgentsGraph            │
    │     - 系统设置             │      │       - LangGraph Workflow            │
    │     - 用户统计            │      │       - LLM Clients                    │
    └───────────────────────────┘      └──────────────────────────────────────┘
```

### 1.2 核心组件职责

| 组件 | 职责 | 技术选型 |
|------|------|----------|
| **API Server** | REST API + WebSocket 服务 | FastAPI |
| **Task Queue** | 异步任务调度与执行 | Celery + Redis |
| **Message Broker** | 实时进度推送 | Redis Pub/Sub |
| **Database** | 数据持久化 | PostgreSQL / SQLite (MVP) |
| **TradingAgents Core** | 核心分析逻辑复用 | 现有代码 + 自定义 Callback |

### 1.3 请求流程（新建分析 → 实时推送 → 报告生成）

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              新建分析完整流程                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  1. [前端] 用户配置 8 步向导 → POST /api/analysis                                      │
│                    │                                                                   │
│                    ▼                                                                   │
│  2. [API] 创建 Analysis 记录 (status=pending) → 入队 Celery Task                      │
│                    │                                                                   │
│                    ▼                                                                   │
│  3. [Celery Worker] 消费任务 → 初始化 TradingAgentsGraph                              │
│                    │                                                                   │
│                    ▼                                                                   │
│  4. [Worker] 注册 WebSocket Callback → 开始执行 graph.stream()                        │
│                    │                                                                   │
│                    ▼                                                                   │
│  5. [Callback] 每个 Chunk → Redis Pub/Sub 发布进度消息                                 │
│                    │                                                                   │
│                    ▼                                                                   │
│  6. [API Server] 订阅 Redis 频道 → WebSocket 推送到前端                                │
│                    │                                                                   │
│                    ▼                                                                   │
│  7. [前端] 实时更新: Agent进度 | 消息流 | 报告预览                                       │
│                    │                                                                   │
│                    ▼                                                                   │
│  8. [Worker] 分析完成 → 提取报告内容 → 存储到 DB → 更新 Analysis status=completed     │
│                    │                                                                   │
│                    ▼                                                                   │
│  9. [前端] 收到完成消息 → 跳转到报告页面                                                │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API 设计 (FastAPI)

### 2.1 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI 应用入口
│   ├── config.py                  # 配置管理
│   ├── database.py                # 数据库连接
│   ├── models/
│   │   ├── __init__.py
│   │   ├── analysis.py            # Analysis 模型
│   │   ├── report.py              # Report 模型
│   │   └── settings.py            # Settings 模型
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── analysis.py            # Analysis Pydantic schemas
│   │   ├── report.py              # Report Pydantic schemas
│   │   └── settings.py            # Settings schemas
│   ├── api/
│   │   ├── __init__.py
│   │   ├── analysis.py            # 分析管理路由
│   │   ├── reports.py             # 报告管理路由
│   │   ├── settings.py             # 系统设置路由
│   │   └── websocket.py            # WebSocket 路由
│   ├── services/
│   │   ├── __init__.py
│   │   ├── analysis_service.py    # 分析业务逻辑
│   │   ├── report_service.py      # 报告业务逻辑
│   │   └── websocket_manager.py   # WebSocket 管理
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py          # Celery 配置
│   │   └── analysis_tasks.py      # 异步任务定义
│   └── callbacks/
│       ├── __init__.py
│       └── streaming_callback.py   # 自定义 LangGraph Callback
├── requirements.txt
└── Dockerfile
```

### 2.2 数据模型定义

#### Analysis 模型

```python
# app/models/analysis.py
from sqlalchemy import Column, String, DateTime, Integer, Float, JSON, Text, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum

class AnalysisStatus(str, enum.Enum):
    PENDING = "pending"        # 等待执行
    RUNNING = "running"        # 执行中
    COMPLETED = "completed"     # 已完成
    FAILED = "failed"          # 执行失败
    CANCELLED = "cancelled"    # 已取消

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    ticker = Column(String(20), nullable=False, index=True)
    analysis_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    
    # 配置 (JSON)
    config = Column(JSON, nullable=False)
    # 示例 config:
    # {
    #     "analysts": ["market", "news"],
    #     "research_depth": 2,
    #     "llm_provider": "openai",
    #     "deep_think_llm": "gpt-4",
    #     "quick_think_llm": "gpt-4o-mini",
    #     "output_language": "Chinese"
    # }
    
    status = Column(String(20), default=AnalysisStatus.PENDING)
    
    # Agent 状态 (JSON) - 实时更新
    agent_status = Column(JSON, nullable=True)
    # {
    #     "Market Analyst": "completed",
    #     "Bull Researcher": "in_progress",
    #     ...
    # }
    
    # 进度统计
    llm_calls = Column(Integer, default=0)
    tool_calls = Column(Integer, default=0)
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    
    # 耗时
    elapsed_seconds = Column(Float, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # 错误信息
    error_message = Column(Text, nullable=True)
    
    # 关联报告
    report_id = Column(String(36), nullable=True, index=True)
```

#### Report 模型

```python
# app/models/report.py
from sqlalchemy import Column, String, DateTime, Integer, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    analysis_id = Column(String(36), ForeignKey("analyses.id"), nullable=False, index=True)
    
    # 交易信号
    decision = Column(String(50), nullable=True)  # BUY / HOLD / SELL
    signal = Column(String(20), nullable=True)     # 信号类型
    confidence = Column(Integer, nullable=True)     # 置信度 0-100
    
    # 报告内容 (JSON) - 5 大板块
    content = Column(JSON, nullable=False)
    # {
    #     "market_report": "...",
    #     "sentiment_report": "...",
    #     "news_report": "...",
    #     "fundamentals_report": "...",
    #     "research": {
    #         "bull": "...",
    #         "bear": "...",
    #         "manager": "..."
    #     },
    #     "trading_plan": "...",
    #     "risk_analysis": {
    #         "aggressive": "...",
    #         "conservative": "...",
    #         "neutral": "..."
    #     },
    #     "final_decision": "..."
    # }
    
    # 完整报告 (Markdown)
    full_report = Column(Text, nullable=True)
    
    # 时间戳
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

#### Settings 模型

```python
# app/models/settings.py
from sqlalchemy import Column, String, Text, Integer
from app.database import Base

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(50), nullable=False, index=True)  # llm / data_source / notification / preferences
    key = Column(String(100), nullable=False)
    value = Column(Text, nullable=True)
    
    # 复合唯一索引
    __table_args__ = (
        UniqueConstraint('category', 'key', name='uq_category_key'),
    )
```

---

### 2.3 API 端点详细定义

#### 2.3.1 分析管理 API

##### POST /api/analysis - 创建分析任务

**请求**
```json
{
    "ticker": "AAPL",
    "analysis_date": "2026-04-24",
    "config": {
        "analysts": ["market", "news", "fundamentals"],
        "research_depth": 2,
        "llm_provider": "openai",
        "deep_think_llm": "gpt-4",
        "quick_think_llm": "gpt-4o-mini",
        "output_language": "Chinese"
    }
}
```

**响应 (201 Created)**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ticker": "AAPL",
    "analysis_date": "2026-04-24",
    "status": "pending",
    "config": {...},
    "created_at": "2026-04-24T10:30:00Z",
    "websocket_url": "/ws/analysis/550e8400-e29b-41d4-a716-446655440000"
}
```

**错误响应 (400 Bad Request)**
```json
{
    "detail": "Invalid ticker symbol: INVALID_TICKER"
}
```

---

##### GET /api/analysis/{id} - 获取分析状态

**响应 (200 OK)**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ticker": "AAPL",
    "analysis_date": "2026-04-24",
    "status": "running",
    "config": {...},
    "agent_status": {
        "Market Analyst": "completed",
        "News Analyst": "completed",
        "Fundamentals Analyst": "in_progress",
        "Bull Researcher": "pending",
        "Bear Researcher": "pending",
        "Research Manager": "pending",
        "Trader": "pending",
        "Aggressive Analyst": "pending",
        "Neutral Analyst": "pending",
        "Conservative Analyst": "pending",
        "Portfolio Manager": "pending"
    },
    "progress": {
        "agents_completed": 2,
        "agents_total": 10,
        "llm_calls": 15,
        "tool_calls": 42,
        "tokens_in": 125000,
        "tokens_out": 8500,
        "elapsed_seconds": 45.5
    },
    "created_at": "2026-04-24T10:30:00Z",
    "started_at": "2026-04-24T10:30:05Z",
    "completed_at": null
}
```

---

##### GET /api/analysis/{id}/result - 获取分析结果

**响应 (200 OK)** - 仅当 status=completed
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ticker": "AAPL",
    "analysis_date": "2026-04-24",
    "status": "completed",
    "decision": "BUY",
    "signal": "STRONG_BUY",
    "confidence": 87,
    "elapsed_seconds": 180.5,
    "report_id": "660e8400-e29b-41d4-a716-446655440001",
    "created_at": "2026-04-24T10:30:00Z",
    "completed_at": "2026-04-24T10:33:00Z"
}
```

**响应 (400 Bad Request)** - 分析尚未完成
```json
{
    "detail": "Analysis is not completed yet. Current status: running"
}
```

---

##### DELETE /api/analysis/{id} - 取消分析

**响应 (200 OK)**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "cancelled",
    "message": "Analysis cancelled successfully"
}
```

**响应 (400 Bad Request)** - 已完成的分析无法取消
```json
{
    "detail": "Cannot cancel completed analysis"
}
```

---

##### GET /api/analysis - 分析列表

**Query Parameters**
- `page` (int, default=1): 页码
- `page_size` (int, default=20, max=100): 每页数量
- `status` (str, optional): 筛选状态 (pending/running/completed/failed)
- `ticker` (str, optional): 筛选股票代码

**响应 (200 OK)**
```json
{
    "items": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "ticker": "AAPL",
            "analysis_date": "2026-04-24",
            "status": "completed",
            "decision": "BUY",
            "confidence": 87,
            "created_at": "2026-04-24T10:30:00Z"
        }
    ],
    "total": 247,
    "page": 1,
    "page_size": 20,
    "pages": 13
}
```

---

#### 2.3.2 WebSocket 实时推送 API

##### WS /ws/analysis/{id} - 实时分析进度流

**连接**
```javascript
// 前端连接
const ws = new WebSocket('ws://localhost:8000/ws/analysis/550e8400-e29b-41d4-a716-446655440000');
```

**服务器推送消息格式**

所有消息都包含公共字段:
```json
{
    "type": "message_type",
    "timestamp": "2026-04-24T10:30:05.123Z",
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

**type: agent_status** - Agent 状态变更
```json
{
    "type": "agent_status",
    "timestamp": "2026-04-24T10:30:05.123Z",
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
        "agent": "Market Analyst",
        "status": "completed",  // pending / in_progress / completed / error
        "all_agents": {
            "Market Analyst": "completed",
            "News Analyst": "in_progress",
            "Bull Researcher": "pending"
        }
    }
}
```

---

**type: message** - 新消息日志
```json
{
    "type": "message",
    "timestamp": "2026-04-24T10:30:05.123Z",
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
        "msg_type": "Agent",  // Agent / Tool / Data / User / System
        "content": "Based on the technical analysis, AAPL shows strong bullish momentum...",
        "agent": "Market Analyst"
    }
}
```

---

**type: report_update** - 报告内容更新
```json
{
    "type": "report_update",
    "timestamp": "2026-04-24T10:30:05.123Z",
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
        "section": "market_report",
        "content": "### Market Analysis\n\nCurrent price: $178.50\n\nTechnical Indicators:\n- RSI(14): 65.3 (bullish)\n- MACD: Positive crossover detected...",
        "is_complete": true
    }
}
```

---

**type: stats_update** - 统计信息更新
```json
{
    "type": "stats_update",
    "timestamp": "2026-04-24T10:30:05.123Z",
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
        "llm_calls": 15,
        "tool_calls": 42,
        "tokens_in": 125000,
        "tokens_out": 8500,
        "elapsed_seconds": 45.5
    }
}
```

---

**type: progress** - 整体进度更新
```json
{
    "type": "progress",
    "timestamp": "2026-04-24T10:30:05.123Z",
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
        "phase": "analyst",  // analyst / research / trading / risk / portfolio
        "phase_progress": 50,  // 当前阶段百分比
        "overall_progress": 25,  // 整体进度百分比
        "current_agent": "News Analyst"
    }
}
```

---

**type: completed** - 分析完成
```json
{
    "type": "completed",
    "timestamp": "2026-04-24T10:33:05.123Z",
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
        "status": "completed",
        "decision": "BUY",
        "signal": "STRONG_BUY",
        "confidence": 87,
        "report_id": "660e8400-e29b-41d4-a716-446655440001",
        "elapsed_seconds": 180.5
    }
}
```

---

**type: error** - 错误发生
```json
{
    "type": "error",
    "timestamp": "2026-04-24T10:32:05.123Z",
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
    "data": {
        "code": "LLM_API_ERROR",
        "message": "OpenAI API rate limit exceeded",
        "retry_count": 3,
        "recoverable": true
    }
}
```

---

#### 2.3.3 报告管理 API

##### GET /api/reports - 报告列表

**Query Parameters**
- `page` (int, default=1): 页码
- `page_size` (int, default=20): 每页数量
- `ticker` (str, optional): 筛选股票代码
- `decision` (str, optional): 筛选决策 (BUY/HOLD/SELL)
- `date_from` (str, optional): 开始日期 (YYYY-MM-DD)
- `date_to` (str, optional): 结束日期 (YYYY-MM-DD)

**响应 (200 OK)**
```json
{
    "items": [
        {
            "id": "660e8400-e29b-41d4-a716-446655440001",
            "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
            "ticker": "AAPL",
            "analysis_date": "2026-04-24",
            "decision": "BUY",
            "confidence": 87,
            "created_at": "2026-04-24T10:33:00Z"
        }
    ],
    "total": 180,
    "page": 1,
    "page_size": 20,
    "pages": 9
}
```

---

##### GET /api/reports/{id} - 报告详情

**响应 (200 OK)**
```json
{
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
    "ticker": "AAPL",
    "analysis_date": "2026-04-24",
    "decision": "BUY",
    "signal": "STRONG_BUY",
    "confidence": 87,
    "content": {
        "market_report": "...",
        "sentiment_report": "...",
        "news_report": "...",
        "fundamentals_report": "...",
        "research": {
            "bull": "...",
            "bear": "...",
            "manager": "..."
        },
        "trading_plan": "...",
        "risk_analysis": {
            "aggressive": "...",
            "conservative": "...",
            "neutral": "..."
        },
        "final_decision": "..."
    },
    "full_report": "# Trading Analysis Report: AAPL\n\n## I. Analyst Team Reports\n\n### Market Analysis\n...",
    "created_at": "2026-04-24T10:33:00Z"
}
```

---

##### GET /api/reports/{id}/export - 导出报告

**Query Parameters**
- `format` (str, default=md): 导出格式 (md / json / pdf)

**响应**
- `format=md`: 返回 Markdown 文本，Content-Type: text/markdown
- `format=json`: 返回 JSON，Content-Type: application/json
- `format=pdf`: 返回 PDF 文件，Content-Type: application/pdf

---

#### 2.3.4 系统设置 API

##### GET /api/settings - 获取所有设置

**响应 (200 OK)**
```json
{
    "llm": {
        "provider": "openai",
        "deep_think_model": "gpt-4",
        "quick_think_model": "gpt-4o-mini",
        "backend_url": "https://api.openai.com/v1",
        "api_key_set": true
    },
    "data_source": {
        "core_stock_apis": "yfinance",
        "technical_indicators": "yfinance",
        "fundamental_data": "yfinance",
        "news_data": "yfinance"
    },
    "preferences": {
        "output_language": "Chinese",
        "default_research_depth": 2,
        "auto_save_reports": true,
        "notifications_enabled": true
    }
}
```

---

##### PUT /api/settings/llm - 更新 LLM 配置

**请求**
```json
{
    "provider": "openai",
    "deep_think_model": "gpt-4",
    "quick_think_model": "gpt-4o-mini",
    "backend_url": "https://api.openai.com/v1",
    "api_key": "sk-..."  // 可选，仅当需要更新时提供
}
```

**响应 (200 OK)**
```json
{
    "message": "LLM settings updated successfully",
    "settings": {
        "provider": "openai",
        "deep_think_model": "gpt-4",
        "quick_think_model": "gpt-4o-mini"
    }
}
```

---

##### PUT /api/settings/preferences - 更新用户偏好

**请求**
```json
{
    "output_language": "English",
    "default_research_depth": 3,
    "auto_save_reports": false
}
```

**响应 (200 OK)**
```json
{
    "message": "Preferences updated successfully"
}
```

---

##### GET /api/settings/stats - 获取统计数据

**响应 (200 OK)**
```json
{
    "total_analyses": 247,
    "analyses_this_month": 38,
    "active_strategies": 12,
    "avg_duration_seconds": 252,
    "recent_analyses": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "ticker": "NVDA",
            "status": "completed",
            "created_at": "2026-04-24T09:30:00Z"
        }
    ]
}
```

---

## 3. 异步任务设计

### 3.1 任务队列选型

| 组件 | 选型 | 理由 |
|------|------|------|
| **Broker** | Redis | 轻量、支持 Pub/Sub、复用现有依赖 |
| **Worker** | Celery | 功能完善、社区活跃、支持任务优先级 |
| **序列化** | JSON | 简单易懂，便于调试 |

### 3.2 Celery 配置

```python
# app/tasks/celery_app.py
from celery import Celery
from app.config import settings

celery_app = Celery(
    "tradingagents",
    broker=settings.CELERY_BROKER_URL,  # redis://localhost:6379/0
    backend=settings.CELERY_RESULT_BACKEND,  # redis://localhost:6379/1
    include=["app.tasks.analysis_tasks"]
)

# Celery 配置
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 小时超时
    task_soft_time_limit=3300,  # 55 分钟软超时
    worker_prefetch_multiplier=1,  # 防止任务堆积
    task_acks_late=True,  # 任务完成后确认
    task_reject_on_worker_lost=True,
)
```

### 3.3 任务状态流转

```
                           ┌─────────────────────────────────────────┐
                           │                                         │
                           ▼                                         │
┌──────────┐    ┌──────────┴──────────┐    ┌───────────┐             │
│ PENDING  │───►│     RUNNING         │───►│ COMPLETED │             │
└──────────┘    └──────────┬──────────┘    └───────────┘             │
      ▲                    │                    │                    │
      │                    │                    │                    │
      │                    │            ┌───────┴───────┐            │
      │                    │            │               │            │
      │                    ▼            ▼               ▼            │
      │            ┌──────────┐  ┌──────────┐  ┌──────────┐         │
      └────────────│ CANCELLED│  │  FAILED  │  │ RETRYING │─────────┘
                   └──────────┘  └──────────┘  └──────────┘
```

### 3.4 异步任务定义

```python
# app/tasks/analysis_tasks.py
from celery import Task
from app.tasks.celery_app import celery_app
from app.database import get_db
from app.services.websocket_manager import ws_manager
from app.callbacks.streaming_callback import WebSocketCallbackHandler
from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG
import traceback

class AnalysisTask(Task):
    """自定义任务类，支持进度回调"""
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """任务失败回调"""
        db = next(get_db())
        try:
            from app.models.analysis import Analysis, AnalysisStatus
            analysis = db.query(Analysis).filter(Analysis.id == task_id).first()
            if analysis:
                analysis.status = AnalysisStatus.FAILED
                analysis.error_message = str(exc)
                db.commit()
                
            # 推送错误消息到 WebSocket
            ws_manager.send_message(task_id, {
                "type": "error",
                "data": {
                    "code": "TASK_FAILED",
                    "message": str(exc),
                    "traceback": traceback.format_exc()
                }
            })
        finally:
            db.close()

@celery_app.task(
    bind=True,
    base=AnalysisTask,
    name="analysis.run_analysis"
)
def run_analysis_task(self, analysis_id: str):
    """
    执行分析任务的主任务
    
    流程:
    1. 从 DB 加载分析配置
    2. 初始化 TradingAgentsGraph
    3. 创建 WebSocketCallbackHandler
    4. 执行 graph.stream() 并实时推送进度
    5. 提取报告内容并存储
    """
    db = next(get_db())
    try:
        # 1. 加载分析记录
        from app.models.analysis import Analysis, AnalysisStatus
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise ValueError(f"Analysis {analysis_id} not found")
        
        # 更新状态为运行中
        analysis.status = AnalysisStatus.RUNNING
        analysis.started_at = datetime.utcnow()
        db.commit()
        
        # 推送状态变更
        ws_manager.send_message(analysis_id, {
            "type": "agent_status",
            "data": {
                "status": "running",
                "started_at": analysis.started_at.isoformat()
            }
        })
        
        # 2. 构建配置
        config = DEFAULT_CONFIG.copy()
        config.update(analysis.config)
        config["llm_provider"] = config.get("llm_provider", "openai")
        
        # 3. 创建 WebSocket 回调处理器
        callback_handler = WebSocketCallbackHandler(
            analysis_id=analysis_id,
            ws_manager=ws_manager,
            db_session=db
        )
        
        # 4. 初始化 TradingAgentsGraph
        graph = TradingAgentsGraph(
            selected_analysts=analysis.config.get("analysts", ["market"]),
            config=config,
            debug=False,
            callbacks=[callback_handler]
        )
        
        # 5. 执行分析
        init_agent_state = graph.propagator.create_initial_state(
            analysis.ticker,
            analysis.analysis_date
        )
        args = graph.propagator.get_graph_args(callbacks=[callback_handler])
        
        final_state = None
        for chunk in graph.graph.stream(init_agent_state, **args):
            final_state = chunk
            # Callback 会在 graph.stream() 内部处理进度推送
        
        # 6. 处理结果
        if final_state:
            decision = graph.process_signal(final_state["final_trade_decision"])
            
            # 创建报告
            report = create_report_from_state(db, analysis_id, final_state, decision)
            
            # 更新分析状态
            analysis.status = AnalysisStatus.COMPLETED
            analysis.completed_at = datetime.utcnow()
            analysis.report_id = report.id
            analysis.agent_status = callback_handler.get_final_agent_status()
            analysis.llm_calls = callback_handler.llm_calls
            analysis.tool_calls = callback_handler.tool_calls
            analysis.tokens_in = callback_handler.tokens_in
            analysis.tokens_out = callback_handler.tokens_out
            analysis.elapsed_seconds = (
                analysis.completed_at - analysis.started_at
            ).total_seconds()
            
            db.commit()
            
            # 推送完成消息
            ws_manager.send_message(analysis_id, {
                "type": "completed",
                "data": {
                    "status": "completed",
                    "decision": decision.get("decision"),
                    "signal": decision.get("signal"),
                    "confidence": decision.get("confidence"),
                    "report_id": report.id,
                    "elapsed_seconds": analysis.elapsed_seconds
                }
            })
        
    except Exception as e:
        # 更新失败状态
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = str(e)
            db.commit()
        
        ws_manager.send_message(analysis_id, {
            "type": "error",
            "data": {
                "code": "EXECUTION_ERROR",
                "message": str(e),
                "recoverable": False
            }
        })
        raise
    
    finally:
        db.close()


def create_report_from_state(db, analysis_id: str, final_state: dict, decision: dict):
    """从 final_state 提取报告内容并存储"""
    from app.models.report import Report
    
    content = {
        "market_report": final_state.get("market_report", ""),
        "sentiment_report": final_state.get("sentiment_report", ""),
        "news_report": final_state.get("news_report", ""),
        "fundamentals_report": final_state.get("fundamentals_report", ""),
        "research": {
            "bull": final_state.get("investment_debate_state", {}).get("bull_history", ""),
            "bear": final_state.get("investment_debate_state", {}).get("bear_history", ""),
            "manager": final_state.get("investment_debate_state", {}).get("judge_decision", "")
        },
        "trading_plan": final_state.get("trader_investment_plan", ""),
        "risk_analysis": {
            "aggressive": final_state.get("risk_debate_state", {}).get("aggressive_history", ""),
            "conservative": final_state.get("risk_debate_state", {}).get("conservative_history", ""),
            "neutral": final_state.get("risk_debate_state", {}).get("neutral_history", "")
        },
        "final_decision": final_state.get("final_trade_decision", "")
    }
    
    report = Report(
        id=str(uuid.uuid4()),
        analysis_id=analysis_id,
        decision=decision.get("decision"),
        signal=decision.get("signal"),
        confidence=decision.get("confidence"),
        content=content,
        full_report=generate_markdown_report(content, final_state.get("company_of_interest"))
    )
    
    db.add(report)
    db.commit()
    
    return report


def generate_markdown_report(content: dict, ticker: str) -> str:
    """生成 Markdown 格式的完整报告"""
    import datetime
    
    parts = [f"# Trading Analysis Report: {ticker}\n"]
    parts.append(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Analyst Reports
    if any(content.get(k) for k in ["market_report", "sentiment_report", "news_report", "fundamentals_report"]):
        parts.append("## I. Analyst Team Reports\n")
        for name, key in [
            ("Market Analysis", "market_report"),
            ("Social Sentiment", "sentiment_report"),
            ("News Analysis", "news_report"),
            ("Fundamentals Analysis", "fundamentals_report")
        ]:
            if content.get(key):
                parts.append(f"### {name}\n{content[key]}\n\n")
    
    # Research Team
    if content.get("research"):
        parts.append("## II. Research Team Decision\n")
        research = content["research"]
        if research.get("bull"):
            parts.append(f"### Bull Researcher\n{research['bull']}\n\n")
        if research.get("bear"):
            parts.append(f"### Bear Researcher\n{research['bear']}\n\n")
        if research.get("manager"):
            parts.append(f"### Research Manager\n{research['manager']}\n\n")
    
    # Trading Team
    if content.get("trading_plan"):
        parts.append("## III. Trading Team Plan\n")
        parts.append(f"{content['trading_plan']}\n\n")
    
    # Risk Management
    if content.get("risk_analysis"):
        parts.append("## IV. Risk Management Team Decision\n")
        risk = content["risk_analysis"]
        if risk.get("aggressive"):
            parts.append(f"### Aggressive Analyst\n{risk['aggressive']}\n\n")
        if risk.get("conservative"):
            parts.append(f"### Conservative Analyst\n{risk['conservative']}\n\n")
        if risk.get("neutral"):
            parts.append(f"### Neutral Analyst\n{risk['neutral']}\n\n")
    
    # Final Decision
    if content.get("final_decision"):
        parts.append("## V. Portfolio Manager Decision\n")
        parts.append(f"{content['final_decision']}\n")
    
    return "\n".join(parts)
```

---

## 4. 数据流设计

### 4.1 实时数据推送流程

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              实时数据推送完整流程                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  [LangGraph Execution]                                                                  │
│         │                                                                               │
│         ▼                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐            │
│  │  WebSocketCallbackHandler (自定义 LangChain Callback)                   │            │
│  │  ├── on_llm_start()     → 发送 agent_status (in_progress)               │            │
│  │  ├── on_chat_model_start() → 同上                                        │            │
│  │  ├── on_llm_end()       → 更新统计信息 tokens                             │            │
│  │  ├── on_tool_start()    → 记录 tool_calls                                │            │
│  │  └── on_custom_event()  → 发送 report_update / phase_update              │            │
│  └─────────────────────────────────────────────────────────────────────────┘            │
│         │                                                                               │
│         ▼                                                                               │
│  [消息发布]                                                                              │
│         │                                                                               │
│         ▼                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐            │
│  │  Redis Pub/Sub                                                           │            │
│  │  Channel: analysis:{analysis_id}:events                                 │            │
│  │  Message: JSON { type, timestamp, data }                                 │            │
│  └─────────────────────────────────────────────────────────────────────────┘            │
│         │                                                                               │
│         │    (多个 Worker 可以订阅同一频道)                                                 │
│         ▼                                                                               │
│  [API Server]                                                                           │
│         │                                                                               │
│         ▼                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐            │
│  │  WebSocket Manager                                                       │            │
│  │  ├── subscribe(analysis_id, websocket) → 加入房间                         │            │
│  │  ├── unsubscribe(analysis_id, websocket) → 离开房间                      │            │
│  │  └── broadcast(analysis_id, message) → 推送给所有连接的客户端              │            │
│  └─────────────────────────────────────────────────────────────────────────┘            │
│         │                                                                               │
│         ▼                                                                               │
│  [WebSocket Connection]                                                                  │
│         │                                                                               │
│         ▼                                                                               │
│  [Frontend] 实时更新 UI                                                                 │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 WebSocket Manager 实现

```python
# app/services/websocket_manager.py
import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket
import redis.asyncio as redis
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """WebSocket 连接管理器"""
    
    def __init__(self):
        # 本地连接池: analysis_id -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Redis 客户端
        self.redis_client: redis.Redis = None
        # 订阅任务
        self.subscriptions: Dict[str, asyncio.Task] = {}
    
    async def connect(self, websocket: WebSocket, analysis_id: str):
        """客户端连接"""
        await websocket.accept()
        
        if analysis_id not in self.active_connections:
            self.active_connections[analysis_id] = set()
            # 首次连接，启动 Redis 订阅
            await self._ensure_redis_subscription(analysis_id)
        
        self.active_connections[analysis_id].add(websocket)
        logger.info(f"WebSocket connected: analysis_id={analysis_id}, total={len(self.active_connections[analysis_id])}")
    
    async def disconnect(self, websocket: WebSocket, analysis_id: str):
        """客户端断开"""
        if analysis_id in self.active_connections:
            self.active_connections[analysis_id].discard(websocket)
            if not self.active_connections[analysis_id]:
                del self.active_connections[analysis_id]
                await self._cleanup_subscription(analysis_id)
        logger.info(f"WebSocket disconnected: analysis_id={analysis_id}")
    
    async def send_message(self, analysis_id: str, message: dict):
        """发送消息给所有连接的客户端"""
        if analysis_id not in self.active_connections:
            return
        
        # 添加公共字段
        full_message = {
            "type": message.get("type", "unknown"),
            "timestamp": message.get("timestamp", datetime.utcnow().isoformat()),
            "analysis_id": analysis_id,
            "data": message.get("data", {})
        }
        
        dead_connections = set()
        for websocket in self.active_connections[analysis_id]:
            try:
                await websocket.send_json(full_message)
            except Exception as e:
                logger.warning(f"Failed to send message: {e}")
                dead_connections.add(websocket)
        
        # 清理死连接
        for ws in dead_connections:
            await self.disconnect(ws, analysis_id)
    
    async def _ensure_redis_subscription(self, analysis_id: str):
        """确保 Redis 订阅已启动"""
        if analysis_id in self.subscriptions:
            return
        
        if not self.redis_client:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
        
        # 创建订阅任务
        self.subscriptions[analysis_id] = asyncio.create_task(
            self._redis_subscriber(analysis_id)
        )
    
    async def _redis_subscriber(self, analysis_id: str):
        """Redis 订阅者协程"""
        channel = f"analysis:{analysis_id}:events"
        pubsub = self.redis_client.pubsub()
        await pubsub.subscribe(channel)
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    await self.send_message(analysis_id, data)
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(channel)
    
    async def _cleanup_subscription(self, analysis_id: str):
        """清理订阅"""
        if analysis_id in self.subscriptions:
            self.subscriptions[analysis_id].cancel()
            del self.subscriptions[analysis_id]
    
    async def publish_event(self, analysis_id: str, event_type: str, data: dict):
        """发布事件到 Redis"""
        if not self.redis_client:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
        
        message = {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        
        channel = f"analysis:{analysis_id}:events"
        await self.redis_client.publish(channel, json.dumps(message))


# 全局单例
ws_manager = WebSocketManager()
```

### 4.3 报告数据存储流程

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              报告数据存储流程                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  1. [Worker] 分析完成 → final_state                                                    │
│                    │                                                                   │
│                    ▼                                                                   │
│  2. [处理] 提取各板块内容                                                                │
│         ├── market_report        → content.market_report                              │
│         ├── sentiment_report     → content.sentiment_report                           │
│         ├── news_report          → content.news_report                                │
│         ├── fundamentals_report  → content.fundamentals_report                        │
│         ├── investment_debate_state.bull_history → content.research.bull             │
│         ├── investment_debate_state.bear_history → content.research.bear             │
│         ├── investment_debate_state.judge_decision → content.research.manager         │
│         ├── trader_investment_plan → content.trading_plan                             │
│         ├── risk_debate_state.aggressive_history → content.risk_analysis.aggressive   │
│         ├── risk_debate_state.conservative_history → content.risk_analysis.conservative│
│         ├── risk_debate_state.neutral_history → content.risk_analysis.neutral         │
│         └── final_trade_decision → content.final_decision                             │
│                    │                                                                   │
│                    ▼                                                                   │
│  3. [生成] Markdown 完整报告                                                            │
│                    │                                                                   │
│                    ▼                                                                   │
│  4. [处理信号] process_signal() → decision, signal, confidence                         │
│                    │                                                                   │
│                    ▼                                                                   │
│  5. [存储] 创建 Report 记录                                                             │
│         ├── content (JSON)                                                              │
│         ├── full_report (Markdown)                                                     │
│         ├── decision, signal, confidence                                               │
│         └── analysis_id (FK)                                                           │
│                    │                                                                   │
│                    ▼                                                                   │
│  6. [更新] Analysis 记录                                                                │
│         ├── status = COMPLETED                                                         │
│         ├── report_id = 新建报告ID                                                     │
│         ├── elapsed_seconds                                                           │
│         └── agent_status (最终状态)                                                    │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 状态管理策略

| 状态类型 | 存储位置 | 生命周期 | 访问方式 |
|---------|---------|---------|---------|
| 分析配置 | PostgreSQL | 永久 | 同步读写 |
| 实时 Agent 状态 | Redis + PostgreSQL | 任务期间 | Pub/Sub + 轮询 |
| 报告内容 | PostgreSQL | 永久 | 同步读写 |
| WebSocket 连接 | 内存 | 连接期间 | 内存管理 |
| 任务队列 | Redis | 任务完成后删除 | Celery 管理 |

---

## 5. 与 TradingAgents Core 的集成方案

### 5.1 复用 TradingAgentsGraph

```python
# app/tasks/analysis_tasks.py (节选)

# 直接复用现有 TradingAgentsGraph
from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

# 初始化 (与 CLI 相同的流程)
graph = TradingAgentsGraph(
    selected_analysts=["market", "news"],  # 来自前端配置
    config={
        **DEFAULT_CONFIG,
        "llm_provider": "openai",
        "deep_think_llm": "gpt-4",
        "quick_think_llm": "gpt-4o-mini",
        "max_debate_rounds": 2,
        "output_language": "Chinese"
    },
    debug=False,
    callbacks=[custom_callback_handler]
)

# 执行 (与 CLI L1056 相同的方式)
init_agent_state = graph.propagator.create_initial_state(
    ticker="AAPL",
    trade_date="2026-04-24"
)
args = graph.propagator.get_graph_args(callbacks=[custom_callback_handler])

# 关键区别: 使用 stream() 而非 invoke() 以支持实时进度
for chunk in graph.graph.stream(init_agent_state, **args):
    # 每个 chunk 包含:
    # - messages: 新产生的消息列表
    # - market_report / sentiment_report / news_report / fundamentals_report
    # - investment_debate_state: { bull_history, bear_history, judge_decision }
    # - trader_investment_plan
    # - risk_debate_state: { aggressive_history, conservative_history, neutral_history }
    # - final_trade_decision
    process_chunk(chunk, callback_handler)
```

### 5.2 自定义 Callback Handler

```python
# app/callbacks/streaming_callback.py
from typing import Any, Dict, List
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from datetime import datetime
import asyncio
import json

class WebSocketCallbackHandler(BaseCallbackHandler):
    """
    自定义 LangChain Callback，用于实时推送分析进度
    
    复用 cli/stats_handler.py 的统计追踪逻辑，
    并扩展为 WebSocket 推送
    """
    
    # Agent 名称映射
    ANALYST_MAPPING = {
        "market": "Market Analyst",
        "social": "Social Analyst", 
        "news": "News Analyst",
        "fundamentals": "Fundamentals Analyst"
    }
    
    REPORT_SECTIONS = {
        "market_report": "Market Analyst",
        "sentiment_report": "Social Analyst",
        "news_report": "News Analyst",
        "fundamentals_report": "Fundamentals Analyst"
    }
    
    PHASE_MAPPING = {
        "Market Analyst": ("analyst", 0),
        "Social Analyst": ("analyst", 25),
        "News Analyst": ("analyst", 50),
        "Fundamentals Analyst": ("analyst", 75),
        "Bull Researcher": ("research", 10),
        "Bear Researcher": ("research", 30),
        "Research Manager": ("research", 50),
        "Trader": ("trading", 50),
        "Aggressive Analyst": ("risk", 10),
        "Neutral Analyst": ("risk", 40),
        "Conservative Analyst": ("risk", 70),
        "Portfolio Manager": ("portfolio", 50)
    }
    
    def __init__(self, analysis_id: str, ws_manager, db_session):
        self.analysis_id = analysis_id
        self.ws_manager = ws_manager
        self.db = db_session
        
        # 统计
        self.llm_calls = 0
        self.tool_calls = 0
        self.tokens_in = 0
        self.tokens_out = 0
        
        # Agent 状态追踪
        self.agent_status = {}
        self.selected_analysts = []
        self._processed_message_ids = set()
        
        # 报告内容累积
        self.report_sections = {}
        self._current_agent = None
    
    def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[Any]],
        **kwargs: Any
    ) -> None:
        """LLM 调用开始"""
        self.llm_calls += 1
        
        # 推断当前 Agent (从 messages 上下文)
        # 这里需要根据实际情况推断 agent 名称
        # 可以在 messages 中查找特定标记
    
    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """LLM 调用结束 - 提取 token 使用量"""
        try:
            generation = response.generations[0][0]
            if hasattr(generation, "message"):
                message = generation.message
                if isinstance(message, AIMessage) and hasattr(message, "usage_metadata"):
                    usage = message.usage_metadata
                    self.tokens_in += usage.get("input_tokens", 0)
                    self.tokens_out += usage.get("output_tokens", 0)
        except (IndexError, TypeError):
            pass
        
        # 推送统计更新 (限制频率)
        if self.llm_calls % 5 == 0:
            asyncio.create_task(self._send_stats_update())
    
    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        **kwargs: Any
    ) -> None:
        """工具调用开始"""
        self.tool_calls += 1
        
        # 推送工具调用消息
        tool_name = serialized.get("name", "unknown_tool")
        asyncio.create_task(self._send_message("message", {
            "msg_type": "Tool",
            "content": f"Calling {tool_name}: {input_str[:100]}...",
            "agent": self._current_agent
        }))
    
    def process_chunk(self, chunk: dict) -> None:
        """
        处理 graph.stream() 返回的 chunk
        这是最关键的集成点
        """
        # 1. 处理消息
        for message in chunk.get("messages", []):
            msg_id = getattr(message, "id", None)
            if msg_id and msg_id in self._processed_message_ids:
                continue
            if msg_id:
                self._processed_message_ids.add(msg_id)
            
            # 分类消息类型
            content = self._extract_content(message)
            if content:
                msg_type = self._classify_message(message)
                asyncio.create_task(self._send_message("message", {
                    "msg_type": msg_type,
                    "content": content[:500],  # 截断
                    "agent": self._current_agent
                }))
        
        # 2. 更新报告板块
        for section, agent in self.REPORT_SECTIONS.items():
            if chunk.get(section):
                self.report_sections[section] = chunk[section]
                asyncio.create_task(self._send_message("report_update", {
                    "section": section,
                    "content": chunk[section][:1000],
                    "is_complete": True
                }))
                # 更新 Agent 状态为完成
                self._update_agent_status(agent, "completed")
        
        # 3. 处理投资辩论状态
        if chunk.get("investment_debate_state"):
            debate = chunk["investment_debate_state"]
            
            if debate.get("bull_history"):
                self._update_agent_status("Bull Researcher", "in_progress")
                asyncio.create_task(self._send_report_update(
                    "research_bull",
                    debate["bull_history"]
                ))
            
            if debate.get("bear_history"):
                self._update_agent_status("Bear Researcher", "in_progress")
                asyncio.create_task(self._send_report_update(
                    "research_bear",
                    debate["bear_history"]
                ))
            
            if debate.get("judge_decision"):
                self._update_agent_status("Research Manager", "completed")
                self._update_agent_status("Bull Researcher", "completed")
                self._update_agent_status("Bear Researcher", "completed")
                self._update_agent_status("Trader", "in_progress")
                asyncio.create_task(self._send_report_update(
                    "research_decision",
                    debate["judge_decision"]
                ))
        
        # 4. 处理交易计划
        if chunk.get("trader_investment_plan"):
            asyncio.create_task(self._send_report_update(
                "trading_plan",
                chunk["trader_investment_plan"]
            ))
            self._update_agent_status("Trader", "completed")
            self._update_agent_status("Aggressive Analyst", "in_progress")
        
        # 5. 处理风险辩论状态
        if chunk.get("risk_debate_state"):
            risk = chunk["risk_debate_state"]
            
            for agent, key in [
                ("Aggressive Analyst", "aggressive_history"),
                ("Conservative Analyst", "conservative_history"),
                ("Neutral Analyst", "neutral_history")
            ]:
                if risk.get(key):
                    self._update_agent_status(agent, "in_progress")
                    asyncio.create_task(self._send_report_update(
                        f"risk_{key}",
                        risk[key]
                    ))
            
            if risk.get("judge_decision"):
                self._update_agent_status("Portfolio Manager", "completed")
                for agent in ["Aggressive Analyst", "Conservative Analyst", "Neutral Analyst"]:
                    self._update_agent_status(agent, "completed")
                asyncio.create_task(self._send_report_update(
                    "final_decision",
                    risk["judge_decision"]
                ))
        
        # 6. 推送进度更新
        asyncio.create_task(self._send_progress_update())
    
    def _update_agent_status(self, agent: str, status: str):
        """更新并推送 Agent 状态"""
        if agent in self.agent_status and self.agent_status[agent] == status:
            return
        
        self.agent_status[agent] = status
        asyncio.create_task(self._send_message("agent_status", {
            "agent": agent,
            "status": status,
            "all_agents": self.agent_status.copy()
        }))
    
    def _extract_content(self, message) -> str:
        """从消息中提取文本内容"""
        content = getattr(message, "content", None)
        if not content:
            return ""
        
        if isinstance(content, str):
            return content.strip()
        
        if isinstance(content, list):
            parts = []
            for item in content:
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        parts.append(item.get("text", ""))
                elif isinstance(item, str):
                    parts.append(item)
            return " ".join(parts).strip()
        
        return str(content)
    
    def _classify_message(self, message) -> str:
        """分类消息类型"""
        if isinstance(message, HumanMessage):
            return "User"
        if isinstance(message, ToolMessage):
            return "Data"
        if isinstance(message, AIMessage):
            return "Agent"
        return "System"
    
    async def _send_message(self, msg_type: str, data: dict):
        """发送消息到 WebSocket"""
        try:
            await self.ws_manager.send_message(self.analysis_id, {
                "type": msg_type,
                "data": data
            })
        except Exception as e:
            pass  # 日志记录
    
    async def _send_stats_update(self):
        """发送统计更新"""
        await self._send_message("stats_update", {
            "llm_calls": self.llm_calls,
            "tool_calls": self.tool_calls,
            "tokens_in": self.tokens_in,
            "tokens_out": self.tokens_out
        })
    
    async def _send_report_update(self, section: str, content: str):
        """发送报告更新"""
        await self._send_message("report_update", {
            "section": section,
            "content": content[:2000],
            "is_complete": True
        })
    
    async def _send_progress_update(self):
        """发送进度更新"""
        # 根据当前 Agent 确定阶段
        current = self._current_agent
        phase, _ = self.PHASE_MAPPING.get(current, ("analyst", 0))
        
        completed = sum(1 for s in self.agent_status.values() if s == "completed")
        total = len(self.agent_status)
        
        await self._send_message("progress", {
            "phase": phase,
            "phase_progress": int((completed / max(total, 1)) * 100),
            "overall_progress": int((completed / max(total, 1)) * 100),
            "current_agent": current
        })
    
    def get_final_agent_status(self) -> dict:
        """获取最终 Agent 状态"""
        return self.agent_status.copy()
```

### 5.3 报告内容提取逻辑

参考 `cli/main.py` 的 `save_report_to_disk()` 和 `display_complete_report()` 函数:

```python
def extract_report_content(final_state: dict, selected_analysts: list) -> dict:
    """
    从 final_state 提取报告内容
    对应 cli/main.py L640-727 的逻辑
    """
    content = {}
    
    # Analyst Reports (L646-666)
    analyst_sections = {
        "market_report": ("market", "Market Analyst"),
        "sentiment_report": ("social", "Social Analyst"),
        "news_report": ("news", "News Analyst"),
        "fundamentals_report": ("fundamentals", "Fundamentals Analyst")
    }
    
    analyst_reports = {}
    for section, (key, name) in analyst_sections.items():
        if key in selected_analysts and final_state.get(section):
            analyst_reports[section] = final_state[section]
    
    if analyst_reports:
        content.update(analyst_reports)
    
    # Research Team (L668-687)
    if final_state.get("investment_debate_state"):
        debate = final_state["investment_debate_state"]
        research = {}
        if debate.get("bull_history"):
            research["bull"] = debate["bull_history"]
        if debate.get("bear_history"):
            research["bear"] = debate["bear_history"]
        if debate.get("judge_decision"):
            research["manager"] = debate["judge_decision"]
        if research:
            content["research"] = research
    
    # Trading Team (L689-694)
    if final_state.get("trader_investment_plan"):
        content["trading_plan"] = final_state["trader_investment_plan"]
    
    # Risk Management (L696-722)
    if final_state.get("risk_debate_state"):
        risk = final_state["risk_debate_state"]
        risk_analysis = {}
        if risk.get("aggressive_history"):
            risk_analysis["aggressive"] = risk["aggressive_history"]
        if risk.get("conservative_history"):
            risk_analysis["conservative"] = risk["conservative_history"]
        if risk.get("neutral_history"):
            risk_analysis["neutral"] = risk["neutral_history"]
        if risk_analysis:
            content["risk_analysis"] = risk_analysis
        # Portfolio Manager Decision
        if risk.get("judge_decision"):
            content["final_decision"] = risk["judge_decision"]
    
    return content
```

---

## 6. 数据库设计

### 6.1 完整数据库 Schema (SQLite/Migration)

```sql
-- analyses 表
CREATE TABLE analyses (
    id VARCHAR(36) PRIMARY KEY,
    ticker VARCHAR(20) NOT NULL,
    analysis_date VARCHAR(10) NOT NULL,
    config JSON NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    agent_status JSON,
    
    llm_calls INTEGER DEFAULT 0,
    tool_calls INTEGER DEFAULT 0,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    elapsed_seconds FLOAT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    report_id VARCHAR(36),
    
    INDEX idx_ticker (ticker),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- reports 表
CREATE TABLE reports (
    id VARCHAR(36) PRIMARY KEY,
    analysis_id VARCHAR(36) NOT NULL,
    decision VARCHAR(50),
    signal VARCHAR(20),
    confidence INTEGER,
    content JSON NOT NULL,
    full_report TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (analysis_id) REFERENCES analyses(id),
    INDEX idx_analysis_id (analysis_id),
    INDEX idx_decision (decision)
);

-- settings 表
CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    UNIQUE(category, key),
    INDEX idx_category (category)
);
```

### 6.2 SQLAlchemy 模型定义

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """数据库会话依赖"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 7. 错误处理

### 7.1 LLM API 错误重试策略

```python
# app/tasks/retry_handlers.py
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
import openai
import anthropic

# LLM API 错误重试配置
LLM_RETRY_CONFIG = {
    "max_attempts": 3,
    "initial_wait": 2,  # 秒
    "max_wait": 30,     # 秒
    "multiplier": 2
}

def create_llm_retry_decorator():
    """创建 LLM 重试装饰器"""
    return retry(
        stop=stop_after_attempt(LLM_RETRY_CONFIG["max_attempts"]),
        wait=wait_exponential(
            multiplier=LLM_RETRY_CONFIG["multiplier"],
            min=LLM_RETRY_CONFIG["initial_wait"],
            max=LLM_RETRY_CONFIG["max_wait"]
        ),
        retry=retry_if_exception_type((
            openai.RateLimitError,
            openai.APIError,
            openai.Timeout,
            anthropic.RateLimitError,
            anthropic.APIError,
            ConnectionError,
            TimeoutError
        )),
        reraise=True
    )

# 使用示例
@create_llm_retry_decorator()
async def call_llm_with_retry(prompt: str, config: dict):
    """带重试的 LLM 调用"""
    client = create_llm_client(config)
    return await client.generate(prompt)
```

### 7.2 超时处理

```python
# app/tasks/celery_app.py (配置部分)
celery_app.conf.update(
    task_time_limit=3600,        # 硬超时 1 小时
    task_soft_time_limit=3300,   # 软超时 55 分钟
    
    # Worker 配置
    worker_task_time_limit=3600,
    worker_soft_time_limit=3300,
)

# 任务内超时处理
async def run_analysis_with_timeout(analysis_id: str, timeout: int = 3600):
    """带超时的分析执行"""
    import asyncio
    
    try:
        result = await asyncio.wait_for(
            execute_analysis(analysis_id),
            timeout=timeout
        )
        return result
    except asyncio.TimeoutError:
        # 超时处理
        await update_analysis_status(analysis_id, "failed")
        await notify_timeout(analysis_id)
        raise TimeoutError(f"Analysis {analysis_id} exceeded timeout of {timeout}s")
```

### 7.3 任务失败恢复

```python
# app/tasks/recovery.py
from celery.exceptions import SoftTimeLimitExceeded, TimeLimitExceeded

class AnalysisRecovery:
    """任务失败恢复处理器"""
    
    @staticmethod
    async def handle_failure(analysis_id: str, error: Exception):
        """处理任务失败"""
        db = next(get_db())
        try:
            from app.models.analysis import Analysis, AnalysisStatus
            
            analysis = db.query(Analysis).filter(
                Analysis.id == analysis_id
            ).first()
            
            if analysis:
                # 确定错误类型
                if isinstance(error, (SoftTimeLimitExceeded, TimeLimitExceeded)):
                    error_type = "TIMEOUT"
                    message = "Analysis exceeded time limit"
                elif isinstance(error, (openai.RateLimitError, anthropic.RateLimitError)):
                    error_type = "RATE_LIMIT"
                    message = "API rate limit exceeded"
                else:
                    error_type = "EXECUTION_ERROR"
                    message = str(error)
                
                # 更新状态
                analysis.status = AnalysisStatus.FAILED
                analysis.error_message = f"[{error_type}] {message}"
                
                # 检查是否可重试
                if error_type in ["RATE_LIMIT"]:
                    # 可恢复错误 - 可以入队重试
                    await schedule_retry(analysis_id)
                else:
                    # 不可恢复错误 - 记录但不重试
                    pass
                
                db.commit()
        
        finally:
            db.close()
    
    @staticmethod
    async def schedule_retry(analysis_id: str, countdown: int = 60):
        """安排重试"""
        from app.tasks.analysis_tasks import run_analysis_task
        
        run_analysis_task.apply_async(
            args=[analysis_id],
            countdown=countdown,
            retry=False  # 避免指数退避冲突
        )
    
    @staticmethod
    async def cleanup_failed_task(analysis_id: str):
        """清理失败任务的相关资源"""
        # 清理 Redis 缓存
        await redis_client.delete(f"analysis:{analysis_id}:*")
        
        # 清理临时文件
        # ...
```

---

## 8. 性能考虑

### 8.1 并发分析任务限制

```python
# app/config.py
class Settings:
    # 最大并发分析任务数 (根据服务器资源调整)
    MAX_CONCURRENT_ANALYSES = 3
    
    # 每个用户最大并发任务数
    MAX_CONCURRENT_PER_USER = 1
    
    # 任务队列配置
    CELERY_TASK_ROUTES = {
        "analysis.run_analysis": {
            "queue": "analysis",
            "priority": 5
        }
    }
    
    # Worker 资源配置
    CELERY_WORKER_CONCURRENCY = 2  # 每个 Worker 的并发数
    CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # 防止任务堆积

# Celery 资源限制
celery_app.conf.update(
    worker_concurrency=settings.CELERY_WORKER_CONCURRENCY,
    worker_prefetch_multiplier=settings.CELERY_WORKER_PREFETCH_MULTIPLIER,
    task_acks_late=True,
    task_reject_on_worker_lost=True
)
```

### 8.2 资源隔离

```python
# app/tasks/resource_isolation.py
import resource
import os

def set_task_resource_limits():
    """为 Celery Worker 设置资源限制"""
    # 内存限制 (2GB)
    try:
        resource.setrlimit(
            resource.RLIMIT_AS,
            (2 * 1024 * 1024 * 1024, resource.RLIM_INFINITY)
        )
    except ValueError:
        pass
    
    # CPU 时间限制 (可以设置但 Celery 会处理)
    # resource.setrlimit(resource.RLIMIT_CPU, (3600, 3600))
    
    # 文件描述符限制
    try:
        resource.setrlimit(
            resource.RLIMIT_NOFILE,
            (1024, 2048)
        )
    except ValueError:
        pass

# 在 Worker 启动时应用
# celery worker --on-startup=set_task_resource_limits
```

### 8.3 缓存策略

```python
# app/services/cache_service.py
import json
import hashlib
from functools import wraps
from typing import Optional, Any, Callable
import redis.asyncio as redis
from app.config import settings

class CacheService:
    """缓存服务"""
    
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL)
    
    async def get(self, key: str) -> Optional[Any]:
        """获取缓存"""
        data = await self.redis.get(key)
        if data:
            return json.loads(data)
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600):
        """设置缓存"""
        await self.redis.setex(key, ttl, json.dumps(value))
    
    async def delete(self, key: str):
        """删除缓存"""
        await self.redis.delete(key)
    
    @staticmethod
    def make_key(prefix: str, *args) -> str:
        """生成缓存 key"""
        parts = [prefix]
        for arg in args:
            if isinstance(arg, dict):
                arg = json.dumps(arg, sort_keys=True)
            parts.append(str(arg))
        return ":".join(parts)


# 缓存装饰器
def cached(prefix: str, ttl: int = 300):
    """缓存装饰器"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = CacheService()
            key = CacheService.make_key(prefix, args, kwargs)
            
            # 尝试获取缓存
            result = await cache.get(key)
            if result is not None:
                return result
            
            # 执行函数
            result = await func(*args, **kwargs)
            
            # 设置缓存
            await cache.set(key, result, ttl)
            return result
        return wrapper
    return decorator
```

### 8.4 缓存使用策略

| 缓存项 | TTL | 说明 |
|-------|-----|------|
| 用户设置 | 1小时 | 低频更新 |
| 股票信息 | 5分钟 | 基础数据缓存 |
| 分析结果摘要 | 永久 | 完成后缓存 |
| WebSocket 状态 | 实时 | 不缓存 |
| LLM API 响应 | 禁止 | 不缓存（数据敏感） |

### 8.5 数据库连接池配置

```python
# app/database.py
from sqlalchemy.pool import QueuePool, NullPool

# 生产环境使用连接池
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,           # 基础连接数
    max_overflow=20,        # 最大溢出
    pool_timeout=30,        # 获取连接超时
    pool_recycle=1800,      # 连接回收时间
    pool_pre_ping=True      # 连接前检测
)
```

---

## 9. FastAPI 完整入口文件

```python
# app/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, Base
from app.api import analysis, reports, settings as settings_api, websocket
from app.services.websocket_manager import ws_manager

# 日志配置
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    logger.info("Starting TradingAgents Web API...")
    
    # 创建数据库表
    Base.metadata.create_all(bind=engine)
    
    # 初始化 WebSocket Manager 的 Redis 连接
    await ws_manager._ensure_redis_client()
    
    yield
    
    # 关闭时
    logger.info("Shutting down TradingAgents Web API...")
    await ws_manager.redis_client.close()


# 创建 FastAPI 应用
app = FastAPI(
    title="TradingAgents Web API",
    description="Multi-Agent LLM Trading Analysis Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(settings_api.router, prefix="/api/settings", tags=["Settings"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])


@app.get("/")
async def root():
    """API 根路径"""
    return {
        "name": "TradingAgents Web API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
```

---

## 10. 环境配置

### 10.1 环境变量

```bash
# .env

# 数据库
DATABASE_URL=sqlite:///./tradingagents.db
# PostgreSQL (生产环境)
# DATABASE_URL=postgresql://user:password@localhost:5432/tradingagents

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# LLM API Keys (建议使用环境变量)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# 可选: 代理设置
# HTTP_PROXY=http://proxy:8080
# HTTPS_PROXY=http://proxy:8080
```

### 10.2 配置文件

```python
# app/config.py
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """应用配置"""
    
    # 数据库
    DATABASE_URL: str = "sqlite:///./tradingagents.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # 并发限制
    MAX_CONCURRENT_ANALYSES: int = 3
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
```

---

## 11. 依赖包

```txt
# requirements.txt

# Web Framework
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-multipart>=0.0.6

# Database
sqlalchemy>=2.0.0
aiosqlite>=0.19.0
alembic>=1.13.0

# Async
redis>=5.0.0

# Task Queue
celery>=5.3.0

# LLM Clients
openai>=1.0.0
anthropic>=0.18.0

# TradingAgents Core (复用现有代码)
# tradingagents @ git+https://github.com/TauricResearch/TradingAgents.git

# Utilities
pydantic>=2.0.0
pydantic-settings>=2.0.0
python-dotenv>=1.0.0
tenacity>=8.0.0

# PDF Generation
reportlab>=4.0.0
markdown>=3.5.0
```

---

## 12. 部署架构 (Docker)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/tradingagents
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      - redis
      - db
    volumes:
      - ./reports:/app/reports

  worker:
    build: .
    command: celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/tradingagents
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      - redis
      - db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=tradingagents
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 13. 开发指南

### 13.1 本地开发启动

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动 Redis
docker run -d -p 6379:6379 redis:7-alpine

# 3. 启动 API 服务
uvicorn app.main:app --reload --port 8000

# 4. 启动 Celery Worker (新终端)
celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2

# 5. 访问 API 文档
# http://localhost:8000/docs
```

### 13.2 测试 API

```bash
# 创建分析任务
curl -X POST http://localhost:8000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "analysis_date": "2026-04-24",
    "config": {
      "analysts": ["market", "news"],
      "research_depth": 1,
      "llm_provider": "openai",
      "deep_think_llm": "gpt-4",
      "quick_think_llm": "gpt-4o-mini",
      "output_language": "Chinese"
    }
  }'

# 获取分析状态
curl http://localhost:8000/api/analysis/{id}

# WebSocket 测试
# 使用浏览器或 websocat 连接
wscat -c ws://localhost:8000/ws/analysis/{id}
```

---

## 14. 关键实现细节总结

### 14.1 与 CLI 代码的集成点

| CLI 文件 | 行号 | 集成到 Web 的方式 |
|---------|------|------------------|
| `cli/main.py` | 930-1154 | `run_analysis_task()` 任务函数 |
| `cli/main.py` | 640-727 | `create_report_from_state()` 报告提取 |
| `cli/stats_handler.py` | 全文 | 扩展为 `WebSocketCallbackHandler` |
| `cli/models.py` | - | Pydantic Schemas |
| `tradingagents/graph/trading_graph.py` | 全文 | 直接复用 `TradingAgentsGraph` |
| `tradingagents/graph/propagation.py` | 56-68 | `get_graph_args()` + `stream()` |

### 14.2 核心流程

1. **创建分析**: POST `/api/analysis` -> 创建 DB 记录 -> 入队 Celery 任务
2. **执行分析**: Worker 消费任务 -> 初始化 Graph -> `graph.stream()` + Callback
3. **实时推送**: Callback 处理每个 chunk -> Redis Pub/Sub -> WebSocket -> 前端
4. **存储结果**: 分析完成 -> 提取报告 -> 创建 Report 记录 -> 更新 Analysis 状态

### 14.3 关键注意事项

1. **LangGraph stream() vs invoke()**: 必须使用 `stream()` 以支持流式输出
2. **Callback 线程安全**: 使用 `asyncio.create_task()` 确保异步推送
3. **Redis 连接管理**: WebSocket Manager 需要维护 Redis 连接用于 Pub/Sub
4. **任务超时**: 配置 Celery 的 `task_time_limit` 防止长时间运行
5. **错误恢复**: 区分可恢复错误（Rate Limit）和不可恢复错误
6. **资源限制**: 限制并发任务数防止服务器过载

---

## 15. 后续 Phase 考虑

### Phase 2 潜在功能
- 用户认证与授权
- 多用户/多团队支持
- 分析历史对比
- 自定义分析师配置
- 实时市场数据订阅
- 交易信号自动执行

### Phase 3 潜在功能
- 分布式 Worker 集群
- 分析任务调度
- Webhook 通知
- API 速率限制
- 使用量计费
- 多语言界面

---

*文档版本: 1.0*
*最后更新: 2026-04-24*
*作者: TradingAgents Web Team*