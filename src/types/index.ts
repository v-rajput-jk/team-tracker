export interface Employee {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | string;
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'new' | 'pending' | 'carry-forward';

export interface Task {
  id: string;
  name: string;
  description: string;
  assignedTo: string;
  assignedDate: string;
  deadline: string;
  status: TaskStatus;
  progress: number;
  priority: TaskPriority;
  type: TaskType;
  project?: string;
  label?: string;
  rawStatus?: string;
  remarks?: string;
  clientFeedback?: string;
  changeLogs?: string[];
}

export type AttendanceStatus = 'present' | 'absent' | 'half-day' | 'late';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  totalHours: number;
  status: AttendanceStatus;
}

export type OvertimeWorkType = 'overtime' | 'urgent-task' | 'short-leave';
export type DeliverableStatus = 'completed' | 'pending';

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  taskName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalExtraHours: number;
  workType: OvertimeWorkType;
  deliverableStatus: DeliverableStatus;
}

export interface PerformanceMetrics {
  employeeId: string;
  employeeName: string;
  taskCompletionRate: number;
  onTimeDelivery: number;
  attendanceScore: number;
  extraContribution: number;
  overallScore: number;
  completedTasks?: number;
  totalTasks?: number;
  averageProgress?: number;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  tasksAssignedToday: number;
  tasksCompletedToday: number;
  teamEfficiency: number;
}

export interface Notification {
  id: string;
  type: 'overdue' | 'completed' | 'assigned' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface WorkloadEntry {
  employeeId: string;
  date: string;
  hours: number;
  isOvertime: boolean;
  taskName: string;
  type: 'regular' | 'overtime' | 'freelance' | 'short-leave';
  startTime?: string;
  endTime?: string;
}

export interface DepartmentAttendance {
  department: string;
  onTime: number;
  late: number;
  absent: number;
  total: number;
}

export type ViewMode = 'table' | 'kanban';
export type ThemeMode = 'dark' | 'light';
export type TimePeriod = 'day' | 'week' | 'month' | 'year';
