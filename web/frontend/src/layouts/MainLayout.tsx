// 主布局组件
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main
        className="main-content"
        id="main-content"
        role="main"
        aria-label="主内容区域"
        style={{
          marginLeft: 260,
          minHeight: '100vh',
          padding: '24px 32px',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
