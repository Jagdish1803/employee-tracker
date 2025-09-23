'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Laptop, Search, Calendar, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { assetService, AssetAssignment } from '@/api';

export default function MyAssets() {
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssetAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned'>('all');

  const employeeId = 1; // Use default employee ID for now


  const filterAssignments = useCallback(() => {
    let filtered = assignments;

    if (searchTerm) {
      filtered = filtered.filter(assignment =>
        assignment.asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(assignment => assignment.status === 'ACTIVE');
    } else if (statusFilter === 'returned') {
      filtered = filtered.filter(assignment => assignment.status === 'RETURNED');
    }

    setFilteredAssignments(filtered);
  }, [assignments, searchTerm, statusFilter]);

  const fetchAssetAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await assetService.getEmployeeAssignments(employeeId);
      setAssignments(response);
    } catch (error) {
      // Don't show error toast for empty results, just log it
      console.error('Failed to load asset assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchAssetAssignments();
  }, [fetchAssetAssignments]);

  useEffect(() => {
    filterAssignments();
  }, [assignments, searchTerm, statusFilter, filterAssignments]);

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType.toUpperCase()) {
      case 'LAPTOP':
      case 'DESKTOP':
        return <Laptop className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusBadgeVariant = (status: AssetAssignment['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'RETURNED':
        return 'outline';
      case 'LOST':
        return 'destructive';
      case 'DAMAGED_RETURN':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition.toUpperCase()) {
      case 'EXCELLENT':
        return 'default';
      case 'GOOD':
        return 'secondary';
      case 'FAIR':
        return 'outline';
      case 'POOR':
      case 'DAMAGED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatStatus = (status: AssetAssignment['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'RETURNED':
        return 'Returned';
      case 'LOST':
        return 'Lost';
      case 'DAMAGED_RETURN':
        return 'Damaged Return';
      default:
        return status;
    }
  };

  const getAssignmentStats = () => {
    const total = assignments.length;
    const active = assignments.filter(a => a.status === 'ACTIVE').length;
    const returned = assignments.filter(a => a.status === 'RETURNED').length;

    return { total, active, returned };
  };

  const stats = getAssignmentStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Assets</h1>
          <p className="text-muted-foreground">View and manage your assigned company assets</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">In your possession</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.returned}</div>
            <p className="text-xs text-muted-foreground">Previously assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'returned' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('returned')}
              >
                Returned
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Your Asset Assignments ({filteredAssignments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading assets...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {assignments.length === 0 ? 'No assets assigned' : 'No assets match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        {getAssetTypeIcon(assignment.asset.assetType)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{assignment.asset.assetName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{assignment.asset.brand}</span>
                          <span>•</span>
                          <span>{assignment.asset.model}</span>
                          {assignment.asset.serialNumber && (
                            <>
                              <span>•</span>
                              <span>SN: {assignment.asset.serialNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={getStatusBadgeVariant(assignment.status)}>
                        {formatStatus(assignment.status)}
                      </Badge>
                      <Badge variant={getConditionBadgeVariant(assignment.asset.condition)}>
                        {assignment.asset.condition}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Assigned Date</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(assignment.assignedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {assignment.returnDate && (
                      <div>
                        <p className="text-muted-foreground">Return Date</p>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(assignment.returnDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Asset Type</p>
                      <Badge variant="outline">{assignment.asset.assetType}</Badge>
                    </div>
                  </div>

                  {assignment.assignmentNotes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Notes:</strong> {assignment.assignmentNotes}
                      </p>
                    </div>
                  )}

                  {assignment.returnNotes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Return Notes:</strong> {assignment.returnNotes}
                      </p>
                      {assignment.returnCondition && (
                        <p className="text-sm mt-1">
                          <strong>Return Condition:</strong> {assignment.returnCondition}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}