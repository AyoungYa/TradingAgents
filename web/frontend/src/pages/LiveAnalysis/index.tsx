// 实时分析页面
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAnalysisStore } from '@/stores/analysisStore';
import { cn } from '@/utils/cn';
import type { AgentGroup, Message, MessageType } from '@/types/analysis';

/** 初始 Agent 分组数据 */
const initialAgentGroups: AgentGroup[] = [
  {
    id: 'analyst', name: 'Analyst Team', icon: 'fa-user-tie', color: '#00d4aa',
    agents: [
      { id: 'market', name: 'Market Analyst', status: 'pending' },
      { id: 'social', name: 'Social Media Analyst', status: 'pending' },
      { id: 'news', name: 'News Analyst', status: 'pending' },
      { id: 'fundamentals', name: 'Fundamentals Analyst', status: 'pending' },
    ],
  },
  {
    id: 'research', name: 'Research Team', icon: 'fa-flask', color: '#818cf8',
    agents: [
      { id: 'bull', name: 'Bull Researcher', status: 'pending' },
      { id: 'bear', name: 'Bear Researcher', status: 'pending' },
      { id: 'manager', name: 'Research Manager', status: 'pending' },
    ],
  },
  {
    id: 'trading', name: 'Trading Team', icon: 'fa-exchange-alt', color: '#f59e0b',
    agents: [
      { id: 'trader', name: 'Trader', status: 'pending' },
    ],
  },
  {
    id: 'risk', name: 'Risk Management', icon: 'fa-shield-alt', color: '#ec4899',
    agents: [
      { id: 'aggressive', name: 'Aggressive Risk Analyst', status: 'pending' },
      { id: 'conservative', name: 'Conservative Risk Analyst', status: 'pending' },
      { id: 'neutral', name: 'Neutral Risk Analyst', status: 'pending' },
    ],
  },
  {
    id: 'portfolio', name: 'Portfolio Management', icon: 'fa-briefcase', color: '#10b981',
    agents: [
      { id: 'pm', name: 'Portfolio Manager', status: 'pending' },
    ],
  },
];

/** 分析步骤定义：[groupId, agentId, 消息列表, 持续时间ms] */
type Step = {
  groupId: string;
  agentId: string;
  messages: { type: MessageType; agent: string; content: string }[];
  duration: number;
};

/** 根据股票代码动态生成分析步骤 */
function buildAnalysisSteps(ticker: string): Step[] {
  return [
    // === Analyst Team ===
    {
      groupId: 'analyst', agentId: 'market', duration: 3000,
      messages: [
        { type: 'tool', agent: 'Market Analyst', content: `调用 yfinance.get_stock_data("${ticker}", period="6mo")...` },
        { type: 'data', agent: 'System', content: `返回 126 个数据点。当前价格: ¥${(Math.random() * 50 + 10).toFixed(2)}, 成交量: ${(Math.random() * 100 + 10).toFixed(1)}M` },
        { type: 'tool', agent: 'Market Analyst', content: '调用 calculate_bollinger_bands(data, period=20)' },
        { type: 'data', agent: 'System', content: `布林带: 上轨=¥${(Math.random() * 50 + 10).toFixed(2)}, 中轨=¥${(Math.random() * 50 + 10).toFixed(2)}, 下轨=¥${(Math.random() * 50 + 10).toFixed(2)}` },
        { type: 'agent', agent: 'Market Analyst', content: `技术分析完成。信号: BUY。置信度: ${Math.floor(Math.random() * 20 + 70)}%` },
      ],
    },
    {
      groupId: 'analyst', agentId: 'social', duration: 2500,
      messages: [
        { type: 'tool', agent: 'Social Media Analyst', content: `调用 fetch_social_sentiment("${ticker}", platforms=["twitter","reddit"])` },
        { type: 'data', agent: 'System', content: `获取 2,847 条社交媒体提及。正面: ${Math.floor(Math.random() * 20 + 60)}%, 中性: ${Math.floor(Math.random() * 15 + 10)}%, 负面: ${Math.floor(Math.random() * 10 + 3)}%` },
        { type: 'agent', agent: 'Social Media Analyst', content: `社交媒体情绪分析完成。${ticker} 讨论热度较高，整体偏正面。` },
      ],
    },
    {
      groupId: 'analyst', agentId: 'news', duration: 2500,
      messages: [
        { type: 'tool', agent: 'News Analyst', content: `调用 fetch_news("${ticker}", days=7)` },
        { type: 'data', agent: 'System', content: `获取 23 条相关新闻。正面: ${Math.floor(Math.random() * 20 + 50)}%, 中性: ${Math.floor(Math.random() * 15 + 20)}%, 负面: ${Math.floor(Math.random() * 10 + 3)}%` },
        { type: 'agent', agent: 'News Analyst', content: `新闻面分析完成。${ticker} 近期相关报道较多，整体偏正面。` },
      ],
    },
    {
      groupId: 'analyst', agentId: 'fundamentals', duration: 3000,
      messages: [
        { type: 'tool', agent: 'Fundamentals Analyst', content: `调用 get_fundamental_data("${ticker}")` },
        { type: 'data', agent: 'System', content: `P/E=${(Math.random() * 40 + 10).toFixed(1)}, EPS=¥${(Math.random() * 5 + 0.5).toFixed(2)}, 营收增长: ${(Math.random() * 50 + 5).toFixed(1)}%` },
        { type: 'agent', agent: 'Fundamentals Analyst', content: `基本面分析完成。${ticker} 财务数据已获取，综合评估进行中。` },
      ],
    },
    // === Research Team ===
    {
      groupId: 'research', agentId: 'bull', duration: 3000,
      messages: [
        { type: 'agent', agent: 'Bull Researcher', content: `基于分析师报告，构建 ${ticker} 看涨论点...` },
        { type: 'agent', agent: 'Bull Researcher', content: `看涨论点: 行业前景向好、公司竞争力强、业绩增长稳健。建议积极配置。` },
      ],
    },
    {
      groupId: 'research', agentId: 'bear', duration: 3000,
      messages: [
        { type: 'agent', agent: 'Bear Researcher', content: `基于分析师报告，构建 ${ticker} 看跌论点...` },
        { type: 'agent', agent: 'Bear Researcher', content: `看跌论点: 估值偏高、市场波动风险、行业竞争加剧。建议谨慎对待。` },
      ],
    },
    {
      groupId: 'research', agentId: 'manager', duration: 4000,
      messages: [
        { type: 'agent', agent: 'Research Manager', content: `综合研究团队发现，权衡 ${ticker} 各方证据...` },
        { type: 'agent', agent: 'Research Manager', content: `研究结论: 建议买入 ${ticker}。核心逻辑: 基本面支撑较强，技术面信号积极。建议分批建仓。` },
      ],
    },
    // === Trading Team ===
    {
      groupId: 'trading', agentId: 'trader', duration: 3500,
      messages: [
        { type: 'agent', agent: 'Trader', content: `根据研究报告制定 ${ticker} 交易方案...` },
        { type: 'agent', agent: 'Trader', content: `交易计划: ${ticker} 建议买入，设置合理止损止盈，控制仓位风险。` },
      ],
    },
    // === Risk Management ===
    {
      groupId: 'risk', agentId: 'aggressive', duration: 2500,
      messages: [
        { type: 'agent', agent: 'Aggressive Risk Analyst', content: `激进风控观点: ${ticker} 建议加大仓位，可适当放宽止损。` },
      ],
    },
    {
      groupId: 'risk', agentId: 'conservative', duration: 2500,
      messages: [
        { type: 'agent', agent: 'Conservative Risk Analyst', content: `保守风控观点: ${ticker} 建议降低仓位，设置更紧止损。` },
      ],
    },
    {
      groupId: 'risk', agentId: 'neutral', duration: 2500,
      messages: [
        { type: 'agent', agent: 'Neutral Risk Analyst', content: `中立风控观点: ${ticker} 建议维持标准仓位，分批建仓分散风险。` },
      ],
    },
    // === Portfolio Management ===
    {
      groupId: 'portfolio', agentId: 'pm', duration: 4000,
      messages: [
        { type: 'agent', agent: 'Portfolio Manager', content: `审查所有团队报告，做出 ${ticker} 最终投资决策...` },
        { type: 'agent', agent: 'Portfolio Manager', content: `最终决策: ✅ BUY ${ticker} | 置信度: 78% | 建议分批建仓，控制风险` },
      ],
    },
  ];
}

/** 消息类型样式映射 */
const msgTypeConfig: Record<MessageType, { className: string; icon: string; color: string }> = {
  tool: { className: 'msg-tool', icon: 'fa-wrench', color: '#818cf8' },
  agent: { className: 'msg-agent', icon: 'fa-robot', color: '#00d4aa' },
  data: { className: 'msg-data', icon: 'fa-database', color: '#f59e0b' },
  system: { className: 'msg-system', icon: 'fa-info-circle', color: '#64748b' },
};

/** Agent 状态文本 */
const statusText: Record<string, string> = {
  pending: '等待中',
  in_progress: '进行中',
  completed: '完成',
  failed: '失败',
};

export default function LiveAnalysis() {
  const { config } = useAnalysisStore();
  const ticker = config.ticker || 'NVDA';

  // 根据用户输入的股票代码动态生成分析步骤
  const analysisSteps = buildAnalysisSteps(ticker);

  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MessageType | 'all'>('all');
  const [agentGroups, setAgentGroups] = useState<AgentGroup[]>(initialAgentGroups);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState({ llmCalls: 0, toolCalls: 0, tokens: 0, elapsed: 0 });
  const [progress, setProgress] = useState(0);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIndexRef = useRef(0);
  const msgIdRef = useRef(0);

  // 自动滚动到消息底部
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 计时器
  useEffect(() => {
    if (!isPaused && !isCompleted) {
      elapsedRef.current = setInterval(() => {
        setStats((s) => ({ ...s, elapsed: s.elapsed + 1 }));
      }, 1000);
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [isPaused, isCompleted]);

  // 推进单个步骤
  const runStep = useCallback((stepIdx: number) => {
    if (stepIdx >= analysisSteps.length) {
      setIsCompleted(true);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      return;
    }

    const step = analysisSteps[stepIdx];

    // 1. 将对应 Agent 设为 in_progress
    setAgentGroups((prev) =>
      prev.map((g) =>
        g.id === step.groupId
          ? {
              ...g,
              agents: g.agents.map((a) =>
                a.id === step.agentId ? { ...a, status: 'in_progress' as const } : a
              ),
            }
          : g
      )
    );

    // 2. 逐条推送消息（在步骤持续时间内均匀分布）
    const msgInterval = step.duration / step.messages.length;
    step.messages.forEach((msg, i) => {
      setTimeout(() => {
        if (isPaused) return;
        const newMsg: Message = {
          id: String(++msgIdRef.current),
          type: msg.type,
          agent: msg.agent,
          content: msg.content,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMsg]);

        // 更新统计
        setStats((s) => ({
          ...s,
          llmCalls: s.llmCalls + (msg.type === 'agent' ? 1 : 0),
          toolCalls: s.toolCalls + (msg.type === 'tool' ? 1 : 0),
          tokens: s.tokens + Math.floor(Math.random() * 3000 + 500),
        }));
      }, msgInterval * (i + 1));
    });

    // 3. 步骤结束时将 Agent 设为 completed
    timerRef.current = setTimeout(() => {
      if (isPaused) {
        // 暂停时等恢复后重新执行
        const checkPause = setInterval(() => {
          if (!isPaused) {
            clearInterval(checkPause);
            finishStep(stepIdx);
          }
        }, 200);
        return;
      }
      finishStep(stepIdx);
    }, step.duration);
  }, [isPaused]);

  const finishStep = useCallback((stepIdx: number) => {
    const step = analysisSteps[stepIdx];

    // Agent 完成
    setAgentGroups((prev) =>
      prev.map((g) =>
        g.id === step.groupId
          ? {
              ...g,
              agents: g.agents.map((a) =>
                a.id === step.agentId ? { ...a, status: 'completed' as const } : a
              ),
            }
          : g
      )
    );

    // 更新进度
    const newProgress = Math.round(((stepIdx + 1) / analysisSteps.length) * 100);
    setProgress(newProgress);

    // 推进下一步
    stepIndexRef.current = stepIdx + 1;
    timerRef.current = setTimeout(() => {
      runStep(stepIdx + 1);
    }, 800);
  }, [runStep]);

  // 启动分析流程
  useEffect(() => {
    // 延迟 1 秒后开始
    const startTimer = setTimeout(() => {
      runStep(0);
    }, 1000);
    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** 格式化时间 */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  /** 过滤消息 */
  const filteredMessages = activeFilter === 'all'
    ? messages
    : messages.filter((m) => m.type === activeFilter);

  // 计算总进度
  const totalAgents = agentGroups.reduce((sum, g) => sum + g.agents.length, 0);
  const completedAgents = agentGroups.reduce(
    (sum, g) => sum + g.agents.filter((a) => a.status === 'completed').length, 0
  );

  return (
    <div className="animate-fade-in">
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            <span className="font-mono" style={{ color: 'var(--accent)' }}>{config.ticker || 'NVDA'}</span> 实时分析
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {isCompleted ? '✅ 分析完成' : '多 Agent 协作分析进行中...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-secondary"
            style={{ padding: '8px 16px' }}
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? '恢复分析' : '暂停分析'}
          >
            <i className={cn('fas', isPaused ? 'fa-play' : 'fa-pause')} /> {isPaused ? '恢复' : '暂停'}
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '8px 16px', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}
            aria-label="终止分析"
          >
            <i className="fas fa-stop" /> 终止
          </button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* 左侧: Agent 进度面板 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {agentGroups.map((group) => {
            const completed = group.agents.filter((a) => a.status === 'completed').length;
            const total = group.agents.length;
            const groupStatus = completed === total ? 'completed' : completed > 0 ? 'in_progress' : 'pending';

            return (
              <div key={group.id} className="glass-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <i className={cn('fas', group.icon)} style={{ color: group.color, fontSize: 14 }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{group.name}</span>
                  <span className={cn('agent-status', `status-${groupStatus}`)} style={{ marginLeft: 'auto', fontSize: 11 }}>
                    {completed}/{total}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {group.agents.map((agent) => (
                    <div key={agent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          className="status-dot"
                          style={{
                            background: agent.status === 'completed' ? '#10b981' : agent.status === 'in_progress' ? '#00d4aa' : '#64748b',
                            animation: agent.status === 'in_progress' ? 'pulse-dot 1.5s infinite' : undefined,
                          }}
                        />
                        <span style={{ fontSize: 13 }}>{agent.name}</span>
                      </div>
                      <span className={cn('agent-status', `status-${agent.status}`)} style={{ fontSize: 11 }}>
                        {agent.status === 'in_progress' && <i className="fas fa-spinner fa-spin" style={{ fontSize: 9 }} />}
                        {agent.status === 'completed' && <i className="fas fa-check" style={{ fontSize: 9 }} />}
                        {statusText[agent.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 右侧: 消息流 + 报告预览 */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 20 }}>
          {/* 实时消息流 */}
          <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-stream" style={{ color: 'var(--accent)', fontSize: 13 }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>实时消息流</span>
                <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>({messages.length})</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['all', 'tool', 'agent', 'data'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', border: 'none',
                      background: activeFilter === type
                        ? type === 'tool' ? 'rgba(99,102,241,0.3)' : type === 'agent' ? 'rgba(0,212,170,0.3)' : type === 'data' ? 'rgba(245,158,11,0.3)' : 'rgba(148,163,184,0.2)'
                        : type === 'tool' ? 'rgba(99,102,241,0.15)' : type === 'agent' ? 'rgba(0,212,170,0.15)' : type === 'data' ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.08)',
                      color: activeFilter === type
                        ? type === 'tool' ? '#818cf8' : type === 'agent' ? '#00d4aa' : type === 'data' ? '#f59e0b' : '#94a3b8'
                        : type === 'tool' ? '#818cf8' : type === 'agent' ? '#00d4aa' : type === 'data' ? '#f59e0b' : '#94a3b8',
                    }}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'grid', gap: 8 }}>
              {filteredMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <i className="fas fa-hourglass-half" style={{ fontSize: 20, marginBottom: 8, display: 'block' }} />
                  等待分析开始...
                </div>
              )}
              {filteredMessages.map((msg) => {
                const cfg = msgTypeConfig[msg.type];
                return (
                  <div key={msg.id} className={cn('msg-item', cfg.className)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 12, color: cfg.color }}>
                        <i className={cn('fas', cfg.icon)} style={{ marginRight: 4 }} />
                        {msg.agent}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{msg.content}</div>
                  </div>
                );
              })}
              <div ref={messageEndRef} />
            </div>
          </div>

          {/* 报告预览 */}
          <div className="glass-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-file-alt" style={{ color: 'var(--warning)', fontSize: 13 }} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>报告预览</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {isCompleted ? '✅ 报告已生成' : '实时更新中...'}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
              {isCompleted ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                      ✅ BUY {ticker}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: 13 }}>
                      <div><span style={{ color: 'var(--text-muted)' }}>置信度</span><br /><span className="font-mono" style={{ fontWeight: 600 }}>78%</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>入场价</span><br /><span className="font-mono" style={{ fontWeight: 600 }}>$142.00</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>目标价</span><br /><span className="font-mono" style={{ fontWeight: 600, color: '#10b981' }}>$165.00</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>止损价</span><br /><span className="font-mono" style={{ fontWeight: 600, color: '#ef4444' }}>$128.50</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>建议仓位</span><br /><span className="font-mono" style={{ fontWeight: 600 }}>15%</span></div>
                      <div><span style={{ color: 'var(--text-muted)' }}>风险回报比</span><br /><span className="font-mono" style={{ fontWeight: 600 }}>1:1.7</span></div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>核心逻辑</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    AI 基础设施需求确定性高，Blackwell 架构进入量产阶段，数据中心收入持续加速增长。
                    技术面显示 RSI=62.4 处于健康区间，布林带显示上行空间充足。
                    社交媒体情绪强烈看涨（78% 正面），新闻面偏正面。
                    建议分 3 批建仓，控制风险。
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 12, display: 'block' }} />
                  等待分析数据生成报告...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="glass-card" style={{ marginTop: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            { icon: 'fa-robot', color: '#818cf8', label: 'LLM 调用', value: String(stats.llmCalls) },
            { icon: 'fa-wrench', color: '#f59e0b', label: 'Tool 调用', value: String(stats.toolCalls) },
            { icon: 'fa-coins', color: '#00d4aa', label: 'Token 用量', value: stats.tokens.toLocaleString() },
            { icon: 'fa-clock', color: '#ec4899', label: '已用时间', value: formatTime(stats.elapsed) },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className={cn('fas', stat.icon)} style={{ color: stat.color, fontSize: 13 }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</span>
              <span className="font-mono" style={{ fontSize: 14, fontWeight: 600 }}>{stat.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>报告进度</span>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${progress}%`,
                background: isCompleted ? '#10b981' : undefined,
              }}
            />
          </div>
          <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: isCompleted ? '#10b981' : 'var(--accent)' }}>
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
