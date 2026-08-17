"""
SQLAlchemy 数据库模型
定义 Analysis、Report、Setting 三张表
"""
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, DateTime, Integer, Float, JSON, Text, UniqueConstraint
)
from sqlalchemy.sql import func
from database import Base


class AnalysisStatus(str, enum.Enum):
    """分析任务状态枚举"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Analysis(Base):
    """分析任务表"""
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    ticker = Column(String(20), nullable=False, index=True)
    analysis_date = Column(String(10), nullable=False)  # YYYY-MM-DD

    # 配置 (JSON)
    config = Column(JSON, nullable=False)

    # 任务状态
    status = Column(String(20), default=AnalysisStatus.PENDING, index=True)

    # Agent 状态 (JSON) - 实时更新
    agent_status = Column(JSON, nullable=True)

    # 进度统计
    llm_calls = Column(Integer, default=0)
    tool_calls = Column(Integer, default=0)
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)

    # 耗时（秒）
    elapsed_seconds = Column(Float, nullable=True)

    # 时间戳
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # 错误信息
    error_message = Column(Text, nullable=True)

    # 关联报告 ID
    report_id = Column(String(36), nullable=True, index=True)


class Report(Base):
    """报告表"""
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    analysis_id = Column(String(36), nullable=False, index=True)

    # 交易信号
    decision = Column(String(50), nullable=True)  # BUY / HOLD / SELL
    signal = Column(String(20), nullable=True)    # 信号类型
    confidence = Column(Integer, nullable=True)    # 置信度 0-100

    # 报告内容 (JSON) - 5 大板块
    content = Column(JSON, nullable=False)

    # 完整报告 (Markdown)
    full_report = Column(Text, nullable=True)

    # 时间戳
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class Setting(Base):
    """系统设置表"""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(50), nullable=False, index=True)  # llm / data_source / notification / preferences
    key = Column(String(100), nullable=False)
    value = Column(Text, nullable=True)

    # 复合唯一索引
    __table_args__ = (
        UniqueConstraint("category", "key", name="uq_category_key"),
    )
