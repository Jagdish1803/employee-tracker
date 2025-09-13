import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: number;
  name: string;
  employeeCode: string;
}

interface Tag {
  id: number;
  tagName: string;
  timeMinutes: number;
}

interface AssignmentModalProps {
  employees: Employee[];
  tags: Tag[];
  onCreate: (data: { employeeId: number; tagIds: number[]; isMandatory: boolean }) => void;
  onClose: () => void;
  submitting?: boolean;
}

export default function AssignmentModal({ employees, tags, onCreate, onClose, submitting = false }: AssignmentModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isMandatory, setIsMandatory] = useState(false);

  const handleTagToggle = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreate = () => {
    if (!selectedEmployee || selectedTags.length === 0) return;
    onCreate({ employeeId: selectedEmployee, tagIds: selectedTags, isMandatory });
  };

  const isValid = selectedEmployee && selectedTags.length > 0;

  return (
    <div className="space-y-6">
      {/* Employee Selection */}
      <div className="space-y-2">
        <Label htmlFor="employee">Employee</Label>
        <Select
          value={selectedEmployee?.toString() || ''}
          onValueChange={(value) => setSelectedEmployee(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                {employee.name} ({employee.employeeCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags Multi-Selection */}
      <div className="space-y-3">
        <Label>Tags</Label>
        <p className="text-sm text-muted-foreground">Click tags to select multiple assignments</p>
        
        {/* Tag Selection Area */}
        <div className="min-h-[120px] border rounded-lg p-4 bg-gray-50/50">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                className={`cursor-pointer transition-all hover:scale-105 ${
                  selectedTags.includes(tag.id) 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
                onClick={() => handleTagToggle(tag.id)}
              >
                {tag.tagName} ({tag.timeMinutes}min)
              </Badge>
            ))}
          </div>
          
          {selectedTags.length === 0 && (
            <p className="text-center text-muted-foreground text-sm mt-8">
              No tags selected
            </p>
          )}
        </div>

        {/* Selected Tags Summary */}
        {selectedTags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">
              {selectedTags.length} tag{selectedTags.length === 1 ? '' : 's'} selected:
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} variant="outline" className="text-xs">
                    {tag.tagName}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="mandatory"
          checked={isMandatory}
          onCheckedChange={(checked) => setIsMandatory(!!checked)}
        />
        <Label htmlFor="mandatory" className="text-sm">
          Make all these assignments mandatory
        </Label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleCreate} 
          disabled={!isValid || submitting}
        >
          {submitting ? 'Creating...' : `Create ${selectedTags.length || 0} Assignment${selectedTags.length === 1 ? '' : 's'}`}
        </Button>
      </div>
    </div>
  );
}