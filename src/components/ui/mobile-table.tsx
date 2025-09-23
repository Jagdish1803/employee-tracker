'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
interface MobileTableProps {
  data: Record<string, unknown>[];
  columns: {
    key: string;
    label: string;
    render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
    mobile?: boolean; // Show on mobile
    desktop?: boolean; // Show on desktop
  }[];
  emptyMessage?: string;
}

export default function MobileTable({ data, columns, emptyMessage = 'No data available' }: MobileTableProps) {
  const mobileColumns = columns.filter(col => col.mobile !== false);
  const desktopColumns = columns.filter(col => col.desktop !== false);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => (
          <Card key={index} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-2">
                {mobileColumns.map((column, colIndex) => {
                  const value = row[column.key];
                  const displayValue = column.render ? column.render(value, row) : value;

                  return (
                    <div key={colIndex} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">{column.label}:</span>
                      <span className="text-sm text-gray-900">{displayValue as React.ReactNode}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {desktopColumns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {desktopColumns.map((column, colIndex) => {
                  const value = row[column.key];
                  const displayValue = column.render ? column.render(value, row) : value;

                  return (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {displayValue as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}