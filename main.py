from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Create a custom config
config = DEFAULT_CONFIG.copy()
config["llm_provider"] = "deepseek"
config['output_language'] = ""
config["backend_url"] = "https://api.deepseek.com/"
config["deep_think_llm"] = "deepseek-v4-flash"  # Use a different model
config["quick_think_llm"] = "deepseek-v4-pro"  # Use a different model
config["max_debate_rounds"] = 1  # Increase debate rounds

selections = {
    # "ticker": "601899.SH",
    # "analysis_date": "2026-04-22",
    "analysts": ["market", "social", "news", "fundamentals"],
    "research_depth": 3,
    "llm_provider": "deepseek",
    "backend_url": "https://api.deepseek.com",
    "shallow_thinker": "deepseek-v4-pro",
    "deep_thinker": "deepseek-v4-flash",
    "google_thinking_level": None,
    "openai_reasoning_effort": None,
    "anthropic_effort": None,
    "output_language": "Chinese"
}
config["max_debate_rounds"] = selections["research_depth"]
config["max_risk_discuss_rounds"] = selections["research_depth"]
config["quick_think_llm"] = selections["shallow_thinker"]
config["deep_think_llm"] = selections["deep_thinker"]
config["backend_url"] = selections["backend_url"]
config["llm_provider"] = selections["llm_provider"].lower()
# Provider-specific thinking configuration
config["google_thinking_level"] = selections.get("google_thinking_level")
config["openai_reasoning_effort"] = selections.get("openai_reasoning_effort")
config["anthropic_effort"] = selections.get("anthropic_effort")
config["output_language"] = selections.get("output_language", "English")

# Configure data vendors (default uses yfinance, no extra API keys needed)
config["data_vendors"] = {
    "core_stock_apis": "yfinance",           # Options: alpha_vantage, yfinance
    "technical_indicators": "yfinance",      # Options: alpha_vantage, yfinance
    "fundamental_data": "yfinance",          # Options: alpha_vantage, yfinance
    "news_data": "yfinance",                 # Options: alpha_vantage, yfinance
}

# Initialize with custom config
ta = TradingAgentsGraph(debug=True, config=config)

# forward propagate
_, decision = ta.propagate("NVDA", "2024-05-10")
print(decision)

# Memorize mistakes and reflect
# ta.reflect_and_remember(1000) # parameter is the position returns
