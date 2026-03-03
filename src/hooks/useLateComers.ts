import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  LateComingDashboard,
  LateComingInsert,
  DashboardFilters,
  SortConfig,
  Student,
} from '@/types/database.types';
import { formatDateToISO } from '@/utils/dateHelpers';

interface UseLateComersOptions {
  filters: DashboardFilters;
  sort: SortConfig;
  page: number;
  pageSize: number;
}

interface LateComersResult {
  data: LateComingDashboard[];
  totalCount: number;
}

/**
 * Fetch late comers from the dashboard view with filters and pagination
 */
const fetchLateComers = async ({
  filters,
  sort,
  page,
  pageSize,
}: UseLateComersOptions): Promise<LateComersResult> => {
  let query = supabase
    .from('late_comers_dashboard')
    .select('*', { count: 'exact' });

  // Apply date filter
  if (filters.date) {
    query = query.eq('date', formatDateToISO(filters.date));
  } else if (filters.dateRange.start && filters.dateRange.end) {
    query = query
      .gte('date', formatDateToISO(filters.dateRange.start))
      .lte('date', formatDateToISO(filters.dateRange.end));
  }

  // Apply department filter
  if (filters.department) {
    query = query.eq('department', filters.department);
  }

  // Apply batch filter
  if (filters.batch) {
    query = query.eq('batch', filters.batch);
  }

  // Apply section filter
  if (filters.section) {
    query = query.eq('section', filters.section);
  }

  // Apply search filter
  if (filters.searchQuery) {
    query = query.or(
      `name.ilike.%${filters.searchQuery}%,register_number.ilike.%${filters.searchQuery}%`
    );
  }

  // Apply sorting
  const ascending = sort.direction === 'asc';
  query = query.order(sort.field, { ascending });

  // Apply pagination
  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data as LateComingDashboard[]) || [],
    totalCount: count || 0,
  };
};

/**
 * Hook to fetch and manage late comers data
 */
export function useLateComers({
  filters,
  sort,
  page,
  pageSize,
}: UseLateComersOptions) {


  const queryKey = ['lateComers', filters, sort, page, pageSize];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchLateComers({ filters, sort, page, pageSize }),
    // Polling as the primary update mechanism to avoid race conditions
    // Real-time subscriptions can cause rapid refetches and abort errors
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Data considered fresh for 10 seconds
  });

  return query;
}

/**
 * Hook to add a new late coming record
 */
export function useAddLateComing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: LateComingInsert) => {
      // Check for existing entry for this student on this date
      const { data: existing } = await supabase
        .from('late_comings')
        .select('register_number')
        .eq('register_number', record.register_number)
        .eq('date', record.date)
        .maybeSingle();

      if (existing) {
        throw new Error('This student already has a late entry for this date.');
      }

      const { data, error } = await supabase
        .from('late_comings')
        .insert(record as any)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch late comers data
      queryClient.invalidateQueries({ queryKey: ['lateComers'] });
    },
  });
}

/**
 * Hook to delete a late coming record (admin only)
 */
export function useDeleteLateComing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registerNumber, date }: { registerNumber: string; date: string }) => {
      const { error } = await supabase
        .from('late_comings')
        .delete()
        .eq('register_number', registerNumber)
        .eq('date', date);

      if (error) {
        throw new Error(error.message);
      }

      return { registerNumber, date };
    },
    onSuccess: () => {
      // Invalidate and refetch late comers data
      queryClient.invalidateQueries({ queryKey: ['lateComers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['studentDetails'] });
    },
  });
}

/**
 * Fetch all departments for filter dropdown
 */
export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('department')
        .order('department');

      if (error) {
        console.error('Error fetching departments:', error);
        throw new Error(error.message);
      }

      return (data as { department: string }[] || []).map((d) => d.department);
    },
    staleTime: Infinity, // Departments rarely change
  });
}

/**
 * Search students by register number or name
 */
export function useSearchStudents(searchQuery: string) {
  return useQuery({
    queryKey: ['students', 'search', searchQuery],
    queryFn: async (): Promise<Student[]> => {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`register_number.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) {
        throw new Error(error.message);
      }

      return (data as Student[]) || [];
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });
}

/**
 * Get student by register number
 */
export function useStudentByRegisterNumber(registerNumber: string) {
  return useQuery({
    queryKey: ['student', registerNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('register_number', registerNumber)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    enabled: !!registerNumber,
  });
}

/**
 * Get statistics for the dashboard
 */
export function useDashboardStats(date: Date) {
  return useQuery({
    queryKey: ['dashboardStats', formatDateToISO(date)],
    queryFn: async () => {
      const dateStr = formatDateToISO(date);

      // Get all late comers for the day from dashboard view (bypasses RLS)
      const { data: lateData, error: todayError } = await supabase
        .from('late_comers_dashboard')
        .select('register_number, department')
        .eq('date', dateStr);

      if (todayError) {
        throw new Error(todayError.message);
      }

      // Calculate total
      const totalToday = lateData?.length || 0;

      // Get department-wise breakdown
      const departmentCounts: Record<string, number> = {};
      lateData?.forEach((record) => {
        const dept = (record as { department: string }).department;
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      });

      return {
        totalToday,
        departmentBreakdown: departmentCounts,
      };
    },
    staleTime: 30000,
  });
}
