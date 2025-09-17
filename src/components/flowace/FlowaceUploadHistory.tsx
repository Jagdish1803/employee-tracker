'use client';

import React from 'react';
import { FileText, RefreshCw, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FlowaceUploadHistory } from '@/api/services/flowace.service';

interface FlowaceUploadHistoryProps {
  uploadHistory: FlowaceUploadHistory[];
  deleting: string | null;
  onRefresh: () => void;
  onShowDetails: (upload: FlowaceUploadHistory) => void;
  onDelete: (batchId: string) => void;
}

export function FlowaceUploadHistory({
  uploadHistory,
  deleting,
  onRefresh,
  onShowDetails,
  onDelete,
}: FlowaceUploadHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Upload History
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uploadHistory.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400" />
            <p className="text-gray-600 mt-2">No upload history found</p>
            <p className="text-sm text-gray-500">Upload Flowace CSV files to see history here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">File Name</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Records</th>
                  <th className="text-left py-2 px-4">Uploaded</th>
                  <th className="text-left py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map((upload) => (
                  <tr key={upload.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <div className="font-medium">{upload.filename}</div>
                      <div className="text-sm text-gray-500">Batch: {upload.batchId}</div>
                    </td>
                    <td className="py-2 px-4">
                      <Badge className={
                        upload.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        upload.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        upload.status === 'PARTIALLY_COMPLETED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {upload.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-2 px-4">
                      <div>{upload.processedRecords} / {upload.totalRecords}</div>
                      {upload.errorRecords > 0 &&
                        <div className="text-sm text-red-600">{upload.errorRecords} errors</div>}
                    </td>
                    <td className="py-2 px-4">
                      {new Date(upload.uploadedAt).toLocaleDateString()} {new Date(upload.uploadedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => onShowDetails(upload)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(upload.batchId)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deleting === upload.batchId}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}