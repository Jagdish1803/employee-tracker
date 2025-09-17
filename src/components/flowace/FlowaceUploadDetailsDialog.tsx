'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FlowaceUploadHistory } from '@/api/services/flowace.service';

interface FlowaceUploadDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUpload: FlowaceUploadHistory | null;
}

export function FlowaceUploadDetailsDialog({
  open,
  onOpenChange,
  selectedUpload,
}: FlowaceUploadDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Details</DialogTitle>
          <DialogDescription>
            Detailed information about the upload process
          </DialogDescription>
        </DialogHeader>
        {selectedUpload && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">File Name</Label>
                <p className="text-sm">{selectedUpload.filename}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm">{selectedUpload.status}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Records</Label>
                <p className="text-sm">{selectedUpload.totalRecords}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Processed</Label>
                <p className="text-sm">{selectedUpload.processedRecords}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Errors</Label>
                <p className="text-sm">{selectedUpload.errorRecords}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Upload Time</Label>
                <p className="text-sm">
                  {new Date(selectedUpload.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedUpload.errors && Array.isArray(selectedUpload.errors) && selectedUpload.errors.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Errors</Label>
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {selectedUpload.errors.map((error: { row: number; error: string }, index: number) => (
                    <div key={index} className="text-sm text-red-800 mb-2">
                      <strong>Row {error.row}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedUpload.summary && (
              <div>
                <Label className="text-sm font-medium">Summary</Label>
                <pre className="mt-2 bg-gray-50 border rounded-lg p-4 text-xs overflow-x-auto">
                  {JSON.stringify(selectedUpload.summary, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}