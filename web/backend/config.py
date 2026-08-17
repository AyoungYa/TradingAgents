"""
配置管理模块
从环境变量读取配置，提供默认值
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()
load_dotenv(".env.enterprise", override=False)

# 项目根目录（web/backend 的父级，即 workspace）
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# 后端目录
BACKEND_DIR = Path(__file__).resolve().parent

# 数据库配置（使用 /tmp 避免虚拟文件系统 I/O 问题）
DATABASE_DIR = Path("/tmp/tradingagents_web")
DATABASE_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{DATABASE_DIR / 'tradingagents.db'}"
)

# 服务配置
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# CORS 配置
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
).split(",")

# LLM 默认配置
DEFAULT_LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai")
DEFAULT_DEEP_MODEL = os.getenv("DEEP_THINK_LLM", "gpt-5.4")
DEFAULT_QUICK_MODEL = os.getenv("QUICK_THINK_LLM", "gpt-5.4-mini")
DEFAULT_BACKEND_URL = os.getenv("BACKEND_URL", "https://api.openai.com/v1")

# 输出语言
DEFAULT_LANGUAGE = os.getenv("OUTPUT_LANGUAGE", "English")

# 研究深度
DEFAULT_RESEARCH_DEPTH = int(os.getenv("DEFAULT_RESEARCH_DEPTH", "1"))
