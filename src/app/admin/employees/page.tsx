// src/app/admin/employees/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/useEmployees';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

// Loading component
function EmployeesLoading() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error component
function EmployeesError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="p-8">
      <Card>
        <CardContent className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-red-900">Error Loading Employees</h3>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
          <Button onClick={onRetry} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component
function EmployeesContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeCode: '',
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const { data: employees = [], isLoading, error, refetch } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  if (isLoading) return <EmployeesLoading />;
  if (error) return <EmployeesError error={error as Error} onRetry={refetch} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingEmployee) {
        await updateEmployee.mutateAsync({ id: editingEmployee.id, data: formData });
      } else {
        await createEmployee.mutateAsync(formData);
      }
      closeDialog();
    } catch {
      // Error is handled by the mutation hooks
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      employeeCode: employee.employeeCode,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      await deleteEmployee.mutateAsync(employeeToDelete.id);
    } catch {
      // Error is handled by the mutation hook
    } finally {
      setEmployeeToDelete(null);
    }
  };

  const openCreateDialog = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      employeeCode: '',
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      employeeCode: '',
    });
  };

  const isSubmitting = createEmployee.isPending || updateEmployee.isPending;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Users className="h-7 w-7 mr-2 text-primary" />
            Manage Employees
          </h1>
          <p className="text-muted-foreground mt-1">Add and manage employee accounts</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Employee</span>
        </Button>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No employees</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first employee account.
            </p>
            <Button onClick={openCreateDialog} className="mt-4">
              Add Employee
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {employees.map((employee) => (
                <div key={employee.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">
                          {employee.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employee.email} • Code: {employee.employeeCode}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleEdit(employee)}
                      variant="outline"
                      size="sm"
                      disabled={deleteEmployee.isPending}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(employee)}
                      variant="destructive"
                      size="sm"
                      disabled={deleteEmployee.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee 
                ? 'Update the employee information below.'
                : 'Fill in the details to create a new employee account.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employeeCode">Employee Code</Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingEmployee ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete ${employeeToDelete?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}

// Main page component with Suspense
export default function EmployeesPage() {
  return (
    <Suspense fallback={<EmployeesLoading />}>
      <EmployeesContent />
    </Suspense>
  );
}