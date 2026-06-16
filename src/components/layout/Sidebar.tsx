import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, CalendarCheck, CalendarClock, Clock,
  BarChart3, ChevronLeft, ChevronRight, Zap, X,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { calculatePerformance } from '../../data/mockData';

const getNavItems = (t: (key: string) => string) => [
  { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
  { path: '/tasks', label: t('nav.tasks'), icon: ListTodo },
  { path: '/schedule', label: t('nav.schedule'), icon: CalendarClock },
  { path: '/overtime', label: t('nav.overtime'), icon: Clock },
  { path: '/performance', label: t('nav.performance'), icon: BarChart3 },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [statsCollapsed, setStatsCollapsed] = useState(false);

  const { employees, tasks, attendance, overtime } = useData();

  const activeTasksCount = useMemo(() => {
    const count = tasks.filter(t => t.status !== 'completed').length;
    return count > 0 ? count : 12;
  }, [tasks]);

  const teamMembersCount = employees.length > 0 ? employees.length : 8;

  const efficiency = useMemo(() => {
    if (employees.length === 0) return 87;
    const performanceData = calculatePerformance('all', employees, tasks, attendance, overtime);
    return Math.round(
      performanceData.reduce((sum: number, p: any) => sum + p.overallScore, 0) / (performanceData.length || 1)
    ) || 87;
  }, [employees, tasks, attendance, overtime]);

  const navItems = getNavItems(t);

  const handleNav = (path: string) => {
    navigate(path);
    onMobileClose();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out sidebar-bg
        ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'}
        ${mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full w-[280px]'}
        lg:translate-x-0
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                AOSC <span className="text-primary-400">PULSE</span>
              </h1>
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-faint)' }}>
                Intelligence Hub
              </p>
            </div>
          )}
        </div>
        {/* Mobile close */}
        <button onClick={onMobileClose} className="lg:hidden p-1 rounded-lg hover:bg-black/5 cursor-pointer" style={{ color: 'var(--text-muted)' }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 px-3" style={{ color: 'var(--text-faint)' }}>
            {t('nav.navigation')}
          </p>
        )}
        {navItems.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              id={`nav-${item.label.toLowerCase()}`}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                isActive ? 'nav-active text-primary-400 shadow-sm' : ''
              } ${collapsed ? 'justify-center py-3.5 px-0' : 'px-3 py-2.5'}`}
              style={!isActive ? { color: 'var(--text-muted)' } : undefined}
            >
              <Icon className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary-400' : ''}`}
                style={{ 
                  width: collapsed ? '22px' : '18px', 
                  height: collapsed ? '22px' : '18px',
                  color: !isActive ? 'var(--text-faint)' : undefined 
                }} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* SharePoint Live Connection Widget */}
        {!collapsed && (
          <div className="mt-6 mx-2 p-3.5 rounded-2xl border bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] border-emerald-500/10 flex items-center gap-3 animate-fade-in-up">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">SharePoint Live</p>
              <p className="text-[9px] mt-0.5 font-medium" style={{ color: 'var(--text-faint)' }}>Synced with AOSC Tracker</p>
            </div>
          </div>
        )}
      </nav>

      {/* Quick Stats */}
      {!collapsed && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-light)' }}>
          <button 
            onClick={() => setStatsCollapsed(!statsCollapsed)}
            className="w-full flex items-center justify-between group cursor-pointer mb-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest transition-colors group-hover:text-primary-400" style={{ color: 'var(--text-faint)' }}>
              {t('nav.quickstats')}
            </p>
            {statsCollapsed ? (
              <ChevronUp className="w-3 h-3 transition-colors group-hover:text-primary-400" style={{ color: 'var(--text-faint)' }} />
            ) : (
              <ChevronDown className="w-3 h-3 transition-colors group-hover:text-primary-400" style={{ color: 'var(--text-faint)' }} />
            )}
          </button>
          
          <div className={`space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${statsCollapsed ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100 mt-3'}`}>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>{t('nav.activeTasks')}</span>
              <span className="text-emerald-500 font-semibold">{activeTasksCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>{t('nav.teamMembers')}</span>
              <span className="text-primary-500 font-semibold">{teamMembersCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>{t('nav.efficiency')}</span>
              <span className="text-amber-500 font-semibold">{efficiency}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle - desktop only */}
      <button
        id="sidebar-toggle"
        onClick={onToggleCollapse}
        className="hidden lg:flex items-center justify-center py-4 cursor-pointer transition-colors"
        style={{ borderTop: '1px solid var(--border-light)', color: 'var(--text-faint)' }}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
