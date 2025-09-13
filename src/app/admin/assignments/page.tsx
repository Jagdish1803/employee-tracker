// src/app/admin/assignments/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, ClipboardList, Users, Tag, AlertTriangle, CheckCircle } from 'lucide-react';
import { assignmentService, employeeService, tagService } from '@/api';
import { Assignment, Employee, Tag as TagType } from '@/types';
import { Button } from '@/components/ui/button';
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [assignmentsResponse, employeesResponse, tagsResponse] = await Promise.all([
        assignmentService.getAll(),
        employeeService.getAll(),
        tagService.getAll()
      ]);

      if (assignmentsResponse.data.success) {
        setAssignments(assignmentsResponse.data.data || []);
      }
      if (employeesResponse.data.success) {
        setEmployees(employeesResponse.data.data || []);
      }
      if (tagsResponse.data.success) {
        setTags(tagsResponse.data.data || []);
      }
    } catch (error: unknown) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignments = async (data: { employeeId: number; tagIds: number[]; isMandatory: boolean }) => {
    setSubmitting(true);

    try {
      const response = await assignmentService.createBulk(data);

      if (response.data.success) {
        const assignmentCount = data.tagIds.length;
        toast.success(`${assignmentCount} assignment${assignmentCount > 1 ? 's' : ''} created successfully`);
        loadData();
        closeDialog();
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create assignments';
      toast.error(errorMessage);
      console.error('Error creating assignments:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!assignmentToDelete) return;

    try {
      await assignmentService.delete(assignmentToDelete.id);
      toast.success('Assignment removed successfully');
      loadData();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to remove assignment';
      toast.error(errorMessage);
    } finally {
      setAssignmentToDelete(null);
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
  }, {} as Record<number, Assignment[]>);

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
            <ClipboardList className="h-7 w-7 mr-2 text-primary" />
            Tag Assignments
          </h1>
          <p className="text-muted-foreground mt-1">Assign tags to employees and set mandatory requirements</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Assignment</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <Tag className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Tags</p>
                <p className="text-2xl font-bold">{tags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      {Object.keys(assignmentsByEmployee).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No assignments</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start by assigning tags to employees
            </p>
            <Button onClick={openCreateDialog} className="mt-4">
              Create Assignment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {employees.map((employee) => {
            const employeeAssignments = assignmentsByEmployee[employee.id] || [];
            
            if (employeeAssignments.length === 0) return null;

            return (
              <Card key={employee.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-primary">
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
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {assignment.isMandatory ? (
                              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{assignment.tag?.tagName}</div>
                            <div className="text-sm text-muted-foreground">
                              {assignment.tag?.timeMinutes} min/unit • {assignment.isMandatory ? 'Mandatory' : 'Optional'}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDelete(assignment)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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