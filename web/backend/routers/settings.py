"""
设置路由
处理系统设置的获取和更新
"""
import os
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Setting
from schemas import (
    SettingsResponse,
    LLMSettings,
    LLMSettingsUpdate,
    DataSourceSettings,
    DataSourceSettingsUpdate,
    NotificationSettings,
    NotificationSettingsUpdate,
    PreferenceSettings,
    PreferenceSettingsUpdate,
    SettingsUpdateResponse,
)
import config as app_config

router = APIRouter(prefix="/api/settings", tags=["设置"])


def _get_setting(db: Session, category: str, key: str, default: str = "") -> str:
    """获取单个设置值"""
    setting = db.query(Setting).filter(
        Setting.category == category,
        Setting.key == key,
    ).first()
    return setting.value if setting else default


def _set_setting(db: Session, category: str, key: str, value: str):
    """设置单个值"""
    setting = db.query(Setting).filter(
        Setting.category == category,
        Setting.key == key,
    ).first()
    if setting:
        setting.value = value
    else:
        setting = Setting(category=category, key=key, value=value)
        db.add(setting)
    db.commit()


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """获取所有设置"""
    # LLM 设置
    llm_settings = LLMSettings(
        provider=_get_setting(db, "llm", "provider", app_config.DEFAULT_LLM_PROVIDER),
        deep_think_model=_get_setting(db, "llm", "deep_think_model", app_config.DEFAULT_DEEP_MODEL),
        quick_think_model=_get_setting(db, "llm", "quick_think_model", app_config.DEFAULT_QUICK_MODEL),
        backend_url=_get_setting(db, "llm", "backend_url", app_config.DEFAULT_BACKEND_URL),
        api_key_set=bool(os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY") or os.getenv("GOOGLE_API_KEY")),
    )

    # 数据源设置
    data_source_settings = DataSourceSettings(
        core_stock_apis=_get_setting(db, "data_source", "core_stock_apis", "yfinance"),
        technical_indicators=_get_setting(db, "data_source", "technical_indicators", "yfinance"),
        fundamental_data=_get_setting(db, "data_source", "fundamental_data", "yfinance"),
        news_data=_get_setting(db, "data_source", "news_data", "yfinance"),
    )

    # 通知设置
    notification_settings = NotificationSettings(
        enabled=_get_setting(db, "notification", "enabled", "true").lower() == "true",
        on_complete=_get_setting(db, "notification", "on_complete", "true").lower() == "true",
        on_error=_get_setting(db, "notification", "on_error", "true").lower() == "true",
    )

    # 用户偏好
    preference_settings = PreferenceSettings(
        output_language=_get_setting(db, "preferences", "output_language", app_config.DEFAULT_LANGUAGE),
        default_research_depth=int(_get_setting(db, "preferences", "default_research_depth", str(app_config.DEFAULT_RESEARCH_DEPTH))),
        auto_save_reports=_get_setting(db, "preferences", "auto_save_reports", "true").lower() == "true",
    )

    return SettingsResponse(
        llm=llm_settings,
        data_source=data_source_settings,
        notifications=notification_settings,
        preferences=preference_settings,
    )


@router.put("/llm", response_model=SettingsUpdateResponse)
def update_llm_settings(
    request: LLMSettingsUpdate,
    db: Session = Depends(get_db),
):
    """更新 LLM 配置"""
    if request.provider is not None:
        _set_setting(db, "llm", "provider", request.provider)
    if request.deep_think_model is not None:
        _set_setting(db, "llm", "deep_think_model", request.deep_think_model)
    if request.quick_think_model is not None:
        _set_setting(db, "llm", "quick_think_model", request.quick_think_model)
    if request.backend_url is not None:
        _set_setting(db, "llm", "backend_url", request.backend_url)
    if request.api_key is not None:
        # API Key 存储到环境变量（仅当前进程生效）
        os.environ["OPENAI_API_KEY"] = request.api_key

    return SettingsUpdateResponse(
        message="LLM 设置更新成功",
        settings={
            "provider": request.provider,
            "deep_think_model": request.deep_think_model,
            "quick_think_model": request.quick_think_model,
        },
    )


@router.put("/data-sources", response_model=SettingsUpdateResponse)
def update_data_source_settings(
    request: DataSourceSettingsUpdate,
    db: Session = Depends(get_db),
):
    """更新数据源配置"""
    if request.core_stock_apis is not None:
        _set_setting(db, "data_source", "core_stock_apis", request.core_stock_apis)
    if request.technical_indicators is not None:
        _set_setting(db, "data_source", "technical_indicators", request.technical_indicators)
    if request.fundamental_data is not None:
        _set_setting(db, "data_source", "fundamental_data", request.fundamental_data)
    if request.news_data is not None:
        _set_setting(db, "data_source", "news_data", request.news_data)

    return SettingsUpdateResponse(
        message="数据源设置更新成功",
    )


@router.put("/notifications", response_model=SettingsUpdateResponse)
def update_notification_settings(
    request: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
):
    """更新通知设置"""
    if request.enabled is not None:
        _set_setting(db, "notification", "enabled", str(request.enabled).lower())
    if request.on_complete is not None:
        _set_setting(db, "notification", "on_complete", str(request.on_complete).lower())
    if request.on_error is not None:
        _set_setting(db, "notification", "on_error", str(request.on_error).lower())

    return SettingsUpdateResponse(
        message="通知设置更新成功",
    )


@router.put("/preferences", response_model=SettingsUpdateResponse)
def update_preference_settings(
    request: PreferenceSettingsUpdate,
    db: Session = Depends(get_db),
):
    """更新用户偏好"""
    if request.output_language is not None:
        _set_setting(db, "preferences", "output_language", request.output_language)
    if request.default_research_depth is not None:
        _set_setting(db, "preferences", "default_research_depth", str(request.default_research_depth))
    if request.auto_save_reports is not None:
        _set_setting(db, "preferences", "auto_save_reports", str(request.auto_save_reports).lower())

    return SettingsUpdateResponse(
        message="用户偏好更新成功",
    )
