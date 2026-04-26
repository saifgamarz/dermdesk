'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CalendarDays, Users, CreditCard, AlertCircle, Plus } from 'lucide-react';
import { useClinic } from '@/hooks/useClinic';
import { getAppointments, getPatients, getPayments, createAppointment } from '@/lib/firestore';
import { format } from 'date-fns';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import Link from 'next/link';
import useSWR from 'swr';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { clinic } = useClinic();
  
  const { data: appointments = [], isLoading: apptsLoading, mutate: mutateAppts } = useSWR(
    clinic?.id ? `dashboard-appointments-${clinic.id}` : null,
    () => getAppointments(clinic!.id),
    { fallbackData: [] }
  );
  
  const { data: patients = [], isLoading: patLoading } = useSWR(
    clinic?.id ? `dashboard-patients-${clinic.id}` : null,
    () => getPatients(clinic!.id),
    { fallbackData: [] }
  );

  const { data: payments = [], isLoading: payLoading } = useSWR(
    clinic?.id ? `dashboard-payments-${clinic.id}` : null,
    () => getPayments(clinic!.id),
    { fallbackData: [] }
  );

  const loading = apptsLoading || patLoading || payLoading;

  const [qbName, setQbName] = useState('');
  const [qbTime, setQbTime] = useState('');
  const [qbTreatment, setQbTreatment] = useState('General Consultation');
  const [qbLoading, setQbLoading] = useState(false);

  const handleQuickBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qbName || !qbTime) return;
    setQbLoading(true);
    try {
      await createAppointment(clinic!.id, {
        patientId: 'walk-in',
        patientName: qbName,
        doctorId: 'any',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: qbTime,
        treatmentType: qbTreatment,
        status: 'Confirmed'
      });
      toast.success('Appointment booked!');
      setQbName('');
      setQbTime('');
      setQbTreatment('General Consultation');
      mutateAppts();
    } catch (err) {
      toast.error('Failed to book appointment');
    } finally {
      setQbLoading(false);
    }
  };

  if (clinic === null && !loading) {
     return (
       <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
          <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="size-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Clinic Assigned</h2>
          <p>Please contact your Super Admin to assign you to a clinic.</p>
       </div>
     );
  }

  if (loading || !clinic?.id) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-24" />
        </div>
      </div>
    );
  }

  // Stats calc
  const todaysAppointments = appointments.filter(a => a.date === format(new Date(), 'yyyy-MM-dd'));
  const currentMonth = format(new Date(), 'yyyy-MM');
  const thisMonthPatients = patients.filter(p => format(new Date(p.createdAt), 'yyyy-MM') === currentMonth);
  const pendingFees = payments.filter(p => !p.id).length; // Dummy
  const noShowsToday = todaysAppointments.filter(a => a.status === 'No-show').length;

  return (
    <>
      <PageHeader 
        title="Clinic Dashboard" 
        actions={
          <>
            <div className="relative hidden sm:block">
               <input type="text" placeholder="Search patient or appt..." className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-60 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent" />
               <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <button className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-transform duration-150">
              <Plus className="w-4 h-4" />
              New Appointment
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Today's Appointments" 
          value={todaysAppointments.length}
          icon={CalendarDays}
          iconBgColor="bg-sky-100"
          iconColor="text-sky-600"
        />
        <StatsCard 
          title="Patients This Month" 
          value={thisMonthPatients.length}
          icon={Users}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard 
          title="Pending Fees" 
          value={`₹${pendingFees * 1000}`} // Mock val
          icon={CreditCard}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatsCard 
          title="No-shows Today" 
          value={noShowsToday}
          icon={AlertCircle}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
        
        {/* Left Schedule */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-base font-semibold text-slate-900 tracking-tight">Today&apos;s Schedule</h3>
            <Link href="/appointments" className="text-sm font-semibold text-sky-500 hover:text-sky-600 bg-transparent border-none">
              View All
            </Link>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[300px] hover:shadow-md transition-shadow duration-200">
             {todaysAppointments.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                 <CalendarDays className="size-16 text-slate-200 mb-3" />
                 <p className="text-sm font-medium text-slate-500">No appointments scheduled for today.</p>
                 <p className="text-xs text-slate-400 mt-1">Enjoy your day or book a new appointment.</p>
               </div>
              ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[500px]">
                   <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                       <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Time</th>
                       <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Patient</th>
                       <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Treatment</th>
                       <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {todaysAppointments.map((app) => (
                       <tr key={app.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
                         <td className="py-3 px-4 text-sm text-slate-700 whitespace-nowrap">{app.time}</td>
                         <td className="py-3 px-4 text-sm font-medium text-slate-900">{app.patientName}</td>
                         <td className="py-3 px-4 text-sm text-slate-500">{app.treatmentType}</td>
                         <td className="py-3 px-4">
                           <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                             app.status === 'Scheduled' ? 'bg-sky-100 text-sky-700' :
                             app.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                             app.status === 'Completed' ? 'bg-slate-100 text-slate-600' :
                             app.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                             'bg-amber-100 text-amber-700'
                           }`}>
                             {app.status}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </div>

        {/* Right Quick Add */}
        <div className="bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">
          <div className="p-5 pb-0">
            <h3 className="m-0 text-base font-semibold text-slate-900 tracking-tight">Quick Book</h3>
            <p className="m-0 mt-1 text-xs text-slate-500">Add a walk-in patient</p>
          </div>
          <form onSubmit={handleQuickBook} className="px-5 flex flex-col gap-4">
            <div>
               <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Patient Name</label>
               <input type="text" placeholder="Full Name" required value={qbName} onChange={e => setQbName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Time Slot</label>
              <input type="time" required value={qbTime} onChange={e => setQbTime(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Treatment</label>
              <select value={qbTreatment} onChange={e => setQbTreatment(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white">
                <option>General Consultation</option>
                <option>Acne Scars Treatment</option>
                <option>Laser Hair Removal</option>
                <option>Botox / Fillers</option>
              </select>
            </div>
            <button disabled={qbLoading} type="submit" className="w-full bg-sky-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-sky-600 transition-colors active:scale-95 duration-150 disabled:opacity-50 flex items-center justify-center">
              {qbLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Appointment'}
            </button>
          </form>
          <div className="mt-auto bg-slate-50 p-3 mx-4 mb-4 rounded-lg flex items-center gap-2.5 border border-slate-100">
             <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
             <span className="text-xs text-slate-500 font-medium">Next slot available</span>
          </div>
        </div>
      </div>
    </>
  );
}
