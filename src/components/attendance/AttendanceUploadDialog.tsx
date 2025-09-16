'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { useUploadAttendanceFile } from '@/hooks/useAttendanceQuery';

interface AttendanceUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export function AttendanceUploadDialog({
  isOpen,
  onClose,
  defaultDate
}: AttendanceUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2025-09-12');
  const [localProgress, setLocalProgress] = useState(0);

  // Use optimized React Query upload mutation
  const uploadMutation = useUploadAttendanceFile();

  useEffect(() => {
    if (defaultDate) {
      setSelectedDate(defaultDate);
    } else {
      setSelectedDate('2025-09-12'); // Default to September 12, 2025
    }
  }, [defaultDate, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setLocalProgress(0);
      // Safe reset call
      try {
        uploadMutation.reset?.();
      } catch (error) {
        console.warn('Reset function not available:', error);
      }
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Safe reset call
      try {
        uploadMutation.reset?.();
      } catch (error) {
        console.warn('Reset function not available:', error);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDate) return;

    try {
      uploadMutation.mutate({
        file: selectedFile,
        uploadDate: selectedDate,
        onProgress: (progress: number) => {
          setLocalProgress(progress);
        }
      }, {
        onSuccess: (data) => {
          console.log('Upload completed:', data);
          setTimeout(() => {
            setSelectedFile(null);
            setLocalProgress(0);
            onClose();
          }, 2000);
        },
        onError: (error) => {
          console.error('Upload failed:', error);
          setLocalProgress(0);
        }
      });
    } catch (error) {
      console.error('Upload mutation failed:', error);
    }
  };

  const isValidFile: boolean = Boolean(selectedFile && selectedFile.name.endsWith('.srp'));

  // Get current upload state with safe property access
  const isUploading: boolean = Boolean(uploadMutation.isPending || (uploadMutation as Record<string, unknown>).isLoading);
  const uploadSuccess: boolean = Boolean(uploadMutation.isSuccess);
  const uploadError: boolean = Boolean(uploadMutation.isError);
  const currentProgress = Math.max(localProgress, 0);

  // Helper to cast uploadMutation.data for rendering
  const uploadResult: { processedRecords?: number; errorRecords?: number } | null =
    uploadSuccess && uploadMutation.data
      ? (uploadMutation.data as { processedRecords?: number; errorRecords?: number })
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {uploadSuccess ? (
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            ) : uploadError ? (
              <XCircle className="w-5 h-5 mr-2 text-red-600" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            {uploadSuccess
              ? 'Upload Successful!'
              : uploadError
              ? 'Upload Failed'
              : 'Upload Attendance File'}
          </DialogTitle>
          {uploadSuccess && (
            <DialogDescription className="text-green-700">
              File processed successfully! The data has been imported.
            </DialogDescription>
          )}
          {uploadError && (
            <DialogDescription className="text-red-700">
              {uploadMutation.error?.message || 'An error occurred during upload. Please try again.'}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="upload-date" className="text-sm font-medium">
              Attendance Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="upload-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
              required
            />
            <p className="text-xs text-gray-500">
              This date will be used for all attendance records in the file
            </p>
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="upload-file" className="text-sm font-medium">
              Attendance File (.srp)
            </Label>
            <Input
              id="upload-file"
              type="file"
              accept=".srp"
              onChange={handleFileChange}
              className="w-full"
            />
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={selectedFile.name}>
                    {selectedFile.name.length > 30 
                      ? `${selectedFile.name.substring(0, 27)}...` 
                      : selectedFile.name}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                    {isValidFile ? (
                      <div className="text-green-600 text-sm">✓ Valid</div>
                    ) : (
                      <div className="text-red-600 text-sm">✗ Invalid</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Upload Progress */}
          {(isUploading || uploadSuccess) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center">
                  {isUploading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Uploading and processing...
                    </>
                  ) : uploadSuccess ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
                      Processing complete
                    </>
                  ) : null}
                </span>
                <span className={uploadSuccess ? 'text-green-600' : ''}>{currentProgress}%</span>
              </div>
              <Progress
                value={currentProgress}
                className={`w-full ${uploadSuccess ? 'bg-green-100' : ''}`}
              />
              {isUploading && (
                <p className="text-xs text-gray-500">
                  Please wait while we process your file. This may take a few moments for large files.
                </p>
              )}
              {uploadResult !== null && (
                <div className="text-xs text-green-700 space-y-1">
                  <p>✅ Processed {typeof uploadResult.processedRecords === 'number' ? uploadResult.processedRecords : 0} records</p>
                  {typeof uploadResult.errorRecords === 'number' && uploadResult.errorRecords > 0 && (
                    <p>⚠️ {uploadResult.errorRecords} records had errors</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              {uploadSuccess ? 'Close' : 'Cancel'}
            </Button>

            {!uploadSuccess && (
              <Button
                onClick={handleUpload}
                disabled={!isValidFile || !selectedDate || isUploading}
                className="flex items-center"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            )}

            {uploadError && (
              <Button
                onClick={handleUpload}
                disabled={!isValidFile || !selectedDate || isUploading}
                className="flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Retry Upload
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
