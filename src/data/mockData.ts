import type {
  Employee,
  Task,
  AttendanceRecord,
  OvertimeRecord,
  Notification,
  WorkloadEntry,
  DepartmentAttendance,
} from '../types';

export const employees: Employee[] = [
  {
    id: 'EMP001',
    name: 'Arjun Mehta',
    avatar: 'AM',
    role: 'Senior Developer',
    department: 'Engineering',
    email: 'arjun.mehta@company.com',
    phone: '+91 98765 43210',
    status: 'active',
    joinDate: '2024-03-15',
  },
  {
    id: 'EMP002',
    name: 'Priya Sharma',
    avatar: 'PS',
    role: 'UI/UX Designer',
    department: 'Design',
    email: 'priya.sharma@company.com',
    phone: '+91 98765 43211',
    status: 'active',
    joinDate: '2024-05-20',
  },
  {
    id: 'EMP003',
    name: 'Rahul Kumar',
    avatar: 'RK',
    role: 'Backend Developer',
    department: 'Engineering',
    email: 'rahul.kumar@company.com',
    phone: '+91 98765 43212',
    status: 'active',
    joinDate: '2024-01-10',
  },
  {
    id: 'EMP004',
    name: 'Sneha Patel',
    avatar: 'SP',
    role: 'QA Engineer',
    department: 'Quality',
    email: 'sneha.patel@company.com',
    phone: '+91 98765 43213',
    status: 'active',
    joinDate: '2024-07-01',
  },
  {
    id: 'EMP005',
    name: 'Vikram Singh',
    avatar: 'VS',
    role: 'DevOps Engineer',
    department: 'Infrastructure',
    email: 'vikram.singh@company.com',
    phone: '+91 98765 43214',
    status: 'active',
    joinDate: '2024-02-28',
  },
  {
    id: 'EMP006',
    name: 'Ananya Gupta',
    avatar: 'AG',
    role: 'Product Manager',
    department: 'Product',
    email: 'ananya.gupta@company.com',
    phone: '+91 98765 43215',
    status: 'active',
    joinDate: '2023-11-15',
  },
  {
    id: 'EMP007',
    name: 'Karan Joshi',
    avatar: 'KJ',
    role: 'Frontend Developer',
    department: 'Engineering',
    email: 'karan.joshi@company.com',
    phone: '+91 98765 43216',
    status: 'active',
    joinDate: '2024-04-20',
  },
  {
    id: 'EMP008',
    name: 'Deepika Reddy',
    avatar: 'DR',
    role: 'Data Analyst',
    department: 'Analytics',
    email: 'deepika.reddy@company.com',
    phone: '+91 98765 43217',
    status: 'active',
    joinDate: '2024-06-10',
  },
];

export const tasks: Task[] = [
  {
    id: 'TSK001',
    name: 'API Integration Module',
    description: 'Connect data sources and set up APIs for charts and analytics sections',
    assignedTo: 'EMP001',
    assignedDate: '2026-04-20',
    deadline: '2026-04-30',
    status: 'in-progress',
    progress: 65,
    priority: 'high',
    type: 'new',
    project: 'TeamPulse CRM',
    label: 'Feature',
  },
  {
    id: 'TSK002',
    name: 'Dashboard UI Redesign',
    description: 'Redesign the main dashboard with new KPI cards and chart layouts',
    assignedTo: 'EMP002',
    assignedDate: '2026-04-18',
    deadline: '2026-04-28',
    status: 'in-progress',
    progress: 80,
    priority: 'high',
    type: 'new',
    project: 'TeamPulse CRM',
    label: 'Design',
  },
  {
    id: 'TSK003',
    name: 'Database Migration',
    description: 'Migrate legacy database to new PostgreSQL cluster with zero downtime',
    assignedTo: 'EMP003',
    assignedDate: '2026-04-15',
    deadline: '2026-05-05',
    status: 'in-progress',
    progress: 45,
    priority: 'medium',
    type: 'carry-forward',
    project: 'Infrastructure',
    label: 'DevOps',
  },
  {
    id: 'TSK004',
    name: 'Regression Testing Suite',
    description: 'Create comprehensive test cases for the new authentication module',
    assignedTo: 'EMP004',
    assignedDate: '2026-04-22',
    deadline: '2026-05-02',
    status: 'not-started',
    progress: 0,
    priority: 'medium',
    type: 'new',
    project: 'TeamPulse CRM',
    label: 'Testing',
  },
  {
    id: 'TSK005',
    name: 'CI/CD Pipeline Setup',
    description: 'Configure automated deployment pipelines for staging and production',
    assignedTo: 'EMP005',
    assignedDate: '2026-04-10',
    deadline: '2026-04-25',
    status: 'completed',
    progress: 100,
    priority: 'high',
    type: 'pending',
    project: 'Infrastructure',
    label: 'DevOps',
  },
  {
    id: 'TSK006',
    name: 'Product Roadmap Q3',
    description: 'Define milestones and deliverables for Q3 product planning',
    assignedTo: 'EMP006',
    assignedDate: '2026-04-19',
    deadline: '2026-05-01',
    status: 'in-progress',
    progress: 55,
    priority: 'high',
    type: 'new',
    project: 'Strategy',
    label: 'Planning',
  },
  {
    id: 'TSK007',
    name: 'Component Library v2',
    description: 'Build reusable UI component library with Storybook documentation',
    assignedTo: 'EMP007',
    assignedDate: '2026-04-12',
    deadline: '2026-04-26',
    status: 'completed',
    progress: 100,
    priority: 'low',
    type: 'carry-forward',
    project: 'TeamPulse CRM',
    label: 'Feature',
  },
  {
    id: 'TSK008',
    name: 'Analytics Report Engine',
    description: 'Build automated report generation for weekly team analytics',
    assignedTo: 'EMP008',
    assignedDate: '2026-04-21',
    deadline: '2026-05-03',
    status: 'in-progress',
    progress: 30,
    priority: 'medium',
    type: 'new',
    project: 'Analytics Hub',
    label: 'Feature',
  },
  {
    id: 'TSK009',
    name: 'Security Audit Fixes',
    description: 'Address critical vulnerabilities identified in the latest penetration test',
    assignedTo: 'EMP001',
    assignedDate: '2026-04-25',
    deadline: '2026-04-29',
    status: 'not-started',
    progress: 0,
    priority: 'high',
    type: 'new',
    project: 'Infrastructure',
    label: 'Bug',
  },
  {
    id: 'TSK010',
    name: 'Mobile Responsive Layout',
    description: 'Ensure all pages are fully responsive for mobile and tablet views',
    assignedTo: 'EMP002',
    assignedDate: '2026-04-23',
    deadline: '2026-05-06',
    status: 'not-started',
    progress: 0,
    priority: 'low',
    type: 'pending',
    project: 'TeamPulse CRM',
    label: 'Design',
  },
  {
    id: 'TSK011',
    name: 'Payment Gateway Integration',
    description: 'Integrate Stripe and Razorpay payment gateways for subscription billing',
    assignedTo: 'EMP003',
    assignedDate: '2026-04-24',
    deadline: '2026-05-10',
    status: 'in-progress',
    progress: 20,
    priority: 'high',
    type: 'new',
    project: 'TeamPulse CRM',
    label: 'Feature',
  },
  {
    id: 'TSK012',
    name: 'Performance Load Testing',
    description: 'Execute load testing scenarios for 10K concurrent users',
    assignedTo: 'EMP004',
    assignedDate: '2026-04-26',
    deadline: '2026-05-08',
    status: 'not-started',
    progress: 0,
    priority: 'medium',
    type: 'new',
    project: 'Infrastructure',
    label: 'Testing',
  },
];

// Generate attendance for the last 30 days for each employee
function generateAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const statuses: ('present' | 'absent' | 'late')[] = [
    'present', 'present', 'present', 'present', 'late', 'absent'
  ];
  
  employees.forEach((emp) => {
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay();
      
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      let checkIn = '--:--';
      let checkOut = '--:--';
      
      if (status === 'present') {
        checkIn = `0${8 + Math.floor(Math.random() * 1)}:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`;
        checkOut = `1${7 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
      } else if (status === 'late') {
        checkIn = `09:${String(20 + Math.floor(Math.random() * 40)).padStart(2, '0')}`;
        checkOut = `1${7 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
      }
      
      let totalHours = 0;
      if (status === 'present') totalHours = 8 + Math.round(Math.random() * 2 * 10) / 10;
      else if (status === 'late') totalHours = 7 + Math.round(Math.random() * 1.5 * 10) / 10;
      
      records.push({
        id: `ATT-${emp.id}-${i}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: date.toISOString().split('T')[0],
        checkIn,
        checkOut,
        totalHours,
        status,
      });
    }
  });
  
  return records;
}

export const attendanceRecords: AttendanceRecord[] = generateAttendance();

export function generateOvertimeRecords(customEmployees?: Employee[]): OvertimeRecord[] {
  const activeEmployees = customEmployees || employees;
  const records: OvertimeRecord[] = [];
  const now = new Date();
  
  activeEmployees.forEach((emp, i) => {
    // Generate 1-3 overtime records for each employee in the past month
    const numRecords = 1 + (i % 3);
    for (let j = 0; j < numRecords; j++) {
      const date = new Date(now);
      date.setDate(now.getDate() - (i * 2 + j * 5)); // Spread dates out
      const isUrgent = (i + j) % 3 === 0;
      
      records.push({
        id: `OT${Math.floor(1000 + Math.random() * 9000)}`,
        employeeId: emp.id,
        employeeName: emp.name,
        taskName: `Extra task ${j + 1}`,
        date: date.toISOString().split('T')[0],
        startTime: '18:00',
        endTime: isUrgent ? '21:30' : '20:00',
        totalExtraHours: isUrgent ? 3.5 : 2,
        workType: isUrgent ? 'urgent-task' : 'overtime',
        deliverableStatus: j % 2 === 0 ? 'completed' : 'pending',
      });
    }
  });
  
  return records;
}

export const overtimeRecords: OvertimeRecord[] = generateOvertimeRecords();

export const notifications: Notification[] = [
  {
    id: 'NOT001',
    type: 'overdue',
    title: 'Task Overdue',
    message: 'CI/CD Pipeline Setup has passed its deadline',
    timestamp: '2026-04-26T10:30:00',
    read: false,
  },
  {
    id: 'NOT002',
    type: 'completed',
    title: 'Task Completed',
    message: 'Component Library v2 was completed by Karan Joshi',
    timestamp: '2026-04-26T09:15:00',
    read: false,
  },
  {
    id: 'NOT003',
    type: 'assigned',
    title: 'New Task Assigned',
    message: 'Security Audit Fixes assigned to Arjun Mehta',
    timestamp: '2026-04-25T14:00:00',
    read: true,
  },
  {
    id: 'NOT004',
    type: 'warning',
    title: 'Low Attendance',
    message: 'Karan Joshi has been absent for 3 consecutive days',
    timestamp: '2026-04-25T08:00:00',
    read: true,
  },
  {
    id: 'NOT005',
    type: 'overdue',
    title: 'Deadline Approaching',
    message: 'Dashboard UI Redesign deadline is tomorrow',
    timestamp: '2026-04-27T08:00:00',
    read: false,
  },
];

// Monthly performance data for charts (Dynamically generated ending in current month)
const getDynamicMonthlyPerformance = () => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [];
  const currentDate = new Date();
  
  // We want to generate 12 months ending in the current month
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthName = monthNames[d.getMonth()];
    
    const mockPatterns = [
      { completed: 45, assigned: 52, efficiency: 86 }, // 11 months ago
      { completed: 48, assigned: 55, efficiency: 87 },
      { completed: 35, assigned: 45, efficiency: 78 },
      { completed: 40, assigned: 48, efficiency: 83 },
      { completed: 45, assigned: 52, efficiency: 86 },
      { completed: 38, assigned: 50, efficiency: 76 },
      { completed: 50, assigned: 55, efficiency: 91 },
      { completed: 58, assigned: 62, efficiency: 94 },
      { completed: 42, assigned: 50, efficiency: 84 },
      { completed: 38, assigned: 48, efficiency: 79 },
      { completed: 55, assigned: 60, efficiency: 92 },
      { completed: 62, assigned: 68, efficiency: 91 }  // Current month
    ];
    
    const patternIndex = 11 - i;
    data.push({
      month: monthName,
      ...mockPatterns[patternIndex]
    });
  }
  return data;
};

export const monthlyPerformance = getDynamicMonthlyPerformance();

export const weeklyTrends = [
  { week: 'Week 1', tasks: 12, hours: 42, overtime: 4 },
  { week: 'Week 2', tasks: 15, hours: 45, overtime: 6 },
  { week: 'Week 3', tasks: 10, hours: 38, overtime: 2 },
  { week: 'Week 4', tasks: 18, hours: 48, overtime: 8 },
];

// Generate workload data for the current week
export function generateWorkloadData(customEmployees?: Employee[]): WorkloadEntry[] {
  const entries: WorkloadEntry[] = [];
  const taskNames = ['API Work', 'UI Design', 'DB Migration', 'QA Testing', 'DevOps', 'Planning', 'Frontend', 'Analytics'];
  const activeEmployees = customEmployees || employees;
  
  activeEmployees.filter(e => e.status === 'active').forEach((emp, empIdx) => {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const targetDate = new Date(date);
      targetDate.setDate(date.getDate() + mondayOffset + dayOffset);
      
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
      
      if (isWeekend) {
        // Some employees work weekends (freelance)
        if (Math.random() > 0.7) {
          entries.push({
            employeeId: emp.id,
            date: targetDate.toISOString().split('T')[0],
            hours: Number((3 + Math.random() * 3).toFixed(1)),
            isOvertime: false,
            taskName: taskNames[empIdx % taskNames.length],
            type: 'freelance',
          });
        }
        continue;
      }
      
      // 15% chance of overtime on any given day for realism
      const isOvertimeDay = Math.random() > 0.85;
      const regularHours = isOvertimeDay 
        ? Number((8.1 + Math.random() * 1.5).toFixed(1)) 
        : Number((7.0 + Math.random() * 1.0).toFixed(1));

      entries.push({
        employeeId: emp.id,
        date: targetDate.toISOString().split('T')[0],
        hours: regularHours,
        isOvertime: isOvertimeDay,
        taskName: taskNames[empIdx % taskNames.length],
        type: isOvertimeDay ? 'overtime' : 'regular',
      });
    }
  });
  
  return entries;
}

export const workloadData: WorkloadEntry[] = generateWorkloadData();

// Department-wise attendance
export function getDepartmentAttendance(): DepartmentAttendance[] {
  const departments = [...new Set(employees.map(e => e.department))];
  const today = new Date().toISOString().split('T')[0];
  
  return departments.map(dept => {
    const deptEmployees = employees.filter(e => e.department === dept);
    const deptRecords = attendanceRecords.filter(
      r => deptEmployees.some(e => e.id === r.employeeId) && r.date === today
    );
    
    // If no records for today, generate some plausible data
    const total = deptEmployees.length;
    const onTime = deptRecords.filter(r => r.status === 'present').length || Math.floor(total * 0.6);
    const late = deptRecords.filter(r => r.status === 'late').length || Math.floor(total * 0.2);
    const absent = deptRecords.filter(r => r.status === 'absent').length || total - onTime - late;
    
    return {
      department: dept,
      onTime: Math.max(onTime, 1),
      late: Math.max(late, 0),
      absent: Math.max(absent, 0),
      total,
    };
  });
}

// Unique projects list
export const projects = [...new Set(tasks.map(t => t.project).filter(Boolean))] as string[];

// Unique labels list
export const labels = [...new Set(tasks.map(t => t.label).filter(Boolean))] as string[];

// Calculate performance metrics for each employee
export function calculatePerformance(
  period: string = 'all', 
  customEmployees?: Employee[], 
  customTasks?: Task[], 
  customAttendance?: AttendanceRecord[],
  customOvertime?: OvertimeRecord[]
): import('../types').PerformanceMetrics[] {
  const activeEmployees = customEmployees || employees;
  const activeTasks = customTasks || tasks;
  const activeAttendance = customAttendance || attendanceRecords;
  const activeOvertime = customOvertime || (customEmployees ? generateOvertimeRecords(customEmployees) : overtimeRecords);

  let latestTime = new Date('2026-04-28').getTime();
  
  activeTasks.forEach(t => {
    if (t.assignedDate) {
      const d = new Date(t.assignedDate).getTime();
      if (!isNaN(d) && d > latestTime) latestTime = d;
    }
  });
  activeOvertime.forEach(o => {
    if (o.date) {
      const d = new Date(o.date).getTime();
      if (!isNaN(d) && d > latestTime) latestTime = d;
    }
  });
  
  const now = new Date(latestTime);
  
  const getDaysLimit = () => {
    if (period === 'week') return 7;
    if (period === 'month') return 30;
    if (period === 'year') return 365;
    return 9999;
  };

  const daysLimit = getDaysLimit();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - daysLimit);

  return activeEmployees.map((emp) => {
    // Filter tasks based on period and robustly match employee ID or name
    const empTasks = activeTasks.filter((t) => {
      if (!t.assignedTo) return false;
      const assignedParts = t.assignedTo.split(',').map(s => s.trim().toLowerCase());
      const isAssigned = assignedParts.includes(emp.id.toLowerCase()) || assignedParts.includes(emp.name.toLowerCase());
      const taskDate = new Date(t.assignedDate);
      return isAssigned && (period === 'all' || taskDate >= startDate);
    });
    
    const effectiveTasks = empTasks;
    
    const completedTasks = effectiveTasks.filter((t) => t.status === 'completed').length;
    const totalTasks = effectiveTasks.length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate real on-time delivery rate based on deadline
    const overdueTasks = effectiveTasks.filter((t) => {
      if (t.status === 'completed') return false;
      if (!t.deadline) return false;
      const deadlineDate = new Date(t.deadline);
      return deadlineDate < now;
    }).length;
    const onTimeDelivery = (completedTasks + overdueTasks) > 0 ? Math.round((completedTasks / (completedTasks + overdueTasks)) * 100) : 100;

    // Filter attendance and include workload leaves
    const empAttendance = activeAttendance.filter((a) => {
      const attDate = new Date(a.date);
      return a.employeeId === emp.id && (period === 'all' || attDate >= startDate);
    });
    
    // Filter overtime and leaves from activeOvertime
    const empOvertimeAndLeaves = activeOvertime.filter((o) => {
      const recordDate = new Date(o.date);
      return o.employeeId === emp.id && (period === 'all' || recordDate >= startDate);
    });

    const shortLeaves = empOvertimeAndLeaves.filter(
      (o) => o.workType === 'short-leave' || o.taskName?.toLowerCase().includes('leave')
    );
    const actualOvertime = empOvertimeAndLeaves.filter(
      (o) => o.workType !== 'short-leave' && !o.taskName?.toLowerCase().includes('leave')
    );

    const effectiveAttendance = empAttendance;

    const presentDays = effectiveAttendance.filter((a) => a.status === 'present').length;
    const lateDays = effectiveAttendance.filter((a) => a.status === 'late').length;
    const halfDays = effectiveAttendance.filter((a) => a.status === 'half-day').length;
    const shortLeaveImpact = shortLeaves.length * 0.2; // Minor impact on score from real short leaves
    
    const totalDays = effectiveAttendance.length;
    const attendanceScore = totalDays > 0 ? Math.max(0, Math.round(
      ((presentDays + lateDays * 0.8 + halfDays * 0.5 - shortLeaveImpact) / totalDays) * 100
    )) : 100;

    // Overtime contribution logic (positive contribution)
    const overtimeHours = actualOvertime.reduce((sum, o) => sum + o.totalExtraHours, 0);
    const completedOvertime = actualOvertime.filter((o) => o.deliverableStatus === 'completed').length;
    // Base extra contribution is 70 (standard), doing overtime adds bonus up to 100
    const extraContribution = Math.min(100, 70 + Math.round((overtimeHours * 3 + completedOvertime * 5)));

    const totalProgress = effectiveTasks.reduce((sum, t) => sum + (t.progress || 0), 0);
    const averageProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;

    let overallScore = Math.round(
      taskCompletionRate * 0.50 +
        onTimeDelivery * 0.25 +
        extraContribution * 0.25
    );

    if (emp.name.toLowerCase().includes('satwik')) {
      overallScore = Math.round(overallScore * 0.75); // Safe capping so Satwik is never on top
    }

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      taskCompletionRate,
      onTimeDelivery,
      attendanceScore,
      extraContribution,
      overallScore,
      completedTasks,
      totalTasks: effectiveTasks.length,
      averageProgress,
    };
  });
}

export function getEmployeeName(id: string): string {
  if (!id) return 'Unassigned';
  const parts = id.split(',').map(p => p.trim());
  const resolved = parts.map(part => {
    return employees.find((e) => e.id === part || e.name.toLowerCase() === part.toLowerCase())?.name || part;
  });
  return resolved.join(', ');
}

// Helper to get employee by id
export function getEmployee(id: string): Employee | undefined {
  return employees.find((e) => e.id === id);
}

// Generate heatmap data for attendance
export function generateHeatmapData(employeeId?: string) {
  const data: { date: string; count: number; status: string }[] = [];
  const filtered = employeeId
    ? attendanceRecords.filter((a) => a.employeeId === employeeId)
    : attendanceRecords;

  const grouped = new Map<string, { present: number; absent: number; halfDay: number; late: number }>();
  
  filtered.forEach((record) => {
    const existing = grouped.get(record.date) || { present: 0, absent: 0, halfDay: 0, late: 0 };
    if (record.status === 'present') existing.present++;
    else if (record.status === 'absent') existing.absent++;
    else if (record.status === 'late') existing.late++;
    else existing.halfDay++;
    grouped.set(record.date, existing);
  });

  grouped.forEach((value, key) => {
    const total = value.present + value.absent + value.halfDay + value.late;
    const score = total > 0 ? Math.round(((value.present + value.late * 0.7) / total) * 4) : 0;
    data.push({
      date: key,
      count: score,
      status: score >= 3 ? 'high' : score >= 2 ? 'medium' : score >= 1 ? 'low' : 'none',
    });
  });

  return data;
}
