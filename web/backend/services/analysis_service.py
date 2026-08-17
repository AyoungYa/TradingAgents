"""
分析业务逻辑服务
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from models import Analysis, AnalysisStatus, Report


def create_analysis(
    db: Session,
    ticker: str,
    date: str,
    analysts: List[str],
    depth: int,
    llm_provider: str,
    quick_model: Optional[str],
    deep_model: Optional[str],
    language: str,
) -> Analysis:
    """创建分析任务记录

    Args:
        db: 数据库会话
        ticker: 股票代码
        date: 分析日期
        analysts: 分析师列表
        depth: 研究深度
        llm_provider: LLM 提供商
        quick_model: 快速模型
        deep_model: 深度模型
        language: 输出语言

    Returns:
        创建的 Analysis 对象
    """
    analysis = Analysis(
        id=str(uuid.uuid4()),
        ticker=ticker.upper(),
        analysis_date=date,
        config={
            "analysts": analysts,
            "depth": depth,
            "llm_provider": llm_provider,
            "quick_model": quick_model,
            "deep_model": deep_model,
            "language": language,
        },
        status=AnalysisStatus.PENDING,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def get_analysis(db: Session, analysis_id: str) -> Optional[Analysis]:
    """获取分析任务"""
    return db.query(Analysis).filter(Analysis.id == analysis_id).first()


def get_analysis_status(db: Session, analysis_id: str) -> Optional[Dict[str, Any]]:
    """获取分析任务状态详情"""
    analysis = get_analysis(db, analysis_id)
    if not analysis:
        return None

    # 计算进度
    agent_status = analysis.agent_status or {}
    agents_completed = sum(1 for s in agent_status.values() if s == "completed")
    agents_total = len(agent_status)

    return {
        "id": analysis.id,
        "ticker": analysis.ticker,
        "date": analysis.analysis_date,
        "status": analysis.status,
        "config": analysis.config,
        "agent_status": agent_status,
        "progress": {
            "agents_completed": agents_completed,
            "agents_total": agents_total,
            "llm_calls": analysis.llm_calls or 0,
            "tool_calls": analysis.tool_calls or 0,
            "tokens_in": analysis.tokens_in or 0,
            "tokens_out": analysis.tokens_out or 0,
            "elapsed_seconds": analysis.elapsed_seconds,
        },
        "created_at": analysis.created_at,
        "started_at": analysis.started_at,
        "completed_at": analysis.completed_at,
        "error_message": analysis.error_message,
    }


def get_analysis_result(db: Session, analysis_id: str) -> Optional[Dict[str, Any]]:
    """获取分析结果（仅已完成的分析）"""
    analysis = get_analysis(db, analysis_id)
    if not analysis:
        return None

    if analysis.status != AnalysisStatus.COMPLETED:
        return {
            "error": f"分析尚未完成，当前状态: {analysis.status}",
            "status": analysis.status,
        }

    # 获取关联报告
    report = None
    if analysis.report_id:
        report = db.query(Report).filter(Report.id == analysis.report_id).first()

    return {
        "id": analysis.id,
        "ticker": analysis.ticker,
        "date": analysis.analysis_date,
        "status": analysis.status,
        "decision": report.decision if report else None,
        "signal": report.signal if report else None,
        "confidence": report.confidence if report else None,
        "elapsed_seconds": analysis.elapsed_seconds,
        "report_id": analysis.report_id,
        "created_at": analysis.created_at,
        "completed_at": analysis.completed_at,
    }


def cancel_analysis(db: Session, analysis_id: str) -> Optional[Analysis]:
    """取消分析任务"""
    analysis = get_analysis(db, analysis_id)
    if not analysis:
        return None

    if analysis.status in (AnalysisStatus.COMPLETED, AnalysisStatus.CANCELLED):
        return None

    analysis.status = AnalysisStatus.CANCELLED
    analysis.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(analysis)
    return analysis


def list_analyses(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    ticker: Optional[str] = None,
) -> Dict[str, Any]:
    """获取分析任务列表（分页）"""
    query = db.query(Analysis)

    # 筛选
    if status:
        query = query.filter(Analysis.status == status)
    if ticker:
        query = query.filter(Analysis.ticker == ticker.upper())

    # 总数
    total = query.count()

    # 分页
    offset = (page - 1) * page_size
    items = query.order_by(Analysis.created_at.desc()).offset(offset).limit(page_size).all()

    pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }
