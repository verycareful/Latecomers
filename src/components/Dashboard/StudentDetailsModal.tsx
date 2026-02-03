import { useStudentDetails, formatLateness, getDefaultEntryTime } from '@/hooks/useStudentDetails';
import { formatTime, formatDate } from '@/utils/dateHelpers';
import { LoadingSpinner, EmptyState } from '@/components/Shared';
import { cn } from '@/utils/helpers';

interface StudentDetailsModalProps {
  registerNumber: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentDetailsModal({
  registerNumber,
  isOpen,
  onClose,
}: StudentDetailsModalProps) {
  const { data, isLoading, error } = useStudentDetails(registerNumber);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Student Details
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error.message}</p>
              </div>
            ) : data ? (
              <div className="space-y-6">
                {/* Student Info Card */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                        {data.student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                        {data.student.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {data.student.register_number}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Course
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {data.student.course}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Department
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {data.student.department}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Specialization
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {data.student.specialization}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Batch
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {data.student.batch}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Section
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        Section {data.student.section}
                      </dd>
                    </div>

                  </div>
                </div>

                {/* Lateness Statistics */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Lateness Statistics
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (Default entry time: {getDefaultEntryTime()})
                    </span>
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className={cn(
                      "rounded-lg p-4 text-center",
                      data.totalLateCount === 0
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-red-50 dark:bg-red-900/20"
                    )}>
                      <p className={cn(
                        "text-2xl font-bold",
                        data.totalLateCount === 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {data.totalLateCount}
                      </p>
                      <p className={cn(
                        "text-xs mt-1",
                        data.totalLateCount === 0
                          ? "text-green-600/70 dark:text-green-400/70"
                          : "text-red-600/70 dark:text-red-400/70"
                      )}>
                        Total Late Days
                      </p>
                    </div>
                    <div className={cn(
                      "rounded-lg p-4 text-center",
                      data.totalLatenessMinutes === 0
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-orange-50 dark:bg-orange-900/20"
                    )}>
                      <p className={cn(
                        "text-2xl font-bold",
                        data.totalLatenessMinutes === 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-orange-600 dark:text-orange-400"
                      )}>
                        {data.totalLatenessMinutes === 0 ? 'On time' : formatLateness(data.totalLatenessMinutes)}
                      </p>
                      <p className={cn(
                        "text-xs mt-1",
                        data.totalLatenessMinutes === 0
                          ? "text-green-600/70 dark:text-green-400/70"
                          : "text-orange-600/70 dark:text-orange-400/70"
                      )}>
                        Total Lateness
                      </p>
                    </div>
                    <div className={cn(
                      "rounded-lg p-4 text-center",
                      data.averageLatenessMinutes === 0
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-yellow-50 dark:bg-yellow-900/20"
                    )}>
                      <p className={cn(
                        "text-2xl font-bold",
                        data.averageLatenessMinutes === 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      )}>
                        {data.averageLatenessMinutes === 0 ? 'On time' : formatLateness(data.averageLatenessMinutes)}
                      </p>
                      <p className={cn(
                        "text-xs mt-1",
                        data.averageLatenessMinutes === 0
                          ? "text-green-600/70 dark:text-green-400/70"
                          : "text-yellow-600/70 dark:text-yellow-400/70"
                      )}>
                        Avg. Lateness
                      </p>
                    </div>
                  </div>
                </div>

                {/* Late History */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Late Arrival History
                  </h4>
                  {data.lateHistory.length === 0 ? (
                    <EmptyState
                      icon={
                        <svg
                          className="w-10 h-10 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"
                          />
                        </svg>
                      }
                      message="No late arrivals recorded. Great punctuality!"
                      className="py-8"
                    />
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Entry Time
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              Lateness
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                              Registered By
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {data.lateHistory.map((entry, index) => (
                            <tr
                              key={`${entry.register_number}-${entry.date}`}
                              className={cn(
                                index % 2 === 0
                                  ? 'bg-white dark:bg-gray-800'
                                  : 'bg-gray-50/50 dark:bg-gray-800/50'
                              )}
                            >
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                {formatDate(entry.date)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {formatTime(entry.time)}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={cn(
                                    'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
                                    entry.lateness_minutes <= 15
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                      : entry.lateness_minutes <= 30
                                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                  )}
                                >
                                  +{formatLateness(entry.lateness_minutes)}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                                {entry.registered_by}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
