'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/hooks/useClinic';
import { useRouter, usePathname } from 'next/navigation';
import { DefaultPageSkeleton } from '@/components/shared/LoadingSkeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading: authLoading } = useAuth();
  const { clinic, loading: clinicLoading } = useClinic();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (role === 'SuperAdmin') {
        router.push('/super-admin');
      }
    }
  }, [user, role, authLoading, router]);

  if (authLoading || clinicLoading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <div className="w-[240px] bg-white border-r border-slate-200 hidden md:block" />
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white border-b border-slate-200 hidden md:block" />
          <DefaultPageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - Desktop & Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full h-full animate-in fade-in duration-300 flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardLayoutSkeleton() {
  return (
    <main className="flex-1 p-6">
      <DefaultPageSkeleton />
    </main>
  );
}
