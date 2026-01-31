import { useDashboardStats } from '@/hooks/useLateComers';
import { StatsSkeleton } from '@/components/Shared';

interface StatsCardsProps {
  date: Date;
}

export function StatsCards({ date }: StatsCardsProps) {
  const { data: stats, isLoading } = useDashboardStats(date);

  if (isLoading) {
    return <StatsSkeleton />;
  }

  const departmentEntries = stats?.departmentBreakdown
    ? Object.entries(stats.departmentBreakdown).sort((a, b) => b[1] - a[1])
    : [];

  const topDepartment = departmentEntries[0];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Late Comers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Late
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.totalToday || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Departments Affected */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Departments
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {departmentEntries.length}
            </p>
          </div>
        </div>
      </div>

      {/* Top Department */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <svg
              className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Top Department
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {topDepartment ? `${topDepartment[0]} (${topDepartment[1]})` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Average per Department */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Avg per Dept
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {departmentEntries.length > 0
                ? ((stats?.totalToday || 0) / departmentEntries.length).toFixed(1)
                : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
