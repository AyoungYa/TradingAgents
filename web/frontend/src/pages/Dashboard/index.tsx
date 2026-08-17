// 仪表盘页面
import { useNavigate } from 'react-router-dom';
import type { RecentAnalysis } from '@/types/analysis';

/** 模拟统计数据 */
const stats = {
  totalAnalyses: 247,
  monthlyAnalyses: 38,
  activeStrategies: 12,
  avgDuration: 4.2,
};

/** 模拟最近分析数据 */
const recentAnalyses: RecentAnalysis[] = [
  { id: '1', ticker: 'NVDA', companyName: 'NVIDIA Corp', date: '2026-04-22', signal: 'buy', confidence: 87, status: 'completed' },
  { id: '2', ticker: 'AAPL', companyName: 'Apple Inc', date: '2026-04-21', signal: 'hold', confidence: 62, status: 'completed' },
  { id: '3', ticker: 'TSLA', companyName: 'Tesla Inc', date: '2026-04-20', signal: 'sell', confidence: 74, status: 'completed' },
  { id: '4', ticker: 'MSFT', companyName: 'Microsoft Corp', date: '2026-04-19', signal: 'buy', confidence: 91, status: 'completed' },
  { id: '5', ticker: 'GOOGL', companyName: 'Alphabet Inc', date: '2026-04-18', signal: 'buy', confidence: 79, status: 'running' },
];

/** 信号对应的颜色 */
const signalColors: Record<string, string> = {
  buy: '#10b981',
  hold: '#f59e0b',
  sell: '#ef4444',
};

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>仪表盘</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>欢迎回来，这是您的交易分析概览</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/analysis/new')}>
          <i className="fas fa-plus" /> 新建分析
        </button>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {/* 总分析次数 */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>总分析次数</div>
              <div className="font-mono" style={{ fontSize: 32, fontWeight: 700 }}>{stats.totalAnalyses}</div>
              <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>
                <i className="fas fa-arrow-up" /> 12.5% 较上月
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-chart-bar" style={{ color: 'var(--accent)', fontSize: 18 }} />
            </div>
          </div>
        </div>

        {/* 本月分析 */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>本月分析</div>
              <div className="font-mono" style={{ fontSize: 32, fontWeight: 700 }}>{stats.monthlyAnalyses}</div>
              <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>
                <i className="fas fa-arrow-up" /> 8.3% 较上月
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-calendar-check" style={{ color: '#818cf8', fontSize: 18 }} />
            </div>
          </div>
        </div>

        {/* 活跃策略 */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>活跃策略</div>
              <div className="font-mono" style={{ fontSize: 32, fontWeight: 700 }}>{stats.activeStrategies}</div>
              <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>
                <i className="fas fa-minus" /> 持平
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-chess-knight" style={{ color: 'var(--warning)', fontSize: 18 }} />
            </div>
          </div>
        </div>

        {/* 平均耗时 */}
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>平均耗时</div>
              <div className="font-mono" style={{ fontSize: 32, fontWeight: 700 }}>
                {stats.avgDuration}<span style={{ fontSize: 16, color: 'var(--text-muted)' }}>min</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>
                <i className="fas fa-arrow-down" /> 15% 更快
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-clock" style={{ color: '#ec4899', fontSize: 18 }} />
            </div>
          </div>
        </div>
      </div>

      {/* 最近分析表格 */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>最近分析</h2>
          <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => navigate('/history')}>
            查看全部 <i className="fas fa-arrow-right" style={{ fontSize: 11 }} />
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>股票代码</th>
              <th>分析日期</th>
              <th>最终决策</th>
              <th>信号强度</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {recentAnalyses.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="font-mono" style={{ fontWeight: 600 }}>{item.ticker}</span>{' '}
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.companyName}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{item.date}</td>
                <td>
                  <span className={`badge badge-${item.signal}`}>{item.signal.toUpperCase()}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${item.confidence}%`,
                          background: item.signal === 'sell'
                            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                            : item.signal === 'hold'
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : undefined,
                        }}
                      />
                    </div>
                    <span className="font-mono" style={{ fontSize: 13, color: signalColors[item.signal] }}>
                      {item.confidence}%
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${item.status === 'completed' ? 'completed' : 'running'}`}>
                    {item.status === 'completed' ? '已完成' : '运行中'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 12px', fontSize: 12 }}
                    onClick={() => navigate(item.status === 'running' ? '/analysis/live' : '/report')}
                  >
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
