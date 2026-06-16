import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ListFilter, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  BarChart3, 
  Target, 
  Bug,
  Calendar,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import type { WorkloadEntry } from '../types';
import ProgressBar from '../components/shared/ProgressBar';
import PriorityBadge from '../components/shared/PriorityBadge';
import StatusBadge from '../components/shared/StatusBadge';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function getBlockColor(hours: number, type: string): string {
  if (type === 'freelance') return 'bg-violet-500/20 border-violet-500/30 text-violet-700 dark:text-violet-300';
  if (hours > 8) return 'bg-rose-500/20 border-rose-500/30 text-rose-700 dark:text-rose-300';
  if (hours >= 6) return 'bg-sky-500/20 border-sky-500/30 text-sky-700 dark:text-sky-300';
  if (hours >= 4) return 'bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300';
  return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
}

export default function Schedule() {
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewPeriod, setViewPeriod] = useState<'Day' | '1 Week' | 'Month'>('1 Week');
  const [view, setView] = useState('Workload');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveData, setLeaveData] = useState({ employeeId: 'EMP001', date: new Date().toISOString().split('T')[0], hours: 2, startTime: '10:00', reason: '' });
  const [selectedCellDetail, setSelectedCellDetail] = useState<{ emp: any; dateStr: string; dayEntry: any } | null>(null);
  const { employees, tasks, overtime, updateOvertimeField } = useData();

  const getEndTime = (startTimeStr: string, hoursNum: number): string => {
    try {
      const [hStr, mStr] = startTimeStr.split(':');
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) return '';
      
      const totalMinutes = h * 60 + m + Math.round(hoursNum * 60);
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(endH)}:${pad(endM)}`;
    } catch (e) {
      return '';
    }
  };

  const workloadData = useMemo(() => {
    const entries: WorkloadEntry[] = [];
    const activeEmployees = employees.filter(e => e.status === 'active');
    
    activeEmployees.forEach((emp) => {
      // Generate workload records for standard 60-day range around today
      for (let dayOffset = -30; dayOffset < 30; dayOffset++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const dateStr = targetDate.toISOString().split('T')[0];
        const dayOfWeek = targetDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Check if there is an overtime record for this employee on this date
        const empOT = overtime.find(
          ot => ot.employeeId === emp.id && ot.date === dateStr
        );

        if (empOT) {
          const isShortLeave = empOT.workType === 'short-leave' || empOT.taskName?.toLowerCase().includes('leave');
          entries.push({
            employeeId: emp.id,
            date: dateStr,
            hours: isShortLeave ? empOT.totalExtraHours : 8 + empOT.totalExtraHours,
            isOvertime: !isShortLeave,
            taskName: empOT.taskName,
            type: isShortLeave ? 'short-leave' : 'overtime',
            startTime: empOT.startTime,
            endTime: empOT.endTime
          });
        } else if (!isWeekend) {
          entries.push({
            employeeId: emp.id,
            date: dateStr,
            hours: 8,
            isOvertime: false,
            taskName: 'Regular Tasks',
            type: 'regular'
          });
        }
      }
    });
    return entries;
  }, [employees, overtime]);
  const [deptFilter, setDeptFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Calculate the current week's dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const dates: Date[] = [];
    
    if (viewPeriod === 'Day') {
      const d = new Date(today);
      d.setDate(today.getDate() + weekOffset);
      dates.push(d);
    } else if (viewPeriod === '1 Week') {
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + mondayOffset + i + weekOffset * 7);
        dates.push(d);
      }
    } else {
      // Month view - show 14 days for now to keep grid manageable
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i + weekOffset * 14);
        dates.push(d);
      }
    }
    return dates;
  }, [weekOffset, viewPeriod]);

  const weekLabel = viewPeriod === 'Day' 
    ? weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[weekDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const activeEmployees = employees.filter(e => {
    const matchesDept = !deptFilter || e.department === deptFilter;
    const matchesSearch = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase());
    return e.status === 'active' && matchesDept && matchesSearch;
  });

  const handleApplyLeave = async () => {
    const emp = employees.find(e => e.id === leaveData.employeeId);
    if (emp) {
      const calculatedEnd = getEndTime(leaveData.startTime, leaveData.hours);
      await updateOvertimeField(emp.name, leaveData.date, leaveData.hours, true, leaveData.startTime, calculatedEnd);
    }
    setShowApplyModal(false);
  };



  function getBlockColorLocal(hours: number, type: string): string {
    if (type === 'short-leave') return 'bg-amber-500/40 border-amber-500/50 text-amber-900 dark:text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    return getBlockColor(hours, type);
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* View tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06]">
            {['Workload', 'Timeline', 'Goals', 'Issues', 'Reports'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setView(tab)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  view === tab 
                    ? 'bg-primary-500/20 text-primary-500 dark:text-primary-300 shadow-sm' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={view !== tab ? { color: 'var(--text-muted)' } : undefined}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">

          {/* Apply Short Leave Button */}
          <button 
            onClick={() => {
              setLeaveData(prev => ({ ...prev, employeeId: employees[0]?.id || '' }));
              setShowApplyModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            Apply Short Leave
          </button>

          {/* Filter */}
          <div className="relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                deptFilter || searchQuery ? 'bg-primary-500/10 text-primary-500 border-primary-500/30' : ''
              }`}
              style={!(deptFilter || searchQuery) ? { background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' } : { border: '1px solid currentColor' }}
            >
              <ListFilter className="w-3.5 h-3.5" /> Filter
              {(deptFilter || searchQuery) && <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-64 glass-card p-4 shadow-xl z-20 animate-fade-in">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Search Team Member</label>
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Name..."
                      className="w-full px-3 py-2 rounded-lg text-xs theme-input outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Department</label>
                    <select 
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs theme-select cursor-pointer"
                    >
                      <option value="">All Departments</option>
                      {[...new Set(employees.map(e => e.department))].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  {(deptFilter || searchQuery) && (
                    <button 
                      onClick={() => { setDeptFilter(''); setSearchQuery(''); }}
                      className="w-full py-2 text-[10px] font-bold text-rose-500 bg-rose-500/10 rounded-lg hover:bg-rose-500/20 transition-all cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(o => o - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-black/10 dark:hover:bg-white/10"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-medium min-w-[120px] text-center" style={{ color: 'var(--text-primary)' }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(o => o + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-black/10 dark:hover:bg-white/10"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button 
            onClick={() => setWeekOffset(0)} 
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${weekOffset === 0 ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : ''}`}
            style={weekOffset !== 0 ? { background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' } : {}}
          >
            Today
          </button>
          <div className="flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06]">
            {(['Day', '1 Week', 'Month'] as const).map((p) => (
              <button 
                key={p}
                onClick={() => { setViewPeriod(p); setWeekOffset(0); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  viewPeriod === p 
                    ? 'bg-primary-500 text-white shadow-sm' 
                    : 'text-muted hover:text-secondary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Based on View */}
      {view === 'Workload' && (
        <>
          <div className="glass-card overflow-hidden">
            {/* Employee Rows */}
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header Row */}
                <div className="grid" style={{ gridTemplateColumns: `260px repeat(${weekDates.length}, 1fr)`, borderBottom: '1px solid var(--border-light)' }}>
                  <div className="px-5 py-3 flex items-center gap-2" style={{ borderRight: '1px solid var(--border-light)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Assignees</span>
                  </div>
                  {weekDates.map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dayIdx = date.getDay();
                    const actualDayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
                    const isWeekend = dayIdx === 0 || dayIdx === 6;
                    return (
                      <div key={i} className={`px-3 py-3 text-center last:border-r-0 ${isToday ? 'bg-primary-500/10 dark:bg-primary-500/[0.05] relative' : ''} ${isWeekend ? 'bg-black/10 dark:bg-white/[0.01]' : ''}`}
                        style={{ borderRight: '1px solid var(--border-light)' }}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider`} style={{ color: isToday ? 'var(--color-primary-500)' : 'var(--text-secondary)' }}>{DAY_LABELS[actualDayIdx]}</p>
                        <p className={`text-xs font-medium mt-0.5`} style={{ color: isToday ? 'var(--color-primary-500)' : 'var(--text-muted)' }}>{date.getDate()}</p>
                        {isToday && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
                      </div>
                    );
                  })}
                </div>

                {activeEmployees.map((emp) => {
                  const empTasks = tasks.filter(t => t.assignedTo === emp.id);
                  const empWorkload = workloadData.filter(w => w.employeeId === emp.id);

                  const totalHours = empWorkload.reduce((sum, w) => sum + w.hours, 0);
                  const overtimeHours = empWorkload.filter(w => w.type === 'overtime').reduce((s, w) => s + (w.hours - 8), 0);
                  const leaveHours = empWorkload.filter(w => w.type === 'short-leave').reduce((sum, w) => sum + w.hours, 0);

                  return (
                    <div key={emp.id} className="grid hover:bg-black/5 dark:hover:bg-white/[0.01] transition-colors group"
                      style={{ gridTemplateColumns: `260px repeat(${weekDates.length}, 1fr)`, borderBottom: '1px solid var(--border-light)' }}>
                      {/* Employee Info */}
                      <div className="px-5 py-4 flex items-start gap-3" style={{ borderRight: '1px solid var(--border-light)' }}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500/30 to-primary-600/20 flex items-center justify-center text-[10px] font-bold text-primary-500 flex-shrink-0">
                          {emp.avatar}
                        </div>
                        <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/performance/${emp.id}`)}>
                          <p className="text-xs font-semibold truncate group-hover:text-primary-500 transition-colors" style={{ color: 'var(--text-primary)' }}>{emp.name}</p>
                          {(overtimeHours > 0 || leaveHours > 0) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {overtimeHours > 0 && (
                                <span className="text-[10px] text-rose-500 font-semibold">+{overtimeHours.toFixed(1)}h OT</span>
                              )}
                              {overtimeHours > 0 && leaveHours > 0 && (
                                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>|</span>
                              )}
                              {leaveHours > 0 && (
                                <span className="text-[10px] text-amber-500 font-semibold">-{leaveHours.toFixed(1)}h Leave</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>
                            <span>☰ {empTasks.length} Tasks</span>
                            <span>• {[...new Set(empTasks.map(t => t.project))].length} Projects</span>
                          </div>
                        </div>
                      </div>

                      {/* Day Cells */}
                      {weekDates.map((date, dayIdx) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isToday = date.toDateString() === new Date().toDateString();
                        const dayOfWeek = date.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const dayEntry = empWorkload.find(w => w.date === dateStr);

                        if (isWeekend && !dayEntry) {
                          return (
                            <div key={dayIdx} className={`px-2 py-4 last:border-r-0 flex items-center justify-center bg-black/[0.08] dark:bg-white/[0.01] ${isToday ? 'bg-primary-500/5 dark:bg-primary-500/[0.02]' : ''}`}
                              style={{ borderRight: '1px solid var(--border-light)' }}>
                              <span className="text-[9px] uppercase font-black tracking-tighter text-center" style={{ color: 'var(--text-muted)' }}>WEEKEND</span>
                            </div>
                          );
                        }

                        if (!dayEntry) {
                          return (
                            <div key={dayIdx} className={`px-2 py-4 last:border-r-0 flex items-center justify-center ${isToday ? 'bg-primary-500/5 dark:bg-primary-500/[0.02]' : ''}`}
                              style={{ borderRight: '1px solid var(--border-light)' }}>
                              <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>—</span>
                            </div>
                          );
                        }

                        return (
                          <div key={dayIdx} className={`px-2 py-3 last:border-r-0 flex flex-col items-center gap-1 ${isToday ? 'bg-primary-500/5 dark:bg-primary-500/[0.02]' : ''}`}
                            style={{ borderRight: '1px solid var(--border-light)' }}>
                            <div 
                              onClick={() => setSelectedCellDetail({ emp, dateStr, dayEntry })}
                              className={`w-full px-2 py-2 rounded-lg border text-center cursor-pointer hover:scale-105 hover:shadow-lg transition-all ${getBlockColorLocal(dayEntry.hours, dayEntry.type)}`}
                            >
                              <p className="text-xs font-bold">
                                {dayEntry.type === 'overtime' ? `8h + ${(dayEntry.hours - 8)}h` : 
                                 dayEntry.type === 'short-leave' ? `${8 - dayEntry.hours}h Work` : 
                                 `${dayEntry.hours}h`}
                              </p>
                              {dayEntry.type === 'short-leave' ? (
                                <>
                                  <p className="text-[9px] mt-0.5 font-bold uppercase tracking-tighter">Short Leave ({dayEntry.hours}h)</p>
                                  {dayEntry.startTime && dayEntry.endTime && (
                                    <p className="text-[8px] font-medium opacity-80 leading-none mt-0.5 whitespace-nowrap">{dayEntry.startTime}-{dayEntry.endTime}</p>
                                  )}
                                </>
                              ) : dayEntry.hours > 8 ? (
                                <p className="text-[9px] mt-0.5 flex items-center justify-center gap-0.5 opacity-80">
                                  <AlertCircle className="w-2.5 h-2.5" /> Overtime
                                </p>
                              ) : dayEntry.type === 'freelance' ? (
                                <p className="text-[9px] mt-0.5 opacity-80">Freelance</p>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500/30" /> Regular (6-8h)</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/30" /> Overtime (&gt;8h)</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" /> Light (4-6h)</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-violet-500/20 border border-violet-500/30" /> Freelance</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/40 border border-amber-500/50" /> Short Leave (0.5-2h)</div>
          </div>
        </>
      )}

      {view === 'Timeline' && <TimelineView weekDates={weekDates} />}
      {view === 'Goals' && <GoalsView />}
      {view === 'Issues' && <IssuesView />}
      {view === 'Reports' && <ReportsView />}

      {/* Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-card p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Apply Short Leave</h3>
              <button onClick={() => setShowApplyModal(false)} className="p-1 rounded-lg hover:bg-black/5 cursor-pointer" style={{ color: 'var(--text-faint)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Employee</label>
                <select 
                  value={leaveData.employeeId}
                  onChange={(e) => setLeaveData({ ...leaveData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm theme-select outline-none transition-all cursor-pointer"
                >
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date</label>
                  <input 
                    type="date"
                    value={leaveData.date}
                    onChange={(e) => setLeaveData({ ...leaveData, date: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl text-xs theme-input outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>From Time</label>
                  <input 
                    type="time"
                    value={leaveData.startTime}
                    onChange={(e) => setLeaveData({ ...leaveData, startTime: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl text-xs theme-input outline-none transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Hours</label>
                  <select 
                    value={leaveData.hours}
                    onChange={(e) => setLeaveData({ ...leaveData, hours: Number(e.target.value) })}
                    className="w-full px-2 py-2 rounded-xl text-xs theme-select outline-none transition-all cursor-pointer"
                  >
                    <option value={0.5}>0.5 Hr</option>
                    <option value={1}>1 Hour</option>
                    <option value={1.5}>1.5 Hrs</option>
                    <option value={2}>2 Hours</option>
                    <option value={2.5}>2.5 Hrs</option>
                    <option value={3}>3 Hours</option>
                    <option value={4}>4 Hours</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                ⏱️ Calculated Leave Period: <span className="font-bold">{leaveData.startTime}</span> to <span className="font-bold">{getEndTime(leaveData.startTime, leaveData.hours)}</span> ({leaveData.hours} hr)
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason</label>
                <textarea 
                  placeholder="Reason for short leave..."
                  value={leaveData.reason}
                  onChange={(e) => setLeaveData({ ...leaveData, reason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm theme-input outline-none transition-all h-24 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button 
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer"
                  style={{ borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApplyLeave}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Cell Detail Modal */}
      {selectedCellDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-card p-6 shadow-2xl animate-scale-in relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-primary-500/20 to-violet-500/10 blur-2xl" />
            
            <div className="flex items-center justify-between mb-6 border-b border-light pb-4 relative z-10">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-primary">
                  Workload Details
                </h3>
                <p className="text-xs text-muted mt-0.5">AOSC Team Schedule Tracker</p>
              </div>
              <button 
                onClick={() => setSelectedCellDetail(null)} 
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer border border-light text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 relative z-10">
              {/* Employee Header */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-light">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-primary-500/20">
                  {selectedCellDetail.emp.avatar}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-primary">
                    {selectedCellDetail.emp.name}
                  </p>
                  <p className="text-[11px] font-semibold text-muted mt-0.5">
                    {selectedCellDetail.emp.role} • {selectedCellDetail.emp.department}
                  </p>
                </div>
              </div>

              {/* Details List */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-light flex flex-col gap-1">
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Schedule Date</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-primary">
                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                    {new Date(selectedCellDetail.dateStr).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-light flex flex-col gap-1">
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Shift Duration</span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-primary">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    {selectedCellDetail.dayEntry.hours} Hours
                  </div>
                </div>
              </div>

              {/* Status & Work Category */}
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-light space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary font-bold">Category</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedCellDetail.dayEntry.type === 'short-leave'
                      ? 'bg-amber-500/10 text-amber-500'
                      : selectedCellDetail.dayEntry.type === 'overtime'
                      ? 'bg-rose-500/10 text-rose-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {selectedCellDetail.dayEntry.type === 'short-leave' ? 'Short Leave' : selectedCellDetail.dayEntry.type}
                  </span>
                </div>

                 {selectedCellDetail.dayEntry.startTime && selectedCellDetail.dayEntry.endTime && (
                  <div className="flex items-center justify-between text-xs border-t border-light pt-3">
                    <span className="text-secondary font-bold">Time Range</span>
                    <span className="text-xs font-bold text-amber-500">
                      {selectedCellDetail.dayEntry.startTime} - {selectedCellDetail.dayEntry.endTime}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs border-t border-light pt-3">
                  <span className="text-secondary font-bold">Task/Description</span>
                  <span className="text-xs font-bold text-primary truncate max-w-[200px]">
                    {selectedCellDetail.dayEntry.taskName || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button 
                  onClick={() => setSelectedCellDetail(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/10 transition-all cursor-pointer"
                >
                  Close Schedule Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components for different views

function TimelineView({ weekDates }: { weekDates: Date[] }) {
  const { employees, tasks } = useData();
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Header */}
          <div className="grid grid-cols-[300px_1fr]" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderRight: '1px solid var(--border-light)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Tasks & Projects</span>
            </div>
            <div className="grid grid-cols-7">
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`px-3 py-4 text-center ${isToday ? 'bg-primary-500/10 dark:bg-primary-500/[0.05] relative' : ''}`} style={{ borderRight: i < 6 ? '1px solid var(--border-light)' : 'none' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isToday ? 'var(--color-primary-500)' : 'var(--text-muted)' }}>{DAY_LABELS[i]}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: isToday ? 'var(--color-primary-500)' : 'var(--text-primary)' }}>{date.getDate()}</p>
                    {isToday && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Rows */}
          <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
            {tasks.slice(0, 8).map((task) => {
              const emp = employees.find(e => e.id === task.assignedTo);
              
              // Simple timeline calculation for demo
              const startDay = new Date(task.assignedDate).getDay();
              const endDay = new Date(task.deadline).getDay();
              const duration = Math.max(1, (endDay - startDay + 1 + 7) % 7 || 5);
              
              return (
                <div key={task.id} className="grid grid-cols-[300px_1fr] hover:bg-black/5 dark:hover:bg-white/[0.01] transition-colors">
                  <div className="px-6 py-4 flex flex-col gap-1" style={{ borderRight: '1px solid var(--border-light)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary truncate max-w-[180px]">{task.name}</span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center text-[8px] font-bold text-primary-500">
                        {emp?.avatar}
                      </div>
                      <span className="text-[10px] text-muted">{emp?.name} • {task.project}</span>
                    </div>
                  </div>
                  <div className="relative h-full py-4">
                    <div 
                      className="absolute h-8 rounded-lg border flex items-center px-3 gap-2 group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
                      style={{ 
                        left: `${(startDay === 0 ? 6 : startDay - 1) * (100 / 7)}%`,
                        width: `${duration * (100 / 7) - 2}%`,
                        backgroundColor: 'var(--color-primary-500)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        boxShadow: '0 4px 15px -3px var(--color-primary-500)'
                      }}
                    >
                      <Clock className="w-3 h-3 opacity-70" />
                      <span className="text-[10px] font-bold truncate">{task.progress}%</span>
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsView() {
  const { tasks } = useData();
  const projects = useMemo(() => [...new Set(tasks.map(t => t.project).filter(Boolean))] as string[], [tasks]);
  const projectStats = useMemo(() => {
    return projects.map(p => {
      const projectTasks = tasks.filter(t => t.project === p);
      const avgProgress = Math.round(projectTasks.reduce((acc, t) => acc + t.progress, 0) / projectTasks.length);
      const completed = projectTasks.filter(t => t.status === 'completed').length;
      return { name: p, progress: avgProgress, total: projectTasks.length, completed };
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projectStats.map((proj) => (
        <div key={proj.name} className="glass-card p-5 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-500" />
            </div>
            <StatusBadge status={proj.progress === 100 ? 'completed' : 'in-progress'} />
          </div>
          <h4 className="text-sm font-bold mb-1 text-primary">{proj.name}</h4>
          <p className="text-[10px] text-muted mb-4">{proj.completed} of {proj.total} milestones reached</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-secondary font-medium">Overall Progress</span>
              <span className="text-primary font-bold">{proj.progress}%</span>
            </div>
            <ProgressBar value={proj.progress} size="sm" />
          </div>
          
          <button className="w-full mt-6 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 border border-light hover:bg-black/5 dark:hover:bg-white/5 transition-all text-secondary">
            View Project Roadmap <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function IssuesView() {
  const { tasks } = useData();
  const issues = useMemo(() => {
    return tasks.filter(t => t.label === 'Bug' || t.priority === 'high').filter(t => t.status !== 'completed');
  }, []);

  return (
    <div className="glass-card">
      <div className="p-4 border-b border-light flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-rose-500" />
          <h4 className="text-sm font-bold text-primary">Active Issues & Blockers</h4>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold">{issues.length} Open</span>
      </div>
      <div className="divide-y divide-light">
        {issues.map((issue) => (
          <div key={issue.id} className="p-4 flex items-start justify-between hover:bg-black/5 dark:hover:bg-white/[0.01] transition-colors">
            <div className="flex items-start gap-4">
              <div className={`mt-1 w-2 h-2 rounded-full ${issue.priority === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <h5 className="text-xs font-bold text-primary">{issue.name}</h5>
                <p className="text-[10px] text-muted mt-0.5">{issue.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-secondary flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {issue.project}
                  </span>
                  <span className="text-[10px] text-secondary flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Due {new Date(issue.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <PriorityBadge priority={issue.priority} />
              <div className="flex -space-x-2">
                {[1, 2].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-primary-500/20 flex items-center justify-center text-[8px] font-bold text-primary-500">
                    U{i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsView() {
  const { tasks } = useData();
  const projects = useMemo(() => [...new Set(tasks.map(t => t.project).filter(Boolean))] as string[], [tasks]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Weekly Velocity', value: '84%', icon: BarChart3, color: 'text-sky-500' },
          { label: 'Tasks Completed', value: '42', icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Avg. Load', value: '6.8h/day', icon: Clock, color: 'text-violet-500' },
          { label: 'Active Projects', value: '12', icon: Layers, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-primary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h4 className="text-sm font-bold text-primary mb-6">Workload Distribution</h4>
          <div className="space-y-5">
            {['Engineering', 'Design', 'Product', 'QA'].map((dept) => (
              <div key={dept} className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-secondary font-bold">{dept}</span>
                  <span className="text-muted">78% capacity</span>
                </div>
                <ProgressBar value={70 + Math.random() * 20} size="md" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h4 className="text-sm font-bold text-primary mb-6">Resource Allocation</h4>
          <div className="flex flex-col gap-4">
            {projects.slice(0, 4).map((p, i) => (
              <div key={p} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-[10px] font-bold text-primary-500">
                    P{i+1}
                  </div>
                  <span className="text-xs font-bold text-primary">{p}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary">{120 + i * 40}h</p>
                    <p className="text-[9px] text-muted">Estimated</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
