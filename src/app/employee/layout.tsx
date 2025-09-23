'use client';

import React, { useState } from 'react';
import EmployeeSidebar from '@/components/employee-sidebar';
import MobileNav from '@/components/mobile-nav';
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
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

function EmployeeLayoutContent({ children }: EmployeeLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Always closed on mobile
      } else {
        setSidebarOpen(true); // Open by default on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile
            ? `fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : `${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 ease-in-out flex-shrink-0`
          }
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
        <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b bg-background px-3 md:px-4 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-7 md:w-7"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb className="flex-1 min-w-0">
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/employee" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-sm md:text-base truncate">Employee Portal</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 overflow-auto bg-background main-content-scrollbar">
          <div className="w-full p-3 md:p-6 pb-20 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav isAdmin={false} />
    </div>
  );
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  return (
    <>
      <SignedIn>
        <EmployeeLayoutContent>{children}</EmployeeLayoutContent>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}