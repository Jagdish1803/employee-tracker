'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { useBreakStatus } from '@/hooks/useBreakStatus';
import {
  Home,
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
    name: 'Work & Assignments',
    href: '/employee/work-assignments',
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
    name: 'Raise Query',
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
  const { user } = useUser();
  const { signOut } = useClerk();
  const breakStatus = useBreakStatus(1); // Use default employee ID for now

  const handleSignOut = () => {
    signOut();
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

        {/* Break Status Indicator */}
        {breakStatus.isOnBreak && (
          <div className="mx-2 mt-4">
            <div className={`rounded-lg p-3 ${breakStatus.isLongBreak ? 'bg-red-100 border border-red-200' : 'bg-blue-100 border border-blue-200'}`}>
              {!isCollapsed ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${breakStatus.isLongBreak ? 'bg-red-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`} />
                    <span className={`text-sm font-medium ${breakStatus.isLongBreak ? 'text-red-800' : 'text-blue-800'}`}>
                      On Break
                    </span>
                  </div>
                  <div className={`text-xs ${breakStatus.isLongBreak ? 'text-red-700' : 'text-blue-700'}`}>
                    Duration: {breakStatus.duration}m
                    {breakStatus.isLongBreak && (
                      <div className="mt-1 text-red-600 font-medium">
                        Exceeds 20 min limit!
                      </div>
                    )}
                  </div>
                  <Link
                    href="/employee/breaks"
                    className={`text-xs underline ${breakStatus.isLongBreak ? 'text-red-700 hover:text-red-800' : 'text-blue-700 hover:text-blue-800'}`}
                  >
                    End Break
                  </Link>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Coffee className={`size-4 ${breakStatus.isLongBreak ? 'text-red-600 animate-pulse' : 'text-blue-600 animate-pulse'}`} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Fixed */}
      {user && (
        <div className="border-t border-sidebar-border/50 p-2 flex-shrink-0">
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.imageUrl} alt={user.fullName || 'Employee'} />
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-medium">
                {user.firstName?.charAt(0)?.toUpperCase() || user.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase() || 'E'}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">{user.fullName || user.firstName || 'Employee'}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">{user.emailAddresses[0]?.emailAddress}</span>
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