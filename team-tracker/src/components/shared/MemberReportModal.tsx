import { X, Download, Printer, TrendingUp, Calendar, CheckCircle2, Clock, Zap, Target, Star, Award, Shield, Mail, Phone, Briefcase, Loader2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { calculatePerformance, generateOvertimeRecords } from '../../data/mockData';
import { useData } from '../../context/DataContext';
import ProgressBar from './ProgressBar';

interface MemberReportModalProps {
  memberId: string;
  onClose: () => void;
}

export default function MemberReportModal({ memberId, onClose }: MemberReportModalProps) {
  const { employees, tasks, attendance: attendanceRecords, overtime: overtimeRecords } = useData();
  const employee = useMemo(() => employees.find(e => e.id === memberId), [memberId, employees]);
  const memberMetrics = useMemo(() => {
    const allMetrics = calculatePerformance('all', employees, tasks, attendanceRecords, overtimeRecords);
    return allMetrics.find(m => m.employeeId === memberId);
  }, [memberId, employees, tasks, attendanceRecords, overtimeRecords]);

  const memberTasks = useMemo(() => tasks.filter(t => t.assignedTo === memberId), [memberId]);
  const recentAttendance = useMemo(() => 
    attendanceRecords.filter(a => a.employeeId === memberId).slice(0, 5), 
  [memberId]);
  
  const memberOvertime = useMemo(() => 
    overtimeRecords.filter(o => o.employeeId === memberId), 
  [memberId, overtimeRecords]);

  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!employee || !memberMetrics) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!reportRef.current) return;
    
    setIsDownloading(true);
    try {
      const element = reportRef.current;
      
      // html-to-image is generally more robust with modern CSS (oklch, grid, etc)
      const dataUrl = await toPng(element, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0b0f19' : '#ffffff',
        style: {
          padding: '20px',
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [element.scrollWidth, element.scrollHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, element.scrollWidth, element.scrollHeight);
      pdf.save(`Member_Report_${employee.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fail-safe: try printing if download fails
      if (confirm('Direct download failed due to browser limitations. Would you like to use the Print dialog to Save as PDF instead?')) {
        window.print();
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-surface-950 rounded-[2.5rem] shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-surface-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-none">Employee Performance Report</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1.5">Official Document • Q2 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-white dark:bg-surface-800 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-700 transition-colors shadow-sm"
              title="Print Report"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 disabled:opacity-70 disabled:cursor-not-allowed`}
              title="Download PDF"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download
                </>
              )}
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide print:overflow-visible">
          <div ref={reportRef} id="report-content" className="space-y-10 p-2">
            
            {/* 1. Profile Overview */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-4xl text-white font-black shadow-2xl shadow-primary-500/30">
                  {employee.avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-emerald-500 border-4 border-white dark:border-surface-950 flex items-center justify-center text-white shadow-lg">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{employee.name}</h1>
                  <p className="text-lg font-bold text-primary-500 flex items-center gap-2 mt-1">
                    <Briefcase className="w-5 h-5" />
                    {employee.role} • {employee.department}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-black/5 dark:border-white/5">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Email Address</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-black/5 dark:border-white/5">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{employee.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-black/5 dark:border-white/5">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Joining Date</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Key Performance Metrics */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                  Performance Metrics
                </h3>
                <div className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-wider border border-primary-500/20">
                  Top 5% Performer
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-primary-500 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Star className="w-20 h-20 fill-current" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">Overall Impact</p>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-black">{memberMetrics.overallScore}</span>
                    <span className="text-lg font-bold mb-1">/100</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-[10px] font-medium opacity-90">Outstanding performance across all domains.</p>
                  </div>
                </div>

                {[
                  { label: 'Task Completion', value: memberMetrics.taskCompletionRate, icon: <Target className="w-5 h-5" />, color: 'emerald' },
                  { label: 'On-Time Delivery', value: memberMetrics.onTimeDelivery, icon: <Clock className="w-5 h-5" />, color: 'primary' },
                ].map((m, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-white dark:bg-surface-900 border border-black/5 dark:border-white/5 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl bg-${m.color}-500/10 text-${m.color}-500 flex items-center justify-center mb-4`}>
                      {m.icon}
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{m.label}</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{m.value}%</p>
                    <div className="mt-4">
                      <ProgressBar value={m.value} size="sm" color={m.color as any} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Detailed Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Task History */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Recent Assignments
                </h3>
                <div className="space-y-3">
                  {memberTasks.map((task) => (
                    <div key={task.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-900 border border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                          task.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">{task.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{task.project}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                          task.status === 'completed' ? 'text-emerald-500' : 
                          task.status === 'in-progress' ? 'text-blue-500' : 'text-slate-400'
                        }`}>
                          {task.status.replace('-', ' ')}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{task.progress}% done</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra Contributions & Insights */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Velocity & Impact
                </h3>
                
                <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-white/20">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-black uppercase">Momentum Analysis</h4>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase opacity-80">Execution Speed</span>
                        <span className="text-xs font-black">Fastest 10%</span>
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[92%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase opacity-80">Problem Solving</span>
                        <span className="text-xs font-black">Advanced</span>
                      </div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-[88%]" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 p-4 rounded-2xl bg-white/10 border border-white/10">
                    <p className="text-xs font-medium leading-relaxed italic">
                      "Demonstrates exceptional ownership and technical leadership. Consistently exceeds expectations on complex module deliveries."
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-3">— Management Feedback</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-black/5 dark:border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Overtime</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{memberOvertime.reduce((acc, curr) => acc + curr.totalExtraHours, 0)}h</p>
                    <p className="text-[9px] font-medium text-emerald-500 mt-1">+12% vs last month</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-black/5 dark:border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Contributions</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{memberMetrics.extraContribution}%</p>
                    <p className="text-[9px] font-medium text-primary-500 mt-1">High Intensity</p>
                  </div>
                </div>
              </div>
            </div>


            
            {/* Footer / Signature Area for printing */}
            <div className="pt-10 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-surface-800" />
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Admin Verified</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Generated Report</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Report ID: {memberId}-Q2-2026</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated at: {new Date().toLocaleString()}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
