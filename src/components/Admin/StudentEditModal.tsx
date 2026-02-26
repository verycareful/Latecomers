import { useForm } from 'react-hook-form';
import { useUpdateStudent, type StudentInput } from '@/hooks/useAdmin';
import { LoadingSpinner } from '@/components/Shared';
import { useAuth } from '@/hooks/useAuth';
import type { Student } from '@/types/database.types';

interface StudentEditModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentEditModal({ student, isOpen, onClose }: StudentEditModalProps) {
  const updateStudent = useUpdateStudent();
  const { isAdmin } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<StudentInput>({
    defaultValues: student || undefined,
  });

  // Reset form when student changes
  if (student && !isOpen) {
    reset(student);
  }

  const onSubmit = async (data: StudentInput) => {
    if (!student) return;

    // ensure empty strings are converted to null
    if (data.card_id === '') {
      data.card_id = null;
    }

    try {
      await updateStudent.mutateAsync({
        registerNumber: student.register_number,
        updates: data,
      });
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Student
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-4 space-y-4">
              {/* Register Number (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Register Number
                </label>
                <input
                  type="text"
                  value={student.register_number}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  defaultValue={student.name}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Course & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Course *
                  </label>
                  <input
                    type="text"
                    {...register('course', { required: 'Course is required' })}
                    defaultValue={student.course}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    {...register('department', { required: 'Department is required' })}
                    defaultValue={student.department}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Specialization *
                </label>
                <input
                  type="text"
                  {...register('specialization', { required: 'Specialization is required' })}
                  defaultValue={student.specialization}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Batch and Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Batch *
                  </label>
                  <input
                    type="number"
                    {...register('batch', { required: true, valueAsNumber: true })}
                    defaultValue={student.batch}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Section *
                  </label>
                  <input
                    type="text"
                    {...register('section', { required: true })}
                    defaultValue={student.section}
                    maxLength={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white uppercase"
                  />
                </div>
              </div>

              {/* Card status (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Card Status
                </label>
                <div className="flex items-center gap-2">
                  {student.card_id ? (
                    <span className="text-green-600 dark:text-green-400">Card Registered</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Not Registered</span>
                  )}
                  {isAdmin && student.card_id && (
                    <button
                      type="button"
                      onClick={() => setValue('card_id', null)}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {/* hidden input so value is submitted when clearing */}
                <input type="hidden" {...register('card_id')} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateStudent.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {updateStudent.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
