"""
LangGraph 回调处理器
参考 cli/stats_handler.py 的实现，扩展为支持 WebSocket 推送

核心功能：
1. 统计 LLM 调用次数和 Token 用量
2. 统计工具调用次数
3. 将每个回调事件推送到 WebSocket 连接
"""
import threading
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult
from langchain_core.messages import AIMessage


class AnalysisCallbackHandler(BaseCallbackHandler):
    """分析回调处理器

    继承 LangGraph 的回调基类，在关键节点捕获事件并推送到 WebSocket。
    线程安全设计，支持在后台线程中运行。
    """

    def __init__(self, analysis_id: str, ws_manager=None) -> None:
        """
        Args:
            analysis_id: 分析任务 ID
            ws_manager: WebSocket 管理器实例（ConnectionManager）
        """
        super().__init__()
        self._lock = threading.Lock()
        self.analysis_id = analysis_id
        self.ws_manager = ws_manager

        # 统计数据
        self.llm_calls = 0
        self.tool_calls = 0
        self.tokens_in = 0
        self.tokens_out = 0

        # Agent 状态跟踪
        self.agent_status: Dict[str, str] = {}
        self.start_time: Optional[datetime] = None

    def set_start_time(self):
        """记录分析开始时间"""
        self.start_time = datetime.now(timezone.utc)

    def get_elapsed_seconds(self) -> float:
        """获取已运行秒数"""
        if self.start_time:
            return (datetime.now(timezone.utc) - self.start_time).total_seconds()
        return 0.0

    def get_stats(self) -> Dict[str, Any]:
        """返回当前统计数据"""
        with self._lock:
            return {
                "llm_calls": self.llm_calls,
                "tool_calls": self.tool_calls,
                "tokens_in": self.tokens_in,
                "tokens_out": self.tokens_out,
                "elapsed_seconds": self.get_elapsed_seconds(),
            }

    def get_final_agent_status(self) -> Dict[str, str]:
        """返回最终的 Agent 状态"""
        return dict(self.agent_status)

    # ============================================================
    # WebSocket 推送辅助方法
    # ============================================================

    def _send_ws_message(self, msg_type: str, data: Dict[str, Any]):
        """发送 WebSocket 消息"""
        if self.ws_manager is None:
            return
        message = {
            "type": msg_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "analysis_id": self.analysis_id,
            "data": data,
        }
        # ws_manager.broadcast 是 async 方法，这里在线程中调用
        # 需要通过 asyncio 的方式调度
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(
                    self.ws_manager.broadcast(self.analysis_id, message)
                )
            else:
                loop.run_until_complete(
                    self.ws_manager.broadcast(self.analysis_id, message)
                )
        except RuntimeError:
            # 没有事件循环时，创建新的
            import asyncio
            asyncio.run(
                self.ws_manager.broadcast(self.analysis_id, message)
            )

    def _send_stats_update(self):
        """推送统计信息更新"""
        self._send_ws_message("stats_update", self.get_stats())

    # ============================================================
    # LangGraph 回调方法
    # ============================================================

    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        **kwargs: Any,
    ) -> None:
        """LLM 调用开始"""
        with self._lock:
            self.llm_calls += 1

    def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[Any]],
        **kwargs: Any,
    ) -> None:
        """Chat Model 调用开始"""
        with self._lock:
            self.llm_calls += 1

        # 推送统计更新
        self._send_stats_update()

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """LLM 调用结束，统计 Token 用量"""
        try:
            generation = response.generations[0][0]
        except (IndexError, TypeError):
            return

        usage_metadata = None
        if hasattr(generation, "message"):
            message = generation.message
            if isinstance(message, AIMessage) and hasattr(message, "usage_metadata"):
                usage_metadata = message.usage_metadata

        if usage_metadata:
            with self._lock:
                self.tokens_in += usage_metadata.get("input_tokens", 0)
                self.tokens_out += usage_metadata.get("output_tokens", 0)

        # 推送统计更新
        self._send_stats_update()

    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        **kwargs: Any,
    ) -> None:
        """工具调用开始"""
        tool_name = serialized.get("name", "unknown")
        with self._lock:
            self.tool_calls += 1

        # 推送工具调用消息
        self._send_ws_message("message", {
            "msg_type": "Tool",
            "content": f"调用工具: {tool_name}",
        })

        # 推送统计更新
        self._send_stats_update()

    def on_tool_end(self, output: str, **kwargs: Any) -> None:
        """工具调用结束"""
        # 工具结果通常较长，不推送完整内容
        pass

    def on_chain_start(
        self,
        serialized: Dict[str, Any],
        inputs: Dict[str, Any],
        **kwargs: Any,
    ) -> None:
        """Chain（Agent）开始执行"""
        chain_name = serialized.get("name", "")
        # 推送 Agent 状态变更
        if chain_name:
            self._send_ws_message("agent_status", {
                "agent": chain_name,
                "status": "in_progress",
                "all_agents": dict(self.agent_status),
            })

    def on_chain_end(self, outputs: Dict[str, Any], **kwargs: Any) -> None:
        """Chain（Agent）执行完成"""
        pass

    def on_llm_error(self, error: Exception, **kwargs: Any) -> None:
        """LLM 调用错误"""
        self._send_ws_message("error", {
            "code": "LLM_ERROR",
            "message": str(error),
            "recoverable": True,
        })

    def on_tool_error(self, error: Exception, **kwargs: Any) -> None:
        """工具调用错误"""
        self._send_ws_message("error", {
            "code": "TOOL_ERROR",
            "message": str(error),
            "recoverable": True,
        })
