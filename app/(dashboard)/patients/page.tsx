'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Plus, Search, MoreVertical, Phone, Clock, X } from 'lucide-react';
import { useClinic } from '@/hooks/useClinic';
import { getPatients, createPatient } from '@/lib/firestore';
import { Patient } from '@/types';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import Link from 'next/link';
import useSWR from 'swr';
import toast from 'react-hot-toast';

export default function PatientsPage() {
  const { clinic } = useClinic();
  
  const { data: patients = [], isLoading, mutate } = useSWR(
    clinic?.id ? `patients-${clinic.id}` : null,
    () => getPatients(clinic!.id),
    { fallbackData: [] }
  );

  const loading = !clinic?.id || (isLoading && patients.length === 0);

  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic?.id || !name || !age || !phone) return;
    setActionLoading(true);
    try {
      await createPatient(clinic.id, {
        name,
        age: parseInt(age),
        gender: gender as 'Male' | 'Female' | 'Other',
        phone,
        allergies: [],
        skinConcerns: '',
      });
      toast.success('Patient added successfully');
      setIsDrawerOpen(false);
      setName('');
      setAge('');
      setGender('Male');
      setPhone('');
      mutate();
    } catch (err) {
      toast.error('Failed to add patient');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search));

  return (
    <>
      <PageHeader 
        title="Patients" 
        actions={
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 active:scale-95 transition-transform duration-150"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        }
      />

      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm bg-white"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
          <LoadingSkeleton className="h-40" />
          <LoadingSkeleton className="h-40" />
          <LoadingSkeleton className="h-40" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 bg-white border border-slate-200 rounded-xl">
           <p className="text-slate-500">No patients found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
          {filtered.map(patient => {
            const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
            const lastVisit = patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never';
            
            return (
              <Link href={`/patients/${patient.id}`} key={patient.id} className="block bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-sky-200 transition-all cursor-pointer group relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-semibold text-lg shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-slate-900 group-hover:text-sky-600 tracking-tight transition-colors">
                      {patient.name}
                    </div>
                    <div className="text-xs text-slate-500">{patient.gender}, {patient.age} y/o</div>
                  </div>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center text-sm text-slate-600 gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {patient.phone}
                  </div>
                  <div className="flex items-center text-sm text-slate-600 gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Last visit: <span className="font-medium text-slate-900">{lastVisit}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Drawer */}
      {isDrawerOpen && (
         <>
           <div className="fixed inset-0 bg-slate-900/50 z-[100]" onClick={() => setIsDrawerOpen(false)} />
           <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-[110] animate-in slide-in-from-right duration-300 flex flex-col">
             <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
               <h2 className="text-lg font-semibold text-slate-900">New Patient</h2>
               <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6">
                <form id="patient-form" onSubmit={handleCreatePatient} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Full Name</label>
                    <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Age</label>
                      <input type="number" required value={age} onChange={e => setAge(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Gender</label>
                      <select required value={gender} onChange={e => setGender(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Phone Number</label>
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                  </div>
                </form>
             </div>
             <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 active:scale-95 transition-transform duration-100">Cancel</button>
                <button type="submit" form="patient-form" disabled={actionLoading} className="flex-1 py-2 text-sm font-medium bg-sky-500 text-white rounded-lg hover:bg-sky-600 active:scale-95 transition-transform duration-100 disabled:opacity-50 flex items-center justify-center">
                  {actionLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Patient'}
                </button>
             </div>
           </div>
         </>
      )}
    </>
  );
}
