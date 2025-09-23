'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { issueService } from '@/api';

interface Issue {
  id: number;
  employeeId: number;
  issueCategory: string;
  issueDescription: string;
  issueStatus: 'pending' | 'in_progress' | 'resolved';
  raisedDate: string;
  resolvedDate?: string;
  adminResponse?: string;
  daysElapsed: number;
}

interface APIIssue {
  id: number;
  employeeId: number;
  issueCategory: string;
  issueDescription: string;
  issueStatus: 'pending' | 'in_progress' | 'resolved';
  raisedDate: string | Date;
  resolvedDate?: string | Date;
  adminResponse?: string;
  daysElapsed: number;
}

const issueCategories = [
  'Equipment',
  'Cleanliness',
  'Documents',
  'Stationery',
  'IT Support',
  'HR Related',
  'Other'
];

export default function RaiseQuery() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new issue
  const [newIssue, setNewIssue] = useState({
    issueCategory: '',
    issueDescription: ''
  });

  const employeeId = 1; // Use default employee ID for now

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const response = await issueService.getByEmployee(employeeId);

      if (response.data && response.data.success) {
        const issuesData = (response.data.data || []).map((issue: APIIssue) => ({
          ...issue,
          raisedDate: typeof issue.raisedDate === 'string' ? issue.raisedDate : new Date(issue.raisedDate).toISOString(),
          resolvedDate: issue.resolvedDate ? (typeof issue.resolvedDate === 'string' ? issue.resolvedDate : new Date(issue.resolvedDate).toISOString()) : undefined
        }));
        setIssues(issuesData);
      } else {
        setIssues([]);
      }
    } catch (error) {
      // Don't show error toast for empty results
      console.error('Failed to fetch issues:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  const filterIssues = useCallback(() => {
    let filtered = issues;

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.issueDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.issueCategory.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.issueStatus === statusFilter);
    }

    setFilteredIssues(filtered);
  }, [issues, searchTerm, statusFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    filterIssues();
  }, [issues, searchTerm, statusFilter, filterIssues]);

  const handleCreateIssue = async () => {
    if (!newIssue.issueCategory || !newIssue.issueDescription.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await issueService.create({
        employeeId,
        issueCategory: newIssue.issueCategory,
        issueDescription: newIssue.issueDescription
      });

      if (response.data && response.data.success) {
        toast.success('Query submitted successfully');
        setNewIssue({ issueCategory: '', issueDescription: '' });
        setIsCreateDialogOpen(false);
        await fetchIssues(); // Refresh the list
      } else {
        toast.error('Failed to create issue');
      }
    } catch (error) {
      console.error('Failed to create issue:', error);
      toast.error('Failed to create issue');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: Issue['issueStatus']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'resolved':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: Issue['issueStatus']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatStatus = (status: Issue['issueStatus']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  const getIssueStats = () => {
    const total = issues.length;
    const pending = issues.filter(i => i.issueStatus === 'pending').length;
    const inProgress = issues.filter(i => i.issueStatus === 'in_progress').length;
    const resolved = issues.filter(i => i.issueStatus === 'resolved').length;

    return { total, pending, inProgress, resolved };
  };

  const stats = getIssueStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raise Query</h1>
          <p className="text-muted-foreground">Submit and track your queries</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Raise Query
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raise New Query</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newIssue.issueCategory} onValueChange={(value) => setNewIssue(prev => ({ ...prev, issueCategory: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your issue in detail..."
                  value={newIssue.issueDescription}
                  onChange={(e) => setNewIssue(prev => ({ ...prev, issueDescription: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateIssue} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Query'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('in_progress')}
              >
                In Progress
              </Button>
              <Button
                variant={statusFilter === 'resolved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('resolved')}
              >
                Resolved
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Queries ({filteredIssues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading issues...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {issues.length === 0 ? 'No issues found' : 'No issues match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(issue.issueStatus)}
                        <Badge variant="outline">{issue.issueCategory}</Badge>
                        <Badge variant={getStatusBadgeVariant(issue.issueStatus)}>
                          {formatStatus(issue.issueStatus)}
                        </Badge>
                      </div>
                      <p className="font-medium mb-2">{issue.issueDescription}</p>
                      <p className="text-sm text-muted-foreground">
                        Raised on {new Date(issue.raisedDate).toLocaleDateString()} • {issue.daysElapsed} days ago
                        {issue.resolvedDate && (
                          <> • Resolved on {new Date(issue.resolvedDate).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                  </div>

                  {issue.adminResponse && (
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Admin Response:</span>
                      </div>
                      <p className="text-sm">{issue.adminResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}