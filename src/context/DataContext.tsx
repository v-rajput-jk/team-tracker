import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';
import type { Employee, Task, AttendanceRecord, OvertimeRecord, TaskPriority, TaskType } from '../types';
import { useToast } from './ToastContext';
import { generateOvertimeRecords } from '../data/mockData';

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  // If it's an ISO format with 'T', split and take the date part
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  // Check if date is in "DD-MMM-YY" format (e.g., "08-Apr-26")
  const match = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthStr = match[2].toLowerCase();
    const year = '20' + match[3];
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const month = months[monthStr];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }
  return dateStr.trim();
};

interface DataContextType {
  employees: Employee[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  overtime: OvertimeRecord[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  updateOvertimeField: (employeeName: string, date: string, value: number, isShortLeave?: boolean, startTime?: string, endTime?: string) => Promise<void>;
  updateProjectFields: (taskId: string, allocatedStaff: string, remarks: string, status?: string, clientFeedback?: string, changeLogs?: string[], progress?: number) => Promise<void>;
  addTask: (name: string, project: string, assignedTo: string, priority: string, assignedDate: string, deadline: string, description: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
        if (accounts.length === 0) return;
    setIsLoading(true);

    try {
      let token;
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0]
        });
        token = response.accessToken;
      } catch (error: any) {
        if (error.name === 'InteractionRequiredAuthError' || error.message?.includes('consent') || error.message?.includes('AADSTS65001')) {
          console.warn("Silent token acquisition failed. Redirecting for consent...");
          // Use redirect instead of popup to avoid popup blockers in useEffect
          await instance.acquireTokenRedirect({
            ...loginRequest,
            account: accounts[0]
          });
          return; // Stop execution, page will redirect
        } else {
          throw error;
        }
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all datasets in parallel
      const [empRes, taskRes, attRes, otRes] = await Promise.all([
        fetch("http://localhost:5000/getEmployees", { headers }),
        fetch("http://localhost:5000/getTasks", { headers }),
        fetch("http://localhost:5000/getAttendance", { headers }),
        fetch("http://localhost:5000/getOvertime", { headers }).catch(err => {
          console.warn("getOvertime fetch failed, will use fallback", err);
          return { ok: false } as any;
        }),
      ]);

      if (!empRes.ok || !taskRes.ok || !attRes.ok) throw new Error("One or more requests failed");

      const [empData, taskData, attData, otData] = await Promise.all([
        empRes.json(),
        taskRes.json(),
        attRes.json(),
        otRes && otRes.ok ? otRes.json() : { items: [], columnMap: {} },
      ]);

      // Map SharePoint fields to local types
      // Mapping assumes SharePoint field names: Title (Name), EmployeeID, Role, Department, Email, Status, etc.
      // Parse Attendance (supports both Standard and Pivoted formats)
      const parsedAttendance: AttendanceRecord[] = [];
      const attItems = attData.items || [];
      const columnMap = attData.columnMap || {};

      attItems.forEach((row: any) => {
        // Check if it's standard format (has Date column)
        if (row.Date) {
          const rawDate = String(row.Date).split('T')[0].split(' ')[0].trim();
          parsedAttendance.push({
            id: row.id || '',
            employeeId: row.EmployeeID || '',
            employeeName: row.EmployeeName || row.Title || '',
            date: rawDate || new Date().toISOString().split('T')[0],
            checkIn: row.CheckIn || '--:--',
            checkOut: row.CheckOut || '--:--',
            totalHours: Number(row.TotalHours) || 0,
            status: (row.Status || 'present').toLowerCase(),
          });
        } else {
          // It's a pivoted format (Columns are Dates)
          const empName = row.Name || row.Title || row.EmployeeName || row.LinkTitleNoMenu || 'Unknown';
          
          Object.keys(row).forEach(key => {
            // Get the display name for the column (e.g. "30-01-2026")
            let displayName = columnMap[key] || key;
            
            // Decode SharePoint internal column names if not in map
            if (displayName === key) {
              displayName = key.replace(/^OData_/, '');
              displayName = displayName.replace(/_x([0-9a-fA-F]{4})_/gi, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
            }
            
            // Look for DD-MM-YYYY or MM-DD-YYYY
            const dateMatch = displayName.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
            if (dateMatch) {
              const [_, d, m, y] = dateMatch;
              const isoDate = `${y}-${m}-${d}`;
              const val = String(row[key] || '').toUpperCase().trim();
              
              let status = 'present';
              if (val === 'A' || val === 'ABSENT') status = 'absent';
              else if (val === 'L' || val === 'LATE') status = 'late';
              else if (val === 'H' || val === 'HALF') status = 'half-day';
              
              if (!val) return;

              parsedAttendance.push({
                id: `${row.id}-${key}`,
                employeeId: '', 
                employeeName: empName,
                date: isoDate,
                checkIn: val === 'P' ? '09:00' : val === 'L' ? '10:30' : '--:--',
                checkOut: val === 'A' ? '--:--' : '17:00',
                totalHours: val === 'P' ? 8 : val === 'L' ? 6 : val === 'H' ? 4 : 0,
                status: status as any
              });
            }
          });
        }
      });

      // Link Employee IDs for Pivoted Data
      const parsedEmployees = empData.map((f: any) => ({
        id: f.EmployeeID || f.id || '',
        name: f.Employee_x0020_Name || f.Title || f.Name || 'Unknown',
        avatar: (f.Employee_x0020_Name || f.Title || f.Name || 'U').split(' ').map((n: string) => n[0]).join(''),
        role: f.Role || 'Member',
        department: f.Department || 'General',
        email: f.Email || '',
        phone: f.Phone || '',
        status: (f.Status || 'active').toLowerCase(),
        joinDate: f.JoinDate || new Date().toISOString(),
      }));

      parsedAttendance.forEach(record => {
        if (!record.employeeId) {
          const emp = parsedEmployees.find((e: any) => {
            const eName = (e.name || '').trim().toLowerCase();
            const rName = (record.employeeName || '').trim().toLowerCase();
            return eName === rName || eName.includes(rName) || rName.includes(eName);
          });
          if (emp) record.employeeId = emp.id;
        }
      });

      setEmployees(parsedEmployees);
      console.log("PROJECT TRACKING ITEM SAMPLE:", taskData && taskData[0] ? JSON.stringify(taskData[0]) : "empty");

      // Load local overrides from localStorage safely
      let overrides: Record<string, any> = {};
      try {
        const savedOverrides = localStorage.getItem('teampulse-task-overrides');
        if (savedOverrides) {
          overrides = JSON.parse(savedOverrides);
        }
      } catch (e) {
        console.error("Failed to parse task overrides from localStorage", e);
      }

      const mappedTasks = taskData.map((f: any) => {
        // Find raw assigned value using common SharePoint column names for assigned/allocated staff
        const rawAssigned = 
          f.field_3 ||
          f.Allocated_x0020_Staff || 
          f.AllocatedStaff || 
          f.Allocated_Staff || 
          f.AssignedTo || 
          f.Staff || 
          f.Staff_x0020_Name || 
          f.StaffName || 
          f.Employee || 
          f.EmployeeID || 
          f.Employee_x0020_Name || 
          f.Name ||
          '';

        let names: string[] = [];

        const extractName = (val: any): string => {
          if (!val) return '';
          if (typeof val === 'object') {
            return val.LookupValue || val.Title || val.DisplayName || val.Name || '';
          }
          return String(val);
        };

        if (rawAssigned) {
          if (Array.isArray(rawAssigned)) {
            names = rawAssigned.map(extractName).filter(Boolean);
          } else {
            const strVal = extractName(rawAssigned);
            // Split by newline, comma, or semicolon for multiple names
            names = strVal.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
          }
        }

        // Map names to employee IDs if possible, otherwise keep the raw name
        const resolvedParts = names.map(name => {
          const valStr = name.toLowerCase();
          const matchedEmp = parsedEmployees.find((e: any) => 
            e.id.toLowerCase() === valStr || 
            e.name.toLowerCase() === valStr ||
            e.name.toLowerCase().includes(valStr) ||
            valStr.includes(e.name.toLowerCase()) ||
            e.email.toLowerCase() === valStr
          );
          return matchedEmp ? matchedEmp.id : name;
        });

        const assignedTo = resolvedParts.join(', ') || '';

        const rawStatus = f.field_4 || f.Status || 'not-started';
        const rawStatusLower = rawStatus.toLowerCase();
        let canonicalStatus = 'not-started';
        if (rawStatusLower.includes('ongoing') || rawStatusLower.includes('progress') || rawStatusLower.includes('pending') || rawStatusLower.includes('preparing') || rawStatusLower.includes('demo')) {
          canonicalStatus = 'in-progress';
        } else if (rawStatusLower.includes('handover') || rawStatusLower.includes('completed') || rawStatusLower.includes('done') || rawStatusLower.includes('given') || rawStatusLower.includes('proposal')) {
          canonicalStatus = 'completed';
        } else {
          canonicalStatus = 'not-started';
        }

        const rawStart = f.field_5 || f.Start_x0020_Date || f.StartDate || f.AssignedDate || '';
        const rawEnd = f.field_6 || f.Estimated_x0020_EndDate || f.Estimated_x0020_End_x0020_Date || f.EstimatedEndDate || f.Deadline || '';

        // Dynamically find a column that contains 'feedback' in its name
        const feedbackKey = Object.keys(f).find(key => key.toLowerCase().includes('feedback'));
        const clientFeedbackVal = feedbackKey ? String(f[feedbackKey] || '') : (f.ClientFeedback || f.field_9 || '');

        const taskId = f.TaskID || f.id || '';

        const baseTask: Task = {
          id: taskId,
          name: f.Title || f.Project_x0020_Name || f.ProjectName || 'Untitled Project',
          description: f.field_7 || f.Folder_x0020_Link || f.FolderLink || f.Description || '',
          remarks: f.field_8 || f.Remarks || '',
          assignedTo: assignedTo,
          assignedDate: normalizeDate(rawStart) || new Date().toISOString().split('T')[0],
          deadline: normalizeDate(rawEnd) || '',
          status: canonicalStatus,
          rawStatus: rawStatus,
          progress: Number(f.Progress) || (canonicalStatus === 'completed' ? 100 : canonicalStatus === 'in-progress' ? 50 : 0),
          priority: (f.Priority || 'medium').toLowerCase() as TaskPriority,
          type: (f.Type || 'new').toLowerCase() as TaskType,
          project: f.field_1 || f.Client || f.Project || 'General',
          label: f.field_2 || f.Project_x0020_Type || f.ProjectType || f.Label || 'Project',
          clientFeedback: clientFeedbackVal,
        };

        // Merge local overrides if they exist for this task
        if (overrides[taskId]) {
          const taskOverride = overrides[taskId];
          if (taskOverride.assignedTo !== undefined) baseTask.assignedTo = taskOverride.assignedTo;
          if (taskOverride.remarks !== undefined) baseTask.remarks = taskOverride.remarks;
          if (taskOverride.status !== undefined) {
            baseTask.rawStatus = taskOverride.rawStatus;
            baseTask.status = taskOverride.status;
          }
          if (taskOverride.clientFeedback !== undefined) baseTask.clientFeedback = taskOverride.clientFeedback;
          if (taskOverride.progress !== undefined) baseTask.progress = taskOverride.progress;
          if (taskOverride.changeLogs !== undefined) baseTask.changeLogs = taskOverride.changeLogs;
        }

        return baseTask;
      });

      // Load unsynced created tasks from localStorage
      let localUnsyncedTasks: Task[] = [];
      try {
        const savedLocalTasks = localStorage.getItem('teampulse-created-tasks');
        if (savedLocalTasks) {
          const parsed = JSON.parse(savedLocalTasks);
          // Only keep tasks that are not yet in the mapped SharePoint list
          // Match by name and client
          localUnsyncedTasks = parsed.filter((localT: Task) => {
            const alreadyExists = mappedTasks.some(
              (sharepointT: Task) => 
                sharepointT.name.toLowerCase() === localT.name.toLowerCase() && 
                (sharepointT.project || '').toLowerCase() === (localT.project || '').toLowerCase()
            );
            return !alreadyExists;
          });
          // Update the localStorage list with only the remaining unsynced ones
          localStorage.setItem('teampulse-created-tasks', JSON.stringify(localUnsyncedTasks));
        }
      } catch (e) {
        console.error("Failed to merge unsynced created tasks from localStorage", e);
      }

      setTasks([...localUnsyncedTasks, ...mappedTasks]);
      setAttendance(parsedAttendance);

      // Parse Overtime (supports both Standard and Pivoted formats)
      const parsedOvertime: OvertimeRecord[] = [];
      const otItems = otData.items || [];
      const otColumnMap = otData.columnMap || {};
      console.log("➡️ Overtime Column Map:", otColumnMap);

      otItems.forEach((row: any) => {
        // If it's standard format (has single Date and TotalExtraHours/ExtraHours)
        if (row.Date || row.OvertimeDate || row.LeaveDate) {
          const empName = row.Employee_x0020_Name || row.Title || row.Name || row.EmployeeName || '';
          const matchedEmp = parsedEmployees.find((e: any) => 
            e.name.toLowerCase() === empName.toLowerCase() || 
            e.id.toLowerCase() === empName.toLowerCase() ||
            (row.EmployeeID && e.id.toLowerCase() === String(row.EmployeeID).toLowerCase())
          );
          
          const isLeaveRecord = row.LeaveDate !== undefined && row.LeaveDate !== null && row.Leave !== undefined && row.Leave !== null;
          
          const rawHours = isLeaveRecord ? row.Leave : (row.TotalExtraHours || row.ExtraHours || row.TotalHours || row.Hours || 2);
          const totalHours = Number(rawHours) || 2;
          
          const rawWorkType = isLeaveRecord ? 'short-leave' : (row.WorkType || row.Type || 'overtime');
          const workType = (rawWorkType.toLowerCase() === 'short-leave') ? 'short-leave' : 
                           (rawWorkType.toLowerCase() === 'urgent-task' || rawWorkType.toLowerCase() === 'urgent') ? 'urgent-task' : 'overtime';
          
          const rawStatus = row.DeliverableStatus || row.Status || 'completed';
          const deliverableStatus = (rawStatus.toLowerCase() === 'pending') ? 'pending' : 'completed';

          parsedOvertime.push({
            id: row.OvertimeID || row.id || `OT-${Math.floor(1000 + Math.random() * 9000)}`,
            employeeId: matchedEmp ? matchedEmp.id : (row.EmployeeID || ''),
            employeeName: matchedEmp ? matchedEmp.name : empName,
            taskName: isLeaveRecord ? 'Short Leave' : (row.TaskName || row.Task || row.Project || `Extra work`),
            date: normalizeDate(row.LeaveDate || row.Date || row.OvertimeDate || (row.Created ? row.Created.split('T')[0] : '') || new Date().toISOString().split('T')[0]),
            startTime: row.StartTime || row.Start_x0020_Time || (isLeaveRecord ? '10:00' : '18:00'),
            endTime: row.EndTime || row.End_x0020_Time || (isLeaveRecord ? '12:00' : '20:00'),
            totalExtraHours: totalHours,
            workType: workType,
            deliverableStatus: deliverableStatus
          });
        } else {
          // It's a pivoted format (Columns are Dates)
          const empName = row.Employee_x0020_Name || row.Name || row.Title || row.EmployeeName || 'Unknown';
          const matchedEmp = parsedEmployees.find((e: any) => 
            e.name.toLowerCase() === empName.toLowerCase() || 
            e.id.toLowerCase() === empName.toLowerCase() ||
            (row.EmployeeID && e.id.toLowerCase() === String(row.EmployeeID).toLowerCase())
          );

          Object.keys(row).forEach(key => {
            let displayName = otColumnMap[key] || key;
            
            // Decode SharePoint internal column names if not in map
            if (displayName === key) {
              displayName = key.replace(/^OData_/, '');
              displayName = displayName.replace(/_x([0-9a-fA-F]{4})_/gi, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
            }
            
            // Look for YYYY-MM-DD
            const dateMatchYYYY = displayName.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
            // Look for DD-MM-YYYY or MM-DD-YYYY
            const dateMatchDD = displayName.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
            
            let isoDate = '';
            if (dateMatchYYYY) {
              const [_, y, m, d] = dateMatchYYYY;
              isoDate = `${y}-${m}-${d}`;
            } else if (dateMatchDD) {
              const [_, d, m, y] = dateMatchDD;
              isoDate = `${y}-${m}-${d}`;
            }

            if (isoDate) {
              const hoursVal = Number(row[key]);
              // Only include if hours > 0
              if (hoursVal > 0) {
                parsedOvertime.push({
                  id: `${row.id || 'ot'}-${key}`,
                  employeeId: matchedEmp ? matchedEmp.id : (row.EmployeeID || ''),
                  employeeName: matchedEmp ? matchedEmp.name : empName,
                  taskName: `Extra work`,
                  date: isoDate,
                  startTime: '18:00',
                  endTime: '20:00',
                  totalExtraHours: hoursVal,
                  workType: 'overtime',
                  deliverableStatus: 'completed'
                });
              }
            }
          });
        }
      });

      setOvertime(parsedOvertime);

      showToast("Real-time data synced from SharePoint!", "success");
    } catch (error) {
      console.error("Fetch Error:", error);
      showToast("Error syncing with SharePoint. Using fallback data.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOvertimeField = async (employeeName: string, date: string, value: number, isShortLeave: boolean = false, startTime?: string, endTime?: string) => {
    try {
      let token;
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0]
        });
        token = response.accessToken;
      } catch (err) {
        console.warn("Silent token acquisition failed, using local offline fallback", err);
      }

      // 1. UPDATE LOCAL STATE INSTANTLY FOR PERFECT SNAPPY USER EXPERIENCE
      setOvertime(prev => {
        const emp = employees.find(e => e.name === employeeName);
        const empId = emp ? emp.id : '';
        const existingIdx = prev.findIndex(o => o.employeeName === employeeName && o.date === date);
        
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            totalExtraHours: value,
            startTime: startTime || updated[existingIdx].startTime,
            endTime: endTime || updated[existingIdx].endTime,
            workType: isShortLeave ? 'short-leave' : 'overtime',
            taskName: isShortLeave ? 'Short Leave' : 'Extra work',
          };
          return updated;
        } else {
          return [...prev, {
            id: `ot-local-${Math.floor(1000 + Math.random() * 9000)}`,
            employeeId: empId,
            employeeName,
            taskName: isShortLeave ? 'Short Leave' : 'Extra work',
            date,
            startTime: startTime || '18:00',
            endTime: endTime || '20:00',
            totalExtraHours: value,
            workType: isShortLeave ? 'short-leave' : 'overtime',
            deliverableStatus: 'completed'
          }];
        }
      });

      // 2. BACKEND SHAREPOINT UPDATE
      if (token) {
        try {
          console.log("➡️ Sending to backend updateOvertimeField:", { employeeName, date, value, isShortLeave, startTime, endTime });
          const res = await fetch("http://localhost:5000/updateOvertimeField", {
            method: "POST",
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ employeeName, date, value, isShortLeave, startTime, endTime })
          });
          if (res.ok) {
            showToast(isShortLeave ? "Short leave applied successfully!" : "Overtime updated successfully!", "success");
            console.log("✅ SharePoint updated successfully, isShortLeave:", isShortLeave);
          } else {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.details?.error?.message || errData.message || errData.error || "Server error";
            showToast(`Saved locally, but failed to sync to SharePoint: ${errMsg}`, "error");
            console.warn("⚠️ Background update to SharePoint returned non-ok response", errData);
          }
        } catch (err) {
          showToast("Saved locally, but connection to server failed.", "error");
          console.warn("❌ Background update network error:", err);
        }
      } else {
        showToast("Saved locally, but offline (missing credentials).", "error");
      }
    } catch (error: any) {
      console.error("Update Field Error:", error);
      showToast("Failed to update overtime.", "error");
    }
  };

  const updateProjectFields = async (taskId: string, allocatedStaff: string, remarks: string, status?: string, clientFeedback?: string, changeLogs?: string[], progress?: number) => {
    try {
      let token;
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0]
        });
        token = response.accessToken;
      } catch (err) {
        console.warn("Silent token acquisition failed, using local offline fallback", err);
      }

      // 1. UPDATE LOCAL STATE INSTANTLY FOR PERFECT SNAPPY USER EXPERIENCE
      let updatedStatus = 'not-started';
      let updatedRaw = status || '';
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          if (status) {
            updatedRaw = status;
            const rawStatusLower = status.toLowerCase();
            if (rawStatusLower.includes('ongoing') || rawStatusLower.includes('progress') || rawStatusLower.includes('pending') || rawStatusLower.includes('preparing') || rawStatusLower.includes('demo')) {
              updatedStatus = 'in-progress';
            } else if (rawStatusLower.includes('handover') || rawStatusLower.includes('completed') || rawStatusLower.includes('done') || rawStatusLower.includes('given') || rawStatusLower.includes('proposal')) {
              updatedStatus = 'completed';
            } else {
              updatedStatus = 'not-started';
            }
          } else {
            updatedStatus = t.status;
            updatedRaw = t.rawStatus || t.status;
          }

          // Save override to localStorage safely
          try {
            const savedOverrides = localStorage.getItem('teampulse-task-overrides');
            const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};
            overrides[taskId] = {
              ...overrides[taskId],
              assignedTo: allocatedStaff,
              remarks: remarks,
              status: updatedStatus,
              rawStatus: updatedRaw,
              clientFeedback: clientFeedback !== undefined ? clientFeedback : t.clientFeedback,
              progress: progress !== undefined ? progress : t.progress,
              changeLogs: changeLogs !== undefined ? changeLogs : t.changeLogs
            };
            localStorage.setItem('teampulse-task-overrides', JSON.stringify(overrides));
          } catch (e) {
            console.error("Failed to save task overrides to localStorage", e);
          }

          return {
            ...t,
            assignedTo: allocatedStaff,
            remarks: remarks,
            status: updatedStatus,
            rawStatus: updatedRaw,
            clientFeedback: clientFeedback !== undefined ? clientFeedback : t.clientFeedback,
            changeLogs: changeLogs !== undefined ? changeLogs : t.changeLogs,
            progress: progress !== undefined ? progress : t.progress
          };
        }
        return t;
      }));

      // 2. BACKEND SHAREPOINT UPDATE
      if (token) {
        try {
          const res = await fetch("http://localhost:5000/updateProjectFields", {
            method: "POST",
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ taskId, allocatedStaff, remarks, status, clientFeedback })
          });
          if (res.ok) {
            showToast("Project updated successfully!", "success");
            console.log("✅ SharePoint updated successfully");
          } else {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.details?.error?.message || errData.message || errData.error || "Server error";
            showToast(`Saved locally, but failed to sync to SharePoint: ${errMsg}`, "error");
            console.warn("⚠️ Background update to SharePoint returned non-ok response", errData);
          }
        } catch (err) {
          showToast("Saved locally, but connection to server failed.", "error");
          console.warn("❌ Background update network error:", err);
        }
      } else {
        showToast("Saved locally, but offline (missing credentials).", "error");
      }
    } catch (error: any) {
      console.error("Update Project Fields Error:", error);
      showToast("Failed to update project fields.", "error");
    }
  };

  const addTask = async (name: string, project: string, assignedTo: string, priority: string, assignedDate: string, deadline: string, description: string) => {
    try {
      let token;
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0]
        });
        token = response.accessToken;
      } catch (err) {
        console.warn("Silent token acquisition failed, using local offline fallback", err);
      }

      const localId = `TASK-local-${Math.floor(1000 + Math.random() * 9000)}`;

      const tempTask: Task = {
        id: localId,
        name,
        description: description || 'No description provided.',
        project,
        assignedTo,
        priority: priority as any,
        status: 'not-started',
        progress: 0,
        deadline,
        assignedDate,
        type: 'new',
        remarks: '',
        clientFeedback: ''
      };

      // 1. UPDATE LOCAL STATE INSTANTLY FOR PERFECT SNAPPY USER EXPERIENCE
      setTasks(prev => [tempTask, ...prev]);

      // Save to localStorage created-tasks list
      try {
        const savedLocalTasks = localStorage.getItem('teampulse-created-tasks');
        const localTasksList = savedLocalTasks ? JSON.parse(savedLocalTasks) : [];
        localTasksList.push(tempTask);
        localStorage.setItem('teampulse-created-tasks', JSON.stringify(localTasksList));
      } catch (e) {
        console.error("Failed to save created task to localStorage", e);
      }

      // 2. BACKEND SHAREPOINT UPDATE
      if (token) {
        try {
          const res = await fetch("http://localhost:5000/addTask", {
            method: "POST",
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, project, assignedTo, priority, deadline, description, assignedDate })
          });
          if (res.ok) {
            const data = await res.json();
            console.log("✅ Task created in SharePoint:", data);
            
            // Map the returned item to our local format
            const f = data.item || {};
            const taskId = f.id || String(data.itemId) || localId;
            
            // Update the temporary ID with the real SharePoint ID in state
            setTasks(prev => prev.map(t => {
              if (t.id === localId) {
                return { ...t, id: taskId };
              }
              return t;
            }));

            // Remove from local storage list as it is successfully synced
            try {
              const savedLocalTasks = localStorage.getItem('teampulse-created-tasks');
              if (savedLocalTasks) {
                const localTasksList = JSON.parse(savedLocalTasks);
                const updatedList = localTasksList.filter((t: any) => t.id !== localId);
                localStorage.setItem('teampulse-created-tasks', JSON.stringify(updatedList));
              }
            } catch (e) {
              console.error("Failed to update localStorage", e);
            }
            showToast("Task created successfully!", "success");
          } else {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.details?.error?.message || errData.message || errData.error || "Server error";
            showToast(`Saved locally, but failed to sync to SharePoint: ${errMsg}`, "error");
            console.warn("⚠️ Background task creation in SharePoint returned non-ok response", errData);
          }
        } catch (err) {
          showToast("Saved locally, but connection to server failed.", "error");
          console.warn("❌ Background task creation network error:", err);
        }
      } else {
        showToast("Saved locally, but offline (missing credentials).", "error");
      }
    } catch (error: any) {
      console.error("Add Task Error:", error);
      showToast("Failed to create task.", "error");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      let token;
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0]
        });
        token = response.accessToken;
      } catch (err) {
        console.warn("Silent token acquisition failed, using local offline fallback", err);
      }

      // 1. UPDATE LOCAL STATE INSTANTLY
      setTasks(prev => prev.filter(t => t.id !== taskId));

      // Remove from localStorage overrides if it exists
      try {
        const savedOverrides = localStorage.getItem('teampulse-task-overrides');
        if (savedOverrides) {
          const overrides = JSON.parse(savedOverrides);
          if (overrides[taskId]) {
            delete overrides[taskId];
            localStorage.setItem('teampulse-task-overrides', JSON.stringify(overrides));
          }
        }
      } catch (e) {
        console.error("Failed to delete override from localStorage", e);
      }

      // Remove from localStorage created-tasks if it exists there
      try {
        const savedLocalTasks = localStorage.getItem('teampulse-created-tasks');
        if (savedLocalTasks) {
          const localTasksList = JSON.parse(savedLocalTasks);
          const updatedList = localTasksList.filter((t: any) => t.id !== taskId);
          localStorage.setItem('teampulse-created-tasks', JSON.stringify(updatedList));
        }
      } catch (e) {
        console.error("Failed to delete created task from localStorage", e);
      }

      // 2. BACKEND SHAREPOINT UPDATE
      if (token) {
        try {
          const res = await fetch("http://localhost:5000/deleteTask", {
            method: "POST",
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ taskId })
          });
          if (res.ok) {
            showToast("Task deleted successfully!", "success");
            console.log("✅ Task deleted from SharePoint");
          } else {
            const errData = await res.json().catch(() => ({}));
            const errMsg = errData.details?.error?.message || errData.message || errData.error || "Server error";
            showToast(`Deleted locally, but failed to delete from SharePoint: ${errMsg}`, "error");
            console.warn("⚠️ Background task deletion in SharePoint returned non-ok response", errData);
          }
        } catch (err) {
          showToast("Deleted locally, but connection to server failed.", "error");
          console.warn("❌ Background task deletion network error:", err);
        }
      } else {
        showToast("Deleted locally, but offline (missing credentials).", "error");
      }
    } catch (error: any) {
      console.error("Delete Task Error:", error);
      showToast("Failed to delete task.", "error");
    }
  };

  useEffect(() => {
    if (accounts.length > 0) {
      fetchData();
    }
  }, [accounts]);

  return (
    <DataContext.Provider value={{ employees, tasks, attendance, overtime, isLoading, refreshData: fetchData, updateOvertimeField, updateProjectFields, addTask, deleteTask }}>
      {children}
    </DataContext.Provider>
  );
}

// Export the hook separately at the end
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
