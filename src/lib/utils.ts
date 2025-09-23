// Utility functions for date formatting and IST date

export function getCurrentISTDate(): string {
  // Returns current date in YYYY-MM-DD format for IST timezone
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset - now.getTimezoneOffset() * 60 * 1000);
  return istDate.toISOString().split('T')[0];
}

export function formatDateTime(date: Date): string {
  // Format date as DD-MM-YYYY HH:mm (IST)
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  });
}

export function formatMinutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function formatDateStringForComparison(dateString: string): string {
  // Safely extract date part from date string without timezone conversion
  // Handles both ISO strings and regular date strings
  if (dateString.includes('T')) {
    return dateString.split('T')[0];
  }

  // If it's already in YYYY-MM-DD format, return as is
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }

  // For other formats, use UTC to avoid timezone shifts
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date.toISOString().split('T')[0];
}

export function formatDateForDisplay(dateString: string): string {
  // Format date string for display without timezone conversion issues
  const datePart = formatDateStringForComparison(dateString);
  const [year, month, day] = datePart.split('-');

  // Use UTC to avoid any timezone shifts
  const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));

  // Create a manual formatter to avoid timezone issues
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const weekday = weekdays[date.getUTCDay()];
  const monthName = months[date.getUTCMonth()];
  const dayNum = date.getUTCDate();
  const yearNum = date.getUTCFullYear();

  return `${weekday}, ${monthName} ${dayNum}, ${yearNum}`;
}
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWorkingDaysBetween(startDate: string, endDate: string): string[] {
  const workingDays: string[] = [];
  const start = new Date(startDate + 'T00:00:00.000Z');
  const end = new Date(endDate + 'T00:00:00.000Z');

  for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    // Exclude Sundays (0 = Sunday)
    if (date.getUTCDay() !== 0) {
      workingDays.push(formatDateStringForComparison(date.toISOString()));
    }
  }

  return workingDays;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatTime(timeString: string): string {
  if (!timeString) return '';

  // Parse time string and format it
  const timeParts = timeString.split(':');
  if (timeParts.length >= 2) {
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);

    // Format as HH:MM
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return timeString;
}

export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}
