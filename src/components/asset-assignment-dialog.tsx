'use client';

import React, { useState } from 'react';
import { User, Calendar, FileText, Package } from 'lucide-react';
import { Asset, Employee, AssetCondition, AssetAssignment } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useAssignAsset, useReturnAsset } from '@/hooks/use-assets';
import { toast } from 'react-hot-toast';

interface AssetAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  employees: Employee[];
  mode: 'assign' | 'return';
  assignment?: AssetAssignment; // For return mode
}

export function AssetAssignmentDialog({
  open,
  onOpenChange,
  asset,
  employees,
  mode,
  assignment
}: AssetAssignmentDialogProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    assignmentNotes: '',
    returnCondition: 'GOOD' as AssetCondition,
    returnNotes: '',
  });

  const assignAssetMutation = useAssignAsset();
  const returnAssetMutation = useReturnAsset();

  const handleAssign = async () => {
    if (!asset || !formData.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    try {
      const result = await assignAssetMutation.mutateAsync({
        assetId: asset.id,
        employeeId: parseInt(formData.employeeId),
        assignmentNotes: formData.assignmentNotes || undefined,
      });
      toast.success(result.message || 'Asset assigned successfully!');
      handleClose();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to assign asset');
    }
  };

  const handleReturn = async () => {
    if (!assignment) {
      toast.error('No assignment found');
      return;
    }

    try {
      const result = await returnAssetMutation.mutateAsync({
        assignmentId: assignment.id,
        returnCondition: formData.returnCondition,
        returnNotes: formData.returnNotes || undefined,
      });
      toast.success(result.message || 'Asset returned successfully!');
      handleClose();
    } catch (error: unknown) {
      toast.error((error as Error).message || 'Failed to return asset');
    }
  };

  const handleClose = () => {
    setFormData({
      employeeId: '',
      assignmentNotes: '',
      returnCondition: 'GOOD',
      returnNotes: '',
    });
    onOpenChange(false);
  };

  const loading = assignAssetMutation.isPending || returnAssetMutation.isPending;

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'assign' ? (
              <>
                <User className="h-5 w-5" />
                Assign Asset
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                Return Asset
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'assign'
              ? `Assign ${asset.assetName} to an employee`
              : `Return ${asset.assetName} from ${assignment?.employee?.name}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">{asset.assetName}</div>
                <div className="text-sm text-muted-foreground">
                  {asset.brand} {asset.model} • {asset.assetTag}
                </div>
              </div>
            </div>
          </div>

          {mode === 'assign' ? (
            <>
              {/* Employee Selection */}
              <div>
                <Label htmlFor="employee">Employee *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} align="start">
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {employee.employeeCode} • {employee.email}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment Notes */}
              <div>
                <Label htmlFor="assignmentNotes">Assignment Description/Notes</Label>
                <Textarea
                  id="assignmentNotes"
                  value={formData.assignmentNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignmentNotes: e.target.value }))}
                  placeholder="Optional notes about this assignment (e.g., purpose, duration, special instructions)"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              {/* Current Assignment Info */}
              {assignment && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">
                      {assignment.employee?.name} ({assignment.employee?.employeeCode})
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                    </div>
                    {assignment.assignmentNotes && (
                      <div className="flex items-start gap-2 mt-1">
                        <FileText className="h-3 w-3 mt-0.5" />
                        <span>{assignment.assignmentNotes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Return Condition */}
              <div>
                <Label htmlFor="returnCondition">Return Condition *</Label>
                <Select
                  value={formData.returnCondition}
                  onValueChange={(value: AssetCondition) =>
                    setFormData(prev => ({ ...prev, returnCondition: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4} align="start">
                    <SelectItem value="EXCELLENT">Excellent</SelectItem>
                    <SelectItem value="GOOD">Good</SelectItem>
                    <SelectItem value="FAIR">Fair</SelectItem>
                    <SelectItem value="POOR">Poor</SelectItem>
                    <SelectItem value="DAMAGED">Damaged</SelectItem>
                    <SelectItem value="NEEDS_REPAIR">Needs Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Return Notes */}
              <div>
                <Label htmlFor="returnNotes">Return Notes</Label>
                <Textarea
                  id="returnNotes"
                  value={formData.returnNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnNotes: e.target.value }))}
                  placeholder="Optional notes about the return (e.g., issues found, maintenance needed)"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={mode === 'assign' ? handleAssign : handleReturn}
            disabled={loading || (mode === 'assign' && !formData.employeeId)}
          >
            {loading ? 'Processing...' : (mode === 'assign' ? 'Assign Asset' : 'Return Asset')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}