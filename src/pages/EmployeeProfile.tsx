import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Building2,
  Target,
  Trophy,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import ProgressBar from '../components/shared/ProgressBar';
import StatusBadge from '../components/shared/StatusBadge';
import PriorityBadge from '../components/shared/PriorityBadge';
import MemberReportModal from '../components/shared/MemberReportModal';
import { useTheme } from '../context/ThemeContext';
import { calculatePerformance } from '../data/mockData';
import { useData } from '../context/DataContext';

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

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-emerald-600';
  if (score >= 60) return 'from-amber-500 to-amber-600';
  if (score >= 40) return 'from-orange-500 to-orange-600';
  return 'from-rose-500 to-rose-600';
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [showReport, setShowReport] = useState(false);
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.4)';

  const { employees, tasks, attendance: attendanceRecords, overtime: overtimeRecords } = useData();
  const employee = employees.find((e) => e.id === id);
  const performanceData = useMemo(() => calculatePerformance('all', employees, tasks, attendanceRecords, overtimeRecords), [employees, tasks, attendanceRecords, overtimeRecords]);
  const perf = performanceData.find((p) => p.employeeId === id);

  const empTasks = useMemo(() => {
    if (!id) return [];
    return tasks.filter((t) => {
      if (!t.assignedTo) return false;
      const assignedParts = t.assignedTo.split(',').map(s => s.trim().toLowerCase());
      return assignedParts.includes(id.toLowerCase()) || (employee && assignedParts.includes(employee.name.toLowerCase()));
    });
  }, [id, tasks, employee]);
  const empAttendance = useMemo(
    () => attendanceRecords.filter((r) => r.employeeId === id),
    [id, attendanceRecords]
  );
  const empOvertime = useMemo(
    () => overtimeRecords.filter((r) => r.employeeId === id || (employee && r.employeeName?.toLowerCase() === employee.name.toLowerCase())),
    [id, overtimeRecords, employee]
  );

  const empOvertimeOnly = useMemo(
    () => empOvertime.filter(r => r.workType !== 'short-leave'),
    [empOvertime]
  );

  const empLeavesOnly = useMemo(
    () => empOvertime.filter(r => r.workType === 'short-leave'),
    [empOvertime]
  );

  if (!employee || !perf) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]" style={{ color: 'var(--text-faint)' }}>
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>Employee not found</p>
        <button
          onClick={() => navigate('/performance')}
          className="mt-4 px-4 py-2 rounded-xl bg-primary-500/20 text-primary-500 dark:text-primary-300 text-sm font-medium hover:bg-primary-500/30 transition-colors cursor-pointer"
        >
          Back to Performance
        </button>
      </div>
    );
  }

  const radarData = [
    { metric: 'Task Completion', value: perf.taskCompletionRate, fullMark: 100 },
    { metric: 'On-time', value: perf.onTimeDelivery, fullMark: 100 },
    { metric: 'Extra Work', value: perf.extraContribution, fullMark: 100 },
  ];

  // Attendance weekly summary
  const weeklyAttendance = useMemo(() => {
    const weeks: { week: string; present: number; absent: number; halfDay: number }[] = [];
    const sorted = [...empAttendance].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = 0; i < sorted.length; i += 5) {
      const chunk = sorted.slice(i, i + 5);
      const weekLabel = `W${Math.floor(i / 5) + 1}`;
      weeks.push({
        week: weekLabel,
        present: chunk.filter((r) => r.status === 'present').length,
        absent: chunk.filter((r) => r.status === 'absent').length,
        halfDay: chunk.filter((r) => r.status === 'half-day').length,
      });
    }
    return weeks.slice(-4);
  }, [empAttendance]);

  const totalOvertimeHours = empOvertimeOnly.reduce((sum, r) => sum + r.totalExtraHours, 0);
  const totalLeaveHours = empLeavesOnly.reduce((sum, r) => sum + r.totalExtraHours, 0);
  const completedTasks = empTasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = empTasks.filter((t) => t.status === 'in-progress').length;
  const presentDays = empAttendance.filter((r) => r.status === 'present').length;

  // Rank
  const rank = performanceData
    .sort((a, b) => b.overallScore - a.overallScore)
    .findIndex((p) => p.employeeId === id) + 1;


  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back button */}
      <button
        onClick={() => navigate('/performance')}
        className="flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer"
        style={{ color: 'var(--text-faint)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Performance
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Profile Overview</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Detailed performance metrics and history</p>
        </div>
        <button 
          onClick={() => setShowReport(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
        >
          <Target className="w-4 h-4" />
          Generate Member Report
        </button>
      </div>

      {/* Profile Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getScoreGradient(perf.overallScore)} flex items-center justify-center text-2xl font-bold text-white shadow-xl`}>
            {employee.avatar}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{employee.name}</h2>
              <StatusBadge status={employee.status === 'active' ? 'present' : 'absent'} />
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{employee.role}</p>
            <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-faint)' }}>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {employee.department}
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {employee.email}
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {employee.phone}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Score Circle */}
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getScoreGradient(perf.overallScore)} flex items-center justify-center shadow-lg`}>
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-surface-950 flex flex-col items-center justify-center">
                <p className={`text-2xl font-bold ${getScoreColor(perf.overallScore)}`}>
                  {perf.overallScore}
                </p>
                <p className="text-[9px]" style={{ color: 'var(--text-faint)' }}>/ 100</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Trophy className="w-3 h-3 text-amber-400" />
              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Rank #{rank}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <div onClick={() => navigate('/tasks')} className="glass-card-light p-4 text-center cursor-pointer hover:scale-105 transition-all hover:shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center mx-auto mb-2">
            <Target className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{empTasks.length}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Total Tasks</p>
        </div>
        <div onClick={() => navigate('/tasks')} className="glass-card-light p-4 text-center cursor-pointer hover:scale-105 transition-all hover:shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-500">{completedTasks}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Completed</p>
        </div>
        <div onClick={() => navigate('/overtime')} className="glass-card-light p-4 text-center cursor-pointer hover:scale-105 transition-all hover:shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-amber-400">{totalOvertimeHours}h</p>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Overtime Hours</p>
        </div>
      </div>

      {/* Performance Breakdown Chart */}
      <div className="glass-card p-5 max-w-3xl mx-auto w-full">
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Performance Breakdown</h3>
        <p className="text-[11px] mb-4" style={{ color: 'var(--text-faint)' }}>Score distribution across metrics</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: tickColor, fontSize: 9 }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#a78bfa"
                fill="#a78bfa"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-black/5 dark:bg-white/[0.02]">
              <span style={{ color: 'var(--text-muted)' }}>Task Completion</span>
              <span className={`font-bold ${getScoreColor(perf.taskCompletionRate)}`}>
                {perf.taskCompletionRate}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-black/5 dark:bg-white/[0.02]">
              <span style={{ color: 'var(--text-muted)' }}>On-time Delivery</span>
              <span className={`font-bold ${getScoreColor(perf.onTimeDelivery)}`}>
                {perf.onTimeDelivery}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-black/5 dark:bg-white/[0.02]">
              <span style={{ color: 'var(--text-muted)' }}>Extra Contribution</span>
              <span className={`font-bold ${getScoreColor(perf.extraContribution)}`}>
                {perf.extraContribution}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Assigned Tasks</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {empTasks.length} total • {completedTasks} completed • {inProgressTasks} in progress
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                {['Task', 'Deadline', 'Status', 'Priority', 'Progress'].map(h => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-left px-5 py-3" style={{ color: 'var(--text-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => navigate('/tasks')}
                  className="hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer group"
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                >
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{task.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                  </td>
                  <td className="px-5 py-3">
                    {task.deadline && !isNaN(new Date(task.deadline).getTime()) ? (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(task.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-faint)' }}>No due date</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={task.rawStatus || task.status} />
                  </td>
                  <td className="px-5 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-5 py-3 w-32">
                    <ProgressBar value={task.progress} size="sm" showLabel />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overtime Records */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Overtime Records</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {empOvertimeOnly.length} sessions • {totalOvertimeHours}h total
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                {['Task', 'Date', 'Time', 'Hours', 'Type', 'Status'].map(h => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-left px-5 py-3" style={{ color: 'var(--text-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empOvertimeOnly.length > 0 ? (
                empOvertimeOnly.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => navigate('/overtime')}
                    className="hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer group"
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                  >
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{record.taskName}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        {record.startTime}–{record.endTime}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold ${record.totalExtraHours > 3 ? 'text-rose-400' : 'text-amber-400'}`}>
                        +{record.totalExtraHours}h
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-md ${
                        record.workType === 'urgent-task'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {record.workType === 'urgent-task' ? 'Urgent' : 'Overtime'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={record.deliverableStatus} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
                    No overtime hours logged for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Records */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Leave Records</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
            {empLeavesOnly.length} short leaves • {totalLeaveHours}h total
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                {['Reason / Type', 'Date', 'Time', 'Hours', 'Status'].map(h => (
                  <th key={h} className="text-[10px] font-semibold uppercase tracking-wider text-left px-5 py-3" style={{ color: 'var(--text-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empLeavesOnly.length > 0 ? (
                empLeavesOnly.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer group"
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                  >
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{record.taskName || 'Short Leave'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        {record.startTime}–{record.endTime}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold text-amber-500">
                        -{record.totalExtraHours}h
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-500/10 text-amber-500">
                        Short Leave
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-xs" style={{ color: 'var(--text-faint)' }}>
                    No short leaves logged for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReport && employee && (
        <MemberReportModal 
          memberId={employee.id} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
}
