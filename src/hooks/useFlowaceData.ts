'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { flowaceService } from '@/api';
import type { FlowaceRecord, FlowaceUploadHistory } from '@/api/services/flowace.service';

export function useFlowaceData() {
  // States
  const [records, setRecords] = useState<FlowaceRecord[]>([]);
  const [uploadHistory, setUploadHistory] = useState<FlowaceUploadHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Load data functions
  const loadFlowaceRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await flowaceService.getAll();
      setRecords(response.records || []);
    } catch (error) {
      console.error('Error loading flowace records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUploadHistory = useCallback(async () => {
    try {
      const response = await flowaceService.getUploadHistory();
      if (response.success && response.history) {
        setUploadHistory(response.history);
      } else {
        setUploadHistory([]);
      }
    } catch (error) {
      console.error('Error loading upload history:', error);
      setUploadHistory([]);
    }
  }, []);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Performance-based filtering
      const getPerformanceCategory = (rec: FlowaceRecord) => {
        const totalHours = rec.loggedHours || rec.activeHours || rec.totalHours || 0;
        const productivityScore = rec.productivityPercentage || rec.productivityScore || 0;

        if (totalHours < 4) return 'LOW_HOURS';
        if (totalHours >= 8 && productivityScore > 80) return 'EXCELLENT';
        if (totalHours >= 6 && productivityScore > 60) return 'GOOD';
        if (totalHours >= 4 && productivityScore > 40) return 'AVERAGE';
        return 'NEEDS_IMPROVEMENT';
      };

      const statusMatch = filterStatus === 'ALL' || getPerformanceCategory(record) === filterStatus;
      const searchMatch = !searchTerm ||
        record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [records, filterStatus, searchTerm]);

  // Update available dates
  useEffect(() => {
    const newDates = [...new Set(filteredRecords.map(record => record.date))].sort();
    setAvailableDates(newDates);
  }, [filteredRecords]);

  // Filter by date
  const dateFilteredRecords = selectedDate && selectedDate !== 'all'
    ? filteredRecords.filter(record => {
        const recordDateString = record.date.split('T')[0];
        return recordDateString === selectedDate;
      })
    : filteredRecords;

  // Remove duplicate employees - keep only the latest record for each employee
  const uniqueEmployeeRecords = useMemo(() => {
    const employeeMap = new Map<string, FlowaceRecord>();

    // Sort records by date (most recent first) and then by creation time
    const sortedRecords = [...dateFilteredRecords].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      // First sort by date (most recent first)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }

      // If dates are same, sort by creation time (most recent first)
      const createdA = new Date(a.createdAt);
      const createdB = new Date(b.createdAt);
      return createdB.getTime() - createdA.getTime();
    });

    // Keep only the first (most recent) record for each employee
    sortedRecords.forEach(record => {
      const employeeKey = `${record.employeeName}_${record.employeeCode}`.toLowerCase();
      if (!employeeMap.has(employeeKey)) {
        employeeMap.set(employeeKey, record);
      }
    });

    return Array.from(employeeMap.values());
  }, [dateFilteredRecords]);

  return {
    // Data
    records,
    uploadHistory,
    filteredRecords,
    dateFilteredRecords,
    uniqueEmployeeRecords,
    loading,

    // Filters
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    selectedDate,
    setSelectedDate,
    availableDates,

    // Actions
    loadFlowaceRecords,
    loadUploadHistory,
  };
}