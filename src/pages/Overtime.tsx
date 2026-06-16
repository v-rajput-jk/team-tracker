import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Clock, AlertTriangle, CheckCircle2, TrendingUp, Timer, FileSpreadsheet, ArrowUpRight, Activity, Plus, Calendar } from 'lucide-react';
import KPICard from '../components/shared/KPICard';
import StatusBadge from '../components/shared/StatusBadge';
import FilterBar from '../components/shared/FilterBar';
import ProgressBar from '../components/shared/ProgressBar';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { calculatePerformance } from '../data/mockData';
import Modal from '../components/shared/Modal';

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

export default function Overtime() {
  const navigate = useNavigate();
  const { overtime, employees, tasks, attendance, updateOvertimeField } = useData();
  const { showToast } = useToast();

  const performanceData = useMemo(() => 
    calculatePerformance('all', employees, tasks, attendance, overtime), 
    [employees, tasks, attendance, overtime]
  );

  const overtimeRecords = useMemo(() => {
    return overtime.filter(r => r.workType === 'overtime');
  }, [overtime]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [selectedEmployeeForChart, setSelectedEmployeeForChart] = useState<{ id: string; name: string } | null>(null);

  // Form states for manual overtime logging
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:00',
    taskName: 'Extra work',
  });

  const calculateHours = (start: string, end: string): number => {
    try {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
      
      let startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;
      
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60; // Crosses midnight
      }
      
      const diffMinutes = endMinutes - startMinutes;
      return Number((diffMinutes / 60).toFixed(2));
    } catch (e) {
      return 0;
    }
  };

  // Cell editing state
  const [editCell, setEditCell] = useState<{ employeeName: string; date: string; currentHours: number } | null>(null);
  const [editHours, setEditHours] = useState('');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === addForm.employeeId);
    if (!emp) {
      showToast("Please select a developer", "error");
      return;
    }
    
    const hrs = calculateHours(addForm.startTime, addForm.endTime);
    if (hrs <= 0) {
      showToast("Invalid time range. To Time must be after From Time.", "error");
      return;
    }
    
    await updateOvertimeField(emp.name, addForm.date, hrs, false, addForm.startTime, addForm.endTime);
    setIsAddModalOpen(false);
    // Reset form
    setAddForm({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '20:00',
      taskName: 'Extra work',
    });
  };

  const handleSaveCell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCell) return;
    const hrs = Number(editHours);
    if (isNaN(hrs) || hrs < 0) {
      showToast("Please enter valid hours (>= 0)", "error");
      return;
    }
    await updateOvertimeField(editCell.employeeName, editCell.date, hrs, false);
    setEditCell(null);
  };

  const selectedEmpOvertimeData = useMemo(() => {
    if (!selectedEmployeeForChart) return [];
    const empRecords = overtime.filter(r => 
      r.employeeId === selectedEmployeeForChart.id || 
      (r.employeeName && r.employeeName.toLowerCase() === selectedEmployeeForChart.name.toLowerCase())
    );
    return [...empRecords]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: r.totalExtraHours,
        task: r.taskName || 'Extra Work'
      }));
  }, [selectedEmployeeForChart, overtime]);

  const selectedEmpMetrics = useMemo(() => {
    if (!selectedEmployeeForChart) return { totalHours: 0, sessions: 0, avgHours: '0.0', tasks: [] };
    const empRecords = overtime.filter(r => 
      r.employeeId === selectedEmployeeForChart.id || 
      (r.employeeName && r.employeeName.toLowerCase() === selectedEmployeeForChart.name.toLowerCase())
    );
    const totalHours = empRecords.reduce((sum, r) => sum + r.totalExtraHours, 0);
    const sessions = empRecords.length;
    const avgHours = sessions > 0 ? (totalHours / sessions).toFixed(1) : '0.0';
    return {
      totalHours,
      sessions,
      avgHours,
      tasks: empRecords.map(r => ({
        id: r.id,
        date: r.date,
        taskName: r.taskName || 'Extra Work',
        hours: r.totalExtraHours,
        status: r.deliverableStatus || 'completed'
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [selectedEmployeeForChart, overtime]);

  const lastActiveDates = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const uniqueDatesSet = new Set(overtime.map(r => r.date));
    
    // Always include today's date so it is editable in the spreadsheet!
    uniqueDatesSet.add(todayStr);
    
    const uniqueDates = Array.from(uniqueDatesSet)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Return the last 6 dates (including today) in chronological order
    return uniqueDates.slice(0, 6).reverse();
  }, [overtime]);

  const employeeOvertimeMatrix = useMemo(() => {
    return employees.map(emp => {
      const empOvertime = overtime.filter(r => 
        r.employeeId === emp.id || 
        (r.employeeName && r.employeeName.toLowerCase() === emp.name.toLowerCase())
      );
      
      const hoursByDate: Record<string, number> = {};
      lastActiveDates.forEach(date => {
        const dayRecords = empOvertime.filter(r => r.date === date);
        const totalHours = dayRecords.reduce((sum, r) => sum + r.totalExtraHours, 0);
        hoursByDate[date] = totalHours;
      });
      
      const totalHoursSum = Object.values(hoursByDate).reduce((sum, h) => sum + h, 0);
      
      return {
        employee: emp,
        hoursByDate,
        totalHoursSum
      };
    });
  }, [employees, overtime, lastActiveDates]);

  const { theme } = useTheme();
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
  const tickColor = theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.65)';

  // Base filtering by period
  const periodFilteredRecords = useMemo(() => {
    let latestTime = new Date('2026-04-28').getTime();
    overtimeRecords.forEach(r => {
      if (r.date) {
        const d = new Date(r.date).getTime();
        if (!isNaN(d) && d > latestTime) latestTime = d;
      }
    });
    const now = new Date(latestTime);
    const startDate = new Date(now);
    
    if (period === 'week') startDate.setDate(now.getDate() - 7);
    else if (period === 'month') startDate.setDate(now.getDate() - 30);
    else return overtimeRecords;

    return overtimeRecords.filter(r => new Date(r.date) >= startDate);
  }, [period, overtimeRecords]);

  const filteredRecords = useMemo(() => {
    return periodFilteredRecords.filter((r) => {
      const matchSearch =
        (r.employeeName && r.employeeName.toLowerCase().includes(search.toLowerCase())) ||
        (r.taskName && r.taskName.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = !statusFilter || r.deliverableStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [periodFilteredRecords, search, statusFilter]);

  const hasActiveFilters = !!(search || statusFilter);

  // KPI data - based on period filtered records
  const totalOvertimeHours = periodFilteredRecords.reduce((sum, r) => sum + r.totalExtraHours, 0);
  const completedDeliverables = periodFilteredRecords.filter(
    (r) => r.deliverableStatus === 'completed'
  ).length;
  const pendingDeliverables = periodFilteredRecords.filter(
    (r) => r.deliverableStatus === 'pending'
  ).length;
  const avgExtraHours = (totalOvertimeHours / (periodFilteredRecords.length || 1)).toFixed(1);

  // Employee overtime chart - based on period filtered records
  const employeeOvertimeData = useMemo(() => {
    const map = new Map<string, number>();
    periodFilteredRecords.forEach((r) => {
      map.set(r.employeeName, (map.get(r.employeeName) || 0) + r.totalExtraHours);
    });
    return Array.from(map.entries())
      .map(([name, hours]) => ({
        name: name.split(' ')[0],
        hours: Number(hours.toFixed(1)),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [periodFilteredRecords]);

  // Deliverables Status Distribution - based on period filtered records
  const statusPieData = [
    {
      name: 'Completed',
      value: completedDeliverables,
      color: '#10b981',
    },
    {
      name: 'Pending',
      value: pendingDeliverables,
      color: '#f59e0b',
    },
  ];

  // Timeline data - sort by date and time
  const timeline = useMemo(() => {
    return [...filteredRecords].sort(
      (a, b) =>
        new Date(`${b.date} ${b.startTime}`).getTime() -
        new Date(`${a.date} ${a.startTime}`).getTime()
    );
  }, [filteredRecords]);

  const exportEmployeeOvertimeToExcel = (empName: string, empId: string) => {
    // Get overtime records for this specific employee
    const empRecords = overtime.filter(r => 
      r.employeeId === empId || 
      (r.employeeName && r.employeeName.toLowerCase() === empName.toLowerCase())
    );

    if (empRecords.length === 0) {
      showToast(`No overtime records found for ${empName}`, "info");
      return;
    }

    // CSV headers
    const headers = ['Date', 'Task Name', 'Start Time', 'End Time', 'Hours', 'Type', 'Status'];

    // Map records to rows
    const rows = empRecords.map((record) => [
      record.date,
      `"${(record.taskName || 'Extra Work').replace(/"/g, '""')}"`,
      record.startTime || '18:00',
      record.endTime || '20:00',
      record.totalExtraHours,
      record.workType === 'urgent-task' ? 'Urgent' : 'Overtime',
      record.deliverableStatus || 'completed'
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    // Create Blob with UTF-8 BOM
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${empName.replace(/\s+/g, '_')}_Overtime_Report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloaded Overtime Excel for ${empName}!`, "success");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header with Period Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Overtime & Extra Work</h2>
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Monitor extended developer hours and urgent deliverables</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAddForm(prev => ({ ...prev, employeeId: employees[0]?.id || '', date: new Date().toISOString().split('T')[0], hours: '', taskName: 'Extra work' }));
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Overtime
          </button>

          <div className="flex items-center p-1 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06]">
            {[
              { id: 'week', label: '1 Week' },
              { id: 'month', label: '1 Month' },
              { id: 'all', label: 'All Time' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setPeriod(item.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  period === item.id 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                    : 'text-muted hover:text-secondary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <KPICard
          title="Total Overtime Hours"
          value={`${totalOvertimeHours}h`}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          trend={period === 'week' ? 5 : 12}
          trendLabel={`this ${period === 'all' ? 'year' : period}`}
        />
        <KPICard
          title="Completed Deliverables"
          value={completedDeliverables}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
          trend={25}
          trendLabel={`of ${overtimeRecords.length} total`}
        />
        <KPICard
          title="Pending Deliverables"
          value={pendingDeliverables}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="rose"
          trend={-10}
          trendLabel="overtime tasks pending completion"
        />
        <KPICard
          title="Avg Extra Hours"
          value={`${avgExtraHours}h`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="sky"
          trend={5}
          trendLabel="per overtime session"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Employee Overtime Bar Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Overtime by Employee</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-faint)' }}>Total extra hours logged per team member</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={employeeOvertimeData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover-overlay)' }} />
              <Bar dataKey="hours" name="Hours" radius={[6, 6, 0, 0]}>
                {employeeOvertimeData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      index === 0
                        ? 'oklch(0.60 0.22 20)'      // Top 1: Intense Rose for high alert
                        : index === 1
                        ? 'oklch(0.65 0.20 40)'      // Top 2: Deep Orange
                        : index === 2
                        ? 'oklch(0.70 0.18 60)'      // Top 3: Amber
                        : 'var(--color-primary-400)' // Others: Violet (Primary theme color)
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deliverable Status Pie Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Deliverable Status</h3>
          <p className="text-[11px] mb-4" style={{ color: 'var(--text-faint)' }}>Completed vs Pending Overtime Tasks</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusPieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {statusPieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', color: tickColor }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Left Timeline, Right Team Members Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Overtime Timeline feed */}
        <div className="lg:col-span-2 glass-card p-5 self-start">
          <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Overtime Timeline</h3>
          <p className="text-[11px] mb-4" style={{ color: 'var(--text-faint)' }}>Recent overtime sessions and updates</p>
          <div className="space-y-0 relative overflow-y-auto max-h-[460px] pr-2 custom-scrollbar">
            <div className="absolute left-[14px] top-3 bottom-3 w-px" style={{ background: 'var(--border-light)' }} />
            {timeline.slice(0, 25).map((record) => (
              <div key={record.id} 
                onClick={() => {
                  if (record.employeeId && record.employeeName) {
                    setSelectedEmployeeForChart({ id: record.employeeId, name: record.employeeName });
                  }
                }}
                className="relative flex items-start gap-4 pb-5 cursor-pointer group">
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    record.workType === 'urgent-task'
                      ? 'bg-rose-500/20 border border-rose-500/30'
                      : 'bg-amber-500/20 border border-amber-500/30'
                  }`}
                >
                  <Timer
                    className={`w-3 h-3 ${
                      record.workType === 'urgent-task' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold truncate group-hover:text-primary-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {record.employeeName}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        record.workType === 'urgent-task'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {record.workType === 'urgent-task' ? 'URGENT' : 'OT'}
                    </span>
                  </div>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{record.taskName}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>
                    <span>
                      {record.startTime} → {record.endTime}
                    </span>
                    <span
                      className={`font-semibold ${
                        record.totalExtraHours > 3 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      +{record.totalExtraHours}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Members Overtime Cards Grid (replacing the table) */}
        <div className="lg:col-span-3 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Team Overtime Reports</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>Click on any team member to view their overtime analysis and download their report</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[460px] pr-2 custom-scrollbar">
            {employees.map((emp) => {
              const perf = performanceData.find((p: any) => p.employeeId === emp.id);
              const empOvertime = overtime.filter(r => 
                r.employeeId === emp.id || 
                (r.employeeName && r.employeeName.toLowerCase() === emp.name.toLowerCase())
              );
              const totalHours = empOvertime.reduce((sum, r) => sum + r.totalExtraHours, 0);

              return (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEmployeeForChart({ id: emp.id, name: emp.name })}
                  className="interactive-card p-4 glass-card-light group hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-primary-500/20 border border-white/20">
                      {emp.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate group-hover:text-emerald-400 transition-colors flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                        {emp.name}
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all text-emerald-500 translate-y-0.5 group-hover:translate-y-0" />
                      </p>
                      <p className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{emp.role}</p>
                    </div>
                    <StatusBadge status={emp.status === 'active' ? 'present' : 'absent'} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span style={{ color: 'var(--text-faint)' }}>{empOvertime.length} sessions</span>
                    <span className="font-semibold text-emerald-400">
                      Overtime: {totalHours}h
                    </span>
                  </div>
                  <ProgressBar value={Math.min((totalHours / 40) * 100, 100)} size="sm" color="emerald" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Overtime Spreadsheet Matrix */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Daily Overtime Spreadsheet</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>Click developer name for analysis. Click date cells to manually edit/add overtime hours.</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-primary-500 text-white hover:bg-primary-600 flex items-center gap-1.5 shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Overtime
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5">
                <th className="text-[10px] font-bold uppercase tracking-wider text-left pb-3 pl-2" style={{ color: 'var(--text-secondary)' }}>Developer Name</th>
                {lastActiveDates.map(date => {
                  const isToday = date === new Date().toISOString().split('T')[0];
                  return (
                    <th key={date} className={`text-[10px] font-bold uppercase tracking-wider text-center pb-3 px-2 ${isToday ? 'text-primary-500 font-extrabold relative' : ''}`} style={{ color: isToday ? 'var(--color-primary-500)' : 'var(--text-secondary)' }}>
                      {date} {isToday && '(Today)'}
                      {isToday && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />}
                    </th>
                  );
                })}
                <th className="text-[10px] font-bold uppercase tracking-wider text-center pb-3 pr-2" style={{ color: 'var(--text-secondary)' }}>Total (Period)</th>
              </tr>
            </thead>
            <tbody>
              {employeeOvertimeMatrix.map(({ employee, hoursByDate, totalHoursSum }) => (
                <tr 
                  key={employee.id}
                  className="border-b border-black/5 dark:border-white/[0.02] hover:bg-black/5 dark:hover:bg-white/[0.03] transition-all group animate-fade-in"
                >
                  <td 
                    className="py-3 pl-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-l-md"
                    onClick={() => setSelectedEmployeeForChart({ id: employee.id, name: employee.name })}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm flex-shrink-0">
                        {employee.avatar}
                      </div>
                      <p className="text-xs font-semibold truncate group-hover:text-primary-400 transition-colors flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                        {employee.name}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all text-primary-400" />
                      </p>
                    </div>
                  </td>
                  {lastActiveDates.map(date => {
                    const hours = hoursByDate[date] || 0;
                    const isToday = date === new Date().toISOString().split('T')[0];
                    return (
                      <td 
                        key={date} 
                        className={`py-3 px-2 text-center text-xs font-semibold transition-colors ${isToday ? 'bg-primary-500/5 dark:bg-primary-500/[0.02]' : ''}`}
                        style={{ borderRight: '1px solid var(--border-light)' }}
                      >
                        {hours > 0 ? (
                          <span className="text-amber-500 font-bold dark:text-amber-400">
                            {hours}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)', opacity: 0.35 }}>
                            0
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 pr-2 text-center text-xs font-extrabold text-primary-500" style={{ color: 'var(--color-primary-500, #8b5cf6)' }}>
                    {totalHoursSum > 0 ? `${totalHoursSum}h` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!selectedEmployeeForChart}
        onClose={() => setSelectedEmployeeForChart(null)}
        title={selectedEmployeeForChart ? `Overtime Analysis: ${selectedEmployeeForChart.name}` : ''}
        footer={
          selectedEmployeeForChart && (
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <button
                onClick={() => setSelectedEmployeeForChart(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportEmployeeOvertimeToExcel(selectedEmployeeForChart.name, selectedEmployeeForChart.id)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 flex items-center gap-1.5 border border-emerald-500/20"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel Report
                </button>
                <button
                  onClick={() => {
                    navigate(`/performance/${selectedEmployeeForChart.id}`);
                    setSelectedEmployeeForChart(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-primary-500 text-white hover:bg-primary-600 flex items-center gap-1.5 shadow-lg shadow-primary-500/20"
                >
                  View Full Profile
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        }
      >
        {selectedEmployeeForChart && (
          <div className="space-y-5">
            {/* Chart Section */}
            <div>
              <h4 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Hours History Trend</h4>
              {selectedEmpOvertimeData.length > 0 ? (
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedEmpOvertimeData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary-500, #8b5cf6)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--color-primary-500, #8b5cf6)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: tickColor, fontSize: 10 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: tickColor, fontSize: 10 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        name="Hours"
                        stroke="var(--color-primary-500, #8b5cf6)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorHours)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[180px] flex items-center justify-center border border-dashed rounded-xl" style={{ borderColor: 'var(--border-light)' }}>
                  <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>No overtime logs recorded for this period</p>
                </div>
              )}
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl text-center glass-card-light" style={{ background: 'var(--hover-overlay)' }}>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Total Hours</span>
                <p className="text-lg font-extrabold text-amber-500 mt-0.5">{selectedEmpMetrics.totalHours}h</p>
              </div>
              <div className="p-3 rounded-xl text-center glass-card-light" style={{ background: 'var(--hover-overlay)' }}>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Avg Session</span>
                <p className="text-lg font-extrabold text-primary-500 mt-0.5" style={{ color: 'var(--color-primary-500, #8b5cf6)' }}>{selectedEmpMetrics.avgHours}h</p>
              </div>
              <div className="p-3 rounded-xl text-center glass-card-light" style={{ background: 'var(--hover-overlay)' }}>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Total Sessions</span>
                <p className="text-lg font-extrabold text-emerald-500 mt-0.5">{selectedEmpMetrics.sessions}</p>
              </div>
            </div>

            {/* Tasks Detail List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Overtime Task Logs</h4>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Showing all records</span>
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar">
                {selectedEmpMetrics.tasks.length > 0 ? (
                  selectedEmpMetrics.tasks.map((task, index) => (
                    <div key={task.id || index} className="flex items-center justify-between p-2 rounded-lg border text-xs" style={{ borderColor: 'var(--border-light)', background: 'var(--bg-card-light)' }}>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{task.taskName}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                          {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-amber-500">+{task.hours}h</span>
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-xs" style={{ color: 'var(--text-faint)' }}>No recent task logs</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Add Overtime Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Overtime Record"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-overtime-form"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20"
            >
              Add Record
            </button>
          </div>
        }
      >
        <form id="add-overtime-form" onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Select Developer</label>
            <select
              value={addForm.employeeId}
              onChange={(e) => setAddForm(prev => ({ ...prev, employeeId: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-xs theme-select cursor-pointer border focus:outline-none"
              style={{ background: 'var(--bg-card-light)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              required
            >
              <option value="">-- Choose Developer --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-2 py-2 rounded-xl text-xs border focus:outline-none animate-fade-in"
                  style={{ background: 'var(--bg-card-light)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>From Time</label>
              <input
                type="time"
                value={addForm.startTime}
                onChange={(e) => setAddForm(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-2 py-2 rounded-xl text-xs border focus:outline-none"
                style={{ background: 'var(--bg-card-light)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>To Time</label>
              <input
                type="time"
                value={addForm.endTime}
                onChange={(e) => setAddForm(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-2 py-2 rounded-xl text-xs border focus:outline-none"
                style={{ background: 'var(--bg-card-light)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                required
              />
            </div>
          </div>

          {calculateHours(addForm.startTime, addForm.endTime) > 0 && (
            <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs text-primary-600 dark:text-primary-400 font-medium">
              ⏱️ Calculated Overtime: <span className="font-bold">{addForm.startTime}</span> to <span className="font-bold">{addForm.endTime}</span> (<span className="font-bold">{calculateHours(addForm.startTime, addForm.endTime)}</span> hours)
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Task / Description</label>
            <input
              type="text"
              placeholder="e.g. API Integration, Bug fixing"
              value={addForm.taskName}
              onChange={(e) => setAddForm(prev => ({ ...prev, taskName: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
              style={{ background: 'var(--bg-card-light)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            />
          </div>
        </form>
      </Modal>

      {/* Cell Editor Modal */}
      <Modal
        isOpen={!!editCell}
        onClose={() => setEditCell(null)}
        title="Edit Overtime Hours"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditCell(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-cell-form"
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20"
            >
              Save Changes
            </button>
          </div>
        }
      >
        {editCell && (
          <form id="edit-cell-form" onSubmit={handleSaveCell} className="space-y-4">
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.02] border" style={{ borderColor: 'var(--border-light)' }}>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Updating overtime logs for <span className="font-extrabold text-primary-500">{editCell.employeeName}</span> on <span className="font-extrabold text-primary-500">{editCell.date}</span>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Overtime Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={editHours}
                onChange={(e) => setEditHours(e.target.value)}
                placeholder="Enter 0 to clear overtime"
                className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                style={{ background: 'var(--bg-card-light)', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
                required
                autoFocus
              />
              <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-faint)' }}>Setting hours to 0 will clear the overtime record for this date.</p>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
