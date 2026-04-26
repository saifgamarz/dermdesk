'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  CalendarDays, 
  CreditCard, 
  Bell, 
  Settings, 
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  X
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/hooks/useClinic';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Appointments', href: '/appointments', icon: CalendarDays },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Fees', href: '/fees', icon: CreditCard, role: ['Admin', 'Doctor'] },
  { label: 'Reminders', href: '/reminders', icon: Bell, role: ['Admin', 'Doctor'] },
  { label: 'Settings', href: '/settings', icon: Settings, role: ['Admin', 'Doctor'] },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const { user, role } = useAuth();
  const { clinic } = useClinic();

  // Reset optimistic path when real pathname changes
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOptimisticPath(null);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut(auth);
  };


  return (
    <aside 
      className={`bg-white border-r border-slate-200 flex flex-col h-full transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? 'w-[260px] md:w-[64px]' : 'w-[260px] md:w-[240px]'
      }`}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between border-b border-slate-100 px-4 shrink-0 overflow-hidden">
        <div className="flex items-center">
          <div className="flex bg-sky-100 text-sky-600 p-1.5 rounded-lg shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className={`ml-3 font-semibold text-slate-900 tracking-tight whitespace-nowrap ${collapsed ? 'md:hidden' : ''}`}>
            {clinic?.name || 'DermDesk'}
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          if (item.role && role && !item.role.includes(role)) return null;

          // Use optimistic path if it exists, otherwise actual pathname
          const currentPath = optimisticPath ?? pathname;
          // Special case: '/' acts as exact match
          const isActive = item.href === '/' ? currentPath === '/' : currentPath.startsWith(item.href);

          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => {
                setOptimisticPath(item.href);
                if (onClose) onClose();
              }}
              className={`flex items-center rounded-lg h-10 px-2 transition-colors duration-150 overflow-hidden cursor-pointer ${
                isActive 
                  ? 'bg-sky-50 text-sky-600 border-l-[3px] border-sky-500'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-l-[3px] border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center justify-center shrink-0 w-6">
                <item.icon className="w-5 h-5" />
              </div>
              <span className={`ml-3 text-sm font-medium ${isActive ? 'text-sky-600' : 'text-slate-600'} ${collapsed ? 'md:hidden' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* User & Collapse Section */}
      <div className="p-3 border-t border-slate-100 flex flex-col gap-2 shrink-0 overflow-hidden">
        {/* User Card */}
        <div className={`flex items-center justify-between px-2 ${collapsed ? 'md:justify-center' : ''}`}>
          <div className="flex items-center overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-medium text-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className={`ml-3 flex flex-col max-w-[120px] ${collapsed ? 'md:hidden' : ''}`}>
              <span className="text-sm font-medium text-slate-900 truncate">{user?.name}</span>
              <span className="text-xs text-slate-500 truncate">{user?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className={`text-slate-400 hover:text-red-500 p-1 ${collapsed ? 'md:hidden' : ''}`} title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center h-8 rounded-lg hover:bg-slate-100 text-slate-500 w-full"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
