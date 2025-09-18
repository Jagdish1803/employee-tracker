'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Save, Eye } from 'lucide-react';
import { assignmentService, logService } from '@/api';
import { toast } from 'react-hot-toast';

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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [logs, setLogs] = useState<Record<number, number>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Mock employee ID (in real app, this would come from auth context)
  const employeeId = 1;

  const fetchExistingLogs = useCallback(async () => {
    try {
      const response = await logService.getByDate(employeeId, selectedDate);
      if (response && Array.isArray(response)) {
        const existingLogs: Record<number, number> = {};
        response.forEach((log: unknown) => {
          const logData = log as { tagId: number; count: number };
          existingLogs[logData.tagId] = logData.count;
        });
        setLogs(existingLogs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }, [employeeId, selectedDate]);

  useEffect(() => {
    fetchAssignments();
    fetchExistingLogs();
  }, [selectedDate, fetchExistingLogs]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAll();
      if (response && Array.isArray(response)) {
        // Filter assignments for current employee
        const employeeAssignments = response.filter(
          (assignment) => assignment.employeeId === employeeId
        ) || [];
        setAssignments(employeeAssignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" disabled={loading}>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button onClick={handleSubmit} disabled={submitLoading || assignments.length === 0}>
          {submitLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Submitting...
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