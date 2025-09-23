'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Save,
  Eye,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Tag as TagIcon,
  Search,
  FileText,
  BarChart3
} from 'lucide-react';
import { assignmentService, logService } from '@/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  createdAt: Date | string;
  tag?: Tag;
}

export default function WorkAssignments() {
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
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mandatory' | 'optional'>('all');

  // Get actual employee data from authentication
  const { employeeId, loading: employeeLoading, error: employeeError } = useEmployeeData();

  // Filter assignments based on search and type
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.tag?.tagName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' ||
      (filterType === 'mandatory' && assignment.isMandatory) ||
      (filterType === 'optional' && !assignment.isMandatory);
    return matchesSearch && matchesType;
  });

  // Date validation functions
  const getMaxAllowedDate = () => {
    return new Date().toISOString().split('T')[0]; // Today
  };

  const getMinAllowedDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0]; // Yesterday
  };

  const isDateAllowed = (date: string) => {
    const maxDate = getMaxAllowedDate();
    const minDate = getMinAllowedDate();
    return date >= minDate && date <= maxDate;
  };

  const handleDateChange = (newDate: string) => {
    if (!isDateAllowed(newDate)) {
      toast.error('You can only submit work logs for today or yesterday');
      return;
    }
    setSelectedDate(newDate);
  };

  const fetchExistingLogs = useCallback(async () => {
    if (!employeeId) return; // Don't fetch if no employee ID

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
    if (!employeeId) return; // Don't fetch if no employee ID

    try {
      setLoading(true);
      // Use the getByEmployee method to get assignments for specific employee
      const response = await assignmentService.getByEmployee(employeeId);

      let employeeAssignments: Assignment[] = [];

      // Handle API response structure
      if (response && Array.isArray(response)) {
        employeeAssignments = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        const apiResponse = response as { data: Assignment[] };
        if (Array.isArray(apiResponse.data)) {
          employeeAssignments = apiResponse.data;
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
    if (employeeId) {
      fetchAssignments();
      fetchExistingLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, employeeId]);

  // Initialize logs with default 0 values for assignments (only when assignments change)
  useEffect(() => {
    if (assignments.length > 0) {
      setLogs(prevLogs => {
        const initialLogs: Record<number, number> = {};
        assignments.forEach(assignment => {
          if (assignment.tagId) {
            initialLogs[assignment.tagId] = prevLogs[assignment.tagId] || 0;
          }
        });
        return { ...prevLogs, ...initialLogs };
      });
    }
  }, [assignments]);

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
    if (!employeeId) {
      toast.error('Employee data not available. Please refresh the page.');
      return;
    }

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
        // Refresh the submission status and logs
        await fetchExistingLogs();
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

  const getAssignmentStats = () => {
    const total = assignments.length;
    const mandatory = assignments.filter(a => a.isMandatory).length;
    const optional = assignments.filter(a => !a.isMandatory).length;
    const totalTime = assignments.reduce((sum, a) => sum + (a.tag?.timeMinutes || 0), 0);

    return { total, mandatory, optional, totalTime };
  };

  const stats = getAssignmentStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Work & Assignments</h1>
          <p className="text-muted-foreground">Manage your assignments and track daily work activities</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={getMinAllowedDate()}
            max={getMaxAllowedDate()}
            className="w-auto"
          />
          {!isDateAllowed(selectedDate) && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Invalid date
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Active assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMinutes(getTotalDayMinutes())}</div>
            <p className="text-xs text-muted-foreground">Logged for {new Date(selectedDate).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(logs).filter(count => count > 0).length}</div>
            <p className="text-xs text-muted-foreground">With logged work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Required Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mandatory}</div>
            <p className="text-xs text-muted-foreground">Mandatory assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="work-log" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="work-log" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Log Work</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center space-x-2">
            <ClipboardList className="h-4 w-4" />
            <span>View Assignments</span>
          </TabsTrigger>
        </TabsList>

        {/* Work Log Tab */}
        <TabsContent value="work-log" className="space-y-6 mt-6">
          {/* Submission Status */}
          {submissionStatus?.isLocked && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Work log submitted successfully!
                    </p>
                    <p className="text-xs text-green-600">
                      Submitted on {new Date(submissionStatus.submissionTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Log Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Log Your Work - {new Date(selectedDate).toLocaleDateString()}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter the number of times you completed each assigned task
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(loading || employeeLoading) ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading assignments...</p>
                </div>
              ) : employeeError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">Error loading employee data</p>
                  <p className="text-sm text-muted-foreground">{employeeError}</p>
                </div>
              ) : !employeeId ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <p className="text-amber-600 font-medium">No employee data found</p>
                  <p className="text-sm text-muted-foreground">Please contact your administrator</p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No assignments found</p>
                  <p className="text-sm text-muted-foreground">Contact your administrator to get assignments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <TagIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{assignment.tag?.tagName || 'Unknown Tag'}</h3>
                          {assignment.isMandatory ? (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
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
                          disabled={submissionStatus?.isLocked}
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

          {/* Submit Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" disabled={loading || employeeLoading || !employeeId} onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitLoading || assignments.length === 0 || submissionStatus?.isLocked || !employeeId || employeeLoading}
            >
              {submitLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : submissionStatus?.isLocked ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
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
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6 mt-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assignments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterType === 'mandatory' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('mandatory')}
                  >
                    Mandatory
                  </Button>
                  <Button
                    variant={filterType === 'optional' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType('optional')}
                  >
                    Optional
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Assignments ({filteredAssignments.length})</CardTitle>
              <p className="text-sm text-muted-foreground">
                View all your assigned tasks and their details
              </p>
            </CardHeader>
            <CardContent>
              {(loading || employeeLoading) ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading assignments...</p>
                </div>
              ) : employeeError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium">Error loading employee data</p>
                  <p className="text-sm text-muted-foreground">{employeeError}</p>
                </div>
              ) : !employeeId ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <p className="text-amber-600 font-medium">No employee data found</p>
                  <p className="text-sm text-muted-foreground">Please contact your administrator</p>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {assignments.length === 0 ? 'No assignments found' : 'No assignments match your search'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <TagIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{assignment.tag?.tagName}</h3>
                            {assignment.isMandatory ? (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Optional
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Assigned on {new Date(assignment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatMinutes(assignment.tag?.timeMinutes || 0)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">per completion</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Work Log Preview
            </DialogTitle>
            <DialogDescription>
              Review your work log entries for {new Date(selectedDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(selectedDate).toLocaleDateString()}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="font-medium">{formatMinutes(getTotalDayMinutes())}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="font-medium">{Object.values(logs).filter(count => count > 0).length}</p>
              </div>
            </div>

            {/* Preview Entries */}
            <div className="space-y-2">
              <h4 className="font-medium">Work Log Entries:</h4>
              {assignments
                .filter(assignment => logs[assignment.tagId] > 0)
                .map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{assignment.tag?.tagName}</span>
                        {assignment.isMandatory && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {logs[assignment.tagId]} × {assignment.tag?.timeMinutes}min = {formatMinutes(calculateTotalMinutes(assignment.tagId, logs[assignment.tagId]))}
                      </div>
                    </div>
                  </div>
                ))}

              {Object.values(logs).filter(count => count > 0).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>No work log entries to preview</p>
                  <p className="text-sm">Add some counts to your assigned tasks first</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowPreview(false);
                  handleSubmit();
                }}
                disabled={
                  submitLoading ||
                  assignments.length === 0 ||
                  submissionStatus?.isLocked ||
                  !isDateAllowed(selectedDate) ||
                  Object.values(logs).filter(count => count > 0).length === 0 ||
                  !employeeId ||
                  employeeLoading
                }
              >
                <Save className="h-4 w-4 mr-2" />
                Submit Work Log
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}