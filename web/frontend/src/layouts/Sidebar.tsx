// 侧边栏导航组件
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';

/** 导航项配置 */
interface NavItem {
  path: string;
  icon: string;
  label: string;
  section: 'main' | 'manage';
}

const navItems: NavItem[] = [
  { path: '/', icon: 'fa-th-large', label: '仪表盘', section: 'main' },
  { path: '/analysis/new', icon: 'fa-plus-circle', label: '新建分析', section: 'main' },
  { path: '/analysis/live', icon: 'fa-play-circle', label: '实时分析', section: 'main' },
  { path: '/report', icon: 'fa-file-alt', label: '分析报告', section: 'main' },
  { path: '/history', icon: 'fa-history', label: '历史报告', section: 'manage' },
  { path: '/settings', icon: 'fa-cog', label: '系统设置', section: 'manage' },
];

export default function Sidebar() {
  const location = useLocation();

  /** 判断导航项是否激活 */
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="sidebar"
      style={{
        width: 260,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00d4aa, #00b894)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="fas fa-chart-line" style={{ color: '#0a0e1a', fontSize: 16 }} />
          </div>
          <div className="logo-text">
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              TradingAgents
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-Agent Platform</div>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav style={{ padding: '12px', flex: 1 }} aria-label="主导航">
        <div
          className="nav-text"
          style={{
            marginBottom: 8,
            padding: '0 8px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Main
        </div>
        {navItems
          .filter((item) => item.section === 'main')
          .map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn('nav-item', isActive(item.path) && 'active')}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <i
                className={cn('fas', item.icon)}
                style={{ width: 18, textAlign: 'center' }}
                aria-hidden="true"
              />
              <span className="nav-text">{item.label}</span>
            </Link>
          ))}

        <div
          className="nav-text"
          style={{
            margin: '16px 0 8px',
            padding: '0 8px',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Manage
        </div>
        {navItems
          .filter((item) => item.section === 'manage')
          .map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn('nav-item', isActive(item.path) && 'active')}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              <i
                className={cn('fas', item.icon)}
                style={{ width: 18, textAlign: 'center' }}
                aria-hidden="true"
              />
              <span className="nav-text">{item.label}</span>
            </Link>
          ))}
      </nav>

      {/* 用户信息 */}
      <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            A
          </div>
          <div className="user-info">
            <div style={{ fontSize: 13, fontWeight: 600 }}>Admin</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pro Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
