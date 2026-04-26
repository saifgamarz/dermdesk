'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { getClinics, createClinic, createInvite } from '@/lib/firestore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, X, Link as LinkIcon, Building2, LogOut } from 'lucide-react';
import { Clinic } from '@/types';
import toast from 'react-hot-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function SuperAdminPage() {
  const { data: clinics = [], isLoading, mutate } = useSWR('all-clinics', getClinics);
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // New Clinic Form
  const [clinicName, setClinicName] = useState('');
  const [clinicSlug, setClinicSlug] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');

  const autoGenerateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createClinic({
        name: clinicName,
        slug: clinicSlug,
        phone: clinicPhone,
        address: clinicAddress,
        workingHours: {
            Monday: { open: '09:00', close: '18:00', isClosed: false },
            Tuesday: { open: '09:00', close: '18:00', isClosed: false },
            Wednesday: { open: '09:00', close: '18:00', isClosed: false },
            Thursday: { open: '09:00', close: '18:00', isClosed: false },
            Friday: { open: '09:00', close: '18:00', isClosed: false },
            Saturday: { open: '09:00', close: '18:00', isClosed: true },
            Sunday: { open: '09:00', close: '18:00', isClosed: true },
        }
      });
      toast.success('Clinic created successfully!');
      setIsDrawerOpen(false);
      setClinicName('');
      setClinicSlug('');
      setClinicPhone('');
      setClinicAddress('');
      mutate();
    } catch (err: any) {
      toast.error('Failed to create clinic.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;
    setActionLoading(true);
    try {
      const token = crypto.randomUUID();
      await createInvite({
        email: inviteEmail,
        clinicId: selectedClinic.id,
        clinicName: selectedClinic.name,
        role: 'Admin',
        used: false,
        createdAt: Date.now()
      }, token);
      
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      setGeneratedLink(`${appUrl}/invite/${token}`);
      toast.success('Invite link generated!');
    } catch (err: any) {
      toast.error('Failed to generate invite');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Copied to clipboard');
  };

  const openInviteModal = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setInviteEmail('');
    setGeneratedLink('');
    setIsInviteModalOpen(true);
  };

  return (
    <>
      <PageHeader 
        title="DermDesk Admin" 
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              Create New Clinic
            </button>
            <button
              onClick={handleLogout}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-all duration-150"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        }
      />
      <p className="text-slate-500 -mt-2 mb-6">Manage all clinics</p>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-shadow duration-200 flex items-center gap-4">
          <div className="p-3 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 text-sky-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Clinics</p>
            <h3 className="font-bold text-3xl text-slate-900">{clinics.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
             <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                 <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Clinic Name</th>
                 <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Slug</th>
                 <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</th>
                 <th className="py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wide">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {clinics.map((clinic) => (
                 <tr key={clinic.id} className="hover:bg-slate-50 transition-colors">
                   <td className="py-3 px-4 text-sm font-medium text-slate-900">{clinic.name}</td>
                   <td className="py-3 px-4 text-sm text-slate-500">{clinic.slug}</td>
                   <td className="py-3 px-4 text-sm text-slate-500">{clinic.phone || '-'}</td>
                   <td className="py-3 px-4 flex items-center gap-2">
                     <button onClick={() => openInviteModal(clinic)} className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-1.5 active:scale-95 transition-transform duration-100 font-medium">
                       Invite Doctor
                     </button>
                   </td>
                 </tr>
               ))}
               {clinics.length === 0 && !isLoading && (
                 <tr>
                   <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                     No clinics found.
                   </td>
                 </tr>
               )}
             </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
         <>
           <div className="fixed inset-0 bg-slate-900/50 z-[100]" onClick={() => setIsDrawerOpen(false)} />
           <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-[110] animate-in slide-in-from-right duration-300 flex flex-col">
             <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
               <h2 className="text-lg font-semibold text-slate-900">Create New Clinic</h2>
               <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6">
                <form id="clinic-form" onSubmit={handleCreateClinic} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Clinic Name</label>
                    <input 
                      type="text" 
                      required
                      value={clinicName}
                      onChange={(e) => {
                        setClinicName(e.target.value);
                        setClinicSlug(autoGenerateSlug(e.target.value));
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Slug (URL-friendly)</label>
                    <input 
                      type="text" 
                      required
                      value={clinicSlug}
                      onChange={(e) => setClinicSlug(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Phone Number</label>
                    <input 
                      type="tel" 
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Address</label>
                    <input 
                      type="text" 
                      value={clinicAddress}
                      onChange={(e) => setClinicAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                    />
                  </div>
                </form>
             </div>
             <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 active:scale-95 transition-transform duration-100">Cancel</button>
                <button type="submit" form="clinic-form" disabled={actionLoading} className="flex-1 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 active:scale-95 transition-transform duration-100 flex justify-center items-center">
                  {actionLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Clinic'}
                </button>
             </div>
           </div>
         </>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
               <h2 className="text-lg font-semibold text-slate-900">Invite Doctor</h2>
               <button onClick={() => setIsInviteModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6">
              {!generatedLink ? (
                <form onSubmit={handleInviteDoctor} className="space-y-4">
                  <p className="text-sm text-slate-500">Generate an invite link for a specific doctor email to join <strong>{selectedClinic?.name}</strong>.</p>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Doctor&apos;s Email</label>
                    <input 
                      type="email" 
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button type="submit" disabled={actionLoading} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 active:scale-95 transition-all duration-150 flex items-center">
                      {actionLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : null}
                      Generate Invite Link
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100">
                    Invite generated successfully for {inviteEmail}. Send this link to the doctor.
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedLink}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-600"
                    />
                    <button onClick={copyToClipboard} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg active:scale-95 transition-transform duration-100">
                      <LinkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
