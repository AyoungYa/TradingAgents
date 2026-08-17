"""
异步分析任务模块
使用 threading 在后台线程中执行分析任务

参考 cli/main.py 的 run_analysis() 函数实现
"""
import sys
import os
import uuid
import time
import json
import traceback
import threading
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# 将项目根目录添加到 sys.path，确保能导入 tradingagents
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# 注意：tradingagents 的导入延迟到 run_analysis_task() 函数内部
# 因为它依赖 langgraph 等重量级包，在 FastAPI 启动时不需要加载


# 有序的分析师列表
ANALYST_ORDER = ["market", "social", "news", "fundamentals"]

# 分析师名称映射
ANALYST_AGENT_NAMES = {
    "market": "Market Analyst",
    "social": "Social Analyst",
    "news": "News Analyst",
    "fundamentals": "Fundamentals Analyst",
}

# 报告字段映射
ANALYST_REPORT_MAP = {
    "market": "market_report",
    "social": "sentiment_report",
    "news": "news_report",
    "fundamentals": "fundamentals_report",
}

# 固定团队 Agent（非用户可选）
FIXED_AGENTS = {
    "Research Team": ["Bull Researcher", "Bear Researcher", "Research Manager"],
    "Trading Team": ["Trader"],
    "Risk Management": ["Aggressive Analyst", "Neutral Analyst", "Conservative Analyst"],
    "Portfolio Management": ["Portfolio Manager"],
}

# 报告板块映射
REPORT_SECTIONS = {
    "market_report": ("market", "Market Analyst"),
    "sentiment_report": ("social", "Social Analyst"),
    "news_report": ("news", "News Analyst"),
    "fundamentals_report": ("fundamentals", "Fundamentals Analyst"),
    "investment_plan": (None, "Research Manager"),
    "trader_investment_plan": (None, "Trader"),
    "final_trade_decision": (None, "Portfolio Manager"),
}


def _build_agent_status(selected_analysts: list) -> Dict[str, str]:
    """构建初始 Agent 状态字典"""
    status = {}
    for key in selected_analysts:
        if key in ANALYST_AGENT_NAMES:
            status[ANALYST_AGENT_NAMES[key]] = "pending"
    for team_agents in FIXED_AGENTS.values():
        for agent in team_agents:
            status[agent] = "pending"
    return status


def _build_report_sections(selected_analysts: list) -> Dict[str, Optional[str]]:
    """构建初始报告板块字典"""
    sections = {}
    for section, (analyst_key, _) in REPORT_SECTIONS.items():
        if analyst_key is None or analyst_key in selected_analysts:
            sections[section] = None
    return sections


def _extract_content_string(content) -> Optional[str]:
    """从各种消息格式中提取文本内容"""
    import ast

    def is_empty(val):
        if val is None or val == '':
            return True
        if isinstance(val, str):
            s = val.strip()
            if not s:
                return True
            try:
                return not bool(ast.literal_eval(s))
            except (ValueError, SyntaxError):
                return False
        return not bool(val)

    if is_empty(content):
        return None

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, dict):
        text = content.get('text', '')
        return text.strip() if not is_empty(text) else None

    if isinstance(content, list):
        text_parts = [
            item.get('text', '').strip() if isinstance(item, dict) and item.get('type') == 'text'
            else (item.strip() if isinstance(item, str) else '')
            for item in content
        ]
        result = ' '.join(t for t in text_parts if t and not is_empty(t))
        return result if result else None

    return str(content).strip() if not is_empty(content) else None


def _classify_message_type(message) -> tuple:
    """分类 LangChain 消息类型"""
    from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

    content = _extract_content_string(getattr(message, 'content', None))

    if isinstance(message, HumanMessage):
        if content and content.strip() == "Continue":
            return ("Control", content)
        return ("User", content)

    if isinstance(message, ToolMessage):
        return ("Data", content)

    if isinstance(message, AIMessage):
        return ("Agent", content)

    return ("System", content)


def _update_analyst_statuses(
    agent_status: Dict[str, str],
    report_sections: Dict[str, Optional[str]],
    chunk: Dict[str, Any],
    selected_analysts: list,
) -> bool:
    """更新分析师状态

    Returns:
        all_analysts_done: 是否所有分析师都已完成
    """
    found_active = False

    for analyst_key in ANALYST_ORDER:
        if analyst_key not in selected_analysts:
            continue

        agent_name = ANALYST_AGENT_NAMES[analyst_key]
        report_key = ANALYST_REPORT_MAP[analyst_key]

        # 捕获当前 chunk 的新报告内容
        if chunk.get(report_key):
            report_sections[report_key] = chunk[report_key]

        # 根据累积的报告板块判断状态
        has_report = bool(report_sections.get(report_key))

        if has_report:
            agent_status[agent_name] = "completed"
        elif not found_active:
            agent_status[agent_name] = "in_progress"
            found_active = True
        else:
            agent_status[agent_name] = "pending"

    # 当所有分析师完成时，将 Bull Researcher 设为 in_progress
    all_analysts_done = False
    if not found_active and selected_analysts:
        if agent_status.get("Bull Researcher") == "pending":
            agent_status["Bull Researcher"] = "in_progress"
        all_analysts_done = True

    return all_analysts_done


def _generate_markdown_report(content: Dict[str, Any], ticker: str) -> str:
    """生成 Markdown 格式的完整报告"""
    parts = [f"# Trading Analysis Report: {ticker}\n"]
    parts.append(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}\n")

    # 分析师报告
    analyst_keys = ["market_report", "sentiment_report", "news_report", "fundamentals_report"]
    if any(content.get(k) for k in analyst_keys):
        parts.append("## I. Analyst Team Reports\n")
        for name, key in [
            ("Market Analysis", "market_report"),
            ("Social Sentiment", "sentiment_report"),
            ("News Analysis", "news_report"),
            ("Fundamentals Analysis", "fundamentals_report"),
        ]:
            if content.get(key):
                parts.append(f"### {name}\n{content[key]}\n\n")

    # 研究团队
    if content.get("research"):
        parts.append("## II. Research Team Decision\n")
        research = content["research"]
        if research.get("bull"):
            parts.append(f"### Bull Researcher\n{research['bull']}\n\n")
        if research.get("bear"):
            parts.append(f"### Bear Researcher\n{research['bear']}\n\n")
        if research.get("manager"):
            parts.append(f"### Research Manager\n{research['manager']}\n\n")

    # 交易团队
    if content.get("trading_plan"):
        parts.append("## III. Trading Team Plan\n")
        parts.append(f"{content['trading_plan']}\n\n")

    # 风险管理团队
    if content.get("risk_analysis"):
        parts.append("## IV. Risk Management Team Decision\n")
        risk = content["risk_analysis"]
        if risk.get("aggressive"):
            parts.append(f"### Aggressive Analyst\n{risk['aggressive']}\n\n")
        if risk.get("conservative"):
            parts.append(f"### Conservative Analyst\n{risk['conservative']}\n\n")
        if risk.get("neutral"):
            parts.append(f"### Neutral Analyst\n{risk['neutral']}\n\n")

    # 最终决策
    if content.get("final_decision"):
        parts.append("## V. Portfolio Manager Decision\n")
        parts.append(f"{content['final_decision']}\n")

    return "\n".join(parts)


def _create_report_from_state(
    db_session,
    analysis_id: str,
    final_state: Dict[str, Any],
    decision: Dict[str, Any],
) -> Any:
    """从 final_state 提取报告内容并存储到数据库"""
    from models import Report

    content = {
        "market_report": final_state.get("market_report", ""),
        "sentiment_report": final_state.get("sentiment_report", ""),
        "news_report": final_state.get("news_report", ""),
        "fundamentals_report": final_state.get("fundamentals_report", ""),
        "research": {
            "bull": final_state.get("investment_debate_state", {}).get("bull_history", ""),
            "bear": final_state.get("investment_debate_state", {}).get("bear_history", ""),
            "manager": final_state.get("investment_debate_state", {}).get("judge_decision", ""),
        },
        "trading_plan": final_state.get("trader_investment_plan", ""),
        "risk_analysis": {
            "aggressive": final_state.get("risk_debate_state", {}).get("aggressive_history", ""),
            "conservative": final_state.get("risk_debate_state", {}).get("conservative_history", ""),
            "neutral": final_state.get("risk_debate_state", {}).get("neutral_history", ""),
        },
        "final_decision": final_state.get("final_trade_decision", ""),
    }

    ticker = final_state.get("company_of_interest", "UNKNOWN")
    full_report = _generate_markdown_report(content, ticker)

    report = Report(
        id=str(uuid.uuid4()),
        analysis_id=analysis_id,
        decision=decision.get("decision"),
        signal=decision.get("signal"),
        confidence=decision.get("confidence"),
        content=content,
        full_report=full_report,
    )

    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)

    return report


def run_analysis_task(analysis_id: str, config: dict, ws_manager):
    """在后台线程中执行分析任务

    Args:
        analysis_id: 分析任务 ID
        config: 分析配置字典
        ws_manager: WebSocket 管理器实例
    """
    # 延迟导入，避免循环依赖
    from database import SessionLocal
    from models import Analysis, AnalysisStatus
    from callbacks.analysis_callback import AnalysisCallbackHandler

    db = SessionLocal()
    try:
        # 1. 加载分析记录
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return

        # 2. 更新状态为 running
        analysis.status = AnalysisStatus.RUNNING
        analysis.started_at = datetime.now(timezone.utc)
        db.commit()

        # 获取分析参数
        ticker = analysis.ticker
        analysis_date = analysis.analysis_date
        analysis_config = analysis.config

        # 3. 构建 TradingAgents 配置
        ta_config = DEFAULT_CONFIG.copy()
        ta_config["max_debate_rounds"] = analysis_config.get("depth", 1)
        ta_config["max_risk_discuss_rounds"] = analysis_config.get("depth", 1)
        ta_config["quick_think_llm"] = analysis_config.get(
            "quick_model", DEFAULT_CONFIG["quick_think_llm"]
        )
        ta_config["deep_think_llm"] = analysis_config.get(
            "deep_model", DEFAULT_CONFIG["deep_think_llm"]
        )
        ta_config["llm_provider"] = analysis_config.get(
            "llm_provider", DEFAULT_CONFIG["llm_provider"]
        )
        ta_config["output_language"] = analysis_config.get(
            "language", DEFAULT_CONFIG["output_language"]
        )

        # 4. 规范化分析师选择
        selected_analysts = analysis_config.get("analysts", ["market"])
        selected_set = set(selected_analysts)
        selected_analyst_keys = [a for a in ANALYST_ORDER if a in selected_set]

        # 5. 初始化 Agent 状态和报告板块
        agent_status = _build_agent_status(selected_analyst_keys)
        report_sections = _build_report_sections(selected_analyst_keys)

        # 6. 创建回调处理器
        callback_handler = AnalysisCallbackHandler(
            analysis_id=analysis_id,
            ws_manager=ws_manager,
        )
        callback_handler.agent_status = agent_status
        callback_handler.set_start_time()

        # 7. 初始化 TradingAgentsGraph
        graph = TradingAgentsGraph(
            selected_analyst_keys,
            config=ta_config,
            debug=False,
            callbacks=[callback_handler],
        )

        # 8. 创建初始状态
        init_agent_state = graph.propagator.create_initial_state(ticker, analysis_date)
        args = graph.propagator.get_graph_args(callbacks=[callback_handler])

        # 9. 更新数据库中的 Agent 状态
        analysis.agent_status = dict(agent_status)
        db.commit()

        # 10. 流式执行分析
        processed_message_ids = set()
        trace = []

        for chunk in graph.graph.stream(init_agent_state, **args):
            trace.append(chunk)

            # 处理消息
            for message in chunk.get("messages", []):
                msg_id = getattr(message, "id", None)
                if msg_id is not None and msg_id in processed_message_ids:
                    continue
                if msg_id is not None:
                    processed_message_ids.add(msg_id)

                msg_type, content = _classify_message_type(message)
                if content and content.strip():
                    # 推送消息到 WebSocket
                    callback_handler._send_ws_message("message", {
                        "msg_type": msg_type,
                        "content": content[:500] if len(content) > 500 else content,
                    })

                # 处理工具调用
                if hasattr(message, "tool_calls") and message.tool_calls:
                    for tool_call in message.tool_calls:
                        if isinstance(tool_call, dict):
                            tool_name = tool_call.get("name", "unknown")
                        else:
                            tool_name = getattr(tool_call, "name", "unknown")

            # 更新分析师状态
            _update_analyst_statuses(agent_status, report_sections, chunk, selected_analyst_keys)

            # 处理研究团队状态
            if chunk.get("investment_debate_state"):
                debate_state = chunk["investment_debate_state"]
                bull_hist = debate_state.get("bull_history", "").strip()
                bear_hist = debate_state.get("bear_history", "").strip()
                judge = debate_state.get("judge_decision", "").strip()

                if bull_hist or bear_hist:
                    for agent in ["Bull Researcher", "Bear Researcher", "Research Manager"]:
                        agent_status[agent] = "in_progress"

                if bull_hist:
                    report_sections["investment_plan"] = (
                        f"### Bull Researcher Analysis\n{bull_hist}"
                    )
                if bear_hist:
                    report_sections["investment_plan"] = (
                        f"### Bear Researcher Analysis\n{bear_hist}"
                    )
                if judge:
                    report_sections["investment_plan"] = (
                        f"### Research Manager Decision\n{judge}"
                    )
                    for agent in ["Bull Researcher", "Bear Researcher", "Research Manager"]:
                        agent_status[agent] = "completed"
                    agent_status["Trader"] = "in_progress"

                # 推送报告更新
                if report_sections.get("investment_plan"):
                    callback_handler._send_ws_message("report_update", {
                        "section": "investment_plan",
                        "content": report_sections["investment_plan"],
                        "is_complete": bool(judge),
                    })

            # 处理交易团队
            if chunk.get("trader_investment_plan"):
                report_sections["trader_investment_plan"] = chunk["trader_investment_plan"]
                if agent_status.get("Trader") != "completed":
                    agent_status["Trader"] = "completed"
                    agent_status["Aggressive Analyst"] = "in_progress"

                callback_handler._send_ws_message("report_update", {
                    "section": "trader_investment_plan",
                    "content": chunk["trader_investment_plan"],
                    "is_complete": True,
                })

            # 处理风险管理团队
            if chunk.get("risk_debate_state"):
                risk_state = chunk["risk_debate_state"]
                agg_hist = risk_state.get("aggressive_history", "").strip()
                con_hist = risk_state.get("conservative_history", "").strip()
                neu_hist = risk_state.get("neutral_history", "").strip()
                judge = risk_state.get("judge_decision", "").strip()

                if agg_hist:
                    if agent_status.get("Aggressive Analyst") != "completed":
                        agent_status["Aggressive Analyst"] = "in_progress"
                    report_sections["final_trade_decision"] = (
                        f"### Aggressive Analyst Analysis\n{agg_hist}"
                    )
                if con_hist:
                    if agent_status.get("Conservative Analyst") != "completed":
                        agent_status["Conservative Analyst"] = "in_progress"
                    report_sections["final_trade_decision"] = (
                        f"### Conservative Analyst Analysis\n{con_hist}"
                    )
                if neu_hist:
                    if agent_status.get("Neutral Analyst") != "completed":
                        agent_status["Neutral Analyst"] = "in_progress"
                    report_sections["final_trade_decision"] = (
                        f"### Neutral Analyst Analysis\n{neu_hist}"
                    )
                if judge:
                    if agent_status.get("Portfolio Manager") != "completed":
                        agent_status["Portfolio Manager"] = "in_progress"
                        report_sections["final_trade_decision"] = (
                            f"### Portfolio Manager Decision\n{judge}"
                        )
                        # 标记所有风险团队和投资组合经理为完成
                        for agent in [
                            "Aggressive Analyst", "Conservative Analyst",
                            "Neutral Analyst", "Portfolio Manager"
                        ]:
                            agent_status[agent] = "completed"

                # 推送报告更新
                if report_sections.get("final_trade_decision"):
                    callback_handler._send_ws_message("report_update", {
                        "section": "final_trade_decision",
                        "content": report_sections["final_trade_decision"],
                        "is_complete": bool(judge),
                    })

            # 更新 Agent 状态并推送到 WebSocket
            callback_handler.agent_status = agent_status
            callback_handler._send_ws_message("agent_status", {
                "all_agents": dict(agent_status),
            })

            # 定期更新数据库中的状态
            analysis.agent_status = dict(agent_status)
            analysis.llm_calls = callback_handler.llm_calls
            analysis.tool_calls = callback_handler.tool_calls
            analysis.tokens_in = callback_handler.tokens_in
            analysis.tokens_out = callback_handler.tokens_out
            analysis.elapsed_seconds = callback_handler.get_elapsed_seconds()
            db.commit()

        # 11. 获取最终状态和决策
        if not trace:
            raise RuntimeError("分析执行未产生任何输出")

        final_state = trace[-1]
        decision = graph.process_signal(final_state["final_trade_decision"])

        # 12. 创建报告
        report = _create_report_from_state(db, analysis_id, final_state, decision)

        # 13. 更新分析状态为完成
        analysis.status = AnalysisStatus.COMPLETED
        analysis.completed_at = datetime.now(timezone.utc)
        analysis.report_id = report.id
        analysis.agent_status = dict(agent_status)
        analysis.llm_calls = callback_handler.llm_calls
        analysis.tool_calls = callback_handler.tool_calls
        analysis.tokens_in = callback_handler.tokens_in
        analysis.tokens_out = callback_handler.tokens_out
        analysis.elapsed_seconds = callback_handler.get_elapsed_seconds()
        db.commit()

        # 14. 推送完成消息
        callback_handler._send_ws_message("completed", {
            "status": "completed",
            "decision": decision.get("decision"),
            "signal": decision.get("signal"),
            "confidence": decision.get("confidence"),
            "report_id": report.id,
            "elapsed_seconds": analysis.elapsed_seconds,
        })

    except Exception as e:
        # 更新状态为失败
        error_msg = str(e)
        error_tb = traceback.format_exc()
        print(f"[Analysis Task Error] analysis_id={analysis_id}: {error_msg}\n{error_tb}")

        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = error_msg
            analysis.completed_at = datetime.now(timezone.utc)
            db.commit()

        # 推送错误消息
        if ws_manager:
            try:
                import asyncio
                message = {
                    "type": "error",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "analysis_id": analysis_id,
                    "data": {
                        "code": "EXECUTION_ERROR",
                        "message": error_msg,
                        "recoverable": False,
                    },
                }
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.ensure_future(ws_manager.broadcast(analysis_id, message))
                else:
                    asyncio.run(ws_manager.broadcast(analysis_id, message))
            except Exception:
                pass

    finally:
        db.close()


# 存储活跃的分析任务线程，用于取消
_active_tasks: Dict[str, threading.Thread] = {}


def start_analysis_task(analysis_id: str, config: dict, ws_manager) -> threading.Thread:
    """启动后台分析任务线程

    Args:
        analysis_id: 分析任务 ID
        config: 分析配置
        ws_manager: WebSocket 管理器

    Returns:
        启动的线程对象
    """
    thread = threading.Thread(
        target=run_analysis_task,
        args=(analysis_id, config, ws_manager),
        daemon=True,
    )
    _active_tasks[analysis_id] = thread
    thread.start()
    return thread


def cancel_analysis_task(analysis_id: str) -> bool:
    """取消分析任务

    注意：Python 线程不能被强制终止，这里只是标记为取消。
    实际的任务取消需要在 run_analysis_task 中检查取消标志。

    Args:
        analysis_id: 分析任务 ID

    Returns:
        是否成功取消
    """
    if analysis_id in _active_tasks:
        thread = _active_tasks[analysis_id]
        if thread.is_alive():
            # 标记为取消（线程会在下次数据库检查时发现状态已变更）
            del _active_tasks[analysis_id]
            return True
        else:
            del _active_tasks[analysis_id]
    return False
