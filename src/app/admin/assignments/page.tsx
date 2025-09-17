'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, ClipboardList, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { assignmentService, employeeService, tagService } from '@/api';
import { Employee, Tag as TagType } from '@/types';
import { AssignmentWithRelations } from '@/api/services/assignment.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import AssignmentModal from '@/components/admin/AssignmentModal';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentWithRelations | null>(null);

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Show 6 employee cards per page

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignmentsData, employeesResponse, tagsResponse] = await Promise.all([
        assignmentService.getAll(),
        employeeService.getAll(),
        tagService.getAll()
      ]);

      setAssignments(assignmentsData || []);

      if (employeesResponse.data && employeesResponse.data.success) {
        setEmployees(employeesResponse.data.data || []);
      }
      if (tagsResponse.data && tagsResponse.data.success) {
        setTags(tagsResponse.data.data || []);
      }
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateAssignments = async (data: { employeeId: number; tagIds: number[]; isMandatory: boolean }) => {
    setSubmitting(true);
    try {
      const bulkData = {
        employeeIds: [data.employeeId],
        tagIds: data.tagIds,
        isMandatory: data.isMandatory
      };
      await assignmentService.createBulk(bulkData);
      toast.success(`${data.tagIds.length} assignment${data.tagIds.length > 1 ? 's' : ''} created successfully`);
      await loadData();
      closeDialog();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create assignments';
      toast.error(errorMessage);
      console.error('Error creating assignments:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assignment: AssignmentWithRelations) => {
    setAssignmentToDelete(assignment);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      await assignmentService.delete(assignmentToDelete.id);
      toast.success('Assignment removed successfully');
      await loadData();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to remove assignment';
      toast.error(errorMessage);
    } finally {
      setDeleteConfirmOpen(false);
      setAssignmentToDelete(null);
    }
  };

  const handleToggleMandatory = async (assignment: AssignmentWithRelations) => {
    try {
      const newMandatoryStatus = !assignment.isMandatory;
      await assignmentService.toggleMandatory(assignment.id, newMandatoryStatus);
      toast.success(`Assignment marked as ${newMandatoryStatus ? 'mandatory' : 'optional'}`);

      setAssignments(prev =>
        prev.map(a =>
          a.id === assignment.id ? { ...a, isMandatory: newMandatoryStatus } : a
        )
      );
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to update assignment';
      toast.error(errorMessage);
    }
  };

  const openCreateDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  // Group assignments by employee
  const assignmentsByEmployee = assignments.reduce((acc, assignment) => {
    const employeeId = assignment.employeeId;
    if (!acc[employeeId]) {
      acc[employeeId] = [];
    }
    acc[employeeId].push(assignment);
    return acc;
  }, {} as Record<number, AssignmentWithRelations[]>);

  // Filter employees who have assignments and match search
  const employeesWithAssignments = employees.filter(employee => {
    const hasAssignments = assignmentsByEmployee[employee.id]?.length > 0;
    const matchesSearch = !searchTerm.trim() ||
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

    return hasAssignments && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(employeesWithAssignments.length / pageSize);
  const paginatedEmployees = employeesWithAssignments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <ClipboardList className="h-7 w-7 mr-2" />
            Tag Assignments
          </h1>
          <p className="text-muted-foreground">Assign tags to employees and set mandatory requirements</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Mandatory</p>
                <p className="text-2xl font-bold">{assignments.filter(a => a.isMandatory).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Optional</p>
                <p className="text-2xl font-bold">{assignments.filter(a => !a.isMandatory).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <Label htmlFor="search" className="block mb-2">Search Employees</Label>
        <Input
          id="search"
          type="text"
          placeholder="Search by name or employee code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Assignments List */}
      {employeesWithAssignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {searchTerm ? 'No employees found matching your search' : 'No assignments found'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Start by assigning tags to employees'
              }
            </p>
            {searchTerm ? (
              <Button onClick={() => setSearchTerm('')} variant="outline" className="mt-4">
                Clear Search
              </Button>
            ) : (
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Results summary */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {paginatedEmployees.length} of {employeesWithAssignments.length} employees with assignments
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </div>

          <div className="space-y-6">
            {paginatedEmployees.map((employee) => {
              const employeeAssignments = assignmentsByEmployee[employee.id] || [];

              return (
                <Card key={employee.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-white">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div>{employee.name}</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          {employee.employeeCode} • {employeeAssignments.length} assignments
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {employeeAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <button
                                  onClick={() => handleToggleMandatory(assignment)}
                                  className="transition-all duration-200"
                                >
                                  {assignment.isMandatory ? (
                                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                    </div>
                                  ) : (
                                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                  )}
                                </button>
                              </div>
                              <div>
                                <div className="font-medium">{assignment.tag?.tagName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {assignment.tag?.timeMinutes} min/unit • {assignment.isMandatory ? 'Mandatory' : 'Optional'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handleToggleMandatory(assignment)}
                                variant="outline"
                                size="sm"
                                title={`Mark as ${assignment.isMandatory ? 'optional' : 'mandatory'}`}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(assignment)}
                                variant="outline"
                                size="sm"
                                title="Delete assignment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, employeesWithAssignments.length)}
                    </span>{' '}
                    of <span className="font-medium">{employeesWithAssignments.length}</span> employees
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <Button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === page
                              ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Multi-tag Assignment Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Assignments</DialogTitle>
            <DialogDescription>
              Select an employee and multiple tags to assign. All selected tags will be assigned to the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AssignmentModal
              employees={employees}
              tags={tags}
              onCreate={handleCreateAssignments}
              onClose={closeDialog}
              submitting={submitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remove Assignment"
        description={`Remove assignment of "${assignmentToDelete?.tag?.tagName}" from ${assignmentToDelete?.employee?.name}?`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}