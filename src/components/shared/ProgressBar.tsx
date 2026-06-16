interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'emerald' | 'amber' | 'rose' | 'sky' | 'auto';
  showLabel?: boolean;
  animated?: boolean;
}

function getAutoColor(value: number): string {
  if (value >= 75) return 'bg-emerald-500';
  if (value >= 50) return 'bg-amber-500';
  if (value >= 25) return 'bg-orange-500';
  return 'bg-rose-500';
}

const colorClasses = {
  primary: 'bg-primary-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
};

const sizeClasses = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' };

export default function ProgressBar({ value, max = 100, size = 'md', color = 'auto', showLabel = false, animated = true }: ProgressBarProps) {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  const barColor = color === 'auto' ? getAutoColor(percentage) : colorClasses[color];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`flex-1 rounded-full overflow-hidden ${sizeClasses[size]}`}
        style={{ background: 'var(--bg-input)' }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor} ${animated ? 'progress-animate' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] sm:text-xs font-semibold w-8 sm:w-10 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {percentage}%
        </span>
      )}
    </div>
  );
}
