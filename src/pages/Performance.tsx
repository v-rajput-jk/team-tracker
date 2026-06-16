import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  Trophy,
  Target,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import KPICard from '../components/shared/KPICard';
import ProgressBar from '../components/shared/ProgressBar';
import { useData } from '../context/DataContext';
import { calculatePerformance, weeklyTrends } from '../data/mockData';

const COLORS = ['#a78bfa', '#34d399', '#fbbf24', '#f87171', '#38bdf8', '#c084fc', '#fb923c', '#2dd4bf'];

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

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-rose-400';
}

export default function Performance() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { employees, tasks, attendance, overtime } = useData();
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)';

  // Extract all unique projects
  const projects = useMemo(() => {
    return [...new Set(tasks.map(t => t.name).filter(Boolean))] as string[];
  }, [tasks]);

  // Map employee IDs to the list of projects they have worked on
  const employeeProjectsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    employees.forEach(emp => {
      const projs = new Set<string>();
      tasks.forEach(t => {
        if (!t.assignedTo) return;
        const assignedParts = t.assignedTo.split(',').map(s => s.trim().toLowerCase());
        if (assignedParts.includes(emp.id.toLowerCase()) || assignedParts.includes(emp.name.toLowerCase())) {
          if (t.name) projs.add(t.name);
        }
      });
      map[emp.id] = Array.from(projs);
    });
    return map;
  }, [employees, tasks]);

  // Map employee IDs to their overtime records (excluding short-leaves)
  const employeeOvertimeMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    employees.forEach(emp => {
      map[emp.id] = overtime.filter(r => 
        (r.employeeId === emp.id || (r.employeeName?.toLowerCase() === emp.name.toLowerCase())) &&
        r.workType !== 'short-leave'
      );
    });
    return map;
  }, [employees, overtime]);

  // Map employee IDs to their leave records (short-leaves)
  const employeeLeavesMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    employees.forEach(emp => {
      map[emp.id] = overtime.filter(r => 
        (r.employeeId === emp.id || (r.employeeName?.toLowerCase() === emp.name.toLowerCase())) &&
        r.workType === 'short-leave'
      );
    });
    return map;
  }, [employees, overtime]);

  // Filter tasks belonging to the selected project
  const projectTasks = useMemo(() => {
    if (selectedProject === 'all') return tasks;
    return tasks.filter(t => t.name === selectedProject);
  }, [selectedProject, tasks]);

  // Filter employees belonging to the selected project
  const projectEmployees = useMemo(() => {
    if (selectedProject === 'all') return employees;
    return employees.filter(emp => {
      return tasks.some(t => {
        if (t.name !== selectedProject) return false;
        if (!t.assignedTo) return false;
        const assignedParts = t.assignedTo.split(',').map(s => s.trim().toLowerCase());
        return assignedParts.includes(emp.id.toLowerCase()) || assignedParts.includes(emp.name.toLowerCase());
      });
    });
  }, [selectedProject, employees, tasks]);

  const performanceData = useMemo(() => {
    return calculatePerformance(period, projectEmployees, projectTasks, attendance, overtime).sort((a, b) => b.overallScore - a.overallScore);
  }, [period, projectEmployees, projectTasks, attendance, overtime]);

  const topPerformer = performanceData[0];
  
  // Use selected employee or default to top performer
  const activeEmpId = selectedEmpId || topPerformer?.employeeId;
  const activePerf = performanceData.find(p => p.employeeId === activeEmpId) || topPerformer;

  const avgScore = Math.round(
    performanceData.reduce((sum, p) => sum + p.overallScore, 0) / (performanceData.length || 1)
  );
  
  const avgCompletion = Math.round(
    performanceData.reduce((sum, p) => sum + p.taskCompletionRate, 0) / performanceData.length
  );
  const avgAttendance = Math.round(
    performanceData.reduce((sum, p) => sum + p.attendanceScore, 0) / performanceData.length
  );

  // Radar chart data for active employee
  const radarData = activePerf
    ? [
        { metric: 'Task Completion', value: activePerf.taskCompletionRate, fullMark: 100 },
        { metric: 'On-time Delivery', value: activePerf.onTimeDelivery, fullMark: 100 },
        { metric: 'Extra Work', value: activePerf.extraContribution, fullMark: 100 },
        { metric: 'Overall', value: activePerf.overallScore, fullMark: 100 },
      ]
    : [];

  // Score distribution bar
  const scoreDistribution = performanceData.map((p) => ({
    name: p.employeeName.trim().split(' ')[0],
    score: p.overallScore,
    completion: p.taskCompletionRate,
    attendance: p.attendanceScore,
  }));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header with Project and Period Select */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Performance Analytics</h2>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Insights into team productivity and efficiency by project</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedEmpId(null);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold theme-select cursor-pointer border bg-black/5 dark:bg-white/[0.04]"
              style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Period Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/[0.04] border" style={{ borderColor: 'var(--border-light)' }}>
            {['week', 'month', 'year', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize ${
                  period === p 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{ color: period === p ? 'white' : 'var(--text-muted)' }}
              >
                {p === 'all' ? 'All time' : p}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <KPICard
          title="Team Avg Score"
          value={`${avgScore}/100`}
          icon={<Target className="w-5 h-5" />}
          color="primary"
          trend={4.5}
          trendLabel="vs last month"
        />
        <KPICard
          title="Top Contributor"
          value={topPerformer?.employeeName.split(' ')[0] || '—'}
          icon={<Trophy className="w-5 h-5" />}
          color="amber"
          trend={topPerformer?.overallScore}
          trendLabel={`Score: ${topPerformer?.overallScore}`}
        />
        <KPICard
          title="Avg Completion Rate"
          value={`${avgCompletion}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
          trend={7}
          trendLabel="tasks completed on time"
        />
      </div>

      {/* Performance Formula Banner */}
      <div className="glass-card p-5 bg-gradient-to-r from-primary-500/[0.05] to-primary-600/[0.02]" style={{ border: '1px solid var(--border-light)' }}>
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-5 h-5 text-primary-500" />
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Performance Scoring Formula</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card-light p-3 text-center">
            <p className="text-lg font-bold text-primary-500 dark:text-primary-300">50%</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Task Completion</p>
          </div>
          <div className="glass-card-light p-3 text-center">
            <p className="text-lg font-bold text-emerald-500 dark:text-emerald-400">25%</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>On-time Delivery</p>
          </div>
          <div className="glass-card-light p-3 text-center">
            <p className="text-lg font-bold text-amber-500 dark:text-amber-400">25%</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Extra Contribution</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score Distribution */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Performance Scores</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>Overall score comparison</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scoreDistribution} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 11 }}
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 11 }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover-overlay)' }} />
              <Bar dataKey="score" name="Overall Score" radius={[6, 6, 0, 0]}>
                {scoreDistribution.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart - Individual Analysis */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Analysis</h3>
            <select 
              value={activeEmpId || ''} 
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="px-2 py-1 rounded-lg text-[10px] theme-select cursor-pointer max-w-[120px]"
            >
              {projectEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <p className="text-[11px] mb-2" style={{ color: 'var(--text-faint)' }}>
            {activePerf?.employeeName} — Score: {activePerf?.overallScore}
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: tickColor, fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: tickColor, fontSize: 9 }}
              />
              <Radar
                name={topPerformer?.employeeName}
                dataKey="value"
                stroke="#a78bfa"
                fill="#a78bfa"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Weekly Trends</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>Tasks and hours per week</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weeklyTrends}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="week"
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
            <Line
              type="monotone"
              dataKey="tasks"
              name="Tasks"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={{ r: 4, fill: '#a78bfa' }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              name="Hours"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 4, fill: '#34d399' }}
            />
            <Line
              type="monotone"
              dataKey="overtime"
              name="Overtime"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4, fill: '#f59e0b' }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Performance Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Detailed Performance Breakdown</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
            Individual metric scores for each team member
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                {['Employee', 'Projects Worked On', 'Overtime', 'Leave', 'Task Completion (50%)', 'On-time (25%)', 'Extra Work (25%)', 'Overall Score'].map(h => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-left px-5 py-3" style={{ color: 'var(--text-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {performanceData.map((perf) => (
                <tr
                  key={perf.employeeId}
                  onClick={() => navigate(`/performance/${perf.employeeId}`)}
                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500/30 to-primary-600/20 flex items-center justify-center text-[10px] font-bold text-primary-300">
                        {perf.employeeName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{perf.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {employeeProjectsMap[perf.employeeId]?.length > 0 ? (
                        employeeProjectsMap[perf.employeeId].map((proj) => (
                          <span
                            key={proj}
                            className="px-2 py-0.5 rounded text-[9px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20"
                          >
                            {proj}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>None</span>
                      )}
                    </div>
                  </td>
                  {/* Overtime Column */}
                  <td className="px-5 py-3 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {employeeOvertimeMap[perf.employeeId]?.length > 0 ? (
                        employeeOvertimeMap[perf.employeeId].map((rec) => (
                          <span
                            key={rec.id}
                            className="px-2 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          >
                            +{rec.totalExtraHours}h
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </div>
                  </td>
                  {/* Leave Column */}
                  <td className="px-5 py-3 max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {employeeLeavesMap[perf.employeeId]?.length > 0 ? (
                        employeeLeavesMap[perf.employeeId].map((rec) => (
                          <span
                            key={rec.id}
                            className="px-2 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          >
                            -{rec.totalExtraHours}h
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 w-48">
                    <div>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={perf.taskCompletionRate} size="sm" color="primary" />
                        <span className="text-xs w-8 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                          {perf.taskCompletionRate}%
                        </span>
                      </div>
                      <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                        {perf.completedTasks || 0} / {perf.totalTasks || 0} tasks completed
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3 w-36">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={perf.onTimeDelivery} size="sm" color="emerald" />
                      <span className="text-xs w-8 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {perf.onTimeDelivery}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 w-36">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={perf.extraContribution} size="sm" color="amber" />
                      <span className="text-xs w-8 text-right tabular-nums" style={{ color: 'var(--text-muted)' }}>
                        {perf.extraContribution}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-sm font-bold tabular-nums ${getScoreColor(perf.overallScore)}`}
                    >
                      {perf.overallScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
