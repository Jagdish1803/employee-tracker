// src/lib/utils.ts - Complete utility functions
import { type ClassValue, clsx } from 'clsx';

// Utility function for className merging
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date utilities
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

export function getCurrentISTDate(): string {
  const now = new Date();
  // Get IST time (UTC+5:30)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString().split('T')[0];
}

export function getCurrentISTDateTime(): Date {
  const now = new Date();
  // Get IST time (UTC+5:30)
  return new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
}

// Time calculation utilities
export function calculateMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

export function formatMinutesToHours(totalMinutes: number): string {
  if (totalMinutes === 0) return '0h 0m';
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  
  return `${hours}h ${minutes}m`;
}

export function calculateDaysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Array utilities
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key]);
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// Number utilities
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidEmployeeCode(code: string): boolean {
  // Employee code should be alphanumeric and at least 3 characters
  const codeRegex = /^[a-zA-Z0-9]{3,}$/;
  return codeRegex.test(code);
}

export function isValidTimeMinutes(minutes: number): boolean {
  return minutes > 0 && minutes <= 480; // Max 8 hours
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred';
}

// Local storage utilities (for client-side data persistence)
export function setLocalStorage(key: string, value: unknown): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }
  }
  return defaultValue;
}

export function removeLocalStorage(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }
}

// Session management utilities
export function saveEmployeeSession(employee: Record<string, unknown>): void {
  setLocalStorage('employee', employee);
  setLocalStorage('lastLogin', new Date().toISOString());
}

export function getEmployeeSession(): Record<string, unknown> | null {
  return getLocalStorage('employee', null);
}

export function clearEmployeeSession(): void {
  removeLocalStorage('employee');
  removeLocalStorage('lastLogin');
}

export function isSessionValid(): boolean {
  const employee = getEmployeeSession();
  const lastLogin = getLocalStorage('lastLogin', null);
  
  if (!employee || !lastLogin) return false;
  
  // Check if session is less than 24 hours old
  const loginTime = new Date(lastLogin);
  const now = new Date();
  const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff < 24;
}

// Chart color utilities
export const CHART_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384',
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function generateChartColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => getChartColor(i));
}

// Date range utilities
export function getDateRange(period: 'week' | 'month' | 'quarter'): { start: string; end: string } {
  const today = new Date();
  const end = getCurrentISTDate();
  let start: Date;

  switch (period) {
    case 'week':
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      break;
    default:
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return {
    start: start.toISOString().split('T')[0],
    end,
  };
}

// Working days calculation (excluding weekends)
export function getWorkingDaysBetween(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const workingDays: string[] = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // Exclude Sunday (0) only
    if (dayOfWeek !== 0) {
      workingDays.push(d.toISOString().split('T')[0]);
    }
  }
  
  return workingDays;
}

export function isWorkingDay(date: Date | string): boolean {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  return dayOfWeek !== 0; // Not Sunday
}

export function getWorkingDaysCount(startDate: string, endDate: string): number {
  return getWorkingDaysBetween(startDate, endDate).length;
}

// Performance calculation utilities
export function calculateCompletionRate(submitted: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((submitted / total) * 100);
}

export function calculateAveragePerDay(totalMinutes: number, days: number): number {
  if (days === 0) return 0;
  return Math.round(totalMinutes / days);
}

export function calculateProgressToTarget(current: number, target: number): number {
  if (target === 0) return 100;
  return Math.min(Math.round((current / target) * 100), 100);
}

// Break duration utilities
export function calculateBreakDuration(startTime: Date | string, endTime?: Date | string): number {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}

export function isBreakExceeded(duration: number, limit = 20): boolean {
  return duration > limit;
}

export function formatBreakDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

// Text utilities
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function formatEmployeeName(name: string): string {
  return name
    .split(' ')
    .map(word => capitalizeFirst(word))
    .join(' ');
}

// URL utilities
export function createSearchParams(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

// Debounce utility for search inputs
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      func(...args);
    }
  };
}

// Performance monitoring utilities
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${end - start} milliseconds`);
  }
  
  return result;
}

// Random utilities
export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function generateEmployeeCode(name: string): string {
  const prefix = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return prefix + suffix;
}