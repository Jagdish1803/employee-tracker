'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEmployeeAuth } from '@/contexts/EmployeeAuthContext';
import {
  Home,
  Calendar,
  Coffee,
  FileText,
  BarChart3,
  User,
  CalendarDays,
  AlertTriangle,
  LogOut,
  ClipboardList,
  Laptop,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmployeeSidebarProps {
  isCollapsed: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/employee', icon: Home },
  { name: 'Work Log', href: '/employee/work-log', icon: Calendar },
  { name: 'My Assignments', href: '/employee/assignments', icon: ClipboardList },
  { name: 'Attendance', href: '/employee/attendance', icon: CalendarDays },
  { name: 'Flowace Activity', href: '/employee/flowace', icon: Activity },
  { name: 'Break Tracker', href: '/employee/breaks', icon: Coffee },
  { name: 'My Issues', href: '/employee/issues', icon: FileText },
  { name: 'Warnings', href: '/employee/warnings', icon: AlertTriangle },
  { name: 'Performance', href: '/employee/performance', icon: BarChart3 },
  { name: 'My Assets', href: '/employee/assets', icon: Laptop },
];

export default function EmployeeSidebar({ isCollapsed }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const { employee, logout } = useEmployeeAuth();

  const handleSignOut = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-border bg-sidebar",
        isCollapsed ? "px-2 h-16" : "px-4 h-16"
      )}>
        <div className="flex items-center space-x-2">
          <User className={cn("text-sidebar-foreground", isCollapsed ? "h-5 w-5" : "h-6 w-6")} />
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">Employee Portal</h1>
              <p className="text-xs text-muted-foreground">Track your work</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-4")}>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center text-sm font-medium rounded-lg transition-all duration-200 group',
                  isCollapsed ? 'p-2 justify-center' : 'px-3 py-2.5',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={cn("flex-shrink-0", isCollapsed ? "h-4 w-4" : "h-4 w-4 mr-3")} />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      {employee && (
        <div className={cn(
          "border-t border-border bg-sidebar",
          isCollapsed ? "p-2" : "p-4"
        )}>
          <div className={cn(
            "flex items-center",
            isCollapsed ? "flex-col space-y-2" : "justify-between"
          )}>
            <div className={cn(
              "flex items-center",
              isCollapsed ? "flex-col space-y-1" : "space-x-3"
            )}>
              <div className="flex-shrink-0">
                <div className={cn(
                  "rounded-full bg-sidebar-accent flex items-center justify-center",
                  isCollapsed ? "h-6 w-6" : "h-8 w-8"
                )}>
                  <span className={cn(
                    "font-medium text-sidebar-accent-foreground",
                    isCollapsed ? "text-xs" : "text-sm"
                  )}>
                    {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                  </span>
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {employee.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {employee.employeeCode}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size={isCollapsed ? "sm" : "sm"}
              onClick={handleSignOut}
              className={cn(
                "text-muted-foreground hover:text-sidebar-foreground",
                isCollapsed ? "p-1" : "p-1"
              )}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="sr-only">Sign Out</span>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}