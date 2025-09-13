// src/app/admin/edit-logs/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Calendar, Users, Search, Save, AlertTriangle } from 'lucide-react';
import { logService, employeeService, tagService } from '@/api';
import { Log, Employee, Tag } from '@/types';
import { getCurrentISTDate, formatMinutesToHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function EditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getCurrentISTDate());
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [editingLog, setEditingLog] = useState<Log | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editCount, setEditCount] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [selectedDate, employeeFilter, loadLogs]);

  const loadInitialData = async () => {
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
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);

      const filter: Record<string, unknown> = {
        dateFrom: selectedDate,
        dateTo: selectedDate,
      };

      if (employeeFilter !== 'all') {
        filter.employeeId = parseInt(employeeFilter);
      }

      const response = await logService.getByDateRange(filter);
      if (response.data.success) {
        setLogs(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, employeeFilter]);

  const handleEditLog = (log: Log) => {
    setEditingLog(log);
    setEditCount(log.count);
    setIsDialogOpen(true);
  };

  const handleUpdateLog = async () => {
    if (!editingLog) return;

    if (editCount < 0) {
      toast.error('Count cannot be negative');
      return;
    }

    setUpdating(true);
    try {
      const response = await logService.update(editingLog.id, editCount === 0 ? { count: 0, totalMinutes: 0 } : { count: editCount });
      if (response.data.success) {
        toast.success('Log updated successfully');
        loadLogs();
        closeDialog();
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update log';
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingLog(null);
    setEditCount(0);
  };

  const calculateNewTotal = () => {
    if (!editingLog) return 0;
    const tag = tags.find(t => t.id === editingLog.tagId);
    return editCount * (tag?.timeMinutes || 0);
  };

  // Group logs by employee
  const logsByEmployee = logs.reduce((acc, log) => {
    const employeeId = log.employeeId;
    if (!acc[employeeId]) {
      acc[employeeId] = [];
    }
    acc[employeeId].push(log);
    return acc;
  }, {} as Record<number, Log[]>);

  // Calculate stats
  const stats = {
    totalLogs: logs.length,
    totalEmployees: Object.keys(logsByEmployee).length,
    totalMinutes: logs.reduce((sum, log) => sum + log.totalMinutes, 0),
    averagePerEmployee: Object.keys(logsByEmployee).length > 0 
      ? Math.round(logs.length / Object.keys(logsByEmployee).length)
      : 0,
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Edit className="h-7 w-7 mr-2 text-primary" />
            Edit Work Logs
          </h1>
          <p className="text-muted-foreground mt-1">Modify submitted work log entries</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
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
            <div className="grid gap-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadLogs} variant="outline" className="mt-6">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Edit className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold">{stats.totalLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">{formatMinutesToHours(stats.totalMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Avg per Employee</p>
                <p className="text-2xl font-bold">{stats.averagePerEmployee}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      {Object.keys(logsByEmployee).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Edit className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No logs found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No work logs found for the selected date and filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(logsByEmployee).map(([employeeId, employeeLogs]) => {
            const employee = employees.find(emp => emp.id === parseInt(employeeId));
            const totalMinutes = employeeLogs.reduce((sum, log) => sum + log.totalMinutes, 0);
            
            return (
              <Card key={employeeId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-primary">
                          {employee?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div>{employee?.name}</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          {employee?.employeeCode} • {employeeLogs.length} logs • {formatMinutesToHours(totalMinutes)}
                        </div>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium">Tag</th>
                          <th className="text-center px-4 py-3 font-medium">Count</th>
                          <th className="text-center px-4 py-3 font-medium">Time/Unit</th>
                          <th className="text-center px-4 py-3 font-medium">Total Time</th>
                          <th className="text-center px-4 py-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {employeeLogs.map((log) => {
                          const tag = tags.find(t => t.id === log.tagId);
                          
                          return (
                            <tr key={log.id} className="hover:bg-muted/25">
                              <td className="px-4 py-3">
                                <div className="font-medium">{tag?.tagName}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-semibold">{log.count}</span>
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground">
                                {tag?.timeMinutes} min
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-medium">{log.totalMinutes} min</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  onClick={() => handleEditLog(log)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Log Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Work Log</DialogTitle>
            <DialogDescription>
              Modify the count for this work log entry.
            </DialogDescription>
          </DialogHeader>
          
          {editingLog && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Employee:</span>
                    <div>{editingLog.employee?.name}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Tag:</span>
                    <div>{editingLog.tag?.tagName}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date:</span>
                    <div>{new Date(editingLog.logDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Time/Unit:</span>
                    <div>{editingLog.tag?.timeMinutes} minutes</div>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="count">Count</Label>
                <Input
                  id="count"
                  type="number"
                  min="0"
                  value={editCount}
                  onChange={(e) => setEditCount(parseInt(e.target.value) || 0)}
                  placeholder="Enter count"
                />
                <p className="text-xs text-muted-foreground">
                  Current: {editingLog.count} → New total time: {calculateNewTotal()} minutes
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLog} disabled={updating}>
              <Save className="w-4 h-4 mr-2" />
              {updating ? 'Updating...' : 'Update Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Notice */}
      <Card className="mt-6 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Editing work logs will modify the original submission data. This action should only be performed when necessary to correct errors. All changes are logged for audit purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}