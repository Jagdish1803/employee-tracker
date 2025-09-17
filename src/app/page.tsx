
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function HomePage() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleLogin = (role: 'employee' | 'admin') => {
    if (!code.trim()) return;
    if (role === 'employee') {
      router.push(`/employee?code=${encodeURIComponent(code.trim())}`);
    } else {
      router.push(`/admin?code=${encodeURIComponent(code.trim())}`);
    }
  };

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Employee Tracker
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Home</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="flex flex-1 items-center justify-center">
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-center">Access System</h2>
                <p className="text-gray-600 mb-6 text-center">Enter your code to login</p>
                <input
                  type="text"
                  value={code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-6 focus:outline-none focus:ring focus:border-blue-300"
                  placeholder="Enter code (e.g. ZOOT1049 or ADMIN-001)"
                />
                <Button className="w-full mb-3" onClick={() => handleLogin('employee')}>
                  Login as Employee
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleLogin('admin')}>
                  Login as Admin
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}