'use client';

import React, { useState, useEffect } from 'react';
import { Laptop, Plus, Edit, Trash2, Users, Search, ChevronLeft, ChevronRight, UserPlus, RotateCcw, History } from 'lucide-react';
import { Asset, AssetType, AssetAssignment, AssetStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from 'sonner';
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useAssetHistory,
  AssetFilters
} from '@/hooks/use-assets';
import { useEmployees } from '@/hooks/use-employees';
import { AssetAssignmentDialog } from '@/components/asset-assignment-dialog';


export default function AssetsPage() {
  // Filter states
  const [filters, setFilters] = useState<AssetFilters>({
    search: '',
    status: '',
    assetType: '',
    employeeName: '',
    employeeCode: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10
  });

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'assign' | 'return'>('assign');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [assetToAssign, setAssetToAssign] = useState<Asset | null>(null);
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<Asset | null>(null);

  // API Hooks
  const { data: assetsResponse, isLoading: assetsLoading, refetch: refetchAssets } = useAssets(filters);
  const { data: employeesResponse } = useEmployees({ limit: 1000 });
  const { data: historyResponse, isLoading: historyLoading } = useAssetHistory(
    selectedAssetForHistory ? { assetId: selectedAssetForHistory.id.toString() } : {}
  );

  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const deleteAssetMutation = useDeleteAsset();

  const assets = assetsResponse?.data || [];
  const employees = employeesResponse?.data || [];
  const assetHistory = historyResponse?.data || [];
  const pagination = assetsResponse?.pagination;

  const [assetForm, setAssetForm] = useState({
    assetName: '',
    assetType: 'LAPTOP' as AssetType,
    serialNumber: '',
    purchaseDate: '',
    description: '',
    notes: '',
  });


  // Update filters
  const updateFilter = (key: keyof AssetFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? (typeof value === 'string' ? parseInt(value) || 1 : value) : 1
    }));
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilter('search', filters.search || '');
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const handleCreateAsset = async () => {
    try {
      const result = await createAssetMutation.mutateAsync(assetForm);
      toast.success(result.message || 'Asset created successfully!');

      // Force immediate refresh like flowace/attendance with multiple strategies
      refetchAssets();
      setTimeout(() => {
        refetchAssets();
      }, 50);
      setTimeout(() => {
        refetchAssets();
      }, 200);
      setTimeout(() => {
        refetchAssets();
      }, 500);

      closeDialog();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to create asset');
    }
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;

    try {
      const result = await updateAssetMutation.mutateAsync({
        id: editingAsset.id,
        data: assetForm
      });
      toast.success(result.message || 'Asset updated successfully!');

      // Force immediate refresh
      setTimeout(() => {
        refetchAssets();
      }, 100);

      closeDialog();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to update asset');
    }
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;

    try {
      const result = await deleteAssetMutation.mutateAsync(assetToDelete.id);
      toast.success(result.message || 'Asset deleted successfully!');

      // Force immediate refresh
      setTimeout(() => {
        refetchAssets();
      }, 100);

      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to delete asset');
    }
  };


  const openCreateDialog = () => {
    setEditingAsset(null);
    setAssetForm({
      assetName: '',
      assetType: 'LAPTOP',
      serialNumber: '',
      purchaseDate: '',
      description: '',
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetForm({
      assetName: asset.assetName,
      assetType: asset.assetType,
      serialNumber: asset.serialNumber || '',
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
      description: asset.description || '',
      notes: asset.notes || '',
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAsset(null);
  };

  const getStatusBadge = (status: AssetStatus) => {
    const statusConfig = {
      'AVAILABLE': { variant: 'outline' as const, label: 'Available', color: 'text-green-600' },
      'ASSIGNED': { variant: 'secondary' as const, label: 'Assigned', color: 'text-blue-600' },
      'IN_MAINTENANCE': { variant: 'destructive' as const, label: 'Maintenance', color: 'text-orange-600' },
      'RETIRED': { variant: 'outline' as const, label: 'Retired', color: 'text-gray-600' },
      'LOST': { variant: 'destructive' as const, label: 'Lost', color: 'text-red-600' },
      'STOLEN': { variant: 'destructive' as const, label: 'Stolen', color: 'text-red-600' },
    };
    const config = statusConfig[status] || statusConfig.AVAILABLE;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };


  const assetStats = {
    total: pagination?.total || 0,
    available: assets.filter(asset => asset.status === 'AVAILABLE').length,
    assigned: assets.filter(asset => asset.status === 'ASSIGNED').length,
  };

  const loading = assetsLoading || createAssetMutation.isPending || updateAssetMutation.isPending || deleteAssetMutation.isPending;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage company assets and assignments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Laptop className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Asset Control</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-1">
              <Laptop className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Total Assets</p>
                <p className="text-2xl font-bold">{assetStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-1">
              <Plus className="h-4 w-4 text-green-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Available</p>
                <p className="text-2xl font-bold">{assetStats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-blue-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">Assigned</p>
                <p className="text-2xl font-bold">{assetStats.assigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets by name, serial, model, brand..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

              <div>
                <Label htmlFor="type-filter" className="text-sm font-medium">Asset Type</Label>
                <Select value={filters.assetType || 'all'} onValueChange={(value) => updateFilter('assetType', value === 'all' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} align="start">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="LAPTOP">Laptop</SelectItem>
                    <SelectItem value="DESKTOP">Desktop</SelectItem>
                    <SelectItem value="MONITOR">Monitor</SelectItem>
                    <SelectItem value="KEYBOARD">Keyboard</SelectItem>
                    <SelectItem value="MOUSE">Mouse</SelectItem>
                    <SelectItem value="HEADSET">Headset</SelectItem>
                    <SelectItem value="PHONE">Phone</SelectItem>
                    <SelectItem value="TABLET">Tablet</SelectItem>
                    <SelectItem value="PRINTER">Printer</SelectItem>
                    <SelectItem value="FURNITURE">Furniture</SelectItem>
                    <SelectItem value="SOFTWARE_LICENSE">Software License</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee-name-filter" className="text-sm font-medium">Employee Name</Label>
                <Input
                  id="employee-name-filter"
                  placeholder="Filter by name..."
                  value={filters.employeeName || ''}
                  onChange={(e) => updateFilter('employeeName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="employee-code-filter" className="text-sm font-medium">Employee Code</Label>
                <Input
                  id="employee-code-filter"
                  placeholder="Filter by code..."
                  value={filters.employeeCode || ''}
                  onChange={(e) => updateFilter('employeeCode', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="date-from-filter" className="text-sm font-medium">Date From</Label>
                <Input
                  id="date-from-filter"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="date-to-filter" className="text-sm font-medium">Date To</Label>
                <Input
                  id="date-to-filter"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(filters.search || filters.status || filters.assetType || filters.employeeName || filters.employeeCode || filters.dateFrom || filters.dateTo) && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ page: 1, limit: 10 })}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              Asset List ({pagination?.total || assets.length})
            </div>
            <div className="text-sm text-muted-foreground">
              {pagination ? (
                `Showing ${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`
              ) : (
                `Showing ${assets.length} items`
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Asset</TableHead>
                <TableHead className="w-[120px]">Tag</TableHead>
                <TableHead className="w-[150px]">Type</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{asset.assetName}</div>
                        <div className="text-sm text-muted-foreground">{asset.assetType}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {asset.serialNumber && <Badge variant="outline">{asset.serialNumber}</Badge>}
                      {asset.assignments && asset.assignments.length > 0 && asset.assignments[0].employee && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Assigned to: {asset.assignments[0].employee.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{asset.assetType}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(asset.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(asset)}
                        className="h-8 w-8 p-0"
                        title="Edit Asset"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {asset.status === 'AVAILABLE' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssetToAssign(asset);
                            setAssignmentMode('assign');
                            setAssignDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="Assign Asset"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      ) : asset.status === 'ASSIGNED' && asset.assignments && asset.assignments.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssetToAssign(asset);
                            setAssignmentMode('return');
                            setAssignDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="Return Asset"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssetForHistory(asset);
                          setHistoryDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0"
                        title="View History"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAssetToDelete(asset);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Delete Asset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center justify-center">
                <div className="flex space-x-1">
                  <button
                    onClick={() => updateFilter('page', pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className={`inline-flex h-9 px-3 py-2 items-center justify-center rounded-md border border-gray-300 bg-background text-sm font-medium hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 ${
                      !pagination.hasPrev ? 'text-gray-400' : 'text-gray-700'
                    }`}
                    aria-label="Go to previous page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNumber = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + i;
                    } else {
                      pageNumber = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => updateFilter('page', pageNumber)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium ${
                          pagination.page === pageNumber
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-500 border-gray-300 bg-background hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => updateFilter('page', pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className={`inline-flex h-9 px-3 py-2 items-center justify-center rounded-md border border-gray-300 bg-background text-sm font-medium hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50 ${
                      !pagination.hasNext ? 'text-gray-400' : 'text-gray-700'
                    }`}
                    aria-label="Go to next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? 'Edit Asset' : 'Add New Asset'}
            </DialogTitle>
            <DialogDescription>
              {editingAsset
                ? 'Update the asset information below.'
                : 'Fill in the details to add a new asset.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assetName">Asset Name *</Label>
                <Input
                  id="assetName"
                  value={assetForm.assetName}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, assetName: e.target.value }))}
                  placeholder="e.g., MacBook Pro 16"
                  required
                />
              </div>
              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={assetForm.serialNumber}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, serialNumber: e.target.value }))}
                  placeholder="e.g., ABC123456"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={assetForm.purchaseDate}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="assetType">Asset Type *</Label>
                <Select
                  value={assetForm.assetType}
                  onValueChange={(value: AssetType) =>
                    setAssetForm(prev => ({ ...prev, assetType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} align="start">
                    <SelectItem value="LAPTOP">Laptop</SelectItem>
                    <SelectItem value="DESKTOP">Desktop</SelectItem>
                    <SelectItem value="MONITOR">Monitor</SelectItem>
                    <SelectItem value="KEYBOARD">Keyboard</SelectItem>
                    <SelectItem value="MOUSE">Mouse</SelectItem>
                    <SelectItem value="HEADSET">Headset</SelectItem>
                    <SelectItem value="PHONE">Phone</SelectItem>
                    <SelectItem value="TABLET">Tablet</SelectItem>
                    <SelectItem value="PRINTER">Printer</SelectItem>
                    <SelectItem value="FURNITURE">Furniture</SelectItem>
                    <SelectItem value="SOFTWARE_LICENSE">Software License</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>



            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={assetForm.description}
                onChange={(e) => setAssetForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the asset"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={editingAsset ? handleUpdateAsset : handleCreateAsset}
              disabled={loading || !assetForm.assetName.trim()}
            >
              {loading ? 'Saving...' : (editingAsset ? 'Update Asset' : 'Create Asset')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Assignment Dialog */}
      <AssetAssignmentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        asset={assetToAssign}
        employees={employees}
        mode={assignmentMode}
        assignment={assetToAssign?.assignments?.[0]}
        onSuccess={() => {
          // Force immediate refresh after assignment changes with multiple strategies
          refetchAssets();
          setTimeout(() => {
            refetchAssets();
          }, 50);
          setTimeout(() => {
            refetchAssets();
          }, 200);
          setTimeout(() => {
            refetchAssets();
          }, 500);
        }}
      />

      {/* Asset History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Asset History - {selectedAssetForHistory?.assetName}
            </DialogTitle>
            <DialogDescription>
              Assignment history and timeline for this asset
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">Loading history...</div>
              </div>
            ) : assetHistory.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-sm text-muted-foreground">No assignment history found</div>
              </div>
            ) : (
              <div className="space-y-4">
                {assetHistory.map((assignment: AssetAssignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">
                          {assignment.employee?.name} ({assignment.employee?.employeeCode})
                        </span>
                      </div>
                      <Badge variant={assignment.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Assigned:</span>{' '}
                        {new Date(assignment.assignedDate).toLocaleDateString()}
                      </div>
                      {assignment.returnDate && (
                        <div>
                          <span className="font-medium">Returned:</span>{' '}
                          {new Date(assignment.returnDate).toLocaleDateString()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Duration:</span>{' '}
                        {assignment.returnDate
                          ? Math.ceil((new Date(assignment.returnDate).getTime() - new Date(assignment.assignedDate).getTime()) / (1000 * 60 * 60 * 24))
                          : Math.ceil((new Date().getTime() - new Date(assignment.assignedDate).getTime()) / (1000 * 60 * 60 * 24))
                        } days
                      </div>
                      {assignment.returnCondition && (
                        <div>
                          <span className="font-medium">Return Condition:</span>{' '}
                          {assignment.returnCondition}
                        </div>
                      )}
                    </div>
                    {assignment.assignmentNotes && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Notes:</span> {assignment.assignmentNotes}
                      </div>
                    )}
                    {assignment.returnNotes && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Return Notes:</span> {assignment.returnNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Asset"
        description={`Are you sure you want to delete ${assetToDelete?.assetName}? This action cannot be undone.`}
        confirmText="Delete Asset"
        cancelText="Cancel"
        onConfirm={handleDeleteAsset}
        variant="destructive"
      />
    </div>
  );
}