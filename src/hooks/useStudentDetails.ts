import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Student, LateComingRecord, LateComingDashboard } from '@/types/database.types';

export interface StudentLateHistory extends LateComingRecord {
  lateness_minutes: number;
}

export interface StudentDetails {
  student: Student;
  lateHistory: StudentLateHistory[];
  totalLateCount: number;
  totalLatenessMinutes: number;
  averageLatenessMinutes: number;
}

const DEFAULT_ENTRY_TIME = '08:00:00'; // 8:00 AM

/**
 * Calculate lateness in minutes from the default entry time (8 AM)
 */
export const calculateLatenessMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const [defaultHours, defaultMinutes] = DEFAULT_ENTRY_TIME.split(':').map(Number);

  const entryMinutes = hours * 60 + minutes;
  const defaultMinutes_total = defaultHours * 60 + defaultMinutes;

  return Math.max(0, entryMinutes - defaultMinutes_total);
};

/**
 * Format minutes to human-readable duration
 */
export const formatLateness = (minutes: number): string => {
  if (minutes === 0) return 'On time';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${mins} min`;
  }
};

/**
 * Get the default entry time formatted
 */
export const getDefaultEntryTime = (): string => {
  const [hours] = DEFAULT_ENTRY_TIME.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:00 ${period}`;
};

/**
 * Fetch student details including late history
 */
const fetchStudentDetails = async (registerNumber: string): Promise<StudentDetails> => {
  // First, try to get student info from the late_comers_dashboard view
  // This view has student details and bypasses RLS
  const { data: dashboardData, error: dashboardError } = await supabase
    .from('late_comers_dashboard')
    .select('*')
    .eq('register_number', registerNumber)
    .limit(1);

  if (dashboardError) {
    console.error('Dashboard query error:', dashboardError);
  }

  // If we got data from dashboard view, extract student info from it
  let student: Student;

  if (dashboardData && dashboardData.length > 0) {
    const firstRecord = dashboardData[0] as LateComingDashboard;
    // Try to get full student info from students table
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('register_number', registerNumber)
      .maybeSingle();

    if (studentData) {
      student = studentData as Student;
    } else {
      // Construct from dashboard view data
      student = {
        register_number: firstRecord.register_number,
        name: firstRecord.name,
        department: firstRecord.department,
        section: firstRecord.section,
        course: 'N/A', // Not available in view
        batch: firstRecord.batch || 0,
        specialization: 'N/A',
        semester: firstRecord.semester || 0,
      };
    }
  } else {
    // Fallback: try direct students table query
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('register_number', registerNumber)
      .maybeSingle();

    if (studentError) {
      console.error('Students table query error:', studentError);
    }

    if (studentData) {
      student = studentData as Student;
    } else {
      student = {
        register_number: registerNumber,
        name: 'Unknown Student',
        course: 'N/A',
        batch: 0,
        department: 'N/A',
        specialization: 'N/A',
        semester: 0,
        section: 'N/A',
      };
    }
  }

  // Fetch late history from dashboard view (bypasses RLS)
  const { data: lateHistoryData, error: historyError } = await supabase
    .from('late_comers_dashboard')
    .select('date, time, registered_by, register_number')
    .eq('register_number', registerNumber)
    .order('date', { ascending: false });

  if (historyError) {
    console.error('Late history query error:', historyError);
  }

  // Type for the dashboard query result
  type DashboardHistoryEntry = {
    register_number: string;
    date: string;
    time: string;
    registered_by: string;
  };

  // Convert to LateComingRecord format
  const lateHistory: LateComingRecord[] = ((lateHistoryData || []) as DashboardHistoryEntry[]).map((entry) => ({
    register_number: entry.register_number,
    date: entry.date,
    time: entry.time,
    registered_by: entry.registered_by,
  }));

  // Calculate lateness for each entry
  const historyWithLateness: StudentLateHistory[] = lateHistory.map((entry) => ({
    ...entry,
    lateness_minutes: calculateLatenessMinutes(entry.time),
  }));

  // Calculate statistics
  const totalLateCount = historyWithLateness.length;
  const totalLatenessMinutes = historyWithLateness.reduce(
    (sum, entry) => sum + entry.lateness_minutes,
    0
  );
  const averageLatenessMinutes = totalLateCount > 0
    ? Math.round(totalLatenessMinutes / totalLateCount)
    : 0;

  return {
    student,
    lateHistory: historyWithLateness,
    totalLateCount,
    totalLatenessMinutes,
    averageLatenessMinutes,
  };
};

/**
 * Hook to fetch student details with late history
 */
export function useStudentDetails(registerNumber: string | null) {
  return useQuery({
    queryKey: ['studentDetails', registerNumber],
    queryFn: () => fetchStudentDetails(registerNumber!),
    enabled: !!registerNumber,
    staleTime: 30000,
  });
}

/**
 * Student with lateness statistics
 */
export interface StudentWithStats extends Student {
  total_late_days: number;
  total_lateness_minutes: number;
  average_lateness_minutes: number;
}

/**
 * Fetch all students with their lateness statistics
 */
const fetchAllStudentsWithStats = async (): Promise<StudentWithStats[]> => {
  // Get all students from dashboard view (to get unique students)
  const { data: dashboardData, error: dashboardError } = await supabase
    .from('late_comers_dashboard')
    .select('register_number, name, department, section, batch, semester, time');

  if (dashboardError) {
    console.error('Dashboard query error:', dashboardError);
  }

  // Also try to get all students directly
  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select('*');

  if (studentsError) {
    console.error('Students query error:', studentsError);
  }

  // Build a map of student late records
  type DashboardEntry = {
    register_number: string;
    name: string;
    department: string;
    section: string;
    batch: number;
    semester: number;
    time: string;
  };

  const lateRecordsByStudent: Record<string, { times: string[]; info: DashboardEntry }> = {};

  ((dashboardData || []) as DashboardEntry[]).forEach((entry) => {
    if (!lateRecordsByStudent[entry.register_number]) {
      lateRecordsByStudent[entry.register_number] = {
        times: [],
        info: entry,
      };
    }
    lateRecordsByStudent[entry.register_number].times.push(entry.time);
  });

  // Combine with students data
  const studentsMap: Record<string, StudentWithStats> = {};

  // First add all students from students table
  ((studentsData || []) as Student[]).forEach((student) => {
    const lateData = lateRecordsByStudent[student.register_number];
    const times = lateData?.times || [];
    const totalLateness = times.reduce((sum, time) => sum + calculateLatenessMinutes(time), 0);

    studentsMap[student.register_number] = {
      ...student,
      total_late_days: times.length,
      total_lateness_minutes: totalLateness,
      average_lateness_minutes: times.length > 0 ? Math.round(totalLateness / times.length) : 0,
    };
  });

  // Add any students from dashboard that might not be in students table
  Object.entries(lateRecordsByStudent).forEach(([regNo, data]) => {
    if (!studentsMap[regNo]) {
      const times = data.times;
      const totalLateness = times.reduce((sum, time) => sum + calculateLatenessMinutes(time), 0);

      studentsMap[regNo] = {
        register_number: regNo,
        name: data.info.name,
        department: data.info.department,
        section: data.info.section,
        course: 'N/A',
        batch: data.info.batch || 0,
        specialization: 'N/A',
        semester: data.info.semester || 0,
        total_late_days: times.length,
        total_lateness_minutes: totalLateness,
        average_lateness_minutes: times.length > 0 ? Math.round(totalLateness / times.length) : 0,
      };
    }
  });

  return Object.values(studentsMap);
};

/**
 * Hook to fetch all students with their lateness statistics
 */
export function useAllStudentsWithStats() {
  return useQuery({
    queryKey: ['allStudentsWithStats'],
    queryFn: fetchAllStudentsWithStats,
    staleTime: 60000, // 1 minute
  });
}

