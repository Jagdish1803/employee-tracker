// src/app/admin/tags/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { tagService } from '@/api';
import { Tag as TagType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export default function TagsPage() {
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [formData, setFormData] = useState({
    tagName: '',
    timeMinutes: undefined as number | undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagType | null>(null);

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTags, setFilteredTags] = useState<TagType[]>([]);
  const pageSize = 10;

  // Pagination calculations
  const totalPages = Math.ceil(filteredTags.length / pageSize);
  const paginatedTags = filteredTags.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filter tags based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredTags(tags);
    } else {
      const filtered = tags.filter(tag =>
        tag.tagName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTags(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, tags]);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await tagService.getAll();
      if (response.data.success) {
        setTags(response.data.data || []);
      } else {
        toast.error('Failed to load tags');
      }
    } catch (error: unknown) {
      console.error('Error loading tags:', error);
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (formData.timeMinutes === undefined || isNaN(formData.timeMinutes)) {
        toast.error('Please enter a valid time per unit (minutes).');
        setSubmitting(false);
        return;
      }
      const payload = { ...formData, timeMinutes: Number(formData.timeMinutes) };
      if (editingTag) {
        const response = await tagService.update(editingTag.id, payload);
        if (response.data.success) {
          toast.success('Tag updated successfully');
          loadTags();
        }
      } else {
        const response = await tagService.create(payload);
        if (response.data.success) {
          toast.success('Tag created successfully');
          loadTags();
        }
      }

      closeDialog();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Operation failed';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag);
    setFormData({
      tagName: tag.tagName,
      timeMinutes: tag.timeMinutes,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (tag: TagType) => {
    setTagToDelete(tag);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;

    try {
      await tagService.delete(tagToDelete.id);
      toast.success('Tag deleted successfully');
      loadTags();
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to delete tag';
      toast.error(errorMessage);
    } finally {
      setTagToDelete(null);
    }
  };

  const openCreateDialog = () => {
    setEditingTag(null);
    setFormData({
      tagName: '',
      timeMinutes: undefined,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTag(null);
    setFormData({
      tagName: '',
      timeMinutes: undefined,
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Manage Tags
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage work tags with time values</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Tag</span>
        </Button>
      </div>

      {/* Tag Search */}
      <div className="mb-6 max-w-sm">
        <Label htmlFor="search" className="block mb-2">Tag Search</Label>
        <Input
          id="search"
          type="text"
          placeholder="Search by tag name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

{filteredTags.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center py-12">
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchTerm ? 'No tags found matching your search' : 'No tags found'}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {searchTerm
                ? 'Try adjusting your search terms.'
                : 'Get started by creating your first work tag.'
              }
            </p>
            {searchTerm ? (
              <Button onClick={() => setSearchTerm('')} variant="outline" className="mt-4">
                Clear Search
              </Button>
            ) : (
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Work Tags</h3>
              </div>
              <div className="text-sm text-gray-500">
                Total: {filteredTags.length} tags {searchTerm && `(filtered from ${tags.length})`}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tag Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time per Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTags.map((tag, index) => (
                  <tr key={tag.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-primary">
                            {tag.tagName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{tag.tagName}</div>
                          <div className="text-xs text-gray-500">ID: {tag.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tag.timeMinutes} minutes</div>
                      <div className="text-xs text-gray-500">per unit</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tag.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEdit(tag)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-black hover:text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(tag)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredTags.length)} to {Math.min(currentPage * pageSize, filteredTags.length)} of {filteredTags.length} tags
                  {searchTerm && ` (filtered from ${tags.length})`}
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-gray-500 border-gray-300 hover:bg-gray-50"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-500 border-gray-300 hover:bg-gray-50'}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-gray-500 border-gray-300 hover:bg-gray-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tag Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Tag' : 'Add New Tag'}
            </DialogTitle>
            <DialogDescription>
              {editingTag 
                ? 'Update the tag information below.'
                : 'Fill in the details to create a new work tag.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tagName">Tag Name</Label>
                <Input
                  id="tagName"
                  value={formData.tagName}
                  onChange={(e) => setFormData({ ...formData, tagName: e.target.value })}
                  placeholder="e.g., Task Completion, Meeting"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timeMinutes">Time per Unit (minutes)</Label>
                <Input
                  id="timeMinutes"
                  type="number"
                  min="1"
                  max="480"
                  value={formData.timeMinutes === undefined ? '' : formData.timeMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, timeMinutes: val === '' ? undefined : parseInt(val) });
                  }}
                  placeholder="e.g., 30"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  How many minutes each count of this tag represents
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : (editingTag ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Tag"
        description={`Are you sure you want to delete "${tagToDelete?.tagName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}