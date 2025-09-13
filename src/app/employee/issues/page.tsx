// src/app/employee/issues/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FileText, Send, LogOut, Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { issueService, employeeService } from '@/api';
import { Issue, Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ISSUE_CATEGORIES = [
  'Equipment',
  'Cleanliness',
  'Documents',
  'Stationery',
  'IT Support',
  'Other'
];

export default function IssuesPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeCode, setEmployeeCode] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    issueCategory: '',
    issueDescription: '',
  });
  const router = useRouter();

  useEffect(() => {
    // Check if employee is already logged in
    const savedEmployee = localStorage.getItem('employee');
    if (savedEmployee) {
      try {
        const emp = JSON.parse(savedEmployee);
        setEmployee(emp);
        setIsLoggedIn(true);
        loadIssues(emp.id);
      } catch (error) {
        localStorage.removeItem('employee');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim()) {
      toast.error('Please enter your employee code');
      return;
    }

    setLoggingIn(true);
    try {
      const response = await employeeService.login(employeeCode.trim());
      if (response.data.success && response.data.data) {
        const emp = response.data.data;
        setEmployee(emp);
        setIsLoggedIn(true);
        localStorage.setItem('employee', JSON.stringify(emp));
        toast.success('Login successful!');
        loadIssues(emp.id);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setEmployee(null);
    setIsLoggedIn(false);
    setEmployeeCode('');
    setIssues([]);
    setFormData({ issueCategory: '', issueDescription: '' });
    localStorage.removeItem('employee');
    toast.success('Logged out successfully');
  };

  const loadIssues = async (employeeId: number) => {
    try {
      setLoading(true);
      const response = await issueService.getByEmployee(employeeId);
      if (response.data.success) {
        setIssues(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.issueCategory || !formData.issueDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!employee) return;

    setSubmitting(true);
    try {
      const response = await issueService.create({
        employeeId: employee.id,
        issueCategory: formData.issueCategory,
        issueDescription: formData.issueDescription.trim(),
      });

      if (response.data.success) {
        setFormData({ issueCategory: '', issueDescription: '' });
        toast.success('Issue submitted successfully');
        loadIssues(employee.id); // Reload issues
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to submit issue';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'resolved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'in_progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-red-100 text-red-800`;
    }
  };

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Employee Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="employeeCode">Employee Code</Label>
                <Input
                  id="employeeCode"
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="Enter your employee code"
                  required
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={loggingIn || !employeeCode.trim()}
                className="w-full"
              >
                {loggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Issue Reporter</h1>
              <p className="text-sm text-gray-600">
                Welcome, {employee?.name} ({employee?.employeeCode})
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/employee')} variant="outline">
                Dashboard
              </Button>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Report Issue Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Report an Issue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitIssue} className="space-y-4">
                <div>
                  <Label htmlFor="issueCategory">Category</Label>
                  <Select
                    value={formData.issueCategory || undefined}
                    onValueChange={(value) => setFormData({ ...formData, issueCategory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="issueDescription">Description</Label>
                  <Textarea
                    id="issueDescription"
                    value={formData.issueDescription}
                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                    placeholder="Please describe the issue in detail..."
                    rows={4}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !formData.issueCategory || !formData.issueDescription.trim()}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Issue'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Issue Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Your Issue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{issues.length}</div>
                  <p className="text-sm text-gray-600">Total Issues</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {issues.filter(issue => issue.issueStatus === 'pending').length}
                  </div>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {issues.filter(issue => issue.issueStatus === 'resolved').length}
                  </div>
                  <p className="text-sm text-gray-600">Resolved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issues List */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {issues.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No issues reported</h3>
                <p className="mt-2 text-sm text-gray-600">
                  When you report issues, they will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(issue.issueStatus)}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {issue.issueCategory}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Reported {new Date(issue.raisedDate).toLocaleDateString()} • {issue.daysElapsed} days ago
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{issue.issueDescription}</p>
                        
                        {issue.adminResponse && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">Admin Response</span>
                            </div>
                            <p className="text-sm text-blue-800">{issue.adminResponse}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4">
                        <span className={getStatusBadge(issue.issueStatus)}>
                          {issue.issueStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}