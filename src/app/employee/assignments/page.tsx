'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClipboardList,
  Clock,
  Search,
  Tag as TagIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { assignmentService } from '@/api';
import type { AssignmentWithRelations } from '@/api/services/assignment.service';
import { toast } from 'sonner';



export default function MyAssignments() {
  const [assignments, setAssignments] = useState<AssignmentWithRelations[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mandatory' | 'optional'>('all');

  // Mock employee ID (in real app, this would come from auth context)
  const employeeId = 1;

  const filterAssignments = useCallback(() => {
    let filtered = assignments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.tag?.tagName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType === 'mandatory') {
      filtered = filtered.filter(assignment => assignment.isMandatory);
    } else if (filterType === 'optional') {
      filtered = filtered.filter(assignment => !assignment.isMandatory);
    }

    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, filterType]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm, filterType, filterAssignments]);

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
      } else {
        toast.error('Failed to load assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-muted-foreground">View your assigned work tasks and responsibilities</p>
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
            <p className="text-xs text-muted-foreground">
              Active assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mandatory</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mandatory}</div>
            <p className="text-xs text-muted-foreground">
              Required tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optional</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.optional}</div>
            <p className="text-xs text-muted-foreground">
              Optional tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMinutes(stats.totalTime)}</div>
            <p className="text-xs text-muted-foreground">
              Per completion
            </p>
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading assignments...</p>
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
    </div>
  );
}