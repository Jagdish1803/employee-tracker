'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FlowaceCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCalendarMonth: Date;
  availableDates: string[];
  selectedDate: string;
  onMonthNavigate: (direction: 'prev' | 'next') => void;
  onDateSelect: (day: number) => void;
}

export function FlowaceCalendarDialog({
  open,
  onOpenChange,
  currentCalendarMonth,
  availableDates,
  selectedDate,
  onMonthNavigate,
  onDateSelect,
}: FlowaceCalendarDialogProps) {
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Date</DialogTitle>
          <DialogDescription>
            Choose a date to view Flowace records
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthNavigate('prev')}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {currentCalendarMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthNavigate('next')}
              className="p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}

            {/* Empty cells for days before month start */}
            {Array.from({ length: getFirstDayOfMonth(currentCalendarMonth) }).map((_, index) => (
              <div key={`empty-${index}`} className="p-2"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: getDaysInMonth(currentCalendarMonth) }).map((_, index) => {
              const day = index + 1;
              const dateObj = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day);
              const dateStr = formatDateForComparison(dateObj);
              const hasData = availableDates.includes(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <Button
                  key={day}
                  variant={isSelected ? "default" : hasData ? "outline" : "ghost"}
                  size="sm"
                  className={cn(
                    "p-2 h-8 w-8",
                    hasData && !isSelected && "border-blue-200 text-blue-600 hover:bg-blue-50",
                    !hasData && "text-gray-400 cursor-not-allowed",
                    isSelected && "bg-blue-600 text-white"
                  )}
                  onClick={() => onDateSelect(day)}
                  disabled={!hasData}
                >
                  {day}
                </Button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border border-blue-200 rounded"></div>
              <span>Has data</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}