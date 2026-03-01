import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Student, UserDetails, UserRole } from '@/types/database.types';
import toast from 'react-hot-toast';

// ============================================
// Student Management Hooks
// ============================================

export interface StudentInput {
  register_number: string;
  name: string;
  course: string;
  batch: number;
  department: string;
  specialization: string;
  section: string;
}

/**
 * Hook to add a single student
 */
export function useAddStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: StudentInput) => {
      const { data, error } = await supabase
        .from('students')
        .insert(student as never)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['allStudentsWithStats'] });
    },
  });
}

/**
 * Hook to add multiple students (bulk upload)
 */
export function useBulkAddStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (students: StudentInput[]) => {
      const { data, error } = await supabase
        .from('students')
        .insert(students as never[])
        .select();

      if (error) throw new Error(error.message);
      return data as Student[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['allStudentsWithStats'] });
      toast.success(`Successfully added ${data?.length || 0} students`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add students: ${error.message}`);
    },
  });
}

/**
 * Hook to update a student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registerNumber, updates }: { registerNumber: string; updates: Partial<StudentInput> }) => {
      const { data, error } = await supabase
        .from('students')
        .update(updates as never)
        .eq('register_number', registerNumber)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Student;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['allStudentsWithStats'] });
      queryClient.invalidateQueries({ queryKey: ['studentDetails'] });
      toast.success('Student updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update student: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registerNumber: string) => {
      // First delete related late_comings records
      const { error: lateComingsError } = await supabase
        .from('late_comings')
        .delete()
        .eq('register_number', registerNumber);

      if (lateComingsError) {
        console.warn('Error deleting late comings:', lateComingsError);
      }

      // Then delete the student
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('register_number', registerNumber);

      if (error) throw new Error(error.message);
      return registerNumber;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['allStudentsWithStats'] });
      queryClient.invalidateQueries({ queryKey: ['lateComers'] });
      toast.success('Student deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete student: ${error.message}`);
    },
  });
}

/**
 * Hook to fetch all students (for admin)
 */
export function useAllStudents() {
  return useQuery({
    queryKey: ['students', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

      if (error) throw new Error(error.message);
      return data as Student[];
    },
  });
}

// ============================================
// Staff/User Management Hooks
// ============================================

export interface StaffUserInput {
  email: string;
  password: string;
  name: string;
  staff_id: string;
  department: string;
  role: UserRole;
}

/**
 * Hook to create a new staff user (admin only)
 * Creates auth user via signUp and then adds user_details
 */
export function useCreateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StaffUserInput) => {
      // Store current session before creating new user
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      // Create the auth user using signUp
      // Note: In Supabase settings, you may need to disable email confirmation for this to work smoothly
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            user_role: input.role,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!signUpData.user) {
        throw new Error('Failed to create user');
      }

      const newUserId = signUpData.user.id;

      // Restore the admin's session immediately
      await supabase.auth.setSession({
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      });

      // Now insert the user_details record
      const { error: detailsError } = await supabase
        .from('user_details')
        .insert({
          id: newUserId,
          name: input.name,
          staff_id: input.staff_id,
          department: input.department,
          role: input.role,
        } as any);

      if (detailsError) {
        // User was created but details failed - log this
        console.error('User created but details insert failed:', detailsError);
        throw new Error(`User created but failed to save details: ${detailsError.message}`);
      }

      return { user: signUpData.user };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffUsers'] });
      toast.success('Staff user created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create staff user: ${error.message}`);
    },
  });
}

/**
 * Hook to fetch all staff users
 */
export function useAllStaffUsers() {
  return useQuery({
    queryKey: ['staffUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .order('name');

      if (error) throw new Error(error.message);
      return data as UserDetails[];
    },
  });
}

/**
 * Hook to update staff user details
 */
export function useUpdateStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<Omit<UserDetails, 'id' | 'created_at'>> }) => {
      const { data, error } = await supabase
        .from('user_details')
        .update({ ...updates, updated_at: new Date().toISOString() } as never)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as UserDetails;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffUsers'] });
      toast.success('Staff user updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update staff user: ${error.message}`);
    },
  });
}

/**
 * Hook to delete staff user
 */
export function useDeleteStaffUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete from user_details first
      const { error: detailsError } = await supabase
        .from('user_details')
        .delete()
        .eq('id', userId);

      if (detailsError) throw new Error(detailsError.message);

      // Note: Actually deleting auth user requires admin API
      // For now, we just remove from user_details

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffUsers'] });
      toast.success('Staff user deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete staff user: ${error.message}`);
    },
  });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parse CSV file to student records
 */
export function parseCSVToStudents(csvContent: string): StudentInput[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

  // Validate required headers
  const requiredHeaders = ['register_number', 'name', 'course', 'batch', 'department', 'specialization', 'section'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  const students: StudentInput[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());

    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: Column count mismatch`);
      continue;
    }

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });

    try {
      const student: StudentInput = {
        register_number: record.register_number,
        name: record.name,
        course: record.course,
        batch: parseInt(record.batch, 10),
        department: record.department,
        specialization: record.specialization,
        section: record.section,
      };
      students.push(student);
    } catch (e) {
      errors.push(`Row ${i + 1}: Invalid data format`);
    }
  }

  if (errors.length > 0) {
    console.warn('CSV parsing errors:', errors);
  }

  return students;
}

/**
 * Parse Excel file to student records (uses xlsx library)
 * Supports files WITH headers or WITHOUT headers (by column position)
 */
export async function parseExcelToStudents(file: File): Promise<StudentInput[]> {
  const XLSX = await import('xlsx');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get raw data as array of arrays (no headers assumption)
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        if (rawData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }

        console.log('First row:', rawData[0]);
        console.log('Total rows:', rawData.length);

        // Check if first row looks like headers (contains text like "register", "name", etc.)
        const firstRow = rawData[0].map(cell => String(cell || '').toLowerCase());
        const hasHeaders = firstRow.some(cell => 
          cell.includes('register') || cell.includes('name') || cell.includes('batch') || cell.includes('department')
        );

        // Helper to normalize course names (e.g., "B. Tech" -> "B.Tech")
        const normalizeCourse = (course: string): string => {
          const normalized = course.trim()
            .replace(/\.\s+/g, '.') // "B. Tech" -> "B.Tech"
            .replace(/\s+\./g, '.'); // "B .Tech" -> "B.Tech"
          return normalized || 'B.Tech';
        };

        let students: StudentInput[];

        if (hasHeaders) {
          // Parse with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
          
          const getValue = (row: Record<string, unknown>, ...keys: string[]): unknown => {
            for (const key of keys) {
              if (row[key] !== undefined) return row[key];
              const lowerKey = key.toLowerCase();
              const matchingKey = Object.keys(row).find(k => k.toLowerCase() === lowerKey);
              if (matchingKey && row[matchingKey] !== undefined) return row[matchingKey];
            }
            return undefined;
          };

          students = jsonData.map((row) => ({
            register_number: String(getValue(row, 'register_number', 'Register Number', 'RegisterNumber', 'Reg No', 'RegNo') || ''),
            name: String(getValue(row, 'name', 'Name', 'Student Name', 'StudentName') || ''),
            course: normalizeCourse(String(getValue(row, 'course', 'Course', 'Program') || 'B.Tech')),
            batch: Number(getValue(row, 'batch', 'Batch', 'Year', 'Joining Year', 'JoiningYear') || new Date().getFullYear()),
            department: String(getValue(row, 'department', 'Department', 'Dept', 'Branch') || ''),
            specialization: String(getValue(row, 'specialization', 'Specialization', 'Spec', 'Major') || ''),
            section: String(getValue(row, 'section', 'Section', 'Sec') || 'A'),
          }));
        } else {
          // Parse WITHOUT headers - use column positions
          // Expected order: Register Number, Name, Course, Batch, Department, Specialization, Section
          students = rawData
            .filter(row => row.length >= 4 && row[0]) // Filter out empty rows
            .map((row) => ({
              register_number: String(row[0] || '').trim(),
              name: String(row[1] || '').trim(),
              course: normalizeCourse(String(row[2] || 'B.Tech')),
              batch: Number(row[3]) || new Date().getFullYear(),
              department: String(row[4] || '').trim(),
              specialization: String(row[5] || '').trim(),
              section: String(row[6] || 'A').trim(),
            }));
        }

        console.log('Parsed students:', students.length);
        console.log('First student:', students[0]);

        resolve(students);
      } catch (error) {
        console.error('Excel parsing error:', error);
        reject(new Error('Failed to parse Excel file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
