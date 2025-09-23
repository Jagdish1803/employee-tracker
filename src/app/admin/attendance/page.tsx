'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Upload, Calendar, Users, FileText, Eye, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { AttendanceTable } from '@/components/attendance/AttendanceTable';
import { AttendanceUploadDialog } from '@/components/attendance/AttendanceUploadDialog';
import { useAttendanceManagement } from '@/hooks/useAttendanceManagement';
import type { AttendanceRecord, UploadHistory } from '@/types';
import { cn, formatDateStringForComparison, formatDateForDisplay } from '@/lib/utils';

export default function AdminAttendancePage() {
  const {
    filteredRecords, uploadHistory, loading, saving, deleting, editingRecord, editForm,
    filterStatus, searchTerm,
    setFilterStatus, setSearchTerm,
    loadAttendanceRecords, loadUploadHistory,
    handleEditRecord, handleCancelEdit, handleSaveEdit, handleFieldChange, deleteRecord,
    deleteBatch,
  } = useAttendanceManagement();

  // Local states
  const [activeTab, setActiveTab] = useState<'calendar' | 'summary' | 'history'>('calendar');
  const [selectedUpload, setSelectedUpload] = useState<UploadHistory | null>(null);
  const [showUploadDetails, setShowUploadDetails] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  // Confirmation dialog states
  const [deleteRecordConfirmOpen, setDeleteRecordConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [deleteBatchConfirmOpen, setDeleteBatchConfirmOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  // Calculate pagination
  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  // Update available dates when records change using useMemo
  const availableDates = useMemo(() => {
    return [...new Set(filteredRecords.map(record => formatDateStringForComparison(record.date)))].sort();
  }, [filteredRecords]);

  // Filter records by selected date
  const dateFilteredRecords = useMemo(() => {
    if (selectedDate === 'all') return filteredRecords;
    return filteredRecords.filter(record => {
      const recordDateString = formatDateStringForComparison(record.date);
      return recordDateString === selectedDate;
    });
  }, [filteredRecords, selectedDate]);

  // Update pagination for date-filtered records
  const dateFilteredTotal = dateFilteredRecords.length;
  const dateFilteredPages = Math.ceil(dateFilteredTotal / recordsPerPage);
  const dateFilteredStart = (currentPage - 1) * recordsPerPage;
  const dateFilteredEnd = dateFilteredStart + recordsPerPage;
  const dateFilteredCurrent = dateFilteredRecords.slice(dateFilteredStart, dateFilteredEnd);

  // Load data on component mount
  useEffect(() => {
    if (activeTab === 'calendar' || activeTab === 'summary') {
      loadAttendanceRecords();
    } else if (activeTab === 'history') {
      loadUploadHistory();
    }
  }, [activeTab, loadAttendanceRecords, loadUploadHistory]);

  // Reset page when date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);


  // Date navigation functions
  const navigateToDate = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex === -1) return;

    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  };

  const canNavigatePrev = availableDates.indexOf(selectedDate) > 0;
  const canNavigateNext = availableDates.indexOf(selectedDate) < availableDates.length - 1;

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForCalendar = (year: number, month: number, day: number) => {
    // Create date string directly to avoid timezone issues
    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentCalendarMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const selectCalendarDate = useCallback((day: number) => {
    const dateStr = formatDateForCalendar(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
    if (availableDates.includes(dateStr)) {
      setSelectedDate(dateStr);
      setCurrentPage(1);
      setShowCalendarDialog(false);
    }
  }, [currentCalendarMonth, availableDates]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentCalendarMonth);
    const firstDay = getFirstDayOfMonth(currentCalendarMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateForCalendar(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
      const isAvailable = availableDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;
      const todayStr = formatDateStringForComparison(new Date().toISOString());
      const isToday = todayStr === dateStr;

      days.push(
        <button
          key={day}
          onClick={() => selectCalendarDate(day)}
          disabled={!isAvailable}
          className={cn(
            "w-8 h-8 text-sm rounded flex items-center justify-center",
            "hover:bg-gray-100 transition-colors",
            isSelected && "bg-blue-600 text-white hover:bg-blue-700",
            isToday && !isSelected && "bg-blue-100 text-blue-900",
            isAvailable && !isSelected && !isToday && "text-gray-900 hover:bg-gray-100",
            !isAvailable && "text-gray-300 cursor-not-allowed hover:bg-transparent"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  }, [currentCalendarMonth, selectedDate, availableDates, selectCalendarDate]);

  // Date change handler
  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate);
    setCurrentPage(1);
  }, []);

  // Wrapper for AttendanceTable onFieldChange to match expected type
  const handleTableFieldChange = (field: string, value: unknown) => {
    handleFieldChange(field as keyof AttendanceRecord, value);
  };

  // Show upload details
  const showUploadDetail = (upload: UploadHistory) => {
    setSelectedUpload(upload);
    setShowUploadDetails(true);
  };

  // Delete record with confirmation
  const handleDeleteRecord = (record: AttendanceRecord) => {
    setRecordToDelete(record);
    setDeleteRecordConfirmOpen(true);
  };

  // Delete record by ID (for AttendanceTable)
  const handleDeleteRecordById = (id: string | number) => {
    const record = filteredRecords.find(r => r.id === id);
    if (record) {
      handleDeleteRecord(record);
    }
  };

  const confirmDeleteRecord = async () => {
    if (recordToDelete) {
      try {
        deleteRecord(recordToDelete.id);
        // Auto-refresh like flowace after successful delete
        setTimeout(() => {
          loadAttendanceRecords(true);
        }, 100);
      } catch (error) {
        console.error('Error deleting record:', error);
      } finally {
        setDeleteRecordConfirmOpen(false);
        setRecordToDelete(null);
      }
    }
  };

  // Delete batch with confirmation
  const handleDeleteBatch = (batchId: string) => {
    setBatchToDelete(batchId);
    setDeleteBatchConfirmOpen(true);
  };

  const confirmDeleteBatch = async () => {
    if (batchToDelete) {
      try {
        deleteBatch(batchToDelete);
        // Auto-refresh like flowace after successful batch delete
        setTimeout(() => {
          loadAttendanceRecords(true);
          loadUploadHistory();
        }, 100);
      } catch (error) {
        console.error('Error deleting batch:', error);
      } finally {
        setDeleteBatchConfirmOpen(false);
        setBatchToDelete(null);
      }
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Calendar className="h-7 w-7 mr-2" />
            Attendance Management
          </h1>
          <p className="text-muted-foreground">Upload attendance files and manage employee attendance records</p>
        </div>
        <Button
          onClick={() => setShowUploadDialog(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Attendance File
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
        <Button
          variant={activeTab === 'calendar' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('calendar')}
          className="flex items-center space-x-2"
        >
          <Calendar className="h-4 w-4" />
          <span>Calendar View</span>
        </Button>
        <Button
          variant={activeTab === 'summary' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('summary')}
          className="flex items-center space-x-2"
        >
          <Users className="h-4 w-4" />
          <span>Summary</span>
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
          className="flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Upload History</span>
        </Button>
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Label htmlFor="filter-status" className="text-sm font-medium whitespace-nowrap">Status:</Label>
                  <Select value={filterStatus || 'ALL'} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                      <SelectItem value="HALF_DAY">Half Day</SelectItem>
                      <SelectItem value="LEAVE_APPROVED">Leave</SelectItem>
                      <SelectItem value="WFH_APPROVED">WFH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee Search */}
                <div className="flex items-center space-x-2 flex-1">
                  <Label htmlFor="search-emp" className="text-sm font-medium whitespace-nowrap">Employee:</Label>
                  <Input
                    id="search-emp"
                    type="text"
                    placeholder="Search by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                </div>

                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAttendanceRecords(true)}
                  className="whitespace-nowrap"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Enhanced Date Browse Section */}
              {availableDates.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
                  <Label className="text-sm font-medium whitespace-nowrap">Browse by Date:</Label>
                  
                  {/* Date Navigation */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToDate('prev')}
                      disabled={!canNavigatePrev}
                      className="p-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Select value={selectedDate || 'all'} onValueChange={handleDateChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        {availableDates.map((date) => (
                          <SelectItem key={date} value={date}>
                            {formatDateForDisplay(date)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Calendar Picker Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCalendarDialog(true)}
                      className="p-2"
                      title="Open Calendar"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateToDate('next')}
                      disabled={!canNavigateNext}
                      className="p-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Date Info */}
                  {selectedDate && selectedDate !== 'all' && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>•</span>
                      <span>{dateFilteredTotal} records on this date</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDateChange('all')}
                        className="text-blue-600 hover:text-blue-800 p-1 h-auto"
                      >
                        View All Dates
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Table */}
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading attendance records...</p>
              </div>
            </div>
          ) : (selectedDate && selectedDate !== 'all' ? dateFilteredTotal : totalRecords) === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {selectedDate && selectedDate !== 'all' ? `No attendance records found for ${selectedDate}` : 'No attendance records found'}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {selectedDate && selectedDate !== 'all' ? 'Try selecting a different date or view all dates' : 'Upload attendance data to view records'}
                </p>
                <div className="flex flex-col items-center space-y-2 mt-4">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => loadAttendanceRecords(true)}
                      variant="outline"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    {selectedDate && selectedDate !== 'all' && (
                      <Button
                        onClick={() => setSelectedDate('all')}
                        variant="outline"
                      >
                        View All Dates
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Attendance File
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <AttendanceTable
              records={selectedDate && selectedDate !== 'all' ? dateFilteredCurrent : currentRecords}
              totalCount={selectedDate && selectedDate !== 'all' ? dateFilteredTotal : totalRecords}
              currentPage={currentPage}
              totalPages={selectedDate && selectedDate !== 'all' ? dateFilteredPages : totalPages}
              onPageChange={setCurrentPage}
              onEdit={handleEditRecord}
              onDelete={handleDeleteRecordById}
              editingRecord={editingRecord}
              editForm={editForm}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              onFieldChange={handleTableFieldChange}
              saving={saving}
              deleting={deleting}
            />
          )}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">{totalRecords}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold">{filteredRecords.filter(r => r.status === 'PRESENT').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold">{filteredRecords.filter(r => r.status === 'ABSENT').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Late</p>
                    <p className="text-2xl font-bold">{filteredRecords.filter(r => r.status === 'LATE').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Department-wise Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const deptStats = filteredRecords.reduce((acc, record) => {
                  const dept = record.department || 'Unknown';
                  if (!acc[dept]) {
                    acc[dept] = { total: 0, present: 0, absent: 0, late: 0 };
                  }
                  acc[dept].total++;
                  if (record.status === 'PRESENT') acc[dept].present++;
                  if (record.status === 'ABSENT') acc[dept].absent++;
                  if (record.status === 'LATE') acc[dept].late++;
                  return acc;
                }, {} as Record<string, { total: number; present: number; absent: number; late: number }>);

                return Object.keys(deptStats).length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Department</th>
                          <th className="text-center py-2 px-4">Total</th>
                          <th className="text-center py-2 px-4">Present</th>
                          <th className="text-center py-2 px-4">Absent</th>
                          <th className="text-center py-2 px-4">Late</th>
                          <th className="text-center py-2 px-4">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(deptStats).map(([dept, stats]) => (
                          <tr key={dept} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4 font-medium">{dept}</td>
                            <td className="py-2 px-4 text-center">{stats.total}</td>
                            <td className="py-2 px-4 text-center text-green-600">{stats.present}</td>
                            <td className="py-2 px-4 text-center text-red-600">{stats.absent}</td>
                            <td className="py-2 px-4 text-center text-yellow-600">{stats.late}</td>
                            <td className="py-2 px-4 text-center">
                              <Badge className={
                                (stats.present / stats.total) >= 0.9 ? 'bg-green-100 text-green-800' :
                                (stats.present / stats.total) >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {Math.round((stats.present / stats.total) * 100)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No attendance data available</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Upload attendance data to see department-wise summary
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Upload History
                </div>
                <Button onClick={loadUploadHistory} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uploadHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No upload history found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload attendance files to see history here
                  </p>
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="mt-4"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Attendance File
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">File Name</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-left py-2 px-4">Records</th>
                        <th className="text-left py-2 px-4">Uploaded</th>
                        <th className="text-left py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadHistory.map((upload) => (
                        <tr key={upload.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">
                            <div className="font-medium">{upload.filename}</div>
                            <div className="text-sm text-muted-foreground">Batch: {upload.batchId}</div>
                          </td>
                          <td className="py-2 px-4">
                            <Badge className={
                              upload.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              upload.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              upload.status === 'PARTIALLY_COMPLETED' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {upload.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-2 px-4">
                            <div>{upload.processedRecords} / {upload.totalRecords}</div>
                            {upload.errorRecords > 0 && 
                              <div className="text-sm text-red-600">{upload.errorRecords} errors</div>}
                          </td>
                          <td className="py-2 px-4">
                            {new Date(upload.uploadedAt).toLocaleDateString()} {new Date(upload.uploadedAt).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => showUploadDetail(upload)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteBatch(upload.batchId)}
                                      className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar Dialog */}
      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent className="max-w-[350px] p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center text-lg">
              <Calendar className="h-5 w-5 mr-2" />
              Select Date
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant={selectedDate === 'all' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => {
                handleDateChange('all');
                setShowCalendarDialog(false);
              }}
            >
              All Dates ({totalRecords} records)
            </Button>
            
            <div className="border-t pt-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="font-medium">
                  {currentCalendarMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Calendar Days Header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div key={index} className="w-8 h-8 text-xs font-medium text-gray-500 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {calendarDays}
              </div>

              {/* Legend */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                    <span>Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Details Dialog */}
      <Dialog open={showUploadDetails} onOpenChange={setShowUploadDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Details</DialogTitle>
            <DialogDescription>
              Detailed information about the upload process
            </DialogDescription>
          </DialogHeader>
          {selectedUpload && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">File Name</Label>
                  <p className="text-sm">{selectedUpload.filename}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm">{selectedUpload.status}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Records</Label>
                  <p className="text-sm">{selectedUpload.totalRecords}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Processed</Label>
                  <p className="text-sm">{selectedUpload.processedRecords}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Errors</Label>
                  <p className="text-sm">{selectedUpload.errorRecords}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Upload Time</Label>
                  <p className="text-sm">
                    {new Date(selectedUpload.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedUpload.errors && Array.isArray(selectedUpload.errors) && selectedUpload.errors.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Errors</Label>
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {selectedUpload.errors.map((error: { row: number; error: string }, index: number) => (
                      <div key={index} className="text-sm text-red-800 mb-2">
                        <strong>Row {error.row}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUpload.summary && (
                <div>
                  <Label className="text-sm font-medium">Summary</Label>
                  <pre className="mt-2 bg-gray-50 border rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedUpload.summary, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <AttendanceUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
      />

      {/* Delete Record Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteRecordConfirmOpen}
        onOpenChange={setDeleteRecordConfirmOpen}
        title="Delete Attendance Record"
        description={`Are you sure you want to delete the attendance record for ${recordToDelete?.employeeName} on ${recordToDelete?.date ? new Date(recordToDelete.date).toLocaleDateString() : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteRecord}
        variant="destructive"
      />

      {/* Delete Upload History Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteBatchConfirmOpen}
        onOpenChange={setDeleteBatchConfirmOpen}
        title="Delete Upload Batch"
        description="Are you sure you want to delete this entire batch? This will remove all attendance records from this upload. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteBatch}
        variant="destructive"
      />
    </div>
  );
}

