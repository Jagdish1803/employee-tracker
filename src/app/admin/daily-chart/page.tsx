'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, BarChart3, Users, Clock } from 'lucide-react';
import { logService, employeeService, tagService } from '@/api';
import { Employee, Tag, Log } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentISTDate } from '@/lib/utils';

export default function DailyChartPage() {
  const [selectedDate, setSelectedDate] = useState(getCurrentISTDate());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [, setTags] = useState<Tag[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadDailyLogs();
    }
  }, [selectedDate, loadDailyLogs]);

  const loadInitialData = async () => {
    try {
      try {
        const [employeesResponse, tagsResponse] = await Promise.all([
          employeeService.getAll(),
          tagService.getAll()
        ]);

        if (employeesResponse.data.success) {
          setEmployees(employeesResponse.data.data || []);
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

  const loadDailyLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await logService.getByDateRange({
        dateFrom: selectedDate,
        dateTo: selectedDate,
      });

      if (response.data.success) {
        setLogs(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading daily logs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

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

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Select Date
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
                <p className="text-2xl font-bold">{employees.length}</p>
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
                  {employees.filter(emp => hasSubmittedData(emp.id)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {employees.filter(emp => !hasSubmittedData(emp.id)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            Work Log for {new Date(selectedDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Employee</th>
                  <th className="text-center p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const hasData = hasSubmittedData(employee.id);
                  
                  return (
                    <tr key={employee.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-primary">
                              {employee.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">{employee.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-4">
                        {hasData ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {employees.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No employees found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add employees to see their work data here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}