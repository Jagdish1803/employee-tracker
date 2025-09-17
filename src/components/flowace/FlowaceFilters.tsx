'use client';

import React from 'react';
import type { FlowaceRecord } from '@/api/services/flowace.service';
import { RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FlowaceFiltersProps {
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  dateFilteredRecords: FlowaceRecord[];
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  onNavigateDate: (direction: 'prev' | 'next') => void;
  onCalendarClick: () => void;
  onRefresh: () => void;
}

export function FlowaceFilters({
  filterStatus,
  onFilterStatusChange,
  searchTerm,
  onSearchTermChange,
  selectedDate,
  onDateChange,
  availableDates,
  dateFilteredRecords,
  canNavigatePrev,
  canNavigateNext,
  onNavigateDate,
  onCalendarClick,
  onRefresh,
}: FlowaceFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Productivity Filter */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="filter-productivity" className="text-sm font-medium whitespace-nowrap">Performance:</Label>
            <Select value={filterStatus || 'ALL'} onValueChange={onFilterStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Performance</SelectItem>
                <SelectItem value="EXCELLENT">Excellent (8h+ & 80%+)</SelectItem>
                <SelectItem value="GOOD">Good (6h+ & 60%+)</SelectItem>
                <SelectItem value="AVERAGE">Average (4h+ & 40%+)</SelectItem>
                <SelectItem value="LOW_HOURS">Low Hours (&lt;4h)</SelectItem>
                <SelectItem value="NEEDS_IMPROVEMENT">Needs Improvement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employee Search */}
          <div className="flex items-center space-x-2 flex-1">
            <Label htmlFor="search-emp" className="text-sm font-medium whitespace-nowrap">Employee:</Label>
            <Input
              id="search-emp"
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="whitespace-nowrap"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Date Browse Section */}
        {availableDates.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
            <Label className="text-sm font-medium whitespace-nowrap">Browse by Date:</Label>

            {/* Date Navigation */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateDate('prev')}
                disabled={!canNavigatePrev}
                className="p-2"
              >
                ←
              </Button>

              <Select value={selectedDate || 'all'} onValueChange={onDateChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  {availableDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Calendar Picker Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onCalendarClick}
                className="p-2"
                title="Open Calendar"
              >
                <Calendar className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateDate('next')}
                disabled={!canNavigateNext}
                className="p-2"
              >
                →
              </Button>
            </div>

            {/* Date Info */}
            {selectedDate && selectedDate !== 'all' && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>•</span>
                <span>{dateFilteredRecords.length} records on this date</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDateChange('all')}
                  className="text-blue-600 hover:text-blue-800 p-1 h-auto"
                >
                  View All Dates
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}