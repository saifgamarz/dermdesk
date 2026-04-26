'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Plus, Download, CreditCard, TrendingUp, Clock, X } from 'lucide-react';
import { useClinic } from '@/hooks/useClinic';
import { getPayments, createPayment } from '@/lib/firestore';
import { Payment } from '@/types';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import useSWR from 'swr';
import toast from 'react-hot-toast';

export default function FeesPage() {
  const { clinic } = useClinic();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const { data: payments = [], isLoading, mutate } = useSWR(
    clinic?.id ? `payments-${clinic.id}` : null,
    () => getPayments(clinic!.id),
    { fallbackData: [] }
  );

  const loading = !clinic?.id || (isLoading && payments.length === 0);

  // Form states
  const [patientName, setPatientName] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState(false);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic?.id || !patientName || !amount || !date) return;
    setActionLoading(true);
    try {
      await createPayment(clinic.id, {
        appointmentId: 'walk-in',
        patientId: 'walk-in',
        patientName,
        amount: parseFloat(amount),
        mode: mode as any,
        date
      });
      toast.success('Payment recorded successfully');
      setIsDrawerOpen(false);
      setPatientName('');
      setAmount('');
      setMode('UPI');
      setDate(new Date().toISOString().split('T')[0]);
      mutate();
    } catch (err) {
      toast.error('Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Generate CSV
    const headers = ['ID', 'Patient', 'Amount', 'Mode', 'Date'];
    const csvContent = [
      headers.join(','),
      ...payments.map(p => [p.id, p.patientName, p.amount, p.mode, p.date].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dermdesk-fees-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <>
      <PageHeader 
        title="Fees & Payments" 
        actions={
          <>
            <button onClick={handleExportCSV} className="bg-white border text-slate-700 border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hidden sm:flex">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </button>
          </>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px]">
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-24" />
          <LoadingSkeleton className="h-24" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px]">
            <StatsCard 
              title="Today's Collection" 
              value="₹0" // mock
              icon={TrendingUp}
              iconBgColor="bg-emerald-100"
              iconColor="text-emerald-500"
            />
            <StatsCard 
              title="Total Collected (This Month)" 
              value={`₹${payments.reduce((acc, p) => acc + Number(p.amount), 0)}`}
              icon={CreditCard} // generic payment icon
              iconBgColor="bg-sky-100"
              iconColor="text-sky-500"
            />
            <StatsCard 
              title="Pending Fees" 
              value="₹0" // mock
              icon={Clock}
              iconBgColor="bg-amber-100"
              iconColor="text-amber-500"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden min-h-[400px]">
             {payments.length === 0 ? (
               <div className="p-12 text-center text-slate-500">
                 <p>No payments recorded yet.</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[800px]">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-200">
                       <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Patient</th>
                       <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Date</th>
                       <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Amount</th>
                       <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Mode</th>
                       <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {payments.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                         <td className="py-3 px-4 text-sm font-medium text-slate-900">{p.patientName}</td>
                         <td className="py-3 px-4 text-sm text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                         <td className="py-3 px-4 text-sm font-medium text-slate-900">₹{p.amount}</td>
                         <td className="py-3 px-4">
                           <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md">{p.mode}</span>
                         </td>
                         <td className="py-3 px-4 text-right">
                           <button className="text-sm font-medium text-sky-500 hover:text-sky-600">Edit</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </>
      )}

      {/* Drawer */}
      {isDrawerOpen && (
         <>
           <div className="fixed inset-0 bg-slate-900/50 z-[100]" onClick={() => setIsDrawerOpen(false)} />
           <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-[110] animate-in slide-in-from-right duration-300 flex flex-col">
             <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
               <h2 className="text-lg font-semibold text-slate-900">Record Payment</h2>
               <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6">
                <form id="payment-form" onSubmit={handleRecordPayment} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Patient Name</label>
                    <input type="text" required value={patientName} onChange={e=>setPatientName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Amount (₹)</label>
                    <input type="number" required value={amount} onChange={e=>setAmount(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Payment Mode</label>
                    <select required value={mode} onChange={e=>setMode(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white">
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI</option>
                      <option>Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Date</label>
                    <input type="date" required value={date} onChange={e=>setDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                  </div>
                </form>
             </div>
             <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 active:scale-95 transition-transform duration-100">Cancel</button>
                <button type="submit" form="payment-form" disabled={actionLoading} className="flex-1 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 active:scale-95 transition-transform duration-100 disabled:opacity-50 flex items-center justify-center">
                  {actionLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Payment'}
                </button>
             </div>
           </div>
         </>
      )}
    </>
  );
}
