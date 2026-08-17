"""
FastAPI 应用入口

功能：
1. CORS 中间件配置
2. 挂载所有路由
3. WebSocket 端点
4. 启动事件：初始化数据库
5. WebSocket 连接管理器
"""
import sys
import os
import json
from contextlib import asynccontextmanager
from typing import Dict, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# 将项目根目录添加到 sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import config as app_config
from database import init_db, Base, engine
import models  # noqa: F401 - 确保表定义已注册到 Base.metadata

# 模块加载时立即初始化数据库（内存模式需要）
init_db()
print("[TradingAgents Web Backend] 数据库初始化完成")


# ============================================================
# WebSocket 连接管理器
# ============================================================

class ConnectionManager:
    """WebSocket 连接管理器

    管理每个分析任务的 WebSocket 连接，支持广播消息。
    """

    def __init__(self):
        # analysis_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, analysis_id: str):
        """接受 WebSocket 连接"""
        await websocket.accept()
        if analysis_id not in self.active_connections:
            self.active_connections[analysis_id] = []
        self.active_connections[analysis_id].append(websocket)

    async def disconnect(self, websocket: WebSocket, analysis_id: str):
        """断开 WebSocket 连接"""
        if analysis_id in self.active_connections:
            if websocket in self.active_connections[analysis_id]:
                self.active_connections[analysis_id].remove(websocket)
            # 如果没有连接了，清理
            if not self.active_connections[analysis_id]:
                del self.active_connections[analysis_id]

    async def broadcast(self, analysis_id: str, message: dict):
        """向指定分析任务的所有连接广播消息"""
        if analysis_id not in self.active_connections:
            return

        disconnected = []
        for connection in self.active_connections[analysis_id]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        # 清理断开的连接
        for conn in disconnected:
            await self.disconnect(conn, analysis_id)

    def has_connections(self, analysis_id: str) -> bool:
        """检查指定分析任务是否有活跃连接"""
        return analysis_id in self.active_connections and len(self.active_connections[analysis_id]) > 0


# 全局 WebSocket 管理器实例
ws_manager = ConnectionManager()


# ============================================================
# 应用生命周期
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 内存数据库已在模块级别初始化，此处仅做确认
    from sqlalchemy import inspect
    tables = inspect(engine).get_table_names()
    if not tables:
        init_db()
        print("[TradingAgents Web Backend] 数据库初始化完成")
    else:
        print(f"[TradingAgents Web Backend] 数据库已就绪 (tables: {tables})")
    yield
    print("[TradingAgents Web Backend] 服务关闭")


# ============================================================
# FastAPI 应用实例
# ============================================================

app = FastAPI(
    title="TradingAgents Web Backend",
    description="TradingAgents 多 Agent LLM 金融交易分析平台 - 后端 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 注册路由
# ============================================================

from routers import analysis, reports, settings

app.include_router(analysis.router)
app.include_router(reports.router)
app.include_router(settings.router)


# ============================================================
# WebSocket 端点
# ============================================================

@app.websocket("/ws/analysis/{analysis_id}")
async def analysis_websocket(websocket: WebSocket, analysis_id: str):
    """分析任务实时进度 WebSocket 端点

    客户端连接后，服务器会实时推送分析进度消息。
    消息类型包括：
    - agent_status: Agent 状态变更
    - message: 新消息日志
    - report_update: 报告内容更新
    - stats_update: 统计信息更新
    - progress: 整体进度更新
    - completed: 分析完成
    - error: 错误发生
    """
    await ws_manager.connect(websocket, analysis_id)
    try:
        # 发送连接确认
        await websocket.send_json({
            "type": "connected",
            "timestamp": "2026-01-01T00:00:00Z",
            "analysis_id": analysis_id,
            "data": {"message": "WebSocket 连接成功"},
        })

        # 保持连接，接收客户端消息（心跳等）
        while True:
            data = await websocket.receive_text()
            # 处理客户端消息（目前仅支持心跳）
            try:
                client_msg = json.loads(data)
                if client_msg.get("type") == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": "2026-01-01T00:00:00Z",
                        "analysis_id": analysis_id,
                        "data": {},
                    })
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, analysis_id)
    except Exception as e:
        await ws_manager.disconnect(websocket, analysis_id)


# ============================================================
# 健康检查端点
# ============================================================

@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {
        "status": "ok",
        "service": "TradingAgents Web Backend",
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "TradingAgents Web Backend API",
        "docs": "/docs",
        "health": "/api/health",
    }


# ============================================================
# 启动入口
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=app_config.HOST,
        port=app_config.PORT,
        reload=True,
    )
