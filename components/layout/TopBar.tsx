'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Command } from 'lucide-react';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/appointments': 'Appointments',
  '/patients': 'Patients',
  '/fees': 'Fees',
  '/reminders': 'Reminders',
  '/settings': 'Settings',
};

interface TopBarProps {
  onMobileMenuToggle: () => void;
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  
  // Find title by exact match or start match
  let title = 'DermDesk';
  if (routeTitles[pathname]) {
    title = routeTitles[pathname];
  } else {
    for (const [route, routeTitle] of Object.entries(routeTitles)) {
      if (route !== '/' && pathname.startsWith(route)) {
        title = routeTitle;
        break;
      }
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMobileMenuToggle}
          className="md:hidden text-slate-500 hover:text-slate-900"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4 text-slate-500">
         {/* Placeholder for global search or notifications if desired */}
         <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
            <Command className="w-3 h-3" />
            <span>Search</span>
         </button>
      </div>
    </header>
  );
}
