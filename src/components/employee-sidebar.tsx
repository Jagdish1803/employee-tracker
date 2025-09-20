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
  User,
  CalendarDays,
  AlertTriangle,
  LogOut,
  ClipboardList,
  Laptop,
  Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface EmployeeSidebarProps {
  isCollapsed: boolean;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/employee',
    icon: Home,
    badge: null
  },
  {
    name: 'Work Log',
    href: '/employee/work-log',
    icon: Calendar,
    badge: null
  },
  {
    name: 'My Assignments',
    href: '/employee/assignments',
    icon: ClipboardList,
    badge: null
  },
  {
    name: 'Attendance',
    href: '/employee/attendance',
    icon: CalendarDays,
    badge: null
  },
  {
    name: 'Flowace Activity',
    href: '/employee/flowace',
    icon: Activity,
    badge: null
  },
  {
    name: 'Break Tracker',
    href: '/employee/breaks',
    icon: Coffee,
    badge: null
  },
  {
    name: 'My Issues',
    href: '/employee/issues',
    icon: FileText,
    badge: null
  },
  {
    name: 'Warnings',
    href: '/employee/warnings',
    icon: AlertTriangle,
    badge: null
  },
  {
    name: 'My Assets',
    href: '/employee/assets',
    icon: Laptop,
    badge: null
  },
];

export default function EmployeeSidebar({ isCollapsed }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const { employee, logout } = useEmployeeAuth();

  const handleSignOut = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground max-h-screen">
      {/* Header - Fixed */}
      <div className="border-b border-sidebar-border/50 p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <User className="size-4" />
          </div>
          {!isCollapsed && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-sidebar-foreground">Employee Tracker</span>
              <span className="truncate text-xs text-sidebar-foreground/70">Employee Portal</span>
            </div>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 px-2 py-2 overflow-y-auto sidebar-scrollbar min-h-0">
        <div className="mb-2">
          {!isCollapsed && (
            <div className="text-sidebar-foreground/70 text-xs font-medium px-2 py-2">
              Navigation
            </div>
          )}
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                    transition-all duration-200 ease-in-out
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                    ${pathname === item.href
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : ''
                    }
                    ${isCollapsed ? 'justify-center px-2' : ''}
                  `}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="truncate">
                        {item.name}
                      </span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto h-5 px-1.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - Fixed */}
      {employee && (
        <div className="border-t border-sidebar-border/50 p-2 flex-shrink-0">
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src="/placeholder-avatar.jpg" alt={employee.name || 'Employee'} />
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-medium">
                {employee.name?.charAt(0)?.toUpperCase() || 'E'}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">{employee.name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">{employee.employeeCode}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1 rounded hover:bg-sidebar-accent/50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}