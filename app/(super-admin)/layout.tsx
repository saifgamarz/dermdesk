'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Stethoscope, LogOut, Building2, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

function SuperAdminSidebar({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const handleLogout = async () => {
    await signOut(auth);
  };
  return (
    <aside className={`bg-white border-r border-slate-200 flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 w-[260px]`}>
      <div className="h-16 flex items-center justify-between border-b border-slate-100 px-4 shrink-0 overflow-hidden">
        <div className="flex items-center">
          <div className="flex bg-sky-100 text-sky-600 p-1.5 rounded-xl shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className={`ml-3 font-semibold text-slate-900 tracking-tight whitespace-nowrap`}>
            DermDesk Admin
          </div>
        </div>
        {mobile && onClose && (
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        <Link 
          href="/super-admin"
          onClick={onClose}
          className={`flex items-center rounded-lg h-10 px-2 transition-colors duration-150 overflow-hidden cursor-pointer ${
            pathname === '/super-admin'
              ? 'bg-sky-50 text-sky-600 border-l-[3px] border-sky-500'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-[3px] border-transparent'
          }`}
        >
          <div className="flex items-center justify-center shrink-0 w-6">
            <Building2 className="w-4 h-4" />
          </div>
          <span className={`ml-3 text-sm font-medium ${pathname === '/super-admin' ? 'text-sky-600' : 'text-slate-600'}`}>
            All Clinics
          </span>
        </Link>
      </nav>

      <div className="p-3 border-t border-slate-100 flex flex-col gap-2 shrink-0 overflow-hidden">
        <button onClick={handleLogout} className="flex items-center rounded-lg h-10 px-2 transition-colors duration-150 text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer w-full text-left">
          <div className="flex items-center justify-center shrink-0 w-6">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="ml-3 text-sm font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'SuperAdmin') {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== 'SuperAdmin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans">
      <div className="hidden md:flex">
        <SuperAdminSidebar />
      </div>
      
      {/* Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SuperAdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 md:hidden">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-slate-900">DermDesk Admin</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full h-full animate-in fade-in duration-300 flex flex-col gap-6">
            {children}
          </div>
        </main>
      </div>

      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
