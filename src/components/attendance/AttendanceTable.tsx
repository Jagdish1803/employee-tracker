'use client';

import React from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { AttendanceRecord } from '@/types';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (record: AttendanceRecord) => void;
  onDelete: (id: string | number) => void;
  editingRecord?: number | null;
  editForm?: Partial<AttendanceRecord>;
  onSave?: () => void;
  onCancel?: () => void;
  onFieldChange?: (field: string, value: any) => void;
  saving?: boolean;
  deleting?: string | number | null;
}

const getStatusBadge = (status: string) => {
  const configs: Record<string, { label: string; className: string }> = {
    'PRESENT': { label: 'Present', className: 'bg-green-100 text-green-800' },
    'ABSENT': { label: 'Absent', className: 'bg-red-100 text-red-800' },
    'LATE': { label: 'Late', className: 'bg-yellow-100 text-yellow-800' },
    'HALF_DAY': { label: 'Half Day', className: 'bg-blue-100 text-blue-800' },
    'LEAVE_APPROVED': { label: 'Leave', className: 'bg-purple-100 text-purple-800' },
    'WFH_APPROVED': { label: 'WFH', className: 'bg-indigo-100 text-indigo-800' }
  };
  const config = configs[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  return <Badge className={config.className}>{config.label}</Badge>;
};

export function AttendanceTable({
  records,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  editingRecord,
  editForm = {},
  onSave,
  onCancel,
  onFieldChange,
  saving = false,
  deleting = null
}: AttendanceTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Shift</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Break In</TableHead>
            <TableHead>Break Out</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className={editingRecord === record.id ? 'bg-blue-50' : ''}>
              <TableCell className="font-medium">
                {record.employee?.name || record.employeeName || 'Unknown'}
              </TableCell>
              <TableCell>
                {record.employee?.employeeCode || record.employeeCode || 'N/A'}
              </TableCell>
              <TableCell>
                {new Date(record.date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {editingRecord === record.id ? (
                  <div className="space-y-1">
                    <Input 
                      value={editForm.shift || ''} 
                      onChange={(e) => onFieldChange?.('shift', e.target.value)} 
                      placeholder="Shift" 
                      className="w-20 h-8 text-xs" 
                    />
                    <Input 
                      value={editForm.shiftStart || ''} 
                      onChange={(e) => onFieldChange?.('shiftStart', e.target.value)}
                      placeholder="Start" 
                      className="w-20 h-8 text-xs" 
                    />
                  </div>
                ) : (
                  <div>
                    {record.shift ? (
                      <>
                        <div className="text-sm font-medium">{record.shift}</div>
                        {record.shiftStart && <div className="text-xs text-gray-500">Start: {record.shiftStart}</div>}
                      </>
                    ) : '-'}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {editingRecord === record.id ? (
                  <Select
                    value={editForm.status || record.status}
                    onValueChange={(value) => onFieldChange?.('status', value)}
                  >
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="LATE">Late</SelectItem>
                      <SelectItem value="HALF_DAY">Half Day</SelectItem>
                      <SelectItem value="LEAVE_APPROVED">Leave</SelectItem>
                      <SelectItem value="WFH_APPROVED">WFH</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  getStatusBadge(record.status)
                )}
              </TableCell>
              <TableCell>
                {editingRecord === record.id ? (
                  <Input 
                    type="time" 
                    value={editForm.checkInTime || ''} 
                    onChange={(e) => onFieldChange?.('checkInTime', e.target.value)} 
                    className="w-24 h-8" 
                  />
                ) : (record.checkInTime && record.checkInTime !== 'null' ? record.checkInTime : '-')}
              </TableCell>
              <TableCell>
                {editingRecord === record.id ? (
                  <Input 
                    type="time" 
                    value={editForm.lunchOutTime || ''}
                    onChange={(e) => onFieldChange?.('lunchOutTime', e.target.value)} 
                    className="w-24 h-8" 
                  />
                ) : (record.lunchOutTime && record.lunchOutTime !== 'null' ? record.lunchOutTime : '-')}
              </TableCell>
              <TableCell>
                {editingRecord === record.id ? (
                  <Input 
                    type="time" 
                    value={editForm.lunchInTime || ''}
                    onChange={(e) => onFieldChange?.('lunchInTime', e.target.value)} 
                    className="w-24 h-8" 
                  />
                ) : (record.lunchInTime && record.lunchInTime !== 'null' ? record.lunchInTime : '-')}
              </TableCell>
              <TableCell>
                {editingRecord === record.id ? (
                  <Input 
                    type="time" 
                    value={editForm.checkOutTime || ''}
                    onChange={(e) => onFieldChange?.('checkOutTime', e.target.value)} 
                    className="w-24 h-8" 
                  />
                ) : (record.checkOutTime && record.checkOutTime !== 'null' ? record.checkOutTime : '-')}
              </TableCell>
              <TableCell>
                {editingRecord === record.id ? (
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={editForm.hoursWorked || ''}
                    onChange={(e) => onFieldChange?.('hoursWorked', parseFloat(e.target.value) || 0)} 
                    className="w-16 h-8" 
                  />
                ) : (record.hoursWorked && record.hoursWorked > 0 ? `${record.hoursWorked.toFixed(2)}h` : '0.00h')}
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  {editingRecord === record.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={onSave}
                        disabled={saving}
                        className="h-8 w-8 p-0"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onCancel}
                        disabled={saving}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(record)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(record.id)}
                        disabled={deleting === record.id}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deleting === record.id ? (
                          <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-gray-500">
            Showing {Math.min((currentPage - 1) * 10 + 1, totalCount)} to {Math.min(currentPage * 10, totalCount)} of {totalCount} results
          </div>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={page}
                  size="sm"
                  variant={currentPage === page ? 'default' : 'outline'}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
