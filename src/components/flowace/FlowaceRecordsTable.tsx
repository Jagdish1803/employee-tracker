'use client';

import React from 'react';
import { Edit2, Save, X, Trash2, Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { FlowaceRecord } from '@/api/services/flowace.service';

interface FlowaceRecordsTableProps {
  records: FlowaceRecord[];
  loading: boolean;
  selectedDate: string;
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  editingRecord: string | null;
  editForm: Partial<FlowaceRecord>;
  saving: boolean;
  onEditRecord: (record: FlowaceRecord) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onFieldChange: (field: string, value: unknown) => void;
  onDeleteRecord: (record: FlowaceRecord) => void;
  onUploadClick: () => void;
  onExportCSV: () => void;
  onPageChange: (page: number) => void;
}

export function FlowaceRecordsTable({
  records,
  loading,
  selectedDate,
  totalRecords,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  editingRecord,
  editForm,
  saving,
  onEditRecord,
  onSaveEdit,
  onCancelEdit,
  onFieldChange,
  onDeleteRecord,
  onUploadClick,
  onExportCSV,
  onPageChange,
}: FlowaceRecordsTableProps) {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-';
    return timeStr.split(':').slice(0, 2).join(':');
  };

  const formatHoursMinutesSeconds = (hours: number, _record?: FlowaceRecord, _field?: string) => {
    if (hours === 0) return '00:00:00';

    const totalMilliseconds = Math.round(hours * 3600 * 1000);
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusInfo = (record: FlowaceRecord) => {
    const totalHours = record.loggedHours || record.activeHours || record.totalHours || 0;
    const productivityScore = record.productivityPercentage || record.productivityScore || 0;

    if (totalHours < 4) {
      return { text: 'Low Hours', color: 'bg-red-100 text-red-800' };
    } else if (totalHours >= 8 && productivityScore > 80) {
      return { text: 'Excellent', color: 'bg-emerald-100 text-emerald-800' };
    } else if (totalHours >= 6 && productivityScore > 60) {
      return { text: 'Good', color: 'bg-green-100 text-green-800' };
    } else if (totalHours >= 4 && productivityScore > 40) {
      return { text: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'Needs Improvement', color: 'bg-orange-100 text-orange-800' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Flowace Records
            {selectedDate && selectedDate !== 'all' && (
              <Badge variant="outline" className="ml-2">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm font-normal text-gray-600">
              Total: {totalRecords} records
            </div>
            {totalRecords > 0 && (
              <Button
                onClick={onExportCSV}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin mx-auto text-gray-400 border-2 border-gray-300 border-t-gray-600 rounded-full" />
            <p className="text-gray-600 mt-2">Loading flowace records...</p>
          </div>
        ) : totalRecords === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-400" />
            <p className="text-gray-600 mt-2 font-medium">No flowace records found</p>
            <p className="text-sm text-gray-500 mb-6">Upload Flowace CSV data to view records</p>
            <Button onClick={onUploadClick} className="bg-primary hover:bg-primary/90">
              <Users className="h-4 w-4 mr-2" />
              Upload Flowace CSV
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-3 font-semibold">Employee</th>
                  <th className="text-left py-3 px-3 font-semibold">Date</th>
                  <th className="text-left py-3 px-3 font-semibold" title="Start time → End time of work tracking">Work Session</th>
                  <th className="text-left py-3 px-3 font-semibold" title="Total time tracked by Flowace (Active + Idle)">Total Logged</th>
                  <th className="text-left py-3 px-3 font-semibold" title="Active work time vs idle/away time">Active/Idle</th>
                  <th className="text-left py-3 px-3 font-semibold" title="Productive work hours and percentage score">Productivity</th>
                  <th className="text-left py-3 px-3 font-semibold" title="Mouse/keyboard activity level percentage">Activity %</th>
                  <th className="text-left py-3 px-3 font-semibold">Status</th>
                  <th className="text-left py-3 px-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const statusInfo = getStatusInfo(record);

                  return (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      {/* Employee Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs font-medium text-blue-600">
                              {(editingRecord === record.id ? editForm.employeeName : record.employeeName)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            {editingRecord === record.id ? (
                              <div className="space-y-1">
                                <Input
                                  value={editForm.employeeName || ''}
                                  onChange={(e) => onFieldChange('employeeName', e.target.value)}
                                  className="h-8 text-sm"
                                  placeholder="Employee name"
                                />
                                <Input
                                  value={editForm.employeeCode || ''}
                                  onChange={(e) => onFieldChange('employeeCode', e.target.value)}
                                  className="h-7 text-xs"
                                  placeholder="Employee code"
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {record.employeeName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {record.employeeCode}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3">
                        <div className="text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </td>

                      {/* Work Hours */}
                      <td className="py-3 px-3">
                        {editingRecord === record.id ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Input
                                type="time"
                                value={editForm.workStartTime || ''}
                                onChange={(e) => onFieldChange('workStartTime', e.target.value)}
                                className="h-8 text-xs flex-1"
                              />
                              <span className="text-xs">-</span>
                              <Input
                                type="time"
                                value={editForm.workEndTime || ''}
                                onChange={(e) => onFieldChange('workEndTime', e.target.value)}
                                className="h-8 text-xs flex-1"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-gray-900">
                              {formatTime(record.workStartTime)} - {formatTime(record.workEndTime)}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              {record.missingHours && record.missingHours > 0 ? (
                                <>
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                                  {formatHoursMinutesSeconds(record.missingHours)} missing
                                </>
                              ) : record.availableHours ? (
                                <>
                                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1"></span>
                                  {formatHoursMinutesSeconds(record.availableHours)} expected
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                  Full time logged
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Logged Hours */}
                      <td className="py-3 px-3">
                        {editingRecord === record.id ? (
                          <div className="space-y-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editForm.loggedHours || ''}
                              onChange={(e) => onFieldChange('loggedHours', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs"
                              placeholder="Logged hours"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editForm.activeHours || ''}
                              onChange={(e) => onFieldChange('activeHours', parseFloat(e.target.value) || 0)}
                              className="h-7 text-xs"
                              placeholder="Active hours"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-blue-600 text-sm" title="Total time tracked by Flowace software">
                              {formatHoursMinutesSeconds(
                                record.loggedHours !== undefined && record.loggedHours !== null
                                  ? record.loggedHours
                                  : (record.activeHours || record.totalHours || 0)
                              )}
                            </div>
                            {record.activeHours !== undefined && record.activeHours !== null && (
                              <div className="text-xs text-gray-500">
                                {formatHoursMinutesSeconds(record.activeHours)} active
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Active/Idle Time */}
                      <td className="py-3 px-3">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Active: {formatHoursMinutesSeconds(record.activeHours || 0)}
                          </div>
                          <div className="flex items-center text-orange-600">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                            Idle: {formatHoursMinutesSeconds(record.idleHours || 0)}
                          </div>
                        </div>
                      </td>

                      {/* Productivity */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {editingRecord === record.id ? (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={editForm.productivityPercentage || ''}
                              onChange={(e) => onFieldChange('productivityPercentage', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs w-20"
                              placeholder="0.00"
                            />
                          ) : (
                            <div className="flex items-center space-x-1">
                              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    (record.productivityPercentage || record.productivityScore || 0) >= 80
                                      ? 'bg-green-600'
                                      : (record.productivityPercentage || record.productivityScore || 0) >= 60
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, (record.productivityPercentage || record.productivityScore || 0))}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">
                                {(record.productivityPercentage || record.productivityScore || 0).toFixed(2)}%
                              </span>
                            </div>
                          )}
                          {(record.productiveHours || record.unproductiveHours) && (
                            <div className="text-xs text-gray-500 flex items-center space-x-2">
                              {record.productiveHours && record.productiveHours > 0 && (
                                <span className="flex items-center">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                  {formatHoursMinutesSeconds(record.productiveHours)}
                                </span>
                              )}
                              {record.unproductiveHours && record.unproductiveHours > 0 && (
                                <span className="flex items-center">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                                  {formatHoursMinutesSeconds(record.unproductiveHours)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Activity % */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-12 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  (record.activityPercentage || record.activityLevel || 0) >= 80
                                    ? 'bg-blue-600'
                                    : (record.activityPercentage || record.activityLevel || 0) >= 50
                                    ? 'bg-blue-400'
                                    : 'bg-gray-400'
                                }`}
                                style={{
                                  width: `${Math.min(100, record.activityPercentage || record.activityLevel || 0)}%`
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium">
                              {(record.activityPercentage || record.activityLevel || 0).toFixed(2)}%
                            </span>
                          </div>
                          {record.classifiedPercentage && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1"></span>
                              {(record.classifiedPercentage).toFixed(2)}% classified
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <Badge className={statusInfo.color} variant="secondary">
                          {statusInfo.text}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          {editingRecord === record.id ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={onSaveEdit}
                                disabled={saving}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Save changes"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={onCancelEdit}
                                disabled={saving}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                title="Cancel edit"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditRecord(record)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Edit record"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDeleteRecord(record)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords} records
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}