'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, XCircle, Calendar } from 'lucide-react';

interface Warning {
  id: number;
  employeeId: number;
  warningType: 'ATTENDANCE' | 'LEAVE_MISUSE' | 'BREAK_EXCEEDED' | 'WORK_QUALITY' | 'BEHAVIORAL' | 'SYSTEM_MISUSE';
  warningMessage: string;
  warningDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MyWarnings() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarnings();
  }, []);

  const fetchWarnings = async () => {
    try {
      setLoading(true);

      // Mock data
      const mockWarnings: Warning[] = [
        {
          id: 1,
          employeeId: 1,
          warningType: 'BREAK_EXCEEDED',
          warningMessage: 'Break time exceeded recommended duration (45 minutes) on January 15, 2024',
          warningDate: '2024-01-15',
          isActive: true,
          createdAt: '2024-01-15T15:30:00',
          updatedAt: '2024-01-15T15:30:00'
        },
        {
          id: 2,
          employeeId: 1,
          warningType: 'ATTENDANCE',
          warningMessage: 'Late arrival (30 minutes) without prior notification',
          warningDate: '2024-01-10',
          isActive: false,
          createdAt: '2024-01-10T09:30:00',
          updatedAt: '2024-01-12T10:00:00'
        }
      ];

      setWarnings(mockWarnings);
    } catch (error) {
      console.error('Error fetching warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWarningTypeColor = (type: Warning['warningType']) => {
    switch (type) {
      case 'ATTENDANCE':
        return 'bg-red-100 text-red-800';
      case 'BREAK_EXCEEDED':
        return 'bg-yellow-100 text-yellow-800';
      case 'WORK_QUALITY':
        return 'bg-orange-100 text-orange-800';
      case 'BEHAVIORAL':
        return 'bg-purple-100 text-purple-800';
      case 'SYSTEM_MISUSE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const formatWarningType = (type: Warning['warningType']) => {
    switch (type) {
      case 'ATTENDANCE':
        return 'Attendance';
      case 'BREAK_EXCEEDED':
        return 'Break Time';
      case 'WORK_QUALITY':
        return 'Work Quality';
      case 'BEHAVIORAL':
        return 'Behavioral';
      case 'SYSTEM_MISUSE':
        return 'System Misuse';
      case 'LEAVE_MISUSE':
        return 'Leave Misuse';
      default:
        return type;
    }
  };

  const activeWarnings = warnings.filter(w => w.isActive);
  const resolvedWarnings = warnings.filter(w => !w.isActive);

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
                      <Badge className={getWarningTypeColor(warning.warningType)}>
                        {formatWarningType(warning.warningType)}
                      </Badge>
                      <Badge variant="destructive">Active</Badge>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(warning.warningDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-red-800 font-medium">{warning.warningMessage}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Issued on {new Date(warning.createdAt).toLocaleString()}
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
                      <Badge className={getWarningTypeColor(warning.warningType)}>
                        {formatWarningType(warning.warningType)}
                      </Badge>
                      <Badge variant="outline">Resolved</Badge>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(warning.warningDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-medium mb-2">{warning.warningMessage}</p>
                  <div className="text-xs text-muted-foreground">
                    <p>Issued: {new Date(warning.createdAt).toLocaleString()}</p>
                    <p>Resolved: {new Date(warning.updatedAt).toLocaleString()}</p>
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