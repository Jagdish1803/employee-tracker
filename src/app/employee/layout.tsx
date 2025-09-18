'use client';

import React, { useState } from 'react';
import EmployeeSidebar from '@/components/employee-sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { EmployeeAuthProvider } from '@/contexts/EmployeeAuthContext';
import { EmployeeAuthGuard } from '@/components/auth/EmployeeAuthGuard';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

function EmployeeLayoutContent({ children }: EmployeeLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          ${sidebarOpen ? 'w-64' : 'w-16'}
          transition-all duration-300 ease-in-out
          flex-shrink-0
          border-r border-border
          bg-sidebar
          h-full
          overflow-hidden
        `}
      >
        <EmployeeSidebar isCollapsed={!sidebarOpen} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/employee" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">Employee Portal</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 overflow-auto bg-background main-content-scrollbar">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  return (
    <EmployeeAuthProvider>
      <EmployeeAuthGuard>
        <EmployeeLayoutContent>{children}</EmployeeLayoutContent>
      </EmployeeAuthGuard>
    </EmployeeAuthProvider>
  );
}