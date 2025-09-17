'use client';
import React, { useState } from 'react';
import { AlertTriangle, Calendar, Clock, Eye } from 'lucide-react';
import { Warning, WarningType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEmployeeWarnings } from '@/hooks/useWarnings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function EmployeeWarningsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dismissed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | WarningType>('all');

  // Get employee ID from session/context - for now using mock
  const employeeId = 1; // This should come from auth context
  
  const { data: warningsResponse, isLoading } = useEmployeeWarnings(employeeId);
  const warnings = warningsResponse?.data?.data || [];

  // Filter warnings
  const filteredWarnings = warnings.filter((warning: Warning) => {
    if (statusFilter !== 'all' && ((statusFilter === 'active' && !warning.isActive) || (statusFilter === 'dismissed' && warning.isActive))) {
      return false;
    }
    if (typeFilter !== 'all' && warning.warningType !== typeFilter) {
      return false;
    }
    return true;
  });

  const getWarningTypeColor = (type: WarningType) => {
    switch (type) {
      case 'ATTENDANCE': return 'bg-red-100 text-red-800';
      case 'LEAVE_MISUSE': return 'bg-orange-100 text-orange-800';
      case 'BREAK_EXCEEDED': return 'bg-yellow-100 text-yellow-800';
      case 'WORK_QUALITY': return 'bg-blue-100 text-blue-800';
      case 'BEHAVIORAL': return 'bg-purple-100 text-purple-800';
      case 'SYSTEM_MISUSE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  // Calculate stats
  const stats = {
    total: filteredWarnings.length,
    active: filteredWarnings.filter((w: Warning) => w.isActive).length,
    dismissed: filteredWarnings.filter((w: Warning) => !w.isActive).length,
    recent: filteredWarnings.filter((w: Warning) => {
      const daysOld = Math.floor(
        (new Date().getTime() - new Date(w.warningDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysOld <= 7;
    }).length,
  };

  if (isLoading) {
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
            <AlertTriangle className="h-7 w-7 mr-2 text-red-600" />
            My Warnings
          </h1>
          <p className="text-muted-foreground mt-1">View and track your warnings</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
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
            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={(value: 'all' | WarningType) => setTypeFilter(value)}>
                <SelectTrigger className="w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                  <SelectItem value="LEAVE_MISUSE">Leave Misuse</SelectItem>
                  <SelectItem value="BREAK_EXCEEDED">Break Exceeded</SelectItem>
                  <SelectItem value="WORK_QUALITY">Work Quality</SelectItem>
                  <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                  <SelectItem value="SYSTEM_MISUSE">System Misuse</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Calendar className="h-8 w-8 text-green-500" />
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
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Recent (7 days)</p>
                <p className="text-2xl font-bold">{stats.recent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings List */}
      {filteredWarnings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No warnings found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {statusFilter === 'all' && typeFilter === 'all' 
                ? "You don't have any warnings at the moment."
                : "No warnings found matching the selected filters."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWarnings.map((warning: Warning) => {
            const priority = getWarningPriority(warning);
            const daysOld = Math.floor(
              (new Date().getTime() - new Date(warning.warningDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            return (
              <Card key={warning.id} className={`${priority.bg} ${warning.isActive ? '' : 'opacity-60'}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`h-5 w-5 ${priority.color}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-lg">
                            {new Date(warning.warningDate).toLocaleDateString()}
                          </h3>
                          <Badge className={getWarningTypeColor(warning.warningType)}>
                            {warning.warningType}
                          </Badge>
                          {!warning.isActive && (
                            <Badge variant="secondary">Dismissed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {daysOld === 0 ? 'Today' : daysOld === 1 ? 'Yesterday' : `${daysOld} days ago`}
                        </p>
                      </div>
                    </div>
                    {warning.isActive && (
                      <Badge variant="destructive">Active</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    {warning.warningMessage}
                  </p>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Created: {new Date(warning.createdAt).toLocaleString()}
                    {warning.updatedAt !== warning.createdAt && (
                      <span className="ml-2">
                        • Updated: {new Date(warning.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}