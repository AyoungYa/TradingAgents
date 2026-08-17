"""
报告业务逻辑服务
"""
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from models import Analysis, Report


def get_report(db: Session, report_id: str) -> Optional[Report]:
    """获取报告详情"""
    return db.query(Report).filter(Report.id == report_id).first()


def get_report_detail(db: Session, report_id: str) -> Optional[Dict[str, Any]]:
    """获取报告详情（包含关联的分析信息）"""
    report = get_report(db, report_id)
    if not report:
        return None

    # 获取关联的分析记录
    analysis = db.query(Analysis).filter(Analysis.id == report.analysis_id).first()

    return {
        "id": report.id,
        "analysis_id": report.analysis_id,
        "ticker": analysis.ticker if analysis else None,
        "analysis_date": analysis.analysis_date if analysis else None,
        "decision": report.decision,
        "signal": report.signal,
        "confidence": report.confidence,
        "content": report.content,
        "full_report": report.full_report,
        "created_at": report.created_at,
    }


def list_reports(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    ticker: Optional[str] = None,
    decision: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> Dict[str, Any]:
    """获取报告列表（分页、筛选）"""
    # 通过关联 Analysis 表进行筛选
    query = db.query(Report).join(Analysis, Report.analysis_id == Analysis.id)

    if ticker:
        query = query.filter(Analysis.ticker == ticker.upper())
    if decision:
        query = query.filter(Report.decision == decision.upper())
    if date_from:
        query = query.filter(Analysis.analysis_date >= date_from)
    if date_to:
        query = query.filter(Analysis.analysis_date <= date_to)

    # 总数
    total = query.count()

    # 分页
    offset = (page - 1) * page_size
    items = query.order_by(Report.created_at.desc()).offset(offset).limit(page_size).all()

    # 构建响应列表（包含 ticker 和 analysis_date）
    result_items = []
    for report in items:
        analysis = db.query(Analysis).filter(Analysis.id == report.analysis_id).first()
        result_items.append({
            "id": report.id,
            "analysis_id": report.analysis_id,
            "ticker": analysis.ticker if analysis else None,
            "analysis_date": analysis.analysis_date if analysis else None,
            "decision": report.decision,
            "confidence": report.confidence,
            "created_at": report.created_at,
        })

    pages = (total + page_size - 1) // page_size if total > 0 else 0

    return {
        "items": result_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


def export_report_markdown(db: Session, report_id: str) -> Optional[str]:
    """导出报告为 Markdown 格式"""
    report = get_report(db, report_id)
    if not report:
        return None

    return report.full_report or ""
