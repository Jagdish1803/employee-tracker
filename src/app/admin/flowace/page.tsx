'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { flowaceService } from '@/api';
import type { FlowaceRecord, FlowaceUploadHistory } from '@/api/services/flowace.service';

// Import new components
import { FlowaceRecordsTable } from '@/components/flowace/FlowaceRecordsTable';
import { FlowaceUploadDialog } from '@/components/flowace/FlowaceUploadDialog';
import { FlowaceCalendarDialog } from '@/components/flowace/FlowaceCalendarDialog';
import { FlowaceUploadHistory as FlowaceUploadHistoryComponent } from '@/components/flowace/FlowaceUploadHistory';
import { FlowaceUploadDetailsDialog } from '@/components/flowace/FlowaceUploadDetailsDialog';
import { FlowaceFilters } from '@/components/flowace/FlowaceFilters';
import { FlowaceStats } from '@/components/flowace/FlowaceStats';
import { FlowaceDataExplanation } from '@/components/flowace/FlowaceDataExplanation';
import { useFlowaceData } from '@/hooks/useFlowaceData';
import { exportFlowaceDataToCSV } from '@/utils/flowaceUtils';

export default function AdminFlowacePage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'records' | 'history'>('records');

  // Use custom hook for data management
  const {
    uploadHistory,
    dateFilteredRecords,
    loading,
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    selectedDate,
    setSelectedDate,
    availableDates,
    loadFlowaceRecords,
    loadUploadHistory,
  } = useFlowaceData();

  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showUploadDetails, setShowUploadDetails] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<FlowaceUploadHistory | null>(null);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 50;

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDate, setUploadDate] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<FlowaceRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Edit states
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FlowaceRecord>>({});
  const [saving, setSaving] = useState(false);

  // Pagination calculations
  const totalRecords = dateFilteredRecords.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = dateFilteredRecords.slice(startIndex, endIndex);

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'records') {
      loadFlowaceRecords();
    } else {
      loadUploadHistory();
    }
  }, [activeTab, loadFlowaceRecords, loadUploadHistory]);

  // Reset page when date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  // File upload handler
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const response = await flowaceService.uploadCSV(selectedFile, uploadDate || undefined);

      if (response.success) {
        setSelectedFile(null);
        setUploadDate('');
        setShowUploadDialog(false);
        // Refresh data
        if (activeTab === 'records') {
          loadFlowaceRecords();
        } else {
          loadUploadHistory();
        }
      } else {
        console.error('Upload failed:', response.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  // Delete record handler
  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;

    try {
      const response = await flowaceService.deleteRecord(recordToDelete.id);

      if (response.success) {
        loadFlowaceRecords(); // Refresh the data
      } else {
        console.error('Failed to delete record:', response.error);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
    }
  };

  // Edit record handlers
  const handleEditRecord = (record: FlowaceRecord) => {
    setEditingRecord(record.id);
    setEditForm({
      employeeName: record.employeeName,
      employeeCode: record.employeeCode,
      loggedHours: record.loggedHours,
      activeHours: record.activeHours,
      idleHours: record.idleHours,
      productiveHours: record.productiveHours,
      unproductiveHours: record.unproductiveHours,
      productivityPercentage: record.productivityPercentage,
      activityPercentage: record.activityPercentage,
      workStartTime: record.workStartTime,
      workEndTime: record.workEndTime,
      missingHours: record.missingHours,
      availableHours: record.availableHours,
    });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      setSaving(true);
      // TODO: Implement actual update API call
      handleCancelEdit();
      loadFlowaceRecords(); // Refresh the data
    } catch (error) {
      console.error('Error saving record:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: unknown) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Delete upload history confirmation states
  const [deleteBatchConfirmOpen, setDeleteBatchConfirmOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  // Delete upload history
  const handleDeleteBatch = (batchId: string) => {
    setBatchToDelete(batchId);
    setDeleteBatchConfirmOpen(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;

    try {
      setDeleting(batchToDelete);
      const response = await flowaceService.deleteUploadHistory(batchToDelete);

      if (response.success) {
        await loadUploadHistory();
      } else {
        console.error('Failed to delete upload history:', response.error);
      }
    } catch (error) {
      console.error('Failed to delete upload history:', error);
    } finally {
      setDeleting(null);
      setDeleteBatchConfirmOpen(false);
      setBatchToDelete(null);
    }
  };

  // Show upload details
  const showUploadDetail = (upload: FlowaceUploadHistory) => {
    setSelectedUpload(upload);
    setShowUploadDetails(true);
  };

  // Date navigation
  const navigateToDate = (direction: 'prev' | 'next') => {
    const currentIndex = availableDates.indexOf(selectedDate);
    if (currentIndex === -1) return;

    if (direction === 'prev' && currentIndex > 0) {
      setSelectedDate(availableDates[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[currentIndex + 1]);
    }
  };

  const canNavigatePrev = availableDates.indexOf(selectedDate) > 0;
  const canNavigateNext = availableDates.indexOf(selectedDate) < availableDates.length - 1;

  // Calendar functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentCalendarMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const selectCalendarDate = useCallback((day: number) => {
    const selectedDateObj = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
    const dateStr = selectedDateObj.toISOString().split('T')[0];
    if (availableDates.includes(dateStr)) {
      setSelectedDate(dateStr);
      setCurrentPage(1);
      setShowCalendarDialog(false);
    }
  }, [currentCalendarMonth, availableDates, setSelectedDate]);

  const handleDateChange = useCallback((newDate: string) => {
    setSelectedDate(newDate);
    setCurrentPage(1);
  }, [setSelectedDate]);

  // Upload dialog handlers
  const handleUploadCancel = () => {
    setShowUploadDialog(false);
    setSelectedFile(null);
    setUploadDate('');
  };

  const handleExportCSV = () => {
    exportFlowaceDataToCSV(dateFilteredRecords, selectedDate);
  };

  const handleDeleteRecordClick = (record: FlowaceRecord) => {
    setRecordToDelete(record);
    setDeleteConfirmOpen(true);
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Upload className="h-7 w-7 mr-2" />
            Flowace Management
          </h1>
          <p className="text-muted-foreground">Upload Flowace CSV files and manage employee productivity data</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'records' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('records')}
            className="flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>View Records</span>
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Upload History</span>
          </Button>
        </div>

        {/* Upload File Button */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Flowace CSV</span>
          </Button>
        </div>
      </div>

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <FlowaceFilters
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            availableDates={availableDates}
            dateFilteredRecords={dateFilteredRecords}
            canNavigatePrev={canNavigatePrev}
            canNavigateNext={canNavigateNext}
            onNavigateDate={navigateToDate}
            onCalendarClick={() => setShowCalendarDialog(true)}
            onRefresh={() => loadFlowaceRecords()}
          />

          {/* Summary Statistics */}
          <FlowaceStats records={currentRecords} />

          {/* Data Explanation */}
          <FlowaceDataExplanation />

          {/* Flowace Records Table */}
          <FlowaceRecordsTable
            records={currentRecords}
            loading={loading}
            selectedDate={selectedDate}
            totalRecords={totalRecords}
            currentPage={currentPage}
            totalPages={totalPages}
            editingRecord={editingRecord}
            editForm={editForm}
            saving={saving}
            onEditRecord={handleEditRecord}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onFieldChange={handleFieldChange}
            onDeleteRecord={handleDeleteRecordClick}
            onUploadClick={() => setShowUploadDialog(true)}
            onExportCSV={handleExportCSV}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <FlowaceUploadHistoryComponent
          uploadHistory={uploadHistory}
          deleting={deleting}
          onRefresh={loadUploadHistory}
          onShowDetails={showUploadDetail}
          onDelete={handleDeleteBatch}
        />
      )}

      {/* Upload Dialog */}
      <FlowaceUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        uploadDate={uploadDate}
        onUploadDateChange={setUploadDate}
        uploading={uploading}
        onUpload={handleFileUpload}
        onCancel={handleUploadCancel}
      />

      {/* Upload Details Dialog */}
      <FlowaceUploadDetailsDialog
        open={showUploadDetails}
        onOpenChange={setShowUploadDetails}
        selectedUpload={selectedUpload}
      />

      {/* Calendar Dialog */}
      <FlowaceCalendarDialog
        open={showCalendarDialog}
        onOpenChange={setShowCalendarDialog}
        currentCalendarMonth={currentCalendarMonth}
        availableDates={availableDates}
        selectedDate={selectedDate}
        onMonthNavigate={navigateMonth}
        onDateSelect={selectCalendarDate}
      />

      {/* Delete Record Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Flowace Record"
        description={`Are you sure you want to delete the record for ${recordToDelete?.employeeName} on ${recordToDelete ? new Date(recordToDelete.date).toLocaleDateString() : ''}?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteRecord}
        variant="destructive"
      />

      {/* Delete Upload History Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteBatchConfirmOpen}
        onOpenChange={setDeleteBatchConfirmOpen}
        title="Delete Upload History"
        description="Are you sure you want to delete this upload history entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteBatch}
        variant="destructive"
      />
    </div>
  );
}