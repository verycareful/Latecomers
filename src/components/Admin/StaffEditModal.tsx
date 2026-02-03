import { useForm } from 'react-hook-form';
import { useUpdateStaffUser, useCreateStaffUser } from '@/hooks/useAdmin';
import { useDepartments } from '@/hooks/useLateComers';
import { LoadingSpinner } from '@/components/Shared';
import type { UserDetails, UserRole } from '@/types/database.types';

interface StaffEditModalProps {
  user: UserDetails | null;
  isOpen: boolean;
  onClose: () => void;
  isCreating?: boolean;
}

interface FormData {
  email?: string;
  password?: string;
  name: string;
  staff_id: string;
  department: string;
  role: UserRole;
}

export function StaffEditModal({ user, isOpen, onClose, isCreating = false }: StaffEditModalProps) {
  const updateStaffUser = useUpdateStaffUser();
  const createStaffUser = useCreateStaffUser();
  const { data: departments = [] } = useDepartments();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: user ? {
      name: user.name,
      staff_id: user.staff_id,
      department: user.department,
      role: user.role,
    } : {
      role: 'staff',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (isCreating) {
        // Creating new user
        await createStaffUser.mutateAsync({
          email: data.email!,
          password: data.password!,
          name: data.name,
          staff_id: data.staff_id,
          department: data.department,
          role: data.role,
        });
      } else if (user) {
        // Updating existing user
        await updateStaffUser.mutateAsync({
          userId: user.id,
          updates: {
            name: data.name,
            staff_id: data.staff_id,
            department: data.department,
            role: data.role,
          },
        });
      }
      reset();
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const isPending = isCreating ? createStaffUser.isPending : updateStaffUser.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isCreating ? 'Add Staff User' : 'Edit Staff User'}
            </h2>
            <button
              onClick={handleClose}
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
              {/* Email & Password (only for creating) */}
              {isCreating && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      {...register('email', {
                        required: isCreating ? 'Email is required' : false,
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="user@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Temporary Password *
                    </label>
                    <input
                      type="password"
                      {...register('password', {
                        required: isCreating ? 'Password is required' : false,
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="••••••••"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      User should change this after first login
                    </p>
                  </div>
                </>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Staff ID & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Staff ID *
                  </label>
                  <input
                    type="text"
                    {...register('staff_id', { required: 'Staff ID is required' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="STF001"
                  />
                  {errors.staff_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.staff_id.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department *
                  </label>
                  <select
                    {...register('department', { required: 'Department is required' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                  )}
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role *
                </label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="staff">Staff (View Only)</option>
                  <option value="floor_staff">Floor Staff (Can Record Late Entries)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Role Descriptions */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Role Permissions:</p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• <strong>Staff:</strong> View dashboard and reports only</li>
                  <li>• <strong>Floor Staff:</strong> Record late entries + Staff permissions</li>
                  <li>• <strong>Admin:</strong> Manage students, staff users + all permissions</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    {isCreating ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  isCreating ? 'Create User' : 'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
