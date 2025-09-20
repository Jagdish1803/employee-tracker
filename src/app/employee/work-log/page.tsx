'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Save, Eye } from 'lucide-react';
import { assignmentService, logService } from '@/api';
import { toast } from 'sonner';

interface Tag {
  id: number;
  tagName: string;
  timeMinutes: number;
}

interface Assignment {
  id: number;
  employeeId: number;
  tagId: number;
  isMandatory: boolean;
  tag?: Tag;
}


export default function WorkLog() {
  const { employee } = useEmployeeAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [logs, setLogs] = useState<Record<number, number>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    isLocked: boolean;
    submissionTime: string;
    statusMessage: string;
  } | null>(null);

  const employeeId = employee?.id || 1;

  const fetchExistingLogs = useCallback(async () => {
    try {
      const response = await logService.getByDate(employeeId, selectedDate);

      // Handle the new API response structure that includes submissionStatus
      if (response && typeof response === 'object' && 'data' in response) {
        const apiResponse = response as unknown as {
          data: { tagId: number; count: number }[];
          submissionStatus: { isLocked: boolean; submissionTime: string; statusMessage: string } | null
        };

        const existingLogs: Record<number, number> = {};
        if (Array.isArray(apiResponse.data)) {
          apiResponse.data.forEach((log) => {
            existingLogs[log.tagId] = log.count;
          });
        }
        setLogs(existingLogs);
        setSubmissionStatus(apiResponse.submissionStatus);
      } else if (Array.isArray(response)) {
        // Fallback for old response format
        const existingLogs: Record<number, number> = {};
        response.forEach((log: unknown) => {
          const logData = log as { tagId: number; count: number };
          existingLogs[logData.tagId] = logData.count;
        });
        setLogs(existingLogs);
        setSubmissionStatus(null);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }, [employeeId, selectedDate]);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAll();

      let employeeAssignments: Assignment[] = [];

      // Handle new API response structure
      if (response && Array.isArray(response)) {
        employeeAssignments = response.filter(
          (assignment) => assignment.employeeId === employeeId
        );
      } else if (response && typeof response === 'object' && 'data' in response) {
        const apiResponse = response as { data: Assignment[] };
        if (Array.isArray(apiResponse.data)) {
          employeeAssignments = apiResponse.data.filter(
            (assignment) => assignment.employeeId === employeeId
          );
        }
      }

      setAssignments(employeeAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchAssignments();
    fetchExistingLogs();
  }, [selectedDate, fetchExistingLogs, fetchAssignments]);

  // Initialize logs with default 0 values for assignments
  useEffect(() => {
    if (assignments.length > 0) {
      const initialLogs: Record<number, number> = {};
      assignments.forEach(assignment => {
        if (assignment.tagId) {
          initialLogs[assignment.tagId] = logs[assignment.tagId] || 0;
        }
      });
      setLogs(prevLogs => ({ ...initialLogs, ...prevLogs }));
    }
  }, [assignments, logs]);

  const handleLogChange = (tagId: number, count: number) => {
    setLogs(prev => ({
      ...prev,
      [tagId]: Math.max(0, count)
    }));
  };

  const calculateTotalMinutes = (tagId: number, count: number) => {
    const assignment = assignments.find(a => a.tagId === tagId);
    return assignment && assignment.tag ? assignment.tag.timeMinutes * count : 0;
  };

  const getTotalDayMinutes = () => {
    return Object.entries(logs).reduce((total, [tagId, count]) => {
      return total + calculateTotalMinutes(parseInt(tagId), count);
    }, 0);
  };

  const handleSubmit = async () => {
    try {
      setSubmitLoading(true);

      const logEntries = Object.entries(logs)
        .filter(([, count]) => count > 0)
        .map(([tagId, count]) => ({
          tagId: parseInt(tagId),
          count
        }));

      if (logEntries.length === 0) {
        toast.error('Please add at least one log entry');
        return;
      }

      const response = await logService.submit({
        employeeId,
        logs: logEntries,
        logDate: selectedDate
      });

      if (response.data) {
        toast.success('Work log submitted successfully!');
      } else {
        toast.error('Failed to submit work log');
      }
    } catch (error) {
      console.error('Error submitting logs:', error);
      toast.error('Failed to submit work log');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work Log</h1>
          <p className="text-muted-foreground">Track your daily work activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Daily Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-2xl font-bold">{formatMinutes(getTotalDayMinutes())}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Tasks</p>
              <p className="text-2xl font-bold">{Object.values(logs).filter(count => count > 0).length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="text-2xl font-bold">{new Date(selectedDate).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Log Your Work</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the number of times you completed each assigned task
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No assignments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{assignment.tag?.tagName || 'Unknown Tag'}</h3>
                      {assignment.isMandatory && (
                        <Badge variant="secondary">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {assignment.tag?.timeMinutes || 0} minutes per count
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`count-${assignment.tagId}`} className="text-sm">
                      Count:
                    </Label>
                    <Input
                      id={`count-${assignment.tagId}`}
                      type="number"
                      min="0"
                      value={logs[assignment.tagId] || 0}
                      onChange={(e) => handleLogChange(assignment.tagId, parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Time</p>
                    <p className="font-medium">
                      {formatMinutes(calculateTotalMinutes(assignment.tagId, logs[assignment.tagId] || 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Status */}
      {submissionStatus?.isLocked && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Work log submitted successfully!
                </p>
                <p className="text-xs text-green-600">
                  Submitted on {new Date(submissionStatus.submissionTime).toLocaleString()}
                </p>
                <p className="text-xs text-green-600">
                  Status: {submissionStatus.statusMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" disabled={loading}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitLoading || assignments.length === 0 || submissionStatus?.isLocked}
        >
          {submitLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
            </>
          ) : submissionStatus?.isLocked ? (
            <>
              <div className="h-4 w-4 bg-green-500 rounded-full mr-2" />
              Already Submitted
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Submit Work Log
            </>
          )}
        </Button>
      </div>
    </div>
  );
}