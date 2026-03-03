import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { DashboardFilters, SortConfig, QuickFilterPreset } from '@/types/database.types';
import { useDepartments } from '@/hooks/useLateComers';
import { formatForDateInput, getDateRangeForPreset, formatDateToISO } from '@/utils/dateHelpers';
import { cn } from '@/utils/helpers';

interface FilterBarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  onClearFilters: () => void;
}

// Generate batch years (last 6 years for joining year filter)
const currentYear = new Date().getFullYear();
const BATCHES = Array.from({ length: 6 }, (_, i) => currentYear - i);
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

const QUICK_FILTERS: { label: string; value: QuickFilterPreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
];

export function FilterBar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  onClearFilters,
}: FilterBarProps) {
  const { data: departments = [], isLoading: loadingDepartments } = useDepartments();
  const [showDateRange, setShowDateRange] = useState(false);

  const activeQuickFilter = useMemo(() => {
    if (!filters.date && !filters.dateRange.start) return null;

    for (const qf of QUICK_FILTERS) {
      const range = getDateRangeForPreset(qf.value);
      const rangeStartStr = formatDateToISO(range.start);
      const rangeEndStr = formatDateToISO(range.end);

      // Check if single date matches this preset's range
      if (filters.date && !filters.dateRange.start) {
        const dateStr = formatDateToISO(filters.date);
        if (dateStr >= rangeStartStr && dateStr <= rangeEndStr) {
          return qf.value;
        }
      }

      // Check if date range matches this preset's range
      if (filters.dateRange.start && filters.dateRange.end && !filters.date) {
        const userStartStr = formatDateToISO(filters.dateRange.start);
        const userEndStr = formatDateToISO(filters.dateRange.end);
        if (userStartStr === rangeStartStr && userEndStr === rangeEndStr) {
          return qf.value;
        }
      }
    }
    return null;
  }, [filters.date, filters.dateRange]);

  const handleQuickFilter = (preset: QuickFilterPreset) => {
    const range = getDateRangeForPreset(preset);
    if (preset === 'today' || preset === 'yesterday') {
      onFiltersChange({
        ...filters,
        date: range.start,
        dateRange: { start: null, end: null },
      });
    } else {
      onFiltersChange({
        ...filters,
        date: null,
        dateRange: { start: range.start, end: range.end },
      });
    }
  };

  const handleDateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      date: value ? new Date(value) : null,
      dateRange: { start: null, end: null },
    });
    setShowDateRange(false);
  };

  const handleDateRangeStartChange = (value: string) => {
    onFiltersChange({
      ...filters,
      date: null,
      dateRange: {
        start: value ? new Date(value) : null,
        end: filters.dateRange.end,
      },
    });
  };

  const handleDateRangeEndChange = (value: string) => {
    onFiltersChange({
      ...filters,
      date: null,
      dateRange: {
        start: filters.dateRange.start,
        end: value ? new Date(value) : null,
      },
    });
  };

  const handleDepartmentChange = (value: string) => {
    onFiltersChange({
      ...filters,
      department: value || null,
    });
  };

  const handleBatchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      batch: value ? parseInt(value, 10) : null,
    });
  };

  const handleSectionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      section: value || null,
    });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: value,
    });
  };

  const handleSortFieldChange = (value: string) => {
    onSortChange({
      ...sort,
      field: value as SortConfig['field'],
    });
  };

  const handleSortDirectionToggle = () => {
    onSortChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const hasActiveFilters =
    filters.date ||
    filters.dateRange.start ||
    filters.department ||
    filters.batch ||
    filters.section ||
    filters.searchQuery;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      {/* Top Row: Quick Filters + All Students Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.value}
              onClick={() => handleQuickFilter(qf.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
                activeQuickFilter === qf.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {qf.label}
            </button>
          ))}
        </div>
        <Link
          to="/students"
          className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          All Students
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or register number..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Date Picker / Date Range Toggle */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {showDateRange ? 'Date Range' : 'Date'}
            </label>
            <button
              type="button"
              onClick={() => {
                setShowDateRange(!showDateRange);
                if (!showDateRange) {
                  // Switching to date range, clear single date
                  onFiltersChange({
                    ...filters,
                    date: null,
                  });
                } else {
                  // Switching to single date, clear range
                  onFiltersChange({
                    ...filters,
                    dateRange: { start: null, end: null },
                  });
                }
              }}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              {showDateRange ? 'Single date' : 'Date range'}
            </button>
          </div>

          {showDateRange ? (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={formatForDateInput(filters.dateRange.start)}
                onChange={(e) => handleDateRangeStartChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="From"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <input
                type="date"
                value={formatForDateInput(filters.dateRange.end)}
                onChange={(e) => handleDateRangeEndChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="To"
              />
            </div>
          ) : (
            <input
              type="date"
              value={formatForDateInput(filters.date)}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          )}
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Department
          </label>
          <select
            value={filters.department || ''}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            disabled={loadingDepartments}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Batch
          </label>
          <select
            value={filters.batch || ''}
            onChange={(e) => handleBatchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Batches</option>
            {BATCHES.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </select>
        </div>

        {/* Section Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Section
          </label>
          <select
            value={filters.section || ''}
            onChange={(e) => handleSectionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Sections</option>
            {SECTIONS.map((section) => (
              <option key={section} value={section}>
                Section {section}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <div className="flex gap-2">
            <select
              value={sort.field}
              onChange={(e) => handleSortFieldChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="time">Time</option>
              <option value="name">Name</option>
              <option value="register_number">Register No.</option>
              <option value="department">Department</option>
              <option value="section">Section</option>
              <option value="batch">Batch</option>
              <option value="date">Date</option>
              <option value="previous_late_count">Late Count</option>
            </select>
            <button
              onClick={handleSortDirectionToggle}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title={sort.direction === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sort.direction === 'asc' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all filters
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
