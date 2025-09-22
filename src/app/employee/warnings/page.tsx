'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import { warningService } from '@/api';

interface Warning {
  id: number;
  employeeId: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  resolved_by?: number;
}

export default function MyWarnings() {
  const { employee } = useEmployeeAuth();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  const employeeId = employee?.id || 1;

  const fetchWarnings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await warningService.getByEmployee(employeeId);
      setWarnings(response || []);
    } catch (error) {
      console.error('Error fetching warnings:', error);
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchWarnings();
  }, [fetchWarnings]);


  const getWarningTypeColor = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('attendance')) {
      return 'bg-red-100 text-red-800';
    } else if (normalizedType.includes('break')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (normalizedType.includes('quality') || normalizedType.includes('work')) {
      return 'bg-orange-100 text-orange-800';
    } else if (normalizedType.includes('behavior')) {
      return 'bg-purple-100 text-purple-800';
    } else if (normalizedType.includes('system')) {
      return 'bg-gray-100 text-gray-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  const formatWarningType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const getSeverityColor = (severity: Warning['severity']) => {
    switch (severity) {
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeWarnings = warnings.filter(w => w.status === 'active');
  const resolvedWarnings = warnings.filter(w => w.status === 'resolved' || w.status === 'dismissed');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Warnings</h1>
          <p className="text-muted-foreground">View your warnings and disciplinary notices</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warnings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWarnings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedWarnings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Active Warnings ({activeWarnings.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeWarnings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No active warnings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeWarnings.map((warning) => (
                <div key={warning.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getWarningTypeColor(warning.type)}>
                        {formatWarningType(warning.type)}
                      </Badge>
                      <Badge className={getSeverityColor(warning.severity)}>
                        {warning.severity.charAt(0).toUpperCase() + warning.severity.slice(1)}
                      </Badge>
                      <Badge variant="destructive">Active</Badge>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(warning.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-red-800 font-medium">{warning.message}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Issued on {new Date(warning.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning History */}
      <Card>
        <CardHeader>
          <CardTitle>Warning History ({resolvedWarnings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading warnings...</p>
            </div>
          ) : resolvedWarnings.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No warning history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {resolvedWarnings.map((warning) => (
                <div key={warning.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getWarningTypeColor(warning.type)}>
                        {formatWarningType(warning.type)}
                      </Badge>
                      <Badge className={getSeverityColor(warning.severity)}>
                        {warning.severity.charAt(0).toUpperCase() + warning.severity.slice(1)}
                      </Badge>
                      <Badge variant="outline">
                        {warning.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                      </Badge>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(warning.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-medium mb-2">{warning.message}</p>
                  <div className="text-xs text-muted-foreground">
                    <p>Issued: {new Date(warning.created_at).toLocaleString()}</p>
                    {warning.resolved_at && (
                      <p>Resolved: {new Date(warning.resolved_at).toLocaleString()}</p>
                    )}
                    {warning.updated_at && !warning.resolved_at && (
                      <p>Updated: {new Date(warning.updated_at).toLocaleString()}</p>
                    )}
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