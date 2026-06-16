import type { TaskStatus } from '../../types';

interface StatusBadgeProps {
  status: TaskStatus | 'present' | 'absent' | 'half-day' | 'completed' | 'pending' | 'late' | 'on-time';
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  'not-started': {
    label: 'Not Started',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    dot: 'bg-slate-400',
  },
  'in-progress': {
    label: 'In Progress',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  present: {
    label: 'Present',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  'on-time': {
    label: 'On time',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  absent: {
    label: 'Absent',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
  },
  'half-day': {
    label: 'Half Day',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  late: {
    label: 'Late',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    dot: 'bg-orange-400',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  let config = statusConfig[status];

  if (!config) {
    const raw = String(status || '').toLowerCase();
    if (raw.includes('ongoing') || raw.includes('progress') || raw.includes('pending')) {
      config = {
        label: status,
        bg: 'bg-sky-500/10',
        text: 'text-sky-400',
        dot: 'bg-sky-400',
      };
    } else if (raw.includes('handover') || raw.includes('completed') || raw.includes('done') || raw.includes('given') || raw.includes('proposal')) {
      config = {
        label: status,
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-500',
      };
    } else {
      config = {
        label: status || 'Not Started',
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        dot: 'bg-slate-400',
      };
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
