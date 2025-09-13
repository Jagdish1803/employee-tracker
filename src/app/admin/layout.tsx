'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Tag, 
  ClipboardList, 
  BarChart3, 
  Edit, 
  AlertTriangle, 
  Coffee, 
  FileText,
  Settings,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Daily Chart', href: '/admin/daily-chart', icon: BarChart3 },
  { name: 'Employees', href: '/admin/employees', icon: Users },
  { name: 'Tags', href: '/admin/tags', icon: Tag },
  { name: 'Assignments', href: '/admin/assignments', icon: ClipboardList },
  { name: 'Attendance', href: '/admin/attendance', icon: CalendarDays },
  { name: 'Edit Logs', href: '/admin/edit-logs', icon: Edit },
  { name: 'Missing Data', href: '/admin/missing-data', icon: AlertTriangle },
  { name: 'Warnings', href: '/admin/warnings', icon: AlertTriangle },
  { name: 'Breaks', href: '/admin/breaks', icon: Coffee },
  { name: 'Issues', href: '/admin/issues', icon: FileText },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-gray-700" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Employee Management System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="flex-1 px-4 py-6">
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Navigation
              </h2>
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group',
                        isActive
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
          
          {/* User Profile Section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  admin@company.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}