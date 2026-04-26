'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, X, Search, Filter, MoreHorizontal } from 'lucide-react';
import { useClinic } from '@/hooks/useClinic';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { Appointment } from '@/types';
import { format } from 'date-fns';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import useSWR from 'swr';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AppointmentsPage() {
  const { clinic } = useClinic();
  
  const { data: appointments = [], isLoading, mutate: loadAppointments } = useSWR(
    clinic?.id ? `appointments-${clinic.id}` : null,
    () => getAppointments(clinic!.id),
    { fallbackData: [] }
  );

  const loading = !clinic?.id || (isLoading && appointments.length === 0);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState('All');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId || !clinic?.id) return;
    try {
      await deleteAppointment(clinic.id, deleteId);
      toast.success('Appointment deleted');
      setDeleteId(null);
      loadAppointments();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: any) => {
    try {
      await updateAppointment(clinic!.id, id, { status: newStatus });
      toast.success('Status updated');
      loadAppointments();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update status');
    }
  };

  const filtered = appointments.filter(a => {
    const matchDate = a.date === dateFilter;
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchDate && matchStatus;
  });

  return (
    <>
      <PageHeader 
        title="Appointments" 
        actions={
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex-1 min-w-[200px] relative">
           <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
           <input type="text" placeholder="Search patient..." className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <input 
          type="date" 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white" 
        />
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="No-show">No-show</option>
        </select>
        <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="p-6 space-y-4">
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
            <LoadingSkeleton className="h-10 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p>No appointments found for this filter.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Time</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Patient</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Doctor</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Treatment</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-slate-900 whitespace-nowrap">{app.time}</td>
                  <td className="py-3 px-4 text-sm text-slate-900 font-medium">{app.patientName}</td>
                  <td className="py-3 px-4 text-sm text-slate-500">Dr. {app.doctorId || 'Assigned'}</td>
                  <td className="py-3 px-4 text-sm text-slate-700">{app.treatmentType}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusUpdate(app.id, 'Confirmed')}>Mark Confirmed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(app.id, 'Completed')}>Mark Completed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusUpdate(app.id, 'No-show')}>Mark No-show</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = '/fees'} className="text-sky-600 font-medium">Record Payment</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(app.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog 
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="Delete Appointment"
        description="Are you sure you want to delete this appointment? This action cannot be undone."
        onConfirm={handleDelete}
      />

      {/* Drawer */}
      {isDrawerOpen && (
         <>
           <div className="fixed inset-0 bg-slate-900/50 z-[100]" onClick={() => setIsDrawerOpen(false)} />
           <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-[110] animate-in slide-in-from-right duration-300 flex flex-col">
             <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
               <h2 className="text-lg font-semibold text-slate-900">New Appointment</h2>
               <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6">
                {/* Form placeholder */}
                <form className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Patient Name</label>
                    <input type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Date</label>
                    <input type="date" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Time</label>
                    <input type="time" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Treatment</label>
                    <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white">
                      <option>Consultation</option>
                      <option>Follow-up</option>
                      <option>Laser Therapy</option>
                      <option>Peels</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Notes</label>
                    <textarea rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none" />
                  </div>
                </form>
             </div>
             <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
                <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
                <button className="flex-1 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600">Save</button>
             </div>
           </div>
         </>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'Scheduled': 'bg-sky-100 text-sky-700',
    'Confirmed': 'bg-emerald-100 text-emerald-700',
    'Completed': 'bg-slate-100 text-slate-600',
    'Cancelled': 'bg-red-100 text-red-600',
    'No-show': 'bg-amber-100 text-amber-700',
  };
  const css = styles[status] || styles['Scheduled'];
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${css}`}>
      {status}
    </span>
  );
}
