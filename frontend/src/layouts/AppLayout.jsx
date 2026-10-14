import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { Outlet, useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/analyze': 'Analyze Email',
  '/history': 'Analysis History',
  '/analytics': 'Analytics & Reports',
  '/profile': 'Profile & Settings',
  '/admin': 'Admin Panel',
};

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'SpamShield';

  return (
    <div className={`app-layout ${collapsed ? 'layout--collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="app-main">
        <Topbar onMenuToggle={() => setCollapsed((c) => !c)} title={title} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
