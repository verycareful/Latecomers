import { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLateComers } from '@/hooks/useLateComers';
import { FilterBar } from './FilterBar';
import { LateComersTable } from './LateComersTable';
import { AddLateEntryModal } from './AddLateEntryModal';
import { StudentDetailsModal } from './StudentDetailsModal';

import { StatsCards } from './StatsCards';
import { exportToCSV } from '@/utils/helpers';
import { formatDateRelative } from '@/utils/dateHelpers';
import type { DashboardFilters, SortConfig } from '@/types/database.types';

const DEFAULT_FILTERS: DashboardFilters = {
  date: new Date(),
  dateRange: { start: null, end: null },
  department: null,
  batch: null,
  section: null,
  searchQuery: '',
};

const DEFAULT_SORT: SortConfig = {
  field: 'time',
  direction: 'asc',
};

const PAGE_SIZE = 20;

export function Dashboard() {
  const { isFloorStaff, isAdmin } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortConfig>(DEFAULT_SORT);
  const [page, setPage] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentRegNo, setSelectedStudentRegNo] = useState<string | null>(null);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);

  const { data, isLoading, error, refetch } = useLateComers({
    filters,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });

  const handleFiltersChange = useCallback((newFilters: DashboardFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  const handleSortChange = useCallback((newSort: SortConfig) => {
    setSort(newSort);
    setPage(0);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSort(DEFAULT_SORT);
    setPage(0);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!data?.data || data.data.length === 0) {
      toast.error('No data to export');
      return;
    }
    exportToCSV(data.data, 'late-comers-report');
    toast.success('Report exported successfully');
  }, [data?.data]);

  const handleRowClick = useCallback((registerNumber: string) => {
    setSelectedStudentRegNo(registerNumber);
    setIsStudentDetailsOpen(true);
  }, []);



  const handleCloseStudentDetails = useCallback(() => {
    setIsStudentDetailsOpen(false);
    // Delay clearing the register number to allow modal close animation
    setTimeout(() => setSelectedStudentRegNo(null), 200);
  }, []);

  const displayDate = useMemo(() => {
    if (filters.date) {
      return formatDateRelative(filters.date.toISOString().split('T')[0]);
    }
    if (filters.dateRange.start && filters.dateRange.end) {
      const startStr = formatDateRelative(filters.dateRange.start.toISOString().split('T')[0]);
      const endStr = formatDateRelative(filters.dateRange.end.toISOString().split('T')[0]);
      return `${startStr} - ${endStr}`;
    }
    return 'All Time';
  }, [filters.date, filters.dateRange]);

  const showDateColumn = !filters.date;

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to load data
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Late Comers Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {displayDate} • {data?.totalCount || 0} entries
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={!data?.data || data.data.length === 0}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Add Entry Button (Floor Staff Only) */}
          {isFloorStaff && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Add Late Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards date={filters.date || new Date()} />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        sort={sort}
        onSortChange={handleSortChange}
        onClearFilters={handleClearFilters}
      />

      {/* Table */}
      <div className="mb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Click on any row to view student details
        </p>
      </div>
      <LateComersTable
        data={data?.data || []}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          totalCount: data?.totalCount || 0,
        }}
        onPageChange={setPage}
        onRowClick={handleRowClick}
        showDate={showDateColumn}
        isAdmin={isAdmin}
        sort={sort}
        onSortChange={handleSortChange}
      />

      {/* Add Late Entry Modal */}
      <AddLateEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        registerNumber={selectedStudentRegNo}
        isOpen={isStudentDetailsOpen}
        onClose={handleCloseStudentDetails}
      />
    </div>
  );
}
