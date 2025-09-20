'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Edit, Users, Search, Key, UserCheck, Mail, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useEmployees, useUpdateEmployee, useDeleteEmployee } from '@/hooks/useEmployees';
import { Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Removed pagination imports - using custom buttons instead
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function AdminPanelPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'ADMIN'
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const { data: employees = [], isLoading, refetch } = useEmployees();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  // Filter employees based on search term and role
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (searchTerm.trim()) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(employee => employee.role === roleFilter);
    }

    return filtered;
  }, [employees, searchTerm, roleFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      await updateEmployee.mutateAsync({
        id: selectedEmployee.id,
        data: editForm
      });

      toast.success('Employee updated successfully!');
      setEditDialogOpen(false);
      setSelectedEmployee(null);
      refetch();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedEmployee) return;

    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);

      if (selectedEmployee.supabaseUserId) {
        const { error } = await supabase.auth.admin.updateUserById(
          selectedEmployee.supabaseUserId,
          { password: newPassword }
        );

        if (error) {
          toast.error(`Password reset failed: ${error.message}`);
          return;
        }
      } else {
        toast.error('Employee does not have an authentication account');
        return;
      }

      toast.success('Password reset successfully!');
      setPasswordDialogOpen(false);
      setSelectedEmployee(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      setLoading(true);

      await deleteEmployee.mutateAsync(employeeToDelete.id);

      toast.success(`Employee ${employeeToDelete.name} deleted successfully!`);
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      refetch();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'ADMIN': { variant: 'secondary' as const, label: 'Admin' },
      'EMPLOYEE': { variant: 'outline' as const, label: 'Employee' }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.EMPLOYEE;
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const roleStats = {
    total: employees.length,
    admin: employees.filter(emp => emp.role === 'ADMIN').length,
    user: employees.filter(emp => emp.role === 'EMPLOYEE' || !emp.role).length
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">
            Manage employee roles, permissions, and authentication
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Administrative Controls</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Total Employees</p>
                <p className="text-2xl font-bold">{roleStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Admins</p>
                <p className="text-2xl font-bold">{roleStats.admin}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Regular Users</p>
                <p className="text-2xl font-bold">{roleStats.user}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="EMPLOYEE">Employees</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employee Management ({filteredEmployees.length})
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredEmployees.length)}-{Math.min(currentPage * pageSize, filteredEmployees.length)} of {filteredEmployees.length}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Employee</TableHead>
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead className="w-[250px]">Email</TableHead>
                <TableHead className="w-[100px]">Role</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.employeeCode}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{employee.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(employee.role || 'EMPLOYEE')}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setEditForm({
                            name: employee.name,
                            email: employee.email || '',
                            role: employee.role || 'EMPLOYEE'
                          });
                          setEditDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                        title="Edit Employee"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {employee.supabaseUserId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setPasswordDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmployeeToDelete(employee);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Delete Employee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center justify-center">
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    disabled={currentPage <= 1}
                    className={`inline-flex h-9 px-3 py-2 items-center justify-center rounded-md border border-gray-300 bg-background text-sm font-medium hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 ${
                      currentPage <= 1 ? 'text-gray-400' : 'text-gray-700'
                    }`}
                    aria-label="Go to previous page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-500 border-gray-300 bg-background hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    disabled={currentPage >= totalPages}
                    className={`inline-flex h-9 px-3 py-2 items-center justify-center rounded-md border border-gray-300 bg-background text-sm font-medium hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 ${
                      currentPage >= totalPages ? 'text-gray-400' : 'text-gray-700'
                    }`}
                    aria-label="Go to next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information and role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: 'EMPLOYEE' | 'ADMIN') =>
                  setEditForm(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEmployee} disabled={loading}>
              {loading ? 'Updating...' : 'Update Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedEmployee?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete ${employeeToDelete?.name}? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete Employee"
        cancelText="Cancel"
        onConfirm={handleDeleteEmployee}
        variant="destructive"
      />
    </div>
  );
}