import type { TaskPriority } from '../../types';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

const priorityConfig: Record<TaskPriority, { label: string; bg: string; text: string; icon: string }> = {
  high: {
    label: 'High',
    bg: 'bg-rose-500/10 border border-rose-500/20',
    text: 'text-rose-400',
    icon: '🔴',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-amber-500/10 border border-amber-500/20',
    text: 'text-amber-400',
    icon: '🟡',
  },
  low: {
    label: 'Low',
    bg: 'bg-emerald-500/10 border border-emerald-500/20',
    text: 'text-emerald-400',
    icon: '🟢',
  },
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${config.bg} ${config.text}`}
    >
      <span className="text-[8px]">{config.icon}</span>
      {config.label}
    </span>
  );
}
