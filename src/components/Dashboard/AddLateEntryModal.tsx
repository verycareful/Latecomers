import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useSearchStudents, useAddLateComing } from '@/hooks/useLateComers';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentDate, getCurrentTime } from '@/utils/dateHelpers';
import { debounce } from '@/utils/helpers';
import { LoadingSpinner } from '@/components/Shared';
import type { Student } from '@/types/database.types';

interface AddLateEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  registerNumber: string;
  date: string;
  time: string;
}

export function AddLateEntryModal({ isOpen, onClose }: AddLateEntryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { user } = useAuth();
  const { data: searchResults = [], isLoading: searching } = useSearchStudents(searchQuery);
  const addLateComing = useAddLateComing();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      registerNumber: '',
      date: getCurrentDate(),
      time: getCurrentTime(),
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        registerNumber: '',
        date: getCurrentDate(),
        time: getCurrentTime(),
      });
      setSelectedStudent(null);
      setSearchQuery('');
      setShowConfirm(false);
    }
  }, [isOpen, reset]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('registerNumber', value);
    setSelectedStudent(null);
    debouncedSearch(value);
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setValue('registerNumber', student.register_number);
    setSearchQuery(''); // Clear search to hide dropdown
  };

  const onSubmit = (_data: FormData) => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!selectedStudent || !user) return;

    const formData = watch();

    try {
      await addLateComing.mutateAsync({
        register_number: selectedStudent.register_number,
        date: formData.date,
        time: formData.time,
        registered_by: user.email || 'Unknown',
      });

      toast.success(`Late entry recorded for ${selectedStudent.name}`);
      onClose();
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('This student already has a late entry for today');
      } else {
        toast.error('Failed to record late entry');
      }
      console.error('Error adding late entry:', error);
    }
  };

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
        <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {showConfirm ? 'Confirm Entry' : 'Add Late Entry'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
          <div className="p-4">
            {showConfirm && selectedStudent ? (
              // Confirmation View
              <div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Student Details
                  </h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Name:</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.name}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Register No:</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.register_number}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Department:</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.department}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Batch / Section:</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.batch} - Section {selectedStudent.section}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Date:</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {watch('date')}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Time:</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {watch('time')}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={addLateComing.isPending}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {addLateComing.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Form View
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Student Search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student
                  </label>
                  <input
                    type="text"
                    {...register('registerNumber', {
                      required: 'Please select a student',
                    })}
                    onChange={handleSearchChange}
                    placeholder="Search by name or register number..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    autoComplete="off"
                  />

                  {/* Search Results Dropdown */}
                  {searchQuery.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searching ? (
                        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                          <LoadingSpinner size="sm" className="mx-auto" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((student) => (
                          <button
                            key={student.register_number}
                            type="button"
                            onClick={() => handleSelectStudent(student)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {student.register_number} • {student.department} • Batch {student.batch}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                          No students found
                        </div>
                      )}
                    </div>
                  )}

                  {errors.registerNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.registerNumber.message}
                    </p>
                  )}
                </div>

                {/* Selected Student Info */}
                {selectedStudent && (
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">
                        {selectedStudent.name}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        {selectedStudent.department} • Batch {selectedStudent.batch} • Section {selectedStudent.section}
                      </div>
                    </div>
                  </div>
                )}

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      {...register('date', { required: 'Date is required' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      {...register('time', { required: 'Time is required' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.time && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.time.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedStudent}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
