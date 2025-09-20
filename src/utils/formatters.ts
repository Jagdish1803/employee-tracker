// Common formatting utilities
import { format, parseISO, isValid } from 'date-fns';
import { DATE_FORMATS } from '../constants/app';

/**
 * Format a date string or Date object to a display format
 */
export const formatDate = (date: string | Date, formatString: string = DATE_FORMATS.DISPLAY): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Invalid Date';
    return format(dateObj, formatString);
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format time duration in minutes to human readable format
 */
export const formatDuration = (minutes: number): string => {
  if (minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

/**
 * Format hours to human readable format
 */
export const formatHours = (hours: number): string => {
  if (hours === 0) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/**
 * Format time string (HH:MM:SS) to display format (HH:MM)
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  return timeString.slice(0, 5); // Extract HH:MM from HH:MM:SS
};

/**
 * Format employee code to display format
 */
export const formatEmployeeCode = (code: string): string => {
  return code.toUpperCase();
};

/**
 * Format percentage value
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format currency value
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format file size in bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Capitalize first letter of each word
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Format status for display
 */
export const formatStatus = (status: string): string => {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};