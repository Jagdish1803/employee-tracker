// src/app/layout.tsx - Root layout
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import QueryProvider from '@/providers/QueryProvider';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Employee Tag Tracker',
  description: 'Track employee work time based on tags with break management and issue tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body 
        className={inter.className}
        suppressHydrationWarning={true}
      >
        <QueryProvider>
          <PerformanceMonitor />
          {children}
        </QueryProvider>
        <Toaster
          position="top-right"
          duration={4000}
          richColors
          theme="dark"
        />
      </body>
    </html>
  );
}