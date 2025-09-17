'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, BarChart3, Users, Clock } from 'lucide-react';
import { logService, employeeService, tagService } from '@/api';
import { Employee, Tag, Log } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentISTDate } from '@/lib/utils';

export default function DailyChartPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  // Move pagination logic below employees state declaration
  const [selectedDate, setSelectedDate] = useState(getCurrentISTDate());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setTags] = useState<Tag[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadDailyLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await logService.getByDateRange({
        dateFrom: selectedDate,
        dateTo: selectedDate,
      });

      if (Array.isArray(response)) {
        setLogs(response as Log[]);
      }
    } catch (error) {
      console.error('Error loading daily logs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadInitialData = async () => {
    try {
      try {
        const [employeesResponse, tagsResponse] = await Promise.all([
          employeeService.getAll(),
          tagService.getAll()
        ]);

        if (employeesResponse.data.success) {
          setEmployees(employeesResponse.data.data || []);
          setFilteredEmployees(employeesResponse.data.data || []);
        }
        if (tagsResponse.data.success) {
          setTags(tagsResponse.data.data || []);
        }
      } catch (error) {
        console.error('API error in loadInitialData:', error);
        // Optionally, show a user-friendly message
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadDailyLogs();
    }
  }, [selectedDate, loadDailyLogs]);

  // Filter employees based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee => 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, employees]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getEmployeeLogData = (employeeId: number) => {
    const employeeLogs = logs.filter(log => log.employeeId === employeeId);
    const totalMinutes = employeeLogs.reduce((sum, log) => sum + log.totalMinutes, 0);
    return { logs: employeeLogs, totalMinutes };
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getTagLogForEmployee = (employeeId: number, tagId: number) => {
    return logs.find(log => log.employeeId === employeeId && log.tagId === tagId);
  };

  const hasSubmittedData = (employeeId: number) => {
    return logs.some(log => log.employeeId === employeeId);
  };

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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <BarChart3 className="h-7 w-7 mr-2 text-primary" />
            Daily Work Chart
          </h1>
          <p className="text-muted-foreground mt-1">View daily work submissions and performance</p>
        </div>
      </div>

      {/* Date Selection and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Filters & Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getCurrentISTDate()}
                className="w-auto"
              />
            </div>
            <div className="grid gap-2 flex-1 max-w-xs">
              <Label htmlFor="search">Employee Search</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={loadDailyLogs} variant="outline">
              Load Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{filteredEmployees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold">
                  {filteredEmployees.filter(emp => hasSubmittedData(emp.id)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-gray-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Not Submitted</p>
                <p className="text-2xl font-bold">
                  {filteredEmployees.filter(emp => !hasSubmittedData(emp.id)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Chart */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchTerm ? 'No employees found matching your search' : 'No employees found'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'Add employees to see their work data here.'}
            </p>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm('')} 
                variant="outline" 
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Work Log for {new Date(selectedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
              </div>
              <div className="text-sm text-gray-500">
                Total: {filteredEmployees.length} employees {searchTerm && `(filtered from ${employees.length})`}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Code
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEmployees.map((employee, index) => {
                  const hasData = hasSubmittedData(employee.id);
                  const logData = getEmployeeLogData(employee.id);
                  return (
                    <tr key={employee.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-blue-600">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-xs text-gray-500">ID: {employee.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.employeeCode}</div>
                        <div className="text-xs text-gray-500">Code</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {hasData ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Not Submitted
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {hasData ? (
                          <div className="text-sm text-gray-900">
                            {Math.round(logData.totalMinutes / 60 * 10) / 10}h logged
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No data</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredEmployees.length)} to {Math.min(currentPage * pageSize, filteredEmployees.length)} of {filteredEmployees.length} employees
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-gray-500 border-gray-300 hover:bg-gray-50"
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
                        className={currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-500 border-gray-300 hover:bg-gray-50'}
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
                    className="text-gray-500 border-gray-300 hover:bg-gray-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}