// src/app/page.tsx - Home page
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Users, BarChart3, Shield } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 p-6 rounded-full shadow-lg border border-gray-200">
              <Building className="h-16 w-16 text-gray-700" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Employee Tracker System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive employee management with attendance tracking, work logging, 
            and performance analytics in a clean, professional interface
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="bg-gray-100 p-3 rounded-lg w-fit mx-auto mb-4 border border-gray-200">
                <Users className="h-8 w-8 text-gray-700" />
              </div>
              <CardTitle className="text-gray-800">Employee Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Manage employee profiles, track attendance, and monitor work activities
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="bg-gray-100 p-3 rounded-lg w-fit mx-auto mb-4 border border-gray-200">
                <BarChart3 className="h-8 w-8 text-gray-700" />
              </div>
              <CardTitle className="text-gray-800">Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Generate detailed reports and analytics for performance monitoring
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="bg-gray-100 p-3 rounded-lg w-fit mx-auto mb-4 border border-gray-200">
                <Shield className="h-8 w-8 text-gray-700" />
              </div>
              <CardTitle className="text-gray-800">Secure Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Role-based access control with secure authentication
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-800 mb-2">Access System</CardTitle>
              <p className="text-gray-600">Navigate to your dashboard</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/employee" className="block">
                <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold h-12 rounded-lg transition-all duration-200" size="lg">
                  Employee Dashboard
                </Button>
              </Link>
              <Link href="/admin" className="block">
                <Button variant="outline" className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold h-12 rounded-lg transition-all duration-200" size="lg">
                  Admin Dashboard
                </Button>
              </Link>
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Direct access to dashboards (authentication will be added later)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}