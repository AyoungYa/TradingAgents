"""
报告路由
处理报告的查询、导出等操作
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from database import get_db
from schemas import ReportResponse, ReportListResponse
from services import report_service

router = APIRouter(prefix="/api/reports", tags=["报告"])


@router.get("", response_model=ReportListResponse)
def list_reports(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    ticker: Optional[str] = Query(None, description="筛选股票代码"),
    decision: Optional[str] = Query(None, description="筛选决策 (BUY/HOLD/SELL)"),
    date_from: Optional[str] = Query(None, description="开始日期 (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="结束日期 (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    """获取报告列表（分页、筛选）"""
    result = report_service.list_reports(
        db=db,
        page=page,
        page_size=page_size,
        ticker=ticker,
        decision=decision,
        date_from=date_from,
        date_to=date_to,
    )

    return ReportListResponse(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        pages=result["pages"],
    )


@router.get("/{report_id}", response_model=ReportResponse)
def get_report_detail(
    report_id: str,
    db: Session = Depends(get_db),
):
    """获取报告详情"""
    detail = report_service.get_report_detail(db, report_id)
    if not detail:
        raise HTTPException(status_code=404, detail="报告不存在")

    return ReportResponse(**detail)


@router.get("/{report_id}/export")
def export_report(
    report_id: str,
    format: str = Query("md", description="导出格式 (md/json)"),
    db: Session = Depends(get_db),
):
    """导出报告

    支持 Markdown 和 JSON 两种格式。
    """
    if format == "json":
        detail = report_service.get_report_detail(db, report_id)
        if not detail:
            raise HTTPException(status_code=404, detail="报告不存在")
        return detail

    # 默认 Markdown 格式
    markdown = report_service.export_report_markdown(db, report_id)
    if markdown is None:
        raise HTTPException(status_code=404, detail="报告不存在")

    return PlainTextResponse(
        content=markdown,
        media_type="text/markdown; charset=utf-8",
    )
