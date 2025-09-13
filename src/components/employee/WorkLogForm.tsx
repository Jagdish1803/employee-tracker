'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { logService } from '@/api';
import { Assignment } from '@/types';
import { formatMinutesToHours } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WorkLogFormProps {
  employeeId: number;
  selectedDate: string;
  assignments: Assignment[];
  onSubmitSuccess: () => void;
}

interface LogEntry {
  tagId: number;
  count: number;
}

export default function WorkLogForm({
  employeeId,
  selectedDate,
  assignments,
  onSubmitSuccess,
}: WorkLogFormProps) {
  const [logs, setLogs] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ isLocked?: boolean } | null>(null);

  // Memoize calculations for better performance
  const totalMinutes = useMemo(() => {
    return assignments.reduce((total, assignment) => {
      const count = logs[assignment.tagId] || 0;
      const minutes = count * (assignment.tag?.timeMinutes || 0);
      return total + minutes;
    }, 0);
  }, [logs, assignments]);

  const missingMandatory = useMemo(() => {
    return assignments.some(assignment => 
      assignment.isMandatory && (logs[assignment.tagId] || 0) === 0
    );
  }, [assignments, logs]);

  const hasData = useMemo(() => {
    return Object.values(logs).some(count => count > 0);
  }, [logs]);

  // Initialize logs state when assignments change
  useEffect(() => {
    const initialLogs: Record<number, number> = {};
    assignments.forEach(assignment => {
      initialLogs[assignment.tagId] = logs[assignment.tagId] || 0;
    });
    setLogs(initialLogs);
    setHasChanges(false);
  }, [assignments, logs]);

  // Load existing data and submission status when date or employee changes
  useEffect(() => {
    if (employeeId && selectedDate) {
      loadExistingData();
      loadSubmissionStatus();
    }
  }, [employeeId, selectedDate, loadExistingData, loadSubmissionStatus]);

  const loadExistingData = useCallback(async () => {
    try {
      const response = await logService.getByDate(employeeId, selectedDate);
      if (response.data.success && response.data.data) {
        const existingLogs: Record<number, number> = {};
        interface ApiLogEntry {
          tagId: number;
          count: number;
        }
        (response.data.data as ApiLogEntry[]).forEach((log: ApiLogEntry) => {
          existingLogs[log.tagId] = log.count;
        });
        setLogs(prev => ({ ...prev, ...existingLogs }));
        setHasChanges(false);
      }
    } catch (error) {
      console.error('API error in loadExistingData:', error);
      // Optionally, show a user-friendly message
    }
  }, [employeeId, selectedDate]);

  const loadSubmissionStatus = useCallback(async () => {
    try {
      // If your API does not return submissionStatus, set to null or handle as needed
      setSubmissionStatus(null);
    } catch {
      setSubmissionStatus(null);
    }
  }, []);

  const handleCountChange = useCallback((tagId: number, count: number) => {
    const newCount = Math.max(0, count);
    setLogs(prev => {
      const updated = { ...prev, [tagId]: newCount };
      setHasChanges(true);
      return updated;
    });
  }, []);

  const calculateTagTotal = useCallback((tagId: number, timeMinutes: number): number => {
    const count = logs[tagId] || 0;
    return count * timeMinutes;
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasData) {
      toast.error('Please enter at least one count before submitting.');
      return;
    }

    if (missingMandatory) {
      const confirmed = confirm('Warning: You have missed some mandatory tags. Continue anyway?');
      if (!confirmed) return;
    }

    const confirmed = confirm('Once submitted, this data will be locked and cannot be edited. Continue?');
    if (!confirmed) return;

    setIsSubmitting(true);
    
    try {
      const logEntries: LogEntry[] = Object.entries(logs).map(([tagId, count]) => ({
        tagId: parseInt(tagId),
        count,
      }));

      const response = await logService.submit({
        employeeId,
        logs: logEntries,
        logDate: selectedDate,
      });

      if (response.data.success) {
        setHasChanges(false);
        onSubmitSuccess();
      } else {
        toast.error(response.data.error || 'Failed to submit work log');
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to submit work log';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show warning if user tries to leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Work Log - {new Date(selectedDate).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
          {hasChanges && (
            <span className="text-sm text-orange-600 flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Tags Assigned</h3>
            <p className="mt-2 text-sm text-gray-600">
              You don&apos;t have any work tags assigned. Please contact your administrator.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time/Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map((assignment) => {
                    const count = logs[assignment.tagId] || 0;
                    const timeMinutes = assignment.tag?.timeMinutes || 0;
                    const totalMinutes = calculateTagTotal(assignment.tagId, timeMinutes);
                    const isMissing = assignment.isMandatory && count === 0;
                    
                    return (
                      <tr key={assignment.id} className={isMissing ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {assignment.tag?.tagName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.isMandatory ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Mandatory
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {timeMinutes} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="number"
                            min="0"
                            max="999"
                            value={count}
                            onChange={(e) => handleCountChange(assignment.tagId, parseInt(e.target.value) || 0)}
                            className={`w-20 ${isMissing ? 'border-red-300 focus:border-red-500' : ''}`}
                            placeholder="0"
                            disabled={submissionStatus?.isLocked}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {totalMinutes} min
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      Total Time:
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                      {formatMinutesToHours(totalMinutes)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 space-y-4">
              {missingMandatory && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Missing Mandatory Tags
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>You have not filled in some mandatory tags. Please complete all mandatory fields or contact your supervisor if you didn&apos;t work on these tasks.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important Notice
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Once submitted, this data will be locked and cannot be edited. Please review your entries carefully before submitting.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {hasData ? (
                    <span>Ready to submit {formatMinutesToHours(totalMinutes)} of work</span>
                  ) : (
                    <span>Enter your work counts above</span>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !hasData || submissionStatus?.isLocked}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit & Lock Work Log'}</span>
                </Button>
              </div>
              {submissionStatus?.isLocked && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 text-sm font-medium">Work log is locked and cannot be edited.</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </form>
    </div>
  );
}