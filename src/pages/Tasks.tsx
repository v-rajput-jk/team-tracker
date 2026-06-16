import { useState, useMemo, useRef, useEffect } from 'react';
import { List, Calendar, Plus, Download, SlidersHorizontal, X, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import ProgressBar from '../components/shared/ProgressBar';
import Modal from '../components/shared/Modal';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import type { ViewMode, Task, TaskPriority } from '../types';



const ITEMS_PER_PAGE = 8;

export default function Tasks() {
  const { showToast } = useToast();
  const { tasks, employees, updateProjectFields, addTask, deleteTask } = useData();
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  const getEmployeeName = (id: string) => {
    if (!id) return 'Unassigned';
    const parts = id.split(',').map(p => p.trim());
    const resolved = parts.map(part => {
      return employees.find(e => e.id === part || e.name.toLowerCase() === part.toLowerCase())?.name || part;
    });
    return resolved.join(', ');
  };
  const projects = useMemo(() => [...new Set(tasks.map(t => t.project).filter(Boolean))] as string[], [tasks]);
  const labels = useMemo(() => [...new Set(tasks.map(t => t.label).filter(Boolean))] as string[], [tasks]);

  const handleExport = () => {
    try {
      const headers = ['ID', 'Task', 'Project', 'Assigned To', 'Status', 'Due Date', 'Priority', 'Progress'];
      const rows = tasks.map(t => [
        t.id,
        t.name,
        t.project,
        getEmployeeName(t.assignedTo),
        t.status,
        t.deadline,
        t.priority,
        `${t.progress}%`
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Export successful! CSV downloaded.', 'success');
    } catch (error) {
      showToast('Export failed. Please try again.', 'error');
    }
  };

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [selectedTaskForMembers, setSelectedTaskForMembers] = useState<Task | null>(null);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);
  const [editAllocatedStaff, setEditAllocatedStaff] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editRemarkCategory, setEditRemarkCategory] = useState('General Update');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [editClientFeedback, setEditClientFeedback] = useState('');
  const [editChangeLogs, setEditChangeLogs] = useState<string[]>([]);
  const [newChangeLogEntry, setNewChangeLogEntry] = useState('');
  const [editProgress, setEditProgress] = useState<number>(0);
  
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const [isCustomClient, setIsCustomClient] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const mapNamesToIds = (namesStr: string): string => {
    if (!namesStr) return '';
    const parts = namesStr.split(',').map(p => p.trim()).filter(Boolean);
    const resolved = parts.map(part => {
      const found = employees.find(e => e.name.toLowerCase() === part.toLowerCase() || e.id === part);
      return found ? found.id : part;
    });
    return resolved.join(', ');
  };

  const handleProgressChange = (val: number) => {
    setEditProgress(val);
    if (val === 100) {
      setEditStatus('Completed');
    } else if (val === 0) {
      setEditStatus('Not Started');
    } else if (editStatus === 'Completed' || editStatus === 'Not Started') {
      setEditStatus('Ongoing');
    }
  };

  const handleStatusChange = (status: string) => {
    setEditStatus(status);
    if (status === 'Completed' || status === 'Handover to Client') {
      setEditProgress(100);
    } else if (status === 'Not Started') {
      setEditProgress(0);
    } else if (editProgress === 0 || editProgress === 100) {
      setEditProgress(50);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedTaskToEdit) return;
    const resolvedIds = mapNamesToIds(editAllocatedStaff);
    const finalRemark = (selectedTaskToEdit.remarks && editRemarks.trim())
      ? `[${editRemarkCategory}] ${editRemarks}` 
      : (editRemarks.trim() || selectedTaskToEdit.remarks || '');
    await updateProjectFields(
      selectedTaskToEdit.id, 
      resolvedIds, 
      finalRemark, 
      editStatus, 
      editClientFeedback.trim(), 
      editChangeLogs,
      editProgress
    );
    setIsEditModalOpen(false);
    setSelectedTaskToEdit(null);
  };

  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  
  // Update local tasks when context tasks change
  useMemo(() => {
    setLocalTasks(tasks);
  }, [tasks]);
  const [newTask, setNewTask] = useState({
    name: '',
    project: projects[0],
    assignedTo: [] as string[],
    priority: 'medium' as TaskPriority,
    assignedDate: new Date().toISOString().split('T')[0],
    deadline: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    if (isAddTaskModalOpen) {
      setIsCustomClient(false);
      setNewTask({
        name: '',
        project: projects[0] || '',
        assignedTo: [],
        priority: 'medium' as TaskPriority,
        assignedDate: new Date().toISOString().split('T')[0],
        deadline: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
  }, [isAddTaskModalOpen, projects]);

  const handleAddTask = async () => {
    if (!newTask.name.trim()) {
      showToast('Please enter a task name', 'error');
      return;
    }

    const assignedStr = newTask.assignedTo.join(', ');
    await addTask(newTask.name, newTask.project, assignedStr, newTask.priority, newTask.assignedDate, newTask.deadline, newTask.description);

    setIsAddTaskModalOpen(false);
    setIsAssigneeDropdownOpen(false);
    setAssigneeSearch('');
    setNewTask({
      name: '',
      project: projects[0],
      assignedTo: [],
      priority: 'medium' as TaskPriority,
      assignedDate: new Date().toISOString().split('T')[0],
      deadline: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const filteredTasks = useMemo(() => {
    return localTasks.filter((task) => {
      const assignedName = getEmployeeName(task.assignedTo);
      const matchSearch = 
        task.name.toLowerCase().includes(search.toLowerCase()) || 
        task.id.toLowerCase().includes(search.toLowerCase()) ||
        (task.project && task.project.toLowerCase().includes(search.toLowerCase())) ||
        (task.label && task.label.toLowerCase().includes(search.toLowerCase())) ||
        assignedName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || task.status === statusFilter;
      const matchPriority = !priorityFilter || task.priority === priorityFilter;
      const matchEmployee = !employeeFilter || task.assignedTo === employeeFilter;
      const matchProject = !projectFilter || task.project === projectFilter;
      const matchLabel = !labelFilter || task.label === labelFilter;
      
      const taskDate = new Date(task.deadline);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      const matchStartDate = !start || taskDate >= start;
      const matchEndDate = !end || taskDate <= end;
      
      return matchSearch && matchStatus && matchPriority && matchEmployee && matchProject && matchLabel && matchStartDate && matchEndDate;
    });
  }, [localTasks, search, statusFilter, priorityFilter, employeeFilter, projectFilter, labelFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const hasActiveFilters = !!(statusFilter || priorityFilter || employeeFilter || search || projectFilter || labelFilter || startDate || endDate);
  const activeFilterCount = [statusFilter, priorityFilter, employeeFilter, projectFilter, labelFilter, startDate, endDate].filter(Boolean).length;

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setPriorityFilter(''); setEmployeeFilter(''); setProjectFilter(''); setLabelFilter('');
    setStartDate(''); setEndDate('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button id="add-task-btn" 
            onClick={() => setIsAddTaskModalOpen(true)} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-xs font-semibold transition-all shadow-lg shadow-primary-500/20 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
          <button id="export-btn" onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-surface-200/90 text-xs font-medium transition-all cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search tasks..." 
              className="w-56 pl-4 pr-4 py-2.5 rounded-xl text-sm theme-input transition-all focus:ring-2 focus:ring-primary-500/20" 
              style={{ color: 'var(--text-primary)' }} />
          </div>

          {/* Filter Toggle */}
          <button id="filter-toggle" onClick={() => setShowFilterSidebar(!showFilterSidebar)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              showFilterSidebar ? 'bg-primary-500/20 text-primary-500 dark:text-primary-300 border border-primary-500/30' : 'bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06] hover:bg-black/10 dark:hover:bg-white/10'
            }`}
            style={!showFilterSidebar ? { color: 'var(--text-secondary)' } : undefined}>
            <SlidersHorizontal className="w-3.5 h-3.5" /> More Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary-500 text-[9px] text-white flex items-center justify-center font-bold">{activeFilterCount}</span>
            )}
          </button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06]">
            <button id="view-table" onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-primary-500/20 text-primary-500 dark:text-primary-300 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={viewMode !== 'table' ? { color: 'var(--text-muted)' } : {}}>
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 px-5 py-3 glass-card-light overflow-x-auto whitespace-nowrap scrollbar-hide">
        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => startRef.current?.showPicker()}>
          <Calendar className="w-4 h-4 group-hover:text-primary-400 transition-colors" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs group-hover:text-primary-400 transition-colors" style={{ color: 'var(--text-muted)' }}>Date</span>
          <input 
            type="date" 
            ref={startRef}
            value={startDate} 
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="bg-transparent font-medium outline-none cursor-pointer focus:ring-0 [&::-webkit-calendar-picker-indicator]:dark:invert"
            style={{ color: 'var(--text-primary)' }}
          />
        </label>
        
        <span className="mx-2" style={{ color: 'var(--border-main)' }}>|</span>
        
        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => endRef.current?.showPicker()}>
          <span className="text-xs group-hover:text-primary-400 transition-colors" style={{ color: 'var(--text-muted)' }}>To</span>
          <input 
            type="date" 
            ref={endRef}
            value={endDate} 
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="bg-transparent font-medium outline-none cursor-pointer focus:ring-0 [&::-webkit-calendar-picker-indicator]:dark:invert"
            style={{ color: 'var(--text-primary)' }}
          />
        </label>
        <span className="mx-2" style={{ color: 'var(--border-main)' }}>|</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</span>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="px-2 py-1 rounded-lg text-xs theme-select cursor-pointer focus:ring-1 focus:ring-primary-500/30"
          style={{ color: 'var(--text-secondary)' }}>
          <option value="" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>All Except Completed</option>
          <option value="not-started" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>Not Started</option>
          <option value="in-progress" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>In Progress</option>
          <option value="completed" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>Completed</option>
        </select>
      </div>

      {/* Main Content + Filter Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Table View */}
          {viewMode === 'table' && (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/5">
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>Project Name</th>
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>Client</th>
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>Type</th>
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>Allocated Staff</th>
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>Start Date</th>
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>Due Date</th>
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>Progress</th>
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>Remarks</th>
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5" style={{ color: 'var(--text-secondary)' }}>Status</th>
                      <th className="text-[10px] font-bold uppercase tracking-wider text-left px-5 py-3.5 w-16" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.map((task) => {
                      const isOverdue = task.deadline && !isNaN(new Date(task.deadline).getTime()) && new Date(task.deadline) < new Date() && task.status !== 'completed';
                      return (
                        <tr key={task.id} 
                          onClick={() => setSelectedTaskForDetails(task)}
                          className={`border-b border-black/5 dark:border-white/[0.02] hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer group ${isOverdue ? 'bg-rose-50/50 dark:bg-rose-500/[0.02]' : ''}`}>
                          <td className="px-5 py-3.5 max-w-[220px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-semibold whitespace-normal break-words" style={{ color: 'var(--text-primary)' }}>{task.name}</p>
                              {task.clientFeedback && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase bg-orange-500/10 text-orange-400 border border-orange-500/15 animate-pulse">
                                  Client Feedback
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-[10px] mt-0.5 whitespace-normal break-words opacity-60" style={{ color: 'var(--text-muted)' }}>
                                {task.description}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3.5"><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{task.project || '—'}</span></td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-primary-500/10 text-primary-400 border border-primary-500/15">
                              {task.label || 'Project'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {/* Avatar stack */}
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskForMembers(task);
                                }}
                                className="flex -space-x-1.5 overflow-hidden hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                                title="Click to view all assigned members"
                              >
                                {(task.assignedTo ? task.assignedTo.split(',').map(p => p.trim()) : []).slice(0, 2).map((id, idx) => {
                                  const emp = employees.find(e => e.id === id || e.name.toLowerCase() === id.toLowerCase());
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
                              </div>
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskForMembers(task);
                                }}
                                className="text-xs truncate max-w-[120px] cursor-pointer hover:text-primary-500 transition-colors" 
                                style={{ color: 'var(--text-secondary)' }} 
                                title={getEmployeeName(task.assignedTo)}
                              >
                                {getEmployeeName(task.assignedTo)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {task.assignedDate ? (
                              <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                                {new Date(task.assignedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-xs opacity-40" style={{ color: 'var(--text-faint)' }}>—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {task.deadline && !isNaN(new Date(task.deadline).getTime()) ? (
                              <span className={`text-xs font-semibold ${isOverdue ? 'text-rose-400 font-medium' : ''}`} style={!isOverdue ? { color: 'var(--text-secondary)' } : {}}>
                                {new Date(task.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-xs opacity-40" style={{ color: 'var(--text-faint)' }}>—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 w-32">
                            <ProgressBar value={task.progress || 0} size="sm" showLabel />
                          </td>
                          <td className="px-5 py-3.5 max-w-[220px]">
                            {task.remarks ? (
                              <span className="text-xs whitespace-normal break-words block opacity-80" style={{ color: 'var(--text-muted)' }}>
                                {task.remarks}
                              </span>
                            ) : (
                              <span className="text-xs opacity-40" style={{ color: 'var(--text-faint)' }}>—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5"><StatusBadge status={task.rawStatus || task.status} /></td>
                          <td className="px-5 py-3.5 w-24" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => {
                                  setSelectedTaskToEdit(task);
                                  setEditAllocatedStaff(getEmployeeName(task.assignedTo));
                                  setEditRemarks('');
                                  setEditRemarkCategory('General Update');
                                  setEditStatus(task.rawStatus || task.status);
                                  setEditClientFeedback(task.clientFeedback || '');
                                  setEditChangeLogs(task.changeLogs || []);
                                  setEditProgress(task.progress || 0);
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                                title="Edit Task"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
                                    deleteTask(task.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 border-t border-black/10 dark:border-white/5">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06] hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-all"
                    style={{ color: 'var(--text-muted)' }}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                        currentPage === i + 1 ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06] hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                      style={currentPage !== i + 1 ? { color: 'var(--text-muted)' } : {}}>{i + 1}</button>
                  ))}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06] hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-all"
                    style={{ color: 'var(--text-muted)' }}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-surface-200/25">
                  <List className="w-10 h-10 mb-3" /><p className="text-sm font-medium">No tasks found</p>
                </div>
              )}
            </div>
          )}



          {/* Summary Footer */}
          <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-6">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{filteredTasks.length}</span> tasks</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Completed: <span className="text-emerald-500 font-semibold">{filteredTasks.filter(t => t.status === 'completed').length}</span></div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>In Progress: <span className="text-sky-500 font-semibold">{filteredTasks.filter(t => t.status === 'in-progress').length}</span></div>
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Last updated: {new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Filter Sidebar Panel */}
        {showFilterSidebar && (
          <div className="w-72 flex-shrink-0 glass-card p-5 animate-fade-in-up self-start sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Filters</h3>
              <button onClick={() => setShowFilterSidebar(false)} className="text-slate-400 dark:text-surface-200/30 hover:text-slate-700 dark:hover:text-surface-200/60 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {/* Project */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Project</label>
                <select value={projectFilter} onChange={e => { setProjectFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2.5 rounded-xl text-xs theme-select transition-all focus:ring-1 focus:ring-primary-500/30 cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}>
                  <option value="" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>All Projects</option>
                  {projects.map(p => <option key={p} value={p} className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>{p}</option>)}
                </select>
              </div>
              {/* Assigned To */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Assigned To</label>
                <select value={employeeFilter} onChange={e => { setEmployeeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2.5 rounded-xl text-xs theme-select transition-all focus:ring-1 focus:ring-primary-500/30 cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}>
                  <option value="" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>All Employees</option>
                  {employees.map(e => <option key={e.id} value={e.id} className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>{e.name}</option>)}
                </select>
              </div>
              {/* Priority */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Priority</label>
                <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2.5 rounded-xl text-xs theme-select transition-all focus:ring-1 focus:ring-primary-500/30 cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}>
                  <option value="" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>All Priority</option>
                  <option value="high" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>High</option>
                  <option value="medium" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>Medium</option>
                  <option value="low" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>Low</option>
                </select>
              </div>
              {/* Label */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Label</label>
                <select value={labelFilter} onChange={e => { setLabelFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2.5 rounded-xl text-xs theme-select transition-all focus:ring-1 focus:ring-primary-500/30 cursor-pointer"
                  style={{ color: 'var(--text-secondary)' }}>
                  <option value="" className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>All Labels</option>
                  {labels.map(l => <option key={l} value={l} className="bg-white dark:bg-surface-900" style={{ color: 'var(--text-primary)' }}>{l}</option>)}
                </select>
              </div>
              {/* Clear All */}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="w-full py-2.5 rounded-xl text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer">
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <Modal 
        isOpen={isAddTaskModalOpen} 
        onClose={() => {
          setIsAddTaskModalOpen(false);
          setIsAssigneeDropdownOpen(false);
          setAssigneeSearch('');
        }} 
        title="Create New Task"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button 
              onClick={() => {
                setIsAddTaskModalOpen(false);
                setIsAssigneeDropdownOpen(false);
                setAssigneeSearch('');
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleAddTask}
              className="px-6 py-2 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-xs font-bold transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
            >
              Create Task
            </button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Task Name</label>
            <input 
              type="text" 
              autoFocus
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              placeholder="e.g. Design System Update"
              className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all focus:ring-2 focus:ring-primary-500/20"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Client</label>
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !isCustomClient;
                    setIsCustomClient(nextMode);
                    setNewTask({
                      ...newTask,
                      project: nextMode ? '' : (projects[0] || '')
                    });
                  }}
                  className="text-[9px] font-bold text-primary-500 hover:text-primary-400 cursor-pointer transition-colors"
                >
                  {isCustomClient ? 'Choose Existing' : '+ Custom'}
                </button>
              </div>
              {isCustomClient ? (
                <input 
                  type="text"
                  value={newTask.project}
                  onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                  placeholder="Enter client name..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all focus:ring-2 focus:ring-primary-500/20"
                />
              ) : (
                <select 
                  value={newTask.project} 
                  onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm theme-select cursor-pointer"
                >
                  {projects.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Priority</label>
              <select 
                value={newTask.priority} 
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                className="w-full px-3 py-2.5 rounded-xl text-sm theme-select cursor-pointer"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Start Date</label>
              <input 
                type="date" 
                value={newTask.assignedDate}
                onChange={(e) => setNewTask({ ...newTask, assignedDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Deadline</label>
              <input 
                type="date" 
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5 relative" ref={assigneeDropdownRef}>
            <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Assigned To</label>
            <button
              type="button"
              onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
              className="w-full px-4 py-2.5 rounded-xl text-sm theme-input flex items-center justify-between text-left transition-all focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="truncate">
                {newTask.assignedTo.length === 0 
                  ? 'Select team members...' 
                  : newTask.assignedTo.map(id => employees.find(e => e.id === id)?.name || id).join(', ')
                }
              </span>
              <svg className="w-4 h-4 ml-2 opacity-60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ stroke: 'var(--text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isAssigneeDropdownOpen && (
              <div 
                className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border shadow-xl overflow-hidden glass-card-light backdrop-blur-md"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-light)' }}
              >
                {/* Search input */}
                <div className="p-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg theme-input"
                  />
                </div>
                {/* Options List */}
                <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
                  {employees
                    .filter(e => e.name.toLowerCase().includes(assigneeSearch.toLowerCase()))
                    .map(e => {
                      const isSelected = newTask.assignedTo.includes(e.id);
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => {
                            setNewTask(prev => {
                              const current = prev.assignedTo;
                              const updated = current.includes(e.id)
                                ? current.filter(x => x !== e.id)
                                : [...current, e.id];
                              return { ...prev, assignedTo: updated };
                            });
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left ${
                            isSelected ? 'bg-primary-500/10 text-primary-500 dark:text-primary-300' : ''
                          }`}
                          style={!isSelected ? { color: 'var(--text-secondary)' } : undefined}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-[8px] font-black text-white shadow-sm flex-shrink-0">
                              {e.avatar}
                            </div>
                            <span className="truncate">{e.name}</span>
                          </div>
                          {isSelected && (
                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  {employees.filter(e => e.name.toLowerCase().includes(assigneeSearch.toLowerCase())).length === 0 && (
                    <div className="text-[10px] text-center py-4" style={{ color: 'var(--text-faint)' }}>
                      No team members found
                    </div>
                  )}
                </div>
              </div>
            )}
            <p className="text-[10px] px-1" style={{ color: 'var(--text-faint)' }}>Select one or more members to assign to this task.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Description</label>
            <textarea 
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Describe the task details..."
              className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Assigned Members Modal */}
      <Modal
        isOpen={selectedTaskForMembers !== null}
        onClose={() => setSelectedTaskForMembers(null)}
        title="Assigned Team Members"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => setSelectedTaskForMembers(null)}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedTaskForMembers && (
          <div className="space-y-4">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-faint)' }}>Project/Task</h4>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedTaskForMembers.name}</p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>
                Assigned Members ({(selectedTaskForMembers.assignedTo ? selectedTaskForMembers.assignedTo.split(',') : []).length})
              </h4>
              <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                {(selectedTaskForMembers.assignedTo ? selectedTaskForMembers.assignedTo.split(',').map(p => p.trim()) : []).map(id => {
                  const emp = employees.find(e => e.id === id || e.name.toLowerCase() === id.toLowerCase());
                  return (
                    <div key={id} className="flex items-center gap-3 p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.05]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-[10px] font-black text-white shadow-md shadow-primary-500/10">
                        {emp ? emp.avatar : id.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {emp ? emp.name : id}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                          {emp ? emp.role : 'Team Member'}
                        </p>
                      </div>
                      {emp && (
                        <div className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-primary-500/10 text-primary-400 border border-primary-500/15">
                          {emp.department}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTaskToEdit(null);
        }}
        title="Edit Project Details"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button 
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTaskToEdit(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveEdit}
              className="px-6 py-2 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-xs font-bold transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        }
      >
        {selectedTaskToEdit && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Project Name</h4>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedTaskToEdit.name}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Allocated Staff</label>
              <textarea 
                rows={2}
                value={editAllocatedStaff}
                onChange={(e) => setEditAllocatedStaff(e.target.value)}
                placeholder="e.g. Harman, Avreen, Navreet"
                className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all resize-none"
              />
              <p className="text-[10px] px-1 opacity-60 animate-pulse" style={{ color: 'var(--text-muted)' }}>Separate names with commas or newlines.</p>
            </div>

            {selectedTaskToEdit.remarks ? (
              <div className="space-y-4">
                {/* Read-only Existing Remarks display */}
                <div className="space-y-1 bg-black/5 dark:bg-white/[0.03] p-3 rounded-xl border border-black/5 dark:border-white/[0.05]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted block" style={{ color: 'var(--text-faint)' }}>Existing Remarks</span>
                  <p className="text-xs opacity-80 whitespace-normal break-words" style={{ color: 'var(--text-secondary)' }}>{selectedTaskToEdit.remarks}</p>
                </div>

                {/* Dropdown for Remark Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Remark Update Type</label>
                  <select 
                    value={editRemarkCategory}
                    onChange={(e) => setEditRemarkCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all cursor-pointer"
                  >
                    <option value="General Update">General Update</option>
                    <option value="Client Feedback">Client Feedback</option>
                    <option value="Delay Notice">Delay Notice</option>
                    <option value="Technical Blocker">Technical Blocker</option>
                    <option value="Testing Update">Testing Update</option>
                  </select>
                </div>

                {/* New Remarks Update (starts empty so only newly edited data shows) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>New Remarks Update</label>
                  <textarea 
                    rows={3}
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="Type the new update/remarks here..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all resize-none"
                  />
                </div>
              </div>
            ) : (
              /* Standard Remarks Field if empty */
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Remarks / Notes</label>
                <textarea 
                  rows={4}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Describe current project remarks..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all resize-none"
                />
              </div>
            )}

            {/* Client Recommendations & Feedback */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <label className="text-[10px] font-black uppercase tracking-widest text-orange-400 block">Client Recommended Changes</label>
              <textarea 
                rows={2}
                value={editClientFeedback}
                onChange={(e) => setEditClientFeedback(e.target.value)}
                placeholder="Type any changes or feedback recommended by the client..."
                className="w-full px-4 py-2 rounded-xl text-sm theme-input transition-all resize-none animate-fade-in-up"
              />
            </div>

            {/* Change Logs Timeline */}
            <div className="space-y-2 p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/10">
              <label className="text-[10px] font-black uppercase tracking-widest text-sky-400 block">Changes Made (History Log)</label>
              
              {editChangeLogs.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto mb-2">
                  {editChangeLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-black/10 dark:bg-white/[0.02]">
                      <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{log}</span>
                      <button 
                        type="button"
                        onClick={() => setEditChangeLogs(prev => prev.filter((_, i) => i !== idx))}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-1 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newChangeLogEntry}
                  onChange={(e) => setNewChangeLogEntry(e.target.value)}
                  placeholder="e.g. Added Harman, removed Avreen"
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs theme-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newChangeLogEntry.trim()) {
                        setEditChangeLogs([...editChangeLogs, newChangeLogEntry.trim()]);
                        setNewChangeLogEntry('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newChangeLogEntry.trim()) {
                      setEditChangeLogs([...editChangeLogs, newChangeLogEntry.trim()]);
                      setNewChangeLogEntry('');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Add Log
                </button>
              </div>
            </div>

            {/* Project Progress Slider & Numeric Input */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-primary-500/5 border border-primary-500/10">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary-400">Project Progress</label>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number"
                    min={0}
                    max={100}
                    value={editProgress}
                    onChange={(e) => handleProgressChange(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-14 px-1.5 py-0.5 rounded text-center text-xs font-bold theme-input"
                  />
                  <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>%</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min={0}
                  max={100}
                  value={editProgress}
                  onChange={(e) => handleProgressChange(Number(e.target.value))}
                  className="flex-1 accent-primary-500 cursor-pointer h-1.5 rounded-lg bg-black/10 dark:bg-white/10"
                />
              </div>
              <div className="flex justify-between text-[9px] px-1 font-medium" style={{ color: 'var(--text-faint)' }}>
                <span>0% (Not Started)</span>
                <span>50%</span>
                <span>100% (Completed)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-faint)' }}>Project Status</label>
              <select 
                value={editStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm theme-input transition-all cursor-pointer"
              >
                <option value="Not Started">Not Started</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Pending Demo">Pending Demo</option>
                <option value="Handover to Client">Handover to Client</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Project Details & Client Changes Modal */}
      <Modal
        isOpen={selectedTaskForDetails !== null}
        onClose={() => setSelectedTaskForDetails(null)}
        title="Project & Client Changes Timeline"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                const task = selectedTaskForDetails;
                setSelectedTaskForDetails(null);
                if (task) {
                  setSelectedTaskToEdit(task);
                  setEditAllocatedStaff(getEmployeeName(task.assignedTo));
                  setEditRemarks('');
                  setEditRemarkCategory('General Update');
                  setEditStatus(task.rawStatus || task.status);
                  setEditClientFeedback(task.clientFeedback || '');
                  setEditChangeLogs(task.changeLogs || []);
                  setEditProgress(task.progress || 0);
                  setIsEditModalOpen(true);
                }
              }}
              className="px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              Edit Details
            </button>
            <button
              onClick={() => setSelectedTaskForDetails(null)}
              className="px-5 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 text-xs font-bold transition-all shadow-lg shadow-primary-500/20 cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedTaskForDetails && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-primary-400">Project / Task Name</span>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selectedTaskForDetails.name}</h3>
              <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--text-muted)' }}>{selectedTaskForDetails.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed" style={{ borderColor: 'var(--border-light)' }}>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Assigned Team</span>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{getEmployeeName(selectedTaskForDetails.assignedTo)}</p>
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Status</span>
                <StatusBadge status={selectedTaskForDetails.rawStatus || selectedTaskForDetails.status} />
              </div>
            </div>

            {/* Client Recommended Changes Display */}
            <div className="pt-3 border-t border-dashed" style={{ borderColor: 'var(--border-light)' }}>
              <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 block mb-1">Client Suggestions / Feedback</span>
              {selectedTaskForDetails.clientFeedback ? (
                <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/10 relative overflow-hidden">
                  <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    "{selectedTaskForDetails.clientFeedback}"
                  </p>
                  <div className="absolute right-2 bottom-1 text-[8px] font-bold text-orange-400/40 uppercase">Client Suggested</div>
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: 'var(--text-faint)' }}>No client feedback logged yet.</p>
              )}
            </div>

            {/* Specific Change Log (History) */}
            <div className="pt-3 border-t border-dashed" style={{ borderColor: 'var(--border-light)' }}>
              <span className="text-[9px] font-black uppercase tracking-widest text-sky-400 block mb-2">Specific Changes Made (Log Timeline)</span>
              {selectedTaskForDetails.changeLogs && selectedTaskForDetails.changeLogs.length > 0 ? (
                <div className="relative pl-4 border-l border-sky-500/20 space-y-3 py-1">
                  {selectedTaskForDetails.changeLogs.map((log: string, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-slate-50 dark:border-surface-950 shadow-sm" />
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{log}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic" style={{ color: 'var(--text-faint)' }}>No specific updates/change logs recorded yet.</p>
              )}
            </div>

            {/* Project Remarks */}
            {selectedTaskForDetails.remarks && (
              <div className="pt-3 border-t border-dashed" style={{ borderColor: 'var(--border-light)' }}>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Remarks / Progress Notes</span>
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.02] border" style={{ borderColor: 'var(--border-light)' }}>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selectedTaskForDetails.remarks}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
