// 历史报告页面
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HistoryReport } from '@/types/report';

/** 模拟历史报告数据 */
const mockReports: HistoryReport[] = [
  { id: '1', ticker: 'NVDA', companyName: 'NVIDIA Corporation', signal: 'buy', confidence: 87, date: '2026-04-22', duration: '4m 12s', status: 'completed' },
  { id: '2', ticker: 'AAPL', companyName: 'Apple Inc', signal: 'hold', confidence: 62, date: '2026-04-21', duration: '3m 45s', status: 'completed' },
  { id: '3', ticker: 'TSLA', companyName: 'Tesla Inc', signal: 'sell', confidence: 74, date: '2026-04-20', duration: '5m 08s', status: 'completed' },
  { id: '4', ticker: 'MSFT', companyName: 'Microsoft Corp', signal: 'buy', confidence: 91, date: '2026-04-19', duration: '4m 32s', status: 'completed' },
  { id: '5', ticker: 'GOOGL', companyName: 'Alphabet Inc', signal: 'buy', confidence: 79, date: '2026-04-18', duration: '3m 58s', status: 'completed' },
  { id: '6', ticker: 'AMZN', companyName: 'Amazon.com Inc', signal: 'buy', confidence: 83, date: '2026-04-17', duration: '4m 45s', status: 'completed' },
];

/** 信号颜色映射 */
const signalColors: Record<string, string> = {
  buy: '#10b981',
  hold: '#f59e0b',
  sell: '#ef4444',
};

export default function History() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [signalFilter, setSignalFilter] = useState('all');

  /** 过滤报告 */
  const filteredReports = mockReports.filter((r) => {
    if (search && !r.ticker.toLowerCase().includes(search.toLowerCase()) && !r.companyName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (signalFilter !== 'all' && r.signal !== signalFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>历史报告</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>查看和管理所有历史分析报告</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/analysis/new')}>
          <i className="fas fa-plus" /> 新建分析
        </button>
      </div>

      {/* 搜索筛选 */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px 160px', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>搜索</label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }} />
              <input
                type="text"
                className="input-field"
                placeholder="搜索股票代码或公司名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>开始日期</label>
            <input type="date" className="input-field" defaultValue="2026-01-01" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>结束日期</label>
            <input type="date" className="input-field" defaultValue="2026-04-23" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>决策类型</label>
            <select className="input-field" value={signalFilter} onChange={(e) => setSignalFilter(e.target.value)}>
              <option value="all">全部</option>
              <option value="buy">BUY</option>
              <option value="hold">HOLD</option>
              <option value="sell">SELL</option>
            </select>
          </div>
        </div>
      </div>

      {/* 报告卡片列表 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="glass-card"
            style={{ padding: 20, cursor: 'pointer' }}
            onClick={() => navigate('/report')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: 18, fontWeight: 700 }}>{report.ticker}</span>
                  <span className={`badge badge-${report.signal}`}>{report.signal.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{report.companyName}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: signalColors[report.signal] }}>{report.confidence}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>置信度</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <i className="fas fa-calendar" style={{ marginRight: 6 }} />{report.date}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                <i className="fas fa-clock" style={{ marginRight: 6 }} />{report.duration}
              </span>
              <span className="badge badge-completed">已完成</span>
            </div>
          </div>
        ))}
      </div>

      {/* 对比按钮 */}
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button className="btn-secondary" style={{ padding: '10px 24px' }}>
          <i className="fas fa-columns" /> 对比分析 (选择 2-4 个报告)
        </button>
      </div>
    </div>
  );
}
