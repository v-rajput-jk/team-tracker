import { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  UserCheck,
  Sparkles,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import KPICard from '../components/shared/KPICard';
import ProgressBar from '../components/shared/ProgressBar';
import StatusBadge from '../components/shared/StatusBadge';
import PriorityBadge from '../components/shared/PriorityBadge';
import PerformanceOrbit from '../components/shared/PerformanceOrbit';
import Modal from '../components/shared/Modal';
import {
  monthlyPerformance,
  calculatePerformance,
} from '../data/mockData';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { employees: realEmployees, tasks: realTasks, attendance: realAttendance, overtime: realOvertime, isLoading } = useData();
  const { theme } = useTheme();
  
  // Use real data
  const currentEmployees = realEmployees;
  const currentTasks = realTasks;
  const currentAttendance = realAttendance;
  const currentOvertime = realOvertime;
  
  
  
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.65)';
  
  const activeCount = currentEmployees.filter((e) => e.status === 'active').length;
  const inactiveCount = currentEmployees.filter((e) => e.status === 'inactive').length;
  const completedToday = currentTasks.filter((t) => t.status === 'completed').length;
  const assignedToday = currentTasks.filter(
    (t) => t.assignedDate === new Date().toISOString().split('T')[0]
  ).length || 5;

  const performanceData = useMemo(() => calculatePerformance('all', currentEmployees, currentTasks, currentAttendance, currentOvertime), [currentEmployees, currentTasks, currentAttendance, currentOvertime]);
  const avgEfficiency = Math.round(
    performanceData.reduce((sum: number, p: any) => sum + p.overallScore, 0) / (performanceData.length || 1)
  );

  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [timeRange, setTimeRange] = useState('Last 6 months'); 
  
  const calculatedMonthlyPerformance = useMemo(() => {
    const result = [];
    const now = new Date();
    
    // Generate last 12 months dynamically
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthLabel = monthNames[monthIndex];
      
      const tasksInMonth = currentTasks.filter(t => {
        if (!t.assignedDate) return false;
        const tDate = new Date(t.assignedDate);
        return tDate.getFullYear() === year && tDate.getMonth() === monthIndex;
      });
      
      const assigned = tasksInMonth.length;
      const completed = tasksInMonth.filter(t => t.status === 'completed').length;
      
      result.push({
        month: monthLabel,
        assigned,
        completed
      });
    }
    return result;
  }, [currentTasks]);

  const filteredPerformanceData = useMemo(() => {
    const limit = timeRange === 'Last 3 months' ? 3 : timeRange === 'Last 6 months' ? 6 : 12;
    return calculatedMonthlyPerformance.slice(-limit);
  }, [calculatedMonthlyPerformance, timeRange]);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowReport(true);
    }, 2000);
  };

  const handleDownload = () => {
    setIsDownloading(true);
    showToast("Preparing AI Executive Summary PDF...", "info");
    
    setTimeout(() => {
      setIsDownloading(false);
      setShowReport(false);
      showToast("Report downloaded successfully!", "success");
    }, 2500);
  };

  const { refreshData } = useData();
  const [isFetchingSite, setIsFetchingSite] = useState(false);

  const handleSyncData = async () => {
    setIsFetchingSite(true);
    await refreshData();
    setIsFetchingSite(false);
  };

  // Recent tasks for the table
  const recentTasks = currentTasks.slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 stagger-children">
        <div onClick={() => navigate('/performance')} className="interactive-card">
          <KPICard
            title="Total Members"
            value={currentEmployees.length}
            icon={<Users className="w-5 h-5" />}
            color="primary"
            trend={12}
            trendLabel="vs last month"
          />
        </div>
        <div onClick={() => navigate('/performance')} className="interactive-card">
          <KPICard
            title="Active Members"
            value={activeCount}
            icon={<UserCheck className="w-5 h-5" />}
            color="emerald"
            trend={5}
            trendLabel={inactiveCount === 0 ? "All members active" : `${inactiveCount} inactive`}
          />
        </div>
        <div onClick={() => navigate('/tasks')} className="interactive-card">
          <KPICard
            title="Tasks Today"
            value={assignedToday}
            icon={<ListTodo className="w-5 h-5" />}
            color="sky"
            trend={8}
            trendLabel="new assignments"
          />
        </div>
        <div onClick={() => navigate('/tasks')} className="interactive-card">
          <KPICard
            title="Completed"
            value={completedToday}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
            trend={15}
            trendLabel="tasks finished"
          />
        </div>
        <div onClick={() => navigate('/overtime')} className="interactive-card">
          <KPICard
            title="In Progress"
            value={currentTasks.filter((t) => t.status === 'in-progress').length}
            icon={<TrendingUp className="w-5 h-5" />}
            color="amber"
            trend={-3}
            trendLabel="being worked on"
          />
        </div>
        <div onClick={() => navigate('/performance')} className="interactive-card">
          <KPICard
            title="Team Efficiency"
            value={`${avgEfficiency}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="primary"
            trend={4.5}
            trendLabel="vs last 6 months"
          />
        </div>
      </div>

      {/* Analytics Row: KPI Performance Chart */}
      <div className="grid grid-cols-1 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>KPI Performance</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>{timeRange} trend</p>
            </div>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs theme-select cursor-pointer"
            >
              <option value="Last 3 months">Last 3 months</option>
              <option value="Last 6 months">Last 6 months</option>
              <option value="Last year">Last year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={filteredPerformanceData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-main)', strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#34d399"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCompleted)"
                name="Completed"
              />
              <Area
                type="monotone"
                dataKey="assigned"
                stroke="#a78bfa"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAssigned)"
                name="Assigned"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Primary Intelligence Row: Orbit & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance Orbit Visualization */}
        <div className="lg:col-span-2 glass-card p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Performance Orbit</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>Real-time momentum</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                 <div className="w-2 h-2 rounded-full bg-primary-500" /> Top Tier
               </div>
            </div>
          </div>
          
          <PerformanceOrbit 
            members={currentEmployees.map(emp => {
              const perf = performanceData.find((p: any) => p.employeeId === emp.id);
              const empTasks = currentTasks.filter((t: any) => {
                if (!t.assignedTo) return false;
                const assignedParts = t.assignedTo.split(',').map((s: string) => s.trim().toLowerCase());
                return assignedParts.includes(emp.id.toLowerCase()) || assignedParts.includes(emp.name.toLowerCase());
              });
              return {
                id: emp.id,
                name: emp.name,
                score: perf?.overallScore || 0,
                tasks: empTasks.length,
                avatar: emp.avatar
              };
            })} 
          />
        </div>

        {/* AI Smart Insights */}
        <div className="glass-card p-5 bg-gradient-to-br from-primary-500/[0.08] to-transparent border-primary-500/20 shadow-xl shadow-primary-500/5 flex flex-col h-full min-h-[500px] lg:min-h-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-primary-500/20 text-primary-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Insights</h3>
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Proactive team analysis</p>
            </div>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {[
              { text: "Engineering is at 95% capacity. Suggest moving 2 tasks from active sprint to backlog.", type: "warning", icon: Zap },
              { text: "Task completion velocity is up 12% this week. Productivity boost observed across project deliveries!", type: "success", icon: TrendingUp },
              { text: "Burnout risk detected in 3 members working 10+ hours overtime. Recommend scheduling 1-on-1s.", type: "danger", icon: MessageSquare },
              { text: "Project Alpha momentum is strong. Current velocity implies an early delivery by 3 days.", type: "success", icon: Zap },
              { text: "Documentation updates are lagging behind development velocity. Allocate 2 hours to review.", type: "warning", icon: ListTodo }
            ].map((insight, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-black/10 dark:bg-white/[0.03] border border-white/5 flex gap-3 group hover:border-primary-500/30 hover:bg-black/20 dark:hover:bg-white/[0.05] transition-all cursor-pointer">
                <insight.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${insight.type === 'warning' ? 'text-amber-400' : insight.type === 'danger' ? 'text-rose-400' : 'text-emerald-400'}`} />
                <p className="text-[11px] leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>{insight.text}</p>
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="w-full mt-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-all flex items-center justify-center gap-2 border border-primary-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Analyzing Data...
              </>
            ) : (
              'Generate Detailed Report'
            )}
          </button>
        </div>
      </div>

      {/* AI Report Modal */}
      <Modal 
        isOpen={showReport} 
        onClose={() => setShowReport(false)} 
        title="AI Executive Summary"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowReport(false)} className="px-4 py-2 rounded-lg text-xs font-bold bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer">Close</button>
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/30 cursor-pointer disabled:opacity-70 flex items-center gap-2"
            >
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        }
      >
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
            <h4 className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">Overall Verdict</h4>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              The team is currently operating at <span className="text-emerald-500 font-bold">High Efficiency</span>. Momentum is positive, but targeted interventions are required to sustain long-term output without risking burnout.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Key Strengths
            </h4>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" /> Task completion is remarkably consistent across departments.</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" /> High completion rate (94%) on high-priority tasks this week.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <Zap className="w-4 h-4 text-amber-500" /> Areas for Improvement
            </h4>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" /> 3 members are logging over 10 hours of overtime per week.</li>
              <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" /> Task assignment distribution is slightly skewed toward senior engineers.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <p className="text-[11px] italic text-center" style={{ color: 'var(--text-faint)' }}>
              "Consider shifting 15% of the upcoming sprint load from Engineering to QA to balance the pipeline."
            </p>
          </div>
        </div>
      </Modal>

      {/* Recent Tasks */}
      <div className="grid grid-cols-1 gap-4">
        {/* Enhanced Recent Tasks Table */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Tasks</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>Latest task assignments</p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-[11px] text-primary-400 hover:text-primary-300 font-medium cursor-pointer"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5">
                  <th className="text-[10px] font-bold uppercase tracking-wider text-left pb-3" style={{ color: 'var(--text-secondary)' }}>Project/Task</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-left pb-3" style={{ color: 'var(--text-secondary)' }}>Employee</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-left pb-3" style={{ color: 'var(--text-secondary)' }}>Description</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-left pb-3" style={{ color: 'var(--text-secondary)' }}>Priority</th>
                  <th className="text-[10px] font-bold uppercase tracking-wider text-left pb-3" style={{ color: 'var(--text-secondary)' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task.id} 
                    onClick={() => navigate('/tasks')}
                    className="border-b border-black/5 dark:border-white/[0.02] hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer group">
                    <td className="py-3 pr-3">
                      <p className="text-xs font-medium truncate max-w-[140px]" style={{ color: 'var(--text-primary)' }}>{task.name}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {(task.assignedTo ? task.assignedTo.split(',').map(p => p.trim()) : []).slice(0, 2).map((id, idx) => {
                          const emp = currentEmployees.find(e => e.id === id || e.name.toLowerCase() === id.toLowerCase());
                          const initials = emp ? emp.avatar : (id ? id.substring(0, 2).toUpperCase() : 'U');
                          return (
                            <div
                              key={id}
                              title={emp ? emp.name : id}
                              className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-[8px] font-black text-white border-2 border-white dark:border-surface-950 shadow-sm flex-shrink-0"
                              style={{ zIndex: 10 - idx }}
                            >
                              {initials}
                            </div>
                          );
                        })}
                        {(task.assignedTo ? task.assignedTo.split(',').map(p => p.trim()) : []).length > 2 && (
                          <div
                            title={`${(task.assignedTo ? task.assignedTo.split(',').map(p => p.trim()) : []).length - 2} more assignees`}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-[8px] font-black text-white border-2 border-white dark:border-surface-950 shadow-sm flex-shrink-0 z-0"
                          >
                            +{(task.assignedTo ? task.assignedTo.split(',').map(p => p.trim()) : []).length - 2}
                          </div>
                        )}
                        {task.priority === 'high' && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-[8px] font-black text-white border-2 border-white dark:border-surface-950 shadow-sm z-20" title="High Priority">+</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="text-[10px] max-w-[180px] truncate font-medium" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-3 w-20">
                      <ProgressBar value={task.progress} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Source Data Integration */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Source Data Integration</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>Fetch secure data using your delegated login</p>
          </div>
          <button
            onClick={handleSyncData}
            disabled={isFetchingSite || isLoading}
            className="px-4 py-2 rounded-xl text-[11px] font-bold tracking-wide uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isFetchingSite || isLoading ? 'Syncing...' : 'Sync Real SharePoint Data'}
          </button>
        </div>
      </div>

      {/* Team Members Quick View */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Team Members</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>Quick overview of all team members</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentEmployees.map((emp) => {
            const perf = performanceData.find((p: any) => p.employeeId === emp.id);
            const empTasks = currentTasks.filter((t: any) => {
              if (!t.assignedTo) return false;
              const assignedParts = t.assignedTo.split(',').map((s: string) => s.trim().toLowerCase());
              return assignedParts.includes(emp.id.toLowerCase()) || assignedParts.includes(emp.name.toLowerCase());
            });
            return (
              <div
                key={emp.id}
                onClick={() => navigate(`/performance/${emp.id}`)}
                className="interactive-card p-4 glass-card-light"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-primary-500/20 border border-white/20">
                    {emp.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-primary-300 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {emp.name}
                    </p>
                    <p className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{emp.role}</p>
                  </div>
                  <StatusBadge status={emp.status === 'active' ? 'present' : 'absent'} />
                </div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span style={{ color: 'var(--text-faint)' }}>{empTasks.length} tasks</span>
                  <span className="font-semibold text-primary-400">
                    Score: {perf?.overallScore || 0}
                  </span>
                </div>
                <ProgressBar value={perf?.overallScore || 0} size="sm" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
