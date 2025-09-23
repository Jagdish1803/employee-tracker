// src/app/admin/missing-data/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Calendar, Users, Download, FileX, Search } from 'lucide-react';
import { employeeService, logService, assignmentService } from '@/api';
import { Employee, Log } from '@/types';
import { AssignmentWithRelations } from '@/api/services/assignment.service';
import { getCurrentISTDate, getWorkingDaysBetween, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MissingDataRecord {
  employee: Employee;
  missingDates: string[];
  submittedDates: string[];
  totalMissing: number;
  completionRate: number;
}

export default function MissingDataPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([]);
  const [missingData, setMissingData] = useState<MissingDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Last 7 days
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(getCurrentISTDate());
  const [analyzing, setAnalyzing] = useState(false);

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMissingData, setFilteredMissingData] = useState<MissingDataRecord[]>([]);
  const pageSize = 10;

  // Pagination calculations
  const totalPages = Math.ceil(filteredMissingData.length / pageSize);
  const paginatedMissingData = filteredMissingData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const analyzeMissingData = useCallback(async () => {
    if (!dateFrom || !dateTo || employees.length === 0) return;

    setAnalyzing(true);
    try {
      // Get all logs for the date range
      console.log('Requesting logs for missing data analysis:', { dateFrom, dateTo });
      const logsResponse = await logService.getByDateRange({
        dateFrom,
        dateTo,
      });
      console.log('Missing data analysis - logs response:', logsResponse);

      const logs = Array.isArray(logsResponse) ? logsResponse as Log[] : [];
      console.log('Processed logs for analysis:', logs.length, 'logs found');
      const workingDays = getWorkingDaysBetween(dateFrom, dateTo);

      // Filter employees to only include those with assignments
      const employeesWithAssignments = employees.filter(employee =>
        assignments.some(assignment => assignment.employeeId === employee.id)
      );

      // Analyze missing data for each employee with assignments
      const missingDataAnalysis: MissingDataRecord[] = employeesWithAssignments.map(employee => {
        // Get all dates this employee submitted data
        const employeeLogs = logs.filter(log => log.employeeId === employee.id);
        const submittedDates = [...new Set(employeeLogs.map(log =>
          new Date(log.logDate).toISOString().split('T')[0]
        ))];

        // Find missing working days
        const missingDates = workingDays.filter(date => !submittedDates.includes(date));

        const totalMissing = missingDates.length;
        const completionRate = workingDays.length > 0
          ? Math.round(((workingDays.length - totalMissing) / workingDays.length) * 100)
          : 100;

        return {
          employee,
          missingDates,
          submittedDates,
          totalMissing,
          completionRate,
        };
      });

      // Sort by most missing data first
      missingDataAnalysis.sort((a, b) => b.totalMissing - a.totalMissing);
      setMissingData(missingDataAnalysis);
    } catch (error) {
      console.error('Error analyzing missing data:', error);
      toast.error('Failed to analyze missing data');
    } finally {
      setAnalyzing(false);
    }
  }, [dateFrom, dateTo, employees, assignments]);

  // Filter missing data based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMissingData(missingData);
    } else {
      const filtered = missingData.filter(record =>
        record.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMissingData(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, missingData]);

  const loadEmployees = async () => {
    try {
      const [employeesResponse, assignmentsData] = await Promise.all([
        employeeService.getAll(),
        assignmentService.getAll()
      ]);

      if (employeesResponse.data.success) {
        setEmployees(employeesResponse.data.data || []);
      }
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      analyzeMissingData();
    }
  }, [employees, dateFrom, dateTo, analyzeMissingData]);

  const exportToCSV = () => {
    const csvHeaders = [
      'Employee Name',
      'Employee Code',
      'Total Working Days',
      'Days Submitted',
      'Days Missing',
      'Completion Rate (%)',
      'Missing Dates'
    ];

    const workingDays = getWorkingDaysBetween(dateFrom, dateTo);

    const csvData = filteredMissingData.map(record => [
      record.employee.name,
      record.employee.employeeCode,
      workingDays.length,
      record.submittedDates.length,
      record.totalMissing,
      record.completionRate,
      record.missingDates.join('; ')
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `missing-data-report-${dateFrom}-to-${dateTo}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const workingDays = getWorkingDaysBetween(dateFrom, dateTo);
  const employeesWithAssignments = employees.filter(employee =>
    assignments.some(assignment => assignment.employeeId === employee.id)
  );
  const totalPossibleSubmissions = employeesWithAssignments.length * workingDays.length;
  const totalMissingSubmissions = missingData.reduce((sum, record) => sum + record.totalMissing, 0);
  const overallCompletionRate = totalPossibleSubmissions > 0
    ? Math.round(((totalPossibleSubmissions - totalMissingSubmissions) / totalPossibleSubmissions) * 100)
    : 100;

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <AlertTriangle className="h-7 w-7 mr-2 text-primary" />
            Missing Data Report
          </h1>
          <p className="text-muted-foreground mt-1">Identify employees with incomplete work log submissions</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="grid gap-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom}
                max={getCurrentISTDate()}
              />
            </div>
            <Button 
              onClick={analyzeMissingData} 
              disabled={analyzing}
              className="mt-6"
            >
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Analysis covers {workingDays.length} working days (excluding Sundays)
          </p>
        </CardContent>
      </Card>

      {/* Employee Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Employee Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Label htmlFor="employeeSearch">Search Employees</Label>
            <Input
              id="employeeSearch"
              type="text"
              placeholder="Search by name or employee code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredMissingData.length} of {missingData.length} employees
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Employees with Assignments</p>
                <p className="text-2xl font-bold">{employeesWithAssignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Working Days</p>
                <p className="text-2xl font-bold">{workingDays.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileX className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Missing Submissions</p>
                <p className="text-2xl font-bold">{totalMissingSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Overall Rate</p>
                <p className="text-2xl font-bold">{overallCompletionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missing Data Analysis */}
      {filteredMissingData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {searchTerm ? 'No employees found matching your search' : 'No data to analyze'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Select a date range to analyze missing data submissions.'
              }
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')} variant="outline" className="mt-4">
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Missing Data Analysis</span>
              <div className="text-sm text-muted-foreground">
                Total: {filteredMissingData.length} employees {searchTerm && `(filtered from ${missingData.length})`}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">Employee</th>
                    <th className="text-center px-6 py-4 font-medium">Completion Rate</th>
                    <th className="text-center px-6 py-4 font-medium">Days Missing</th>
                    <th className="text-center px-6 py-4 font-medium">Days Submitted</th>
                    <th className="text-left px-6 py-4 font-medium">Missing Dates</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedMissingData.map((record) => (
                    <tr key={record.employee.id} className="hover:bg-muted/25">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-primary">
                              {record.employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{record.employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.employee.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompletionColor(record.completionRate)}`}>
                          {record.completionRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-medium ${record.totalMissing > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {record.totalMissing}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-green-600">
                          {record.submittedDates.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record.missingDates.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {record.missingDates.slice(0, 3).map((date) => (
                              <span
                                key={date}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
                              >
                                {formatDate(date)}
                              </span>
                            ))}
                            {record.missingDates.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{record.missingDates.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-green-600 text-sm">Complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-muted bg-muted/25">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, filteredMissingData.length)} to {Math.min(currentPage * pageSize, filteredMissingData.length)} of {filteredMissingData.length} employees
                    {searchTerm && ` (filtered from ${missingData.length})`}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-muted-foreground border-muted hover:bg-muted"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button
                          key={page}
                          size="sm"
                          variant={currentPage === page ? 'default' : 'outline'}
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground border-muted hover:bg-muted'}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="text-muted-foreground border-muted hover:bg-muted"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}