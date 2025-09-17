// src/app/admin/warnings/page.tsx
'use client';
import React, { useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Warning, CreateWarningRequest, WarningType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useWarningManagement } from '@/hooks/useWarnings';
import { useEmployees } from '@/hooks/useEmployees';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function WarningsPage() {
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dismissed'>('all');
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [warningToDismiss, setWarningToDismiss] = useState<Warning | null>(null);
  const [warningToDelete, setWarningToDelete] = useState<Warning | null>(null);
  const [createWarningOpen, setCreateWarningOpen] = useState(false);
  const [newWarning, setNewWarning] = useState<CreateWarningRequest>({
    employeeId: 0,
    warningType: 'ATTENDANCE',
    warningMessage: '',
    warningDate: new Date().toISOString().split('T')[0]
  });

  // React Query hooks
  const { data: employees = [], isLoading: loadingEmployees } = useEmployees();
  const {
    warnings,
    isLoading: loadingWarnings,
    dismissWarning,
    isDismissing,
    deleteWarning,
    isDeleting,
    createWarning,
    isCreating
  } = useWarningManagement({
    employeeId: employeeFilter !== 'all' ? parseInt(employeeFilter) : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined
  });

  const handleCreateWarning = async () => {
    if (!newWarning.employeeId || newWarning.employeeId === 0 || !newWarning.warningMessage.trim()) {
      toast.error('Please select an employee and enter a warning message');
      return;
    }

    try {
      // Ensure warningDate is in correct format
      const formattedWarning = {
        ...newWarning,
        warningDate: newWarning.warningDate || new Date().toISOString().split('T')[0]
      };
      
      await createWarning(formattedWarning);
      setCreateWarningOpen(false);
      setNewWarning({
        employeeId: 0,
        warningType: 'ATTENDANCE',
        warningMessage: '',
        warningDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating warning:', error);
    }
  };

  const handleDismissWarning = async (warning: Warning) => {
    setWarningToDismiss(warning);
    setDismissConfirmOpen(true);
  };

  const confirmDismiss = async () => {
    if (!warningToDismiss) return;

    try {
      await dismissWarning(warningToDismiss.id);
    } catch (error: unknown) {
      console.error('Error dismissing warning:', error);
    } finally {
      setWarningToDismiss(null);
      setDismissConfirmOpen(false);
    }
  };

  const handleDeleteWarning = async (warning: Warning) => {
    setWarningToDelete(warning);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!warningToDelete) return;

    try {
      await deleteWarning(warningToDelete.id);
    } catch (error: unknown) {
      console.error('Error deleting warning:', error);
    } finally {
      setWarningToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const getWarningPriority = (warning: Warning) => {
    const daysOld = Math.floor(
      (new Date().getTime() - new Date(warning.warningDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysOld <= 1) return { level: 'high', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    if (daysOld <= 7) return { level: 'medium', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
    return { level: 'low', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
  };

  // Group warnings by employee
  const warningsByEmployee = warnings.reduce((acc: Record<number, Warning[]>, warning: Warning) => {
    const employeeId = warning.employeeId;
    if (!acc[employeeId]) {
      acc[employeeId] = [];
    }
    acc[employeeId].push(warning);
    return acc;
  }, {} as Record<number, Warning[]>);

  // Calculate stats
  const stats = {
    total: warnings.length,
    active: warnings.filter((w: Warning) => w.isActive).length,
    dismissed: warnings.filter((w: Warning) => !w.isActive).length,
    highPriority: warnings.filter((w: Warning) => {
      const daysOld = Math.floor(
        (new Date().getTime() - new Date(w.warningDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return w.isActive && daysOld <= 1;
    }).length,
  };

  const loading = loadingWarnings || loadingEmployees;

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
    <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <AlertTriangle className="h-7 w-7 mr-2 text-primary" />
            Warning Management
          </h1>
          <p className="text-muted-foreground mt-1">Review and manage employee warnings</p>
        </div>
        <Button 
          onClick={() => setCreateWarningOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Create Warning
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Employee</label>
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
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'dismissed') => setStatusFilter(value)}>
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warnings</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="dismissed">Dismissed Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-6"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Warnings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <EyeOff className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Dismissed</p>
                <p className="text-2xl font-bold">{stats.dismissed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{stats.highPriority}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings List */}
      {Object.keys(warningsByEmployee).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No warnings found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No warnings found matching the selected filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(warningsByEmployee).map(([employeeId, employeeWarnings]) => {
            const employee = employees.find(emp => emp.id === parseInt(employeeId));
            const activeWarnings = (employeeWarnings as Warning[]).filter((w: Warning) => w.isActive);
            
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
                          {employee?.employeeCode} • {(employeeWarnings as Warning[]).length} warnings
                        </div>
                      </div>
                    </div>
                    {activeWarnings.length > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {activeWarnings.length} Active
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(employeeWarnings as Warning[]).map((warning: Warning) => {
                      const priority = getWarningPriority(warning);
                      const daysOld = Math.floor(
                        (new Date().getTime() - new Date(warning.warningDate).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <div
                          key={warning.id}
                          className={`p-4 border rounded-lg ${priority.bg} ${warning.isActive ? '' : 'opacity-60'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <AlertTriangle className={`h-4 w-4 ${priority.color}`} />
                                <span className="font-medium text-gray-900">
                                  {new Date(warning.warningDate).toLocaleDateString()}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({daysOld} days ago)
                                </span>
                                {!warning.isActive && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    Dismissed
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 text-sm">
                                {warning.warningMessage || 'No message provided'}
                              </p>
                            </div>
                            
                            <div className="flex space-x-2">
                              {warning.isActive ? (
                                <Button
                                  onClick={() => handleDismissWarning(warning)}
                                  variant="outline"
                                  size="sm"
                                  disabled={isDismissing}
                                >
                                  {isDismissing ? 'Dismissing...' : 'Dismiss'}
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleDeleteWarning(warning)}
                                  variant="outline"
                                  size="sm"
                                  disabled={isDeleting}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  {isDeleting ? 'Deleting...' : 'Delete'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dismiss Confirmation Dialog */}
      <ConfirmationDialog
        open={dismissConfirmOpen}
        onOpenChange={setDismissConfirmOpen}
        title="Dismiss Warning"
        description={`Dismiss warning for ${
          warningToDismiss
            ? employees.find(emp => emp.id === warningToDismiss.employeeId)?.name || 'this employee'
            : ''
        }?`}
        confirmText="Dismiss"
        cancelText="Cancel"
        onConfirm={confirmDismiss}
        variant="destructive"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Warning"
        description={`Permanently delete warning for ${
          warningToDelete
            ? employees.find(emp => emp.id === warningToDelete.employeeId)?.name || 'this employee'
            : ''
        }? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      {/* Create Warning Dialog */}
      <Dialog open={createWarningOpen} onOpenChange={setCreateWarningOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Create Manual Warning
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select 
                value={newWarning.employeeId.toString()} 
                onValueChange={(value) => setNewWarning(prev => ({ ...prev, employeeId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name} ({employee.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warningType">Warning Type</Label>
              <Select 
                value={newWarning.warningType} 
                onValueChange={(value: WarningType) => setNewWarning(prev => ({ ...prev, warningType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATTENDANCE">Attendance Issue</SelectItem>
                  <SelectItem value="LEAVE_MISUSE">Leave Misuse</SelectItem>
                  <SelectItem value="BREAK_EXCEEDED">Break Time Exceeded</SelectItem>
                  <SelectItem value="WORK_QUALITY">Work Quality Issue</SelectItem>
                  <SelectItem value="BEHAVIORAL">Behavioral Issue</SelectItem>
                  <SelectItem value="SYSTEM_MISUSE">System Misuse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warningDate">Warning Date</Label>
              <Input
                id="warningDate"
                type="date"
                value={newWarning.warningDate}
                onChange={(e) => setNewWarning(prev => ({ ...prev, warningDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warningMessage">Warning Message</Label>
              <Textarea
                id="warningMessage"
                value={newWarning.warningMessage}
                onChange={(e) => setNewWarning(prev => ({ ...prev, warningMessage: e.target.value }))}
                placeholder="Enter the warning message..."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCreateWarningOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateWarning}
                disabled={isCreating || !newWarning.employeeId || !newWarning.warningMessage.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Warning'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}