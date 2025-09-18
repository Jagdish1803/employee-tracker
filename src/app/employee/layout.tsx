// src/app/employee/layout.tsx - Enhanced Employee Layout
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Coffee,
  FileText,
  BarChart3,
  User,
  Menu,
  X,
  CalendarDays,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SupabaseAuthProvider, useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { SupabaseAuthGuard } from '@/components/auth/SupabaseAuthGuard';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/employee', icon: Home },
  { name: 'Work Log', href: '/employee/work-log', icon: Calendar },
  { name: 'Attendance', href: '/employee/attendance', icon: CalendarDays },
  { name: 'Break Tracker', href: '/employee/breaks', icon: Coffee },
  { name: 'My Issues', href: '/employee/issues', icon: FileText },
  { name: 'Warnings', href: '/employee/warnings', icon: AlertTriangle },
  { name: 'Performance', href: '/employee/performance', icon: BarChart3 },
];

function EmployeeLayoutContent({ children }: EmployeeLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { employee, signOut } = useSupabaseAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-700" />
              <span className="font-medium text-gray-900">Employee Portal</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="p-1"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
          
          <div className="flex-1 px-4 py-6">
            <div className="mb-6">
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
                      onClick={() => setSidebarOpen(false)}
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

          {/* User Profile Section - Mobile */}
          {employee && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {employee.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {employee.employeeCode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 overflow-y-auto custom-scrollbar">
          <div className="flex-1 px-4 py-6">
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <User className="h-6 w-6 text-gray-700 mr-2" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Employee Portal</h1>
                  <p className="text-xs text-gray-500">Track your work</p>
                </div>
              </div>
              
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

          {/* User Profile Section - Desktop */}
          {employee && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {employee.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {employee.employeeCode}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="p-1"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-700" />
              <span className="font-medium text-gray-900">Employee Portal</span>
            </div>

            <div className="flex items-center space-x-2">
              {employee && (
                <div className="text-sm text-gray-700 font-medium">
                  {employee.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 bg-white overflow-y-auto custom-scrollbar">
          <SupabaseAuthGuard>
            {children}
          </SupabaseAuthGuard>
        </main>
      </div>
    </div>
  );
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  return (
    <SupabaseAuthProvider>
      <EmployeeLayoutContent>{children}</EmployeeLayoutContent>
    </SupabaseAuthProvider>
  );
}