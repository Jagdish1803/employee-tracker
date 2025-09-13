// src/app/admin/tags/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { tagService } from '@/api';
import { Tag as TagType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    timeMinutes: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagType | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await tagService.getAll();
      if (response.data.success) {
        setTags(response.data.data || []);
      } else {
        toast.error(response.data.error || 'Failed to load tags');
      }
    } catch (error: any) {
      console.error('Error loading tags:', error);
      const errorMessage = error.response?.data?.error || 'Failed to load tags';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingTag) {
        const response = await tagService.update(editingTag.id, formData);
        if (response.data.success) {
          toast.success('Tag updated successfully');
          loadTags();
        }
      } else {
        const response = await tagService.create(formData);
        if (response.data.success) {
          toast.success('Tag created successfully');
          loadTags();
        }
      }
      
      closeDialog();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Operation failed';
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete tag';
      toast.error(errorMessage);
    } finally {
      setTagToDelete(null);
    }
  };

  const openCreateDialog = () => {
    setEditingTag(null);
    setFormData({
      tagName: '',
      timeMinutes: 0,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTag(null);
    setFormData({
      tagName: '',
      timeMinutes: 0,
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
          <h1 className="text-2xl font-bold flex items-center">
            <Tag className="h-7 w-7 mr-2 text-primary" />
            Manage Tags
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage work tags with time values</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Tag</span>
        </Button>
      </div>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No tags</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first work tag.
            </p>
            <Button onClick={openCreateDialog} className="mt-4">
              Add Tag
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">Tag Name</th>
                    <th className="text-left px-6 py-4 font-medium">Time per Unit</th>
                    <th className="text-left px-6 py-4 font-medium">Created</th>
                    <th className="text-right px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tags.map((tag) => (
                    <tr key={tag.id} className="hover:bg-muted/25">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                            <Tag className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{tag.tagName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {tag.timeMinutes} minutes
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(tag.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            onClick={() => handleEdit(tag)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(tag)}
                            variant="destructive"
                            size="sm"
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
          </CardContent>
        </Card>
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
                  value={formData.timeMinutes}
                  onChange={(e) => setFormData({ ...formData, timeMinutes: parseInt(e.target.value) || 0 })}
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