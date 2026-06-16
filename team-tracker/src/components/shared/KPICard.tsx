import type { ReactNode } from 'react';


interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'emerald' | 'amber' | 'rose' | 'sky';
}

const colorMap = {
  primary: { iconBg: 'from-primary-500/20 to-primary-600/10', iconColor: 'text-primary-500' },
  emerald: { iconBg: 'from-emerald-500/20 to-emerald-600/10', iconColor: 'text-emerald-500' },
  amber: { iconBg: 'from-amber-500/20 to-amber-600/10', iconColor: 'text-amber-500' },
  rose: { iconBg: 'from-rose-500/20 to-rose-600/10', iconColor: 'text-rose-500' },
  sky: { iconBg: 'from-sky-500/20 to-sky-600/10', iconColor: 'text-sky-500' },
};

export default function KPICard({ title, value, subtitle: _subtitle, icon, trend: _trend, trendLabel: _trendLabel, color = 'primary' }: KPICardProps) {
  const colors = colorMap[color];

  return (
    <div className="glass-card p-4 sm:p-5 hover:scale-[1.02] transition-all duration-300 group shimmer cursor-default">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${colors.iconBg} flex items-center justify-center ${colors.iconColor}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{value}</h3>
      <p className="text-[11px] sm:text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
    </div>
  );
}
