// Common validation utilities
import { isValid, parseISO } from 'date-fns';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate employee code format
 */
export const isValidEmployeeCode = (code: string): boolean => {
  // Employee code should be alphanumeric, 3-10 characters
  const codeRegex = /^[A-Za-z0-9]{3,10}$/;
  return codeRegex.test(code);
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Basic phone number validation (10-15 digits, optional + prefix)
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate date string
 */
export const isValidDate = (dateString: string): boolean => {
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch {
    return false;
  }
};

/**
 * Validate time string (HH:MM format)
 */
export const isValidTime = (timeString: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Validate that a number is positive
 */
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

/**
 * Validate that a number is non-negative
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
};

/**
 * Validate percentage (0-100)
 */
export const isValidPercentage = (value: number): boolean => {
  return typeof value === 'number' && value >= 0 && value <= 100 && !isNaN(value);
};

/**
 * Validate file size (in bytes)
 */
export const isValidFileSize = (size: number, maxSize: number = 10 * 1024 * 1024): boolean => {
  return typeof size === 'number' && size > 0 && size <= maxSize;
};

/**
 * Validate file type by extension
 */
export const isValidFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedTypes.includes(extension);
};

/**
 * Validate string length
 */
export const isValidLength = (value: string, minLength: number = 1, maxLength: number = 255): boolean => {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength;
};

/**
 * Validate required field
 */
export const isRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate object has required fields
 */
export const hasRequiredFields = (obj: Record<string, unknown>, requiredFields: string[]): boolean => {
  return requiredFields.every(field => isRequired(obj[field]));
};

/**
 * Validate productivity score (0-100)
 */
export const isValidProductivityScore = (score: number): boolean => {
  return isValidPercentage(score);
};

/**
 * Validate break duration (reasonable limits)
 */
export const isValidBreakDuration = (minutes: number): boolean => {
  // Break should be between 1 minute and 8 hours (480 minutes)
  return isPositiveNumber(minutes) && minutes <= 480;
};

/**
 * Validate work hours (reasonable limits)
 */
export const isValidWorkHours = (hours: number): boolean => {
  // Work hours should be between 0 and 24 hours
  return isNonNegativeNumber(hours) && hours <= 24;
};