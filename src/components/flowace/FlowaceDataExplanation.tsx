'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function FlowaceDataExplanation() {
  return (
    <Card className="mb-4 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">Understanding Your Flowace Data</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-800">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                <div><strong>Total Logged:</strong> All tracked time (work + idle)</div>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <div><strong>Active Hours:</strong> Time with actual work activity</div>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                <div><strong>Idle Hours:</strong> Time away from computer/inactive</div>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <div><strong>Missing Hours:</strong> Gap from expected work time</div>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-gray-600 rounded-full mr-2"></span>
                <div><strong>Work Session:</strong> Start time → End time of tracking</div>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                <div><strong>Productivity %:</strong> Productive vs unproductive work ratio</div>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                <div><strong>Activity %:</strong> Mouse/keyboard movement percentage</div>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                <div><strong>Classified %:</strong> Time categorized by software type</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}