import {
  format,
  parse,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import type { QuickFilterPreset } from '@/types/database.types';

/**
 * Format a time string to 12-hour format with AM/PM
 * @param timeString - Time in HH:mm:ss or HH:mm format
 * @returns Formatted time string (e.g., "09:30 AM")
 */
export const formatTime = (timeString: string): string => {
  try {
    // Handle both HH:mm:ss and HH:mm formats
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes} ${period}`;
  } catch {
    return timeString;
  }
};

/**
 * Format a date string for display
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string (e.g., "Jan 31, 2026")
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
};

/**
 * Format a date for display with relative text
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string with "Today", "Yesterday", or full date
 */
export const formatDateRelative = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return 'Today';
    }
    
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateString;
  }
};

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDate = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get current time in HH:mm format
 */
export const getCurrentTime = (): string => {
  return format(new Date(), 'HH:mm');
};

/**
 * Get date range for quick filter presets
 */
export const getDateRangeForPreset = (
  preset: QuickFilterPreset
): { start: Date; end: Date } => {
  const now = new Date();

  switch (preset) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday),
      };
    case 'this_week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'this_month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
  }
};

/**
 * Format a Date object to YYYY-MM-DD string
 */
export const formatDateToISO = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Parse a YYYY-MM-DD string to Date object
 */
export const parseDateString = (dateString: string): Date => {
  return parseISO(dateString);
};

/**
 * Check if a date is within a range
 */
export const isDateInRange = (
  date: Date,
  start: Date,
  end: Date
): boolean => {
  return isWithinInterval(date, { start, end });
};

/**
 * Format date for input[type="date"]
 */
export const formatForDateInput = (date: Date | null): string => {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
};

/**
 * Parse date from input[type="date"]
 */
export const parseDateInput = (value: string): Date | null => {
  if (!value) return null;
  return parseISO(value);
};
