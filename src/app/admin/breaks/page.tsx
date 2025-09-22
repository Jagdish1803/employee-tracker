// src/app/admin/breaks/page.tsx
'use client';

import React, { useState } from 'react';
import { Coffee, Clock, AlertTriangle, Users } from 'lucide-react';
import { Break } from '@/types';
import { formatTime, getCurrentISTDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useBreakManagement } from '@/hooks/useBreaks';
import { useEmployees } from '@/hooks/useEmployees';

export default function BreaksPage() {
  const [selectedDate, setSelectedDate] = useState(getCurrentISTDate());
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [warningConfirmOpen, setWarningConfirmOpen] = useState(false);
  const [breakToWarn, setBreakToWarn] = useState<Break | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // React Query hooks
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const {
    breaks,
    activeBreaks,
    todayBreaks,
    isLoading: loadingBreaks,
    refetch
  } = useBreakManagement({
    date: selectedDate,
    employeeId: employeeFilter !== 'all' ? parseInt(employeeFilter) : undefined
  });

  // Auto-refresh every 30 seconds for real-time updates
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (refetch) refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleWarnEmployee = (breakRecord: Break) => {
    setBreakToWarn(breakRecord);
    setWarningConfirmOpen(true);
  };

  const confirmWarnEmployee = async () => {
    if (!breakToWarn) return;
    try {
      // Here you would call a warning creation API
      setBreakToWarn(null);
    } catch (error: unknown) {
      console.error('Error creating warning:', error);
    }
  };

  const loading = loadingBreaks || loadingEmployees;

  // Calculate statistics
  const totalBreaksToday = todayBreaks.length;
  const activeBreaksCount = activeBreaks.length;

  const getBreakDuration = (breakRecord: Break) => {
    if (breakRecord.breakOutTime) {
      const duration = new Date(breakRecord.breakOutTime).getTime() - new Date(breakRecord.breakInTime!).getTime();
      const minutes = Math.floor(duration / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${minutes}m`;
    }
    return 'Ongoing';
  };

  const getBreakStatus = (breakRecord: Break) => {
    if (!breakRecord.breakOutTime) return 'active';
    
    const duration = new Date(breakRecord.breakOutTime).getTime() - new Date(breakRecord.breakInTime!).getTime();
    const minutes = Math.floor(duration / (1000 * 60));
    
    if (minutes > 20) return 'excessive';
    if (minutes > 15) return 'long';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'excessive': return 'bg-red-100 text-red-800';
      case 'long': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
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
            <Coffee className="h-7 w-7 mr-2 text-primary" />
            Break Management
          </h1>
          <p className="text-muted-foreground mt-1">Monitor and manage employee break times</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-700 border-green-200' : ''}
          >
            <Clock className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          {refetch && (
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh Now
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
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
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Breaks Today</p>
                <p className="text-2xl font-bold">{totalBreaksToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Breaks</p>
                <p className="text-2xl font-bold">{activeBreaksCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{breaks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Status */}
      {activeBreaksCount > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Clock className="h-5 w-5 animate-pulse" />
              <span>Live Break Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-blue-700 font-medium">
                {activeBreaksCount} employee{activeBreaksCount > 1 ? 's are' : ' is'} currently on break
              </p>
              <div className="grid gap-2">
                {activeBreaks.slice(0, 3).map((breakRecord: Break) => {
                  const employee = employees.find(emp => emp.id === breakRecord.employeeId);
                  const startTime = new Date(breakRecord.breakInTime!);
                  const duration = Math.floor((new Date().getTime() - startTime.getTime()) / (1000 * 60));
                  const isLongBreak = duration > 20;

                  return (
                    <div key={breakRecord.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isLongBreak ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                        <span className="text-sm font-medium">{employee?.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${isLongBreak ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {duration}m
                      </span>
                    </div>
                  );
                })}
                {activeBreaksCount > 3 && (
                  <p className="text-xs text-blue-600">+{activeBreaksCount - 3} more employees on break</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breaks List */}
      {breaks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Coffee className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No breaks found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedDate === getCurrentISTDate() ?
                'No employees have taken breaks today yet.' :
                'No break records found for the selected date and filters.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Break Records</span>
              <div className="text-sm text-muted-foreground">
                {breaks.length} record{breaks.length > 1 ? 's' : ''} found
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breaks.map((breakRecord: Break) => {
                const employee = employees.find(emp => emp.id === breakRecord.employeeId);
                const status = getBreakStatus(breakRecord);
                const duration = getBreakDuration(breakRecord);
                
                return (
                  <div
                    key={breakRecord.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {employee?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{employee?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee?.employeeCode}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatTime(new Date(breakRecord.breakInTime!).toTimeString().slice(0,5))}
                          {breakRecord.breakOutTime && ` - ${formatTime(new Date(breakRecord.breakOutTime).toTimeString().slice(0,5))}`}
                          {!breakRecord.breakOutTime && <span className="text-blue-600 ml-2">(Active)</span>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {duration}
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      
                      {(status === 'excessive' || status === 'long') && (
                        <Button
                          onClick={() => handleWarnEmployee(breakRecord)}
                          variant="outline"
                          size="sm"
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Warn
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Confirmation Dialog */}
      <ConfirmationDialog
        open={warningConfirmOpen}
        onOpenChange={setWarningConfirmOpen}
        title="Send Warning"
        description={`Send a warning to ${
          breakToWarn 
            ? employees.find(emp => emp.id === breakToWarn.employeeId)?.name || 'this employee'
            : ''
        } for excessive break time?`}
        confirmText="Send Warning"
        cancelText="Cancel"
        onConfirm={confirmWarnEmployee}
        variant="destructive"
      />
    </div>
  );
}