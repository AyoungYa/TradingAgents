// 分析报告页面
import { useState } from 'react';
import { cn } from '@/utils/cn';

/** 报告区块配置 */
interface SectionConfig {
  id: string;
  index: string;
  title: string;
  bgColor: string;
  textColor: string;
  tabs?: { id: string; label: string }[];
  defaultTab?: string;
  content: Record<string, React.ReactNode>;
}

/** 模拟报告区块 */
const sections: SectionConfig[] = [
  {
    id: 'analyst', index: 'I', title: 'Analyst Team Reports',
    bgColor: 'var(--accent-dim)', textColor: 'var(--accent)',
    tabs: [
      { id: 'market', label: 'Market' },
      { id: 'social', label: 'Social' },
      { id: 'news', label: 'News' },
      { id: 'fund', label: 'Fundamentals' },
    ],
    defaultTab: 'market',
    content: {
      market: (
        <div className="report-content">
          <h3>Market Analyst Report - NVDA</h3>
          <p><strong>Technical Overview:</strong> NVDA is currently trading above its 50-day and 200-day moving averages, indicating a strong bullish trend. The RSI stands at 62.4, suggesting the stock is approaching overbought territory but still has room for upward movement.</p>
          <p><strong>Key Technical Indicators:</strong></p>
          <ul>
            <li><strong>MACD:</strong> Bullish crossover confirmed on April 18, with histogram expanding positively</li>
            <li><strong>Bollinger Bands:</strong> Price trading near upper band, indicating strong momentum</li>
            <li><strong>Volume:</strong> 45.2M average daily volume, 20% above 30-day average</li>
            <li><strong>Support/Resistance:</strong> Immediate support at $135.20, resistance at $148.75</li>
          </ul>
          <p><strong>Conclusion:</strong> Technical indicators overwhelmingly support a <strong>BUY</strong> signal with a target price of $155-$160 within the next 30 days.</p>
        </div>
      ),
      social: (
        <div className="report-content">
          <h3>Social Media Analyst Report - NVDA</h3>
          <p><strong>Sentiment Analysis:</strong> Social media sentiment for NVDA remains strongly positive across all major platforms.</p>
          <ul>
            <li><strong>Twitter/X:</strong> 78% positive sentiment, driven by AI/ML discussion threads</li>
            <li><strong>Reddit (r/wallstreetbets):</strong> High mention frequency, predominantly bullish calls</li>
            <li><strong>StockTwits:</strong> Bullish messages outnumber bearish by 4.2:1 ratio</li>
          </ul>
          <p><strong>Conclusion:</strong> Social sentiment strongly supports a <strong>BUY</strong> recommendation.</p>
        </div>
      ),
      news: (
        <div className="report-content">
          <h3>News Analyst Report - NVDA</h3>
          <p><strong>Recent Headlines:</strong></p>
          <ul>
            <li>NVIDIA announces next-gen Blackwell Ultra GPU with 2x performance gains</li>
            <li>Major cloud providers (AWS, Azure, GCP) expand NVIDIA GPU deployments</li>
            <li>NVIDIA Q1 2027 earnings beat estimates by 12%, revenue guidance raised</li>
          </ul>
          <p><strong>Conclusion:</strong> News analysis supports a <strong>BUY</strong> recommendation.</p>
        </div>
      ),
      fund: (
        <div className="report-content">
          <h3>Fundamentals Analyst Report - NVDA</h3>
          <p><strong>Financial Metrics:</strong></p>
          <ul>
            <li><strong>P/E Ratio:</strong> 42.5x (forward), above sector average of 28x but justified by growth</li>
            <li><strong>Revenue Growth:</strong> 78% YoY, data center segment up 125%</li>
            <li><strong>Gross Margin:</strong> 75.2%, expanding from 72.1% in prior quarter</li>
            <li><strong>Free Cash Flow:</strong> $8.2B, up 65% YoY</li>
          </ul>
          <p><strong>Conclusion:</strong> Fundamentals support a <strong>BUY</strong> with strong conviction.</p>
        </div>
      ),
    },
  },
  {
    id: 'research', index: 'II', title: 'Research Team Decision',
    bgColor: 'rgba(99,102,241,0.15)', textColor: '#818cf8',
    tabs: [
      { id: 'bull', label: 'Bull Case' },
      { id: 'bear', label: 'Bear Case' },
      { id: 'manager', label: 'Manager' },
    ],
    defaultTab: 'bull',
    content: {
      bull: (
        <div className="report-content">
          <h3>Bull Research Perspective</h3>
          <p>NVIDIA's competitive moat in AI/ML accelerators is widening. The Blackwell architecture represents a generational leap in compute density and energy efficiency.</p>
          <ul>
            <li>Dominant market share (&gt;80%) in AI training accelerators</li>
            <li>CUDA ecosystem creates massive switching costs</li>
            <li>Software revenue (CUDA, Enterprise AI) growing 3x faster than hardware</li>
          </ul>
          <p><strong>Price Target:</strong> $175 (30% upside)</p>
        </div>
      ),
      bear: (
        <div className="report-content">
          <h3>Bear Research Perspective</h3>
          <p>While NVIDIA's current position is strong, several risks warrant caution. Custom silicon efforts by major cloud providers could erode NVIDIA's market share.</p>
          <ul>
            <li>Valuation premium assumes perpetual hypergrowth</li>
            <li>Customer concentration risk (top 5 customers = 65% of revenue)</li>
            <li>Potential export restrictions to China</li>
          </ul>
          <p><strong>Downside Target:</strong> $105 (25% downside)</p>
        </div>
      ),
      manager: (
        <div className="report-content">
          <h3>Research Manager Decision</h3>
          <p>After carefully weighing both the bull and bear perspectives, the Research Manager concludes that the bull case significantly outweighs the bear case.</p>
          <blockquote>"The combination of NVIDIA's technological leadership and the CUDA ecosystem moat creates a compelling investment case."</blockquote>
          <p><strong>Recommendation:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>BUY</span> | <strong>Conviction:</strong> High</p>
        </div>
      ),
    },
  },
  {
    id: 'trading', index: 'III', title: 'Trading Team Plan',
    bgColor: 'rgba(245,158,11,0.15)', textColor: '#f59e0b',
    content: {
      default: (
        <div className="report-content">
          <h3>Trading Plan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '16px 0' }}>
            <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Entry Price</div>
              <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: '#10b981' }}>$142.50</div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Stop Loss</div>
              <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>$128.00</div>
            </div>
            <div style={{ background: 'rgba(0,212,170,0.08)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Take Profit</div>
              <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>$165.00</div>
            </div>
          </div>
          <p><strong>Position Sizing:</strong> Recommended 5% of portfolio value. Risk/reward ratio of 1:1.6.</p>
          <p><strong>Execution Strategy:</strong> Scale in over 2-3 days using limit orders.</p>
        </div>
      ),
    },
  },
  {
    id: 'risk', index: 'IV', title: 'Risk Management Team Decision',
    bgColor: 'rgba(236,72,153,0.15)', textColor: '#ec4899',
    tabs: [
      { id: 'aggressive', label: 'Aggressive' },
      { id: 'conservative', label: 'Conservative' },
      { id: 'neutral', label: 'Neutral' },
    ],
    defaultTab: 'aggressive',
    content: {
      aggressive: (
        <div className="report-content">
          <h3>Aggressive Risk Profile</h3>
          <p><strong>Position Size:</strong> 8% of portfolio | <strong>Leverage:</strong> None</p>
          <p><strong>Recommendation:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>APPROVE BUY</span> - 8% allocation</p>
        </div>
      ),
      conservative: (
        <div className="report-content">
          <h3>Conservative Risk Profile</h3>
          <p><strong>Position Size:</strong> 3% of portfolio | <strong>Leverage:</strong> None</p>
          <p><strong>Recommendation:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>APPROVE BUY</span> - 3% allocation, add on dips below $135</p>
        </div>
      ),
      neutral: (
        <div className="report-content">
          <h3>Neutral Risk Profile</h3>
          <p><strong>Position Size:</strong> 5% of portfolio | <strong>Leverage:</strong> None</p>
          <p><strong>Recommendation:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>APPROVE BUY</span> - 5% allocation</p>
        </div>
      ),
    },
  },
  {
    id: 'portfolio', index: 'V', title: 'Portfolio Manager Decision',
    bgColor: 'rgba(16,185,129,0.15)', textColor: '#10b981',
    content: {
      default: (
        <div className="report-content">
          <h3>Portfolio Manager Final Decision</h3>
          <blockquote>"After reviewing the comprehensive analysis from all teams, I approve the BUY recommendation for NVDA."</blockquote>
          <p><strong>Final Decision:</strong> <span style={{ color: '#10b981', fontSize: 18, fontWeight: 700 }}>BUY</span></p>
          <p><strong>Confidence Level:</strong> 87% | <strong>Allocation:</strong> 5% of portfolio</p>
          <p><strong>Next Review Date:</strong> 2026-05-22 (30 days)</p>
        </div>
      ),
    },
  },
];

export default function Report() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['analyst']));
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({
    analyst: 'market',
    research: 'bull',
    risk: 'aggressive',
  });

  /** 切换区块展开/收起 */
  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="animate-fade-in">
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            <span className="font-mono" style={{ color: 'var(--accent)' }}>NVDA</span> 分析报告
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>生成时间: 2026-04-22 14:32:18 | 耗时: 4分12秒</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary"><i className="fas fa-file-pdf" /> 导出 PDF</button>
          <button className="btn-secondary"><i className="fas fa-file-code" /> 导出 Markdown</button>
        </div>
      </div>

      {/* 信号卡片 */}
      <div className="signal-buy" style={{ borderRadius: 16, padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>最终交易信号</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#10b981', letterSpacing: 2 }}>BUY</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>NVIDIA Corporation (NVDA)</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>置信度</div>
          <div className="font-mono" style={{ fontSize: 48, fontWeight: 700, color: '#10b981' }}>87<span style={{ fontSize: 24 }}>%</span></div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>建议入场价: $142.50</div>
        </div>
      </div>

      {/* 可折叠区块 */}
      <div style={{ display: 'grid', gap: 12 }}>
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const hasTabs = section.tabs && section.tabs.length > 0;
          const activeTab = activeTabs[section.id] || section.defaultTab || 'default';

          return (
            <div key={section.id} className="glass-card" style={{ overflow: 'hidden' }}>
              <button
                className="collapsible-header"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: section.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontWeight: 700, color: section.textColor, fontSize: 14 }}>{section.index}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{section.title}</span>
                </div>
                <i
                  className="fas fa-chevron-down"
                  style={{ color: 'var(--text-muted)', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : undefined }}
                  aria-hidden="true"
                />
              </button>
              <div className={cn('collapsible-body', isExpanded && 'open')}>
                <div style={{ padding: '0 20px 20px' }}>
                  {/* Tab 切换 */}
                  {hasTabs && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                      {section.tabs!.map((tab) => (
                        <button
                          key={tab.id}
                          className={cn('tab-btn', activeTab === tab.id && 'active')}
                          onClick={() => setActiveTabs((prev) => ({ ...prev, [section.id]: tab.id }))}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* 内容 */}
                  {section.content[activeTab] || section.content['default']}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
