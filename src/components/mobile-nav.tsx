'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  FileText,
  Coffee,
  Users,
  Settings,
  BarChart3,
  Activity
} from 'lucide-react';

interface MobileNavProps {
  isAdmin?: boolean;
}

const employeeNavItems = [
  { icon: Home, label: 'Dashboard', href: '/employee' },
  { icon: Calendar, label: 'Attendance', href: '/employee/attendance' },
  { icon: Activity, label: 'Work', href: '/employee/work-assignments' },
  { icon: Coffee, label: 'Breaks', href: '/employee/breaks' },
  { icon: FileText, label: 'Issues', href: '/employee/issues' },
];

const adminNavItems = [
  { icon: BarChart3, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Employees', href: '/admin/employees' },
  { icon: Calendar, label: 'Attendance', href: '/admin/attendance' },
  { icon: FileText, label: 'Issues', href: '/admin/issues' },
  { icon: Settings, label: 'Settings', href: '/admin/admin-panel' },
];

export default function MobileNav({ isAdmin = false }: MobileNavProps) {
  const pathname = usePathname();
  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`
                flex flex-col items-center justify-center h-full px-1
                transition-colors duration-200
                ${isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
                }
              `}
            >
              <item.icon className={`h-5 w-5 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}