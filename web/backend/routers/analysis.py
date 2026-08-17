"""
分析任务路由
处理分析任务的创建、查询、取消等操作
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    AnalysisCreate,
    AnalysisResponse,
    AnalysisDetailResponse,
    AnalysisResultResponse,
    AnalysisListResponse,
    AnalysisCancelResponse,
)
from services import analysis_service
# 延迟导入 tasks 模块，避免在 FastAPI 启动时加载 tradingagents 依赖
# from tasks.analysis_task import start_analysis_task, cancel_analysis_task

router = APIRouter(prefix="/api/analysis", tags=["分析任务"])


@router.post("", response_model=AnalysisResponse, status_code=201)
def create_analysis(
    request: AnalysisCreate,
    db: Session = Depends(get_db),
):
    """创建分析任务

    接收分析配置，创建 Analysis 记录，启动后台线程执行分析。
    """
    # 创建分析记录
    analysis = analysis_service.create_analysis(
        db=db,
        ticker=request.ticker,
        date=request.date,
        analysts=request.analysts,
        depth=request.depth,
        llm_provider=request.provider,
        quick_model=request.quick_model,
        deep_model=request.deep_model,
        language=request.language,
    )

    # 启动后台分析任务
    from main import ws_manager
    from tasks.analysis_task import start_analysis_task
    start_analysis_task(analysis.id, analysis.config, ws_manager)

    return AnalysisResponse(
        id=analysis.id,
        ticker=analysis.ticker,
        date=analysis.analysis_date,
        status=analysis.status,
        created_at=analysis.created_at,
    )


@router.get("", response_model=AnalysisListResponse)
def list_analyses(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="筛选状态"),
    ticker: Optional[str] = Query(None, description="筛选股票代码"),
    db: Session = Depends(get_db),
):
    """获取分析任务列表（分页）"""
    result = analysis_service.list_analyses(
        db=db,
        page=page,
        page_size=page_size,
        status=status,
        ticker=ticker,
    )

    return AnalysisListResponse(
        items=[
            AnalysisResponse(
                id=item.id,
                ticker=item.ticker,
                date=item.analysis_date,
                status=item.status,
                created_at=item.created_at,
            )
            for item in result["items"]
        ],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        pages=result["pages"],
    )


@router.get("/{analysis_id}", response_model=AnalysisDetailResponse)
def get_analysis_detail(
    analysis_id: str,
    db: Session = Depends(get_db),
):
    """获取分析任务状态详情"""
    detail = analysis_service.get_analysis_status(db, analysis_id)
    if not detail:
        raise HTTPException(status_code=404, detail="分析任务不存在")

    return AnalysisDetailResponse(**detail)


@router.get("/{analysis_id}/result")
def get_analysis_result(
    analysis_id: str,
    db: Session = Depends(get_db),
):
    """获取分析结果（仅已完成的分析）"""
    result = analysis_service.get_analysis_result(db, analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="分析任务不存在")

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return AnalysisResultResponse(**result)


@router.delete("/{analysis_id}", response_model=AnalysisCancelResponse)
def cancel_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
):
    """取消分析任务"""
    analysis = analysis_service.cancel_analysis(db, analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=400,
            detail="无法取消：任务不存在或已完成"
        )

    # 尝试取消后台线程
    from tasks.analysis_task import cancel_analysis_task
    cancel_analysis_task(analysis_id)

    return AnalysisCancelResponse(
        id=analysis.id,
        status=analysis.status,
        message="分析任务已取消",
    )
