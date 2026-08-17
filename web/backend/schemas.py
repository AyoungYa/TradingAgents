"""
Pydantic 请求/响应模型
定义 API 的输入输出数据结构
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ============================================================
# 分析任务相关 Schema
# ============================================================

class AnalysisCreate(BaseModel):
    """创建分析任务请求"""
    ticker: str = Field(..., description="股票代码，如 AAPL, SPY, 601899.SH")
    date: str = Field(..., description="分析日期，格式 YYYY-MM-DD")
    analysts: List[str] = Field(
        default=["market", "social", "news", "fundamentals"],
        description="分析师列表: market, social, news, fundamentals"
    )
    depth: str = Field(default="medium", description="研究深度: shallow, medium, deep")
    provider: str = Field(default="openai", description="LLM 提供商")
    quick_model: Optional[str] = Field(default=None, description="快速思考模型")
    deep_model: Optional[str] = Field(default=None, description="深度思考模型")
    language: str = Field(default="English", description="输出语言")


class AnalysisResponse(BaseModel):
    """分析任务基本响应"""
    id: str
    ticker: str
    date: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AnalysisDetailResponse(BaseModel):
    """分析任务详情响应"""
    id: str
    ticker: str
    date: str
    status: str
    config: Optional[Dict[str, Any]] = None
    agent_status: Optional[Dict[str, str]] = None
    progress: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class AnalysisResultResponse(BaseModel):
    """分析结果响应"""
    id: str
    ticker: str
    date: str
    status: str
    decision: Optional[str] = None
    signal: Optional[str] = None
    confidence: Optional[int] = None
    elapsed_seconds: Optional[float] = None
    report_id: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AnalysisListResponse(BaseModel):
    """分析列表响应（分页）"""
    items: List[AnalysisResponse]
    total: int
    page: int
    page_size: int
    pages: int


class AnalysisCancelResponse(BaseModel):
    """取消分析响应"""
    id: str
    status: str
    message: str


# ============================================================
# 报告相关 Schema
# ============================================================

class ReportResponse(BaseModel):
    """报告详情响应"""
    id: str
    analysis_id: str
    decision: Optional[str] = None
    signal: Optional[str] = None
    confidence: Optional[int] = None
    content: Optional[Dict[str, Any]] = None
    full_report: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportListItem(BaseModel):
    """报告列表项"""
    id: str
    analysis_id: str
    ticker: Optional[str] = None
    analysis_date: Optional[str] = None
    decision: Optional[str] = None
    confidence: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    """报告列表响应（分页）"""
    items: List[ReportListItem]
    total: int
    page: int
    page_size: int
    pages: int


# ============================================================
# 设置相关 Schema
# ============================================================

class LLMSettings(BaseModel):
    """LLM 配置"""
    provider: str = "openai"
    deep_think_model: str = "gpt-5.4"
    quick_think_model: str = "gpt-5.4-mini"
    backend_url: str = "https://api.openai.com/v1"
    api_key_set: bool = False


class DataSourceSettings(BaseModel):
    """数据源配置"""
    core_stock_apis: str = "yfinance"
    technical_indicators: str = "yfinance"
    fundamental_data: str = "yfinance"
    news_data: str = "yfinance"


class NotificationSettings(BaseModel):
    """通知设置"""
    enabled: bool = True
    on_complete: bool = True
    on_error: bool = True


class PreferenceSettings(BaseModel):
    """用户偏好设置"""
    output_language: str = "English"
    default_research_depth: int = 1
    auto_save_reports: bool = True


class SettingsResponse(BaseModel):
    """所有设置响应"""
    llm: LLMSettings
    data_source: DataSourceSettings
    notifications: NotificationSettings
    preferences: PreferenceSettings


class LLMSettingsUpdate(BaseModel):
    """LLM 配置更新"""
    provider: Optional[str] = None
    deep_think_model: Optional[str] = None
    quick_think_model: Optional[str] = None
    backend_url: Optional[str] = None
    api_key: Optional[str] = None


class DataSourceSettingsUpdate(BaseModel):
    """数据源配置更新"""
    core_stock_apis: Optional[str] = None
    technical_indicators: Optional[str] = None
    fundamental_data: Optional[str] = None
    news_data: Optional[str] = None


class NotificationSettingsUpdate(BaseModel):
    """通知设置更新"""
    enabled: Optional[bool] = None
    on_complete: Optional[bool] = None
    on_error: Optional[bool] = None


class PreferenceSettingsUpdate(BaseModel):
    """用户偏好更新"""
    output_language: Optional[str] = None
    default_research_depth: Optional[int] = None
    auto_save_reports: Optional[bool] = None


class SettingsUpdateResponse(BaseModel):
    """设置更新响应"""
    message: str
    settings: Optional[Dict[str, Any]] = None


# ============================================================
# WebSocket 消息 Schema
# ============================================================

class WebSocketMessage(BaseModel):
    """WebSocket 消息格式"""
    type: str
    timestamp: str
    analysis_id: str
    data: Optional[Dict[str, Any]] = None
