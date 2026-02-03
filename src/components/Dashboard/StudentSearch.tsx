import { useState, useCallback } from 'react';
import { useSearchStudents } from '@/hooks/useLateComers';
import { debounce } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/Shared';
import type { Student } from '@/types/database.types';

interface StudentSearchProps {
  onSelectStudent: (student: Student) => void;
}

export function StudentSearch({ onSelectStudent }: StudentSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: searchResults = [], isLoading } = useSearchStudents(searchQuery);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
    setIsDropdownOpen(true);
  };

  const handleSelectStudent = (student: Student) => {
    onSelectStudent(student);
    setInputValue('');
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleBlur = () => {
    // Delay closing to allow click on dropdown items
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  return (
    <div className="relative">
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
          placeholder="Search student by name or register number..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && setIsDropdownOpen(true)}
          onBlur={handleBlur}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      {/* Dropdown Results */}
      {isDropdownOpen && searchQuery.length >= 2 && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <LoadingSpinner size="sm" className="mx-auto" />
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <ul>
              {searchResults.map((student) => (
                <li key={student.register_number}>
                  <button
                    type="button"
                    onClick={() => handleSelectStudent(student)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {student.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {student.register_number} • {student.department} • Batch {student.batch}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <svg
                className="w-8 h-8 mx-auto mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">No students found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
