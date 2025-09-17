'use client';

import React from 'react';
import { Edit2, Trash2, Save, X, Users } from 'lucide-react';
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
  editingRecord?: string | number | null;
  editForm?: Partial<AttendanceRecord>;
  onSave?: () => void;
  onCancel?: () => void;
  onFieldChange?: (field: string, value: unknown) => void;
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
          </div>
          <div className="text-sm text-gray-500">
            Total: {totalCount} records
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Employee Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                Code
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]">
                Date
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                Shift
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                Check In
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                Break In
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                Break Out
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                Check Out
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                Hours
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record, index) => (
              <tr key={record.id} className={`hover:bg-gray-50 ${editingRecord === record.id ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.employee?.name || record.employeeName || 'Unknown'}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.employee?.employeeCode || record.employeeCode || 'N/A'}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(record.date).toLocaleDateString('en-US', { 
                    month: 'numeric', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                  {editingRecord === record.id ? (
                    <div className="space-y-1">
                      <Input 
                        value={editForm.shift || ''} 
                        onChange={(e) => onFieldChange?.('shift', e.target.value)} 
                        placeholder="Shift" 
                        className="w-16 h-7 text-xs" 
                      />
                      <Input 
                        value={editForm.shiftStart || ''} 
                        onChange={(e) => onFieldChange?.('shiftStart', e.target.value)}
                        placeholder="Start" 
                        className="w-16 h-7 text-xs" 
                      />
                    </div>
                  ) : (
                    <div>
                      {record.shift ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{record.shift}</div>
                          {record.shiftStart && <div className="text-xs text-gray-500">Start: {record.shiftStart}</div>}
                        </>
                      ) : '-'}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {editingRecord === record.id ? (
                    <Select
                      value={editForm.status || record.status}
                      onValueChange={(value) => onFieldChange?.('status', value)}
                    >
                      <SelectTrigger className="w-24 h-7">
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
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {editingRecord === record.id ? (
                    <Input 
                      type="time" 
                      value={editForm.checkInTime || ''} 
                      onChange={(e) => onFieldChange?.('checkInTime', e.target.value)} 
                      className="w-20 h-7" 
                    />
                  ) : (record.checkInTime && record.checkInTime !== 'null' ? record.checkInTime : '-')}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {editingRecord === record.id ? (
                    <Input 
                      type="time" 
                      value={editForm.lunchOutTime || ''}
                      onChange={(e) => onFieldChange?.('lunchOutTime', e.target.value)} 
                      className="w-20 h-7" 
                    />
                  ) : (record.lunchOutTime && record.lunchOutTime !== 'null' ? record.lunchOutTime : '-')}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {editingRecord === record.id ? (
                    <Input 
                      type="time" 
                      value={editForm.lunchInTime || ''}
                      onChange={(e) => onFieldChange?.('lunchInTime', e.target.value)} 
                      className="w-20 h-7" 
                    />
                  ) : (record.lunchInTime && record.lunchInTime !== 'null' ? record.lunchInTime : '-')}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {editingRecord === record.id ? (
                    <Input 
                      type="time" 
                      value={editForm.checkOutTime || ''}
                      onChange={(e) => onFieldChange?.('checkOutTime', e.target.value)} 
                      className="w-20 h-7" 
                    />
                  ) : (record.checkOutTime && record.checkOutTime !== 'null' ? record.checkOutTime : '-')}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {editingRecord === record.id ? (
                    <Input 
                      type="number" 
                      step="0.1" 
                      value={editForm.hoursWorked || ''}
                      onChange={(e) => onFieldChange?.('hoursWorked', parseFloat(e.target.value) || 0)} 
                      className="w-14 h-7" 
                    />
                  ) : (record.hoursWorked && record.hoursWorked > 0 ? `${record.hoursWorked.toFixed(1)}h` : '0.0h')}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {editingRecord === record.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={onSave}
                          disabled={saving}
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onCancel}
                          disabled={saving}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(record)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(record.id)}
                          disabled={deleting === record.id}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-900 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deleting === record.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-3 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {Math.min((currentPage - 1) * 50 + 1, totalCount)} to {Math.min(currentPage * 50, totalCount)} of {totalCount} results
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-gray-500 border-gray-300 hover:bg-gray-50"
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
                    className={currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-500 border-gray-300 hover:bg-gray-50'}
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
                className="text-gray-500 border-gray-300 hover:bg-gray-50"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
