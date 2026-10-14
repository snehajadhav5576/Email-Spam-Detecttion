import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Topbar({ onMenuToggle, title }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <div className="topbar-user">
          <span className="topbar-username">{user?.name}</span>
          <div className="topbar-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
        </div>
      </div>
    </header>
  );
}
