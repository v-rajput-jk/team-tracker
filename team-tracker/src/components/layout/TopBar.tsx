import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Bell, Moon, Sun, ChevronDown, X, Menu,
  AlertTriangle, CheckCircle2, ClipboardList, AlertCircle,
  User, LogOut, HelpCircle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useUser } from '../../context/UserContext';
import { useMsal } from '@azure/msal-react';
import { notifications } from '../../data/mockData';

const pageHeaders: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Team Overview', subtitle: 'Monitor your team\'s performance at a glance' },
  '/tasks': { title: 'Task Management', subtitle: 'Assign, track, and manage team tasks' },
  '/attendance': { title: 'Attendance Tracker', subtitle: 'Track team presence and work hours' },
  '/schedule': { title: 'Workload Schedule', subtitle: 'Weekly workload and hours per team member' },
  '/overtime': { title: 'Overtime & Extra Work', subtitle: 'Monitor extended hours and urgent tasks' },
  '/performance': { title: 'Performance Dashboard', subtitle: 'Analyze individual and team metrics' },
  '/settings': { title: 'Account Settings', subtitle: 'Manage your profile and preferences' },
};

function getNotificationIcon(type: string) {
  switch (type) {
    case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'assigned': return <ClipboardList className="w-4 h-4 text-primary-500" />;
    case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
    default: return <Bell className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />;
  }
}

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { profile } = useUser();
  const { instance } = useMsal();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentPage = pageHeaders[location.pathname] || pageHeaders['/'];
  const unreadCount = notifications.filter(n => !n.read && !readNotifications.has(n.id)).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = () => {
    setReadNotifications(new Set(notifications.map(n => n.id)));
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 topbar-bg" style={{ borderBottom: '1px solid var(--border-light)' }}>
      {/* Left: Hamburger + Page Header */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl cursor-pointer" style={{ color: 'var(--text-muted)' }}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{currentPage.title}</h1>
          <p className="text-[10px] sm:text-xs mt-0.5 hidden sm:block" style={{ color: 'var(--text-faint)' }}>{currentPage.subtitle}</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search - hidden on small */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-faint)' }} />
          <input
            id="global-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && showToast(`Searching for: ${searchQuery}`, 'info')}
            placeholder="Search..."
            className="w-40 lg:w-56 pl-9 pr-4 py-2 rounded-xl text-sm theme-input transition-all focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-button"
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all relative cursor-pointer"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-muted)' }}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold badge-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-in-up z-50"
              style={{ background: 'var(--bg-main)', borderColor: 'var(--border-main)', backdropFilter: 'none' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
                <div className="flex items-center gap-2">
                  <button onClick={markAllRead} className="text-[10px] text-primary-500 hover:text-primary-400 font-medium cursor-pointer">Mark all read</button>
                  <button onClick={() => setShowNotifications(false)} className="cursor-pointer" style={{ color: 'var(--text-faint)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map(n => {
                  const isRead = n.read || readNotifications.has(n.id);
                  return (
                    <div key={n.id}
                      onClick={() => setReadNotifications(prev => new Set(prev).add(n.id))}
                      className={`px-4 py-3 transition-colors cursor-pointer ${!isRead ? 'bg-primary-500/[0.05]' : ''}`}
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                          <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>
                            {new Date(n.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!isRead && <div className="w-2 h-2 rounded-full bg-primary-400 mt-1 flex-shrink-0 pulse-dot" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            id="user-profile"
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-2 pl-2 sm:pl-3 pr-2 py-1.5 rounded-xl transition-all cursor-pointer"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[11px] font-bold text-white">
                {profile.initials}
              </div>
            )}
            <div className="text-left hidden xl:block">
              <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{profile.name}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{profile.role}</p>
            </div>
            <ChevronDown className="w-3 h-3 ml-1" style={{ color: 'var(--text-faint)' }} />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-64 border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-in-up z-50" 
              style={{ background: 'var(--bg-main)', borderColor: 'var(--border-main)', backdropFilter: 'none' }}
            >
              {/* Profile header */}
              <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-3">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Profile" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-bold text-white">
                      {profile.initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{profile.email}</p>
                  </div>
                </div>
              </div>
              {/* Menu items */}
              <div className="py-1">
                {[
                  { icon: User, label: 'Profile Settings', action: () => navigate('/settings') },
                  { icon: HelpCircle, label: 'Help Center', action: () => showToast('Help Center coming soon!', 'info') },
                ].map(item => (
                  <button key={item.label} onClick={() => { item.action(); setShowProfile(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-overlay)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <item.icon className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />
                    {item.label}
                  </button>
                ))}
              </div>
              {/* Logout */}
              <div style={{ borderTop: '1px solid var(--border-light)' }}>
                <button onClick={() => { 
                  showToast('Logging out...', 'info'); 
                  localStorage.removeItem('teampulse-user-profile');
                  instance.logoutPopup().catch(e => console.error(e));
                }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer">
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
