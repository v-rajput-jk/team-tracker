import { Search, Filter, X } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    id: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

export default function FilterBar({
  searchValue, onSearchChange, searchPlaceholder = 'Search...', filters = [], onClearFilters, hasActiveFilters,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[160px] sm:min-w-[200px] max-w-[320px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-faint)' }} />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-xl text-sm theme-input transition-all"
        />
      </div>

      {/* Filter Icon */}
      {filters.length > 0 && (
        <div className="hidden sm:flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
          <Filter className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">Filters</span>
        </div>
      )}

      {/* Filter Dropdowns */}
      {filters.map(filter => (
        <select
          key={filter.id}
          id={`filter-${filter.id}`}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          className="px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm theme-select transition-all cursor-pointer appearance-none"
        >
          <option value="" style={{ background: 'var(--dropdown-bg)', color: 'var(--text-primary)' }}>{filter.label}</option>
          {filter.options.map(opt => (
            <option key={opt.value} value={opt.value} style={{ background: 'var(--dropdown-bg)', color: 'var(--text-primary)' }}>{opt.label}</option>
          ))}
        </select>
      ))}

      {/* Clear */}
      {hasActiveFilters && onClearFilters && (
        <button id="clear-filters" onClick={onClearFilters}
          className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer">
          <X className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
  );
}
