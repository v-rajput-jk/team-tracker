import { useState, useMemo } from 'react';
import { Trophy, Users, Star, Target, Zap, Clock, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import MemberReportModal from './MemberReportModal';
import { calculatePerformance } from '../../data/mockData';
import { useData } from '../../context/DataContext';

interface MemberData {
  id: string;
  name: string;
  score: number;
  tasks: number;
  avatar: string;
}

interface PerformanceOrbitProps {
  members: MemberData[];
}

export default function PerformanceOrbit({ members }: PerformanceOrbitProps) {
  const [activeMember, setActiveMember] = useState<MemberData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const navigate = useNavigate();

  const { employees, tasks, attendance: attendanceRecords, overtime } = useData();

  // Get full performance metrics for the active member
  const activeMetrics = useMemo(() => {
    if (!activeMember) return null;
    const allMetrics = calculatePerformance('all', employees, tasks, attendanceRecords, overtime);
    return allMetrics.find(m => m.employeeId === activeMember.id);
  }, [activeMember, employees, tasks, attendanceRecords, overtime]);

  // Show all members but keep them sorted
  const displayMembers = useMemo(() => [...members].sort((a, b) => b.score - a.score), [members]);

  return (
    <div 
      className="relative w-full h-[500px] flex items-center justify-center overflow-hidden bg-white dark:bg-surface-950 rounded-[2.5rem] border border-black/10 dark:border-white/5 shadow-xl transition-all duration-700"
      onClick={() => setActiveMember(null)}
    >
      {/* Aurora Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-sky-400/30 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-400/30 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-emerald-400/20 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }} />
      </div>

      {/* Background Overlay when active */}
      <div className={`absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-opacity duration-500 z-20 pointer-events-none ${activeMember ? 'opacity-100' : 'opacity-0'}`} />

      {/* Subtle Dot Pattern */}
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
      />

      {/* Central Goal */}
      <div className={`relative z-10 transition-transform duration-500 ${activeMember ? 'scale-75 -translate-x-32 blur-sm opacity-50' : ''}`}>
        <div className="absolute -inset-4 rounded-full border border-primary-500/30 border-dashed animate-orbit pointer-events-none" />
        <div className="w-28 h-28 rounded-full bg-white dark:bg-surface-900 border border-black/5 dark:border-white/10 shadow-2xl flex flex-col items-center justify-center relative z-10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-1">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] mt-1">Goal</span>
        </div>
      </div>

      {/* Orbiting Members Container */}
      <div className={`absolute inset-0 transition-all duration-700 pointer-events-none ${activeMember ? 'scale-90 -translate-x-32 opacity-30 blur-[2px]' : ''}`}>
        {displayMembers.map((member, idx) => {
          const ringIdx = idx % 3;
          const radius = 130 + ringIdx * 70;
          const duration = 30 + ringIdx * 15;
          const ringMembers = displayMembers.filter((_, i) => i % 3 === ringIdx);
          const posInRing = ringMembers.findIndex(m => m.id === member.id);
          const delay = -(posInRing * (duration / ringMembers.length));

          return (
            <div key={member.id} className={`absolute animate-orbit group pointer-events-none ${activeMember?.id === member.id ? 'z-50' : 'z-0'}`} style={{ width: '100%', height: '100%', animationDuration: `${duration}s`, animationDelay: `${delay}s`, animationPlayState: activeMember ? 'paused' : 'running' }}>
              <div className="absolute left-1/2 flex flex-col items-center animate-orbit-reverse" style={{ top: `calc(50% - ${radius}px)`, animationDuration: `${duration}s`, animationDelay: `${delay}s`, animationPlayState: activeMember ? 'paused' : 'running' }}>
                <div className="relative group cursor-pointer pointer-events-auto" onClick={(e) => { e.stopPropagation(); setActiveMember(member); }}>
                  <div className={`animate-float ${activeMember?.id === member.id ? 'scale-125' : ''}`} style={{ animationDelay: `${idx * 0.5}s` }}>
                    <div className={`absolute inset-[-6px] rounded-full border-2 transition-all duration-500 ${activeMember?.id === member.id ? 'border-primary-500/60 bg-primary-500/20' : 'border-transparent group-hover:border-primary-500/40 group-hover:bg-primary-500/10'}`} />
                    <div className="w-12 h-12 rounded-full bg-white/95 dark:bg-surface-800/90 backdrop-blur-xl border border-black/10 dark:border-white/10 flex items-center justify-center shadow-xl relative overflow-hidden transition-all duration-300">
                      <span className="relative z-10 text-slate-800 dark:text-white font-black text-sm tracking-tight">{member.avatar}</span>
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10 dark:bg-white/10">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-500" style={{ width: `${member.score}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Team Info Header */}
      <div className={`absolute top-6 left-8 flex items-center gap-3 transition-opacity duration-500 ${activeMember ? 'opacity-0' : 'opacity-100'}`}>
        <div className="p-2.5 rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/30">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none">Team Velocity</h4>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mt-1">{displayMembers.length} Active Members</p>
        </div>
      </div>

      {/* Dynamic Detail Side Panel */}
      <div className={`absolute inset-y-0 right-0 w-[320px] bg-white/80 dark:bg-surface-900/80 backdrop-blur-3xl border-l border-black/5 dark:border-white/5 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] transition-all duration-500 ease-out z-30 flex flex-col ${activeMember ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
        {activeMember && (
          <>
            {/* Header */}
            <div className="p-6 pb-4 border-b border-black/5 dark:border-white/5 relative">
              <button onClick={() => setActiveMember(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-2xl text-white font-bold shadow-xl shadow-primary-500/30">
                  {activeMember.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1.5">{activeMember.name}</h3>
                  <p className="text-xs font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" /> Elite Performer
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                <div className="text-center flex-1 border-r border-primary-500/10">
                  <p className="text-[9px] font-bold text-primary-500 uppercase">Impact Score</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{activeMetrics?.overallScore ?? activeMember.score}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[9px] font-bold text-primary-500 uppercase">Active Tasks</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{activeMetrics?.totalTasks ?? activeMember.tasks}</p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">Performance breakdown</h4>
                
                {[
                  { label: 'Task Completion', value: activeMetrics?.taskCompletionRate || 0, icon: <Target className="w-3.5 h-3.5" />, color: 'emerald' },
                  { label: 'On-Time Delivery', value: activeMetrics?.onTimeDelivery || 0, icon: <Clock className="w-3.5 h-3.5" />, color: 'primary' },
                  { label: 'Team Contribution', value: activeMetrics?.extraContribution || 0, icon: <Zap className="w-3.5 h-3.5" />, color: 'amber' },
                ].map((m, i) => (
                  <div key={i} className="group/metric">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md bg-${m.color}-500/10 text-${m.color}-500`}>{m.icon}</div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{m.label}</span>
                      </div>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white">{m.value}%</span>
                    </div>
                    <ProgressBar value={m.value} size="sm" color={m.color as any} />
                  </div>
                ))}
              </div>

              {/* Status Insight */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-800 border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">AI Momentum Insight</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  Currently operating at <span className="text-emerald-500 font-bold">94% efficiency</span>. 
                  Maintaining high velocity on <span className="text-primary-500 font-bold">{activeMetrics?.totalTasks ?? activeMember.tasks} strategic projects</span>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-black/5 dark:border-white/5 space-y-3">
              <button 
                onClick={() => navigate(`/performance/${activeMember.id}`)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-xs font-black transition-all shadow-xl shadow-primary-500/20 group/btn cursor-pointer"
              >
                Go to Performance Page
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
              </button>
              <button 
                onClick={() => setShowReport(true)}
                className="w-full py-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Generate Member Report
              </button>
            </div>
          </>
        )}
      </div>

      {showReport && activeMember && (
        <MemberReportModal 
          memberId={activeMember.id} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
}
