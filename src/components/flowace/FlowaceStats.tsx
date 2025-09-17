'use client';

import React from 'react';
import { Users, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FlowaceRecord } from '@/api/services/flowace.service';

interface FlowaceStatsProps {
  records: FlowaceRecord[];
}

export function FlowaceStats({ records }: FlowaceStatsProps) {
  const formatHoursMinutesSeconds = (hours: number) => {
    if (hours === 0) return '00:00:00';

    const totalMilliseconds = Math.round(hours * 3600 * 1000);
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const avgHours = records.reduce((sum, r) => sum + (r.loggedHours || r.activeHours || r.totalHours || 0), 0) / records.length;
  const avgProductivity = records.reduce((sum, r) => sum + (r.productivityPercentage || r.productivityScore || 0), 0) / records.length;

  if (records.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
              <p className="text-2xl font-bold">
                {new Set(records.map(r => r.employeeId)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Avg Hours/Day</p>
              <p className="text-2xl font-bold">
                {formatHoursMinutesSeconds(avgHours)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <RefreshCw className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Avg Productivity</p>
              <p className="text-2xl font-bold">
                {avgProductivity.toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold">
                {new Set(records.map(r => r.employeeName)).size}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}