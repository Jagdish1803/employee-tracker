'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FlowaceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  uploadDate: string;
  onUploadDateChange: (date: string) => void;
  uploading: boolean;
  onUpload: () => void;
  onCancel: () => void;
}

export function FlowaceUploadDialog({
  open,
  onOpenChange,
  selectedFile,
  onFileChange,
  uploadDate,
  onUploadDateChange,
  uploading,
  onUpload,
  onCancel,
}: FlowaceUploadDialogProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0] || null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Flowace CSV</DialogTitle>
          <DialogDescription>
            Select a Flowace CSV file to upload productivity data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload" className="text-sm font-medium">CSV File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="upload-date" className="text-sm font-medium">
              Upload Date <span className="text-gray-500">(optional)</span>
            </Label>
            <Input
              id="upload-date"
              type="date"
              value={uploadDate}
              onChange={(e) => onUploadDateChange(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              If specified, all records will use this date instead of the date in the CSV file.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={onUpload}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}