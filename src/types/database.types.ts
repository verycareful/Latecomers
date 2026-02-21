/**
 * Database types for the Late Comers Tracking System
 * These types mirror the PostgreSQL schema in Supabase
 */

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          department: string;
        };
        Insert: {
          department: string;
        };
        Update: {
          department?: string;
        };
      };
      specializations: {
        Row: {
          department: string;
          specialization: string;
        };
        Insert: {
          department: string;
          specialization: string;
        };
        Update: {
          department?: string;
          specialization?: string;
        };
      };
      courses: {
        Row: {
          course: string;
        };
        Insert: {
          course: string;
        };
        Update: {
          course?: string;
        };
      };
      students: {
        Row: {
          register_number: string;
          name: string;
          course: string;
          batch: number;
          department: string;
          specialization: string;
          section: string;
        };
        Insert: {
          register_number: string;
          name: string;
          course: string;
          batch: number;
          department: string;
          specialization: string;
          section: string;
        };
        Update: {
          register_number?: string;
          name?: string;
          course?: string;
          batch?: number;
          department?: string;
          specialization?: string;
          section?: string;
        };
      };
      late_comings: {
        Row: {
          register_number: string;
          date: string;
          time: string;
          registered_by: string;
        };
        Insert: {
          register_number: string;
          date: string;
          time: string;
          registered_by: string;
        };
        Update: {
          register_number?: string;
          date?: string;
          time?: string;
          registered_by?: string;
        };
      };
    };
    Views: {
      late_comers_dashboard: {
        Row: {
          register_number: string;
          name: string;
          department: string;
          section: string;
          batch: number;
          date: string;
          time: string;
          registered_by: string; // UUID
          registered_by_name?: string;
          previous_late_count: number;
        };
      };
    };
  };
}

// Helper types for easier usage
export type Department = Database['public']['Tables']['departments']['Row'];
export type Specialization = Database['public']['Tables']['specializations']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type LateComingRecord = Database['public']['Tables']['late_comings']['Row'];
export type LateComingInsert = Database['public']['Tables']['late_comings']['Insert'];
export type LateComingDashboard = Database['public']['Views']['late_comers_dashboard']['Row'];

// User role types
export type UserRole = 'admin' | 'staff' | 'floor_staff';

export interface UserMetadata {
  user_role: UserRole;
  full_name?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: UserMetadata;
}

// User details table type
export interface UserDetails {
  id: string;
  name: string;
  staff_id: string;
  department: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

// Filter types for the dashboard
export interface DashboardFilters {
  date: Date | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  department: string | null;
  batch: number | null;
  section: string | null;
  searchQuery: string;
}

export type SortField = 'time' | 'name' | 'register_number' | 'department' | 'section' | 'batch' | 'date' | 'previous_late_count';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Pagination types
export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalCount: number;
}

// Quick filter presets
export type QuickFilterPreset = 'today' | 'yesterday' | 'this_week' | 'this_month';
