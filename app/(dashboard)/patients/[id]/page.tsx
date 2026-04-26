'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { useClinic } from '@/hooks/useClinic';
import { getPatient } from '@/lib/firestore';
import { Patient } from '@/types';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, MapPin, AlertTriangle, UploadCloud } from 'lucide-react';

export default function PatientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { clinic } = useClinic();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinic?.id && id) {
      getPatient(clinic.id, id).then(data => {
        setPatient(data);
        setLoading(false);
      });
    }
  }, [clinic?.id, id]);

  if (loading) return <LoadingSkeleton className="h-[400px]" />;
  if (!patient) return <div>Patient not found.</div>;

  const initials = patient.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <>
      <PageHeader 
        title={patient.name} 
        subtitle={`Patient ID: ${patient.id}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
        
        {/* Left column - Info Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-500 font-medium text-2xl flex items-center justify-center mb-4">
                  {initials}
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{patient.name}</h2>
                <span className="text-sm text-slate-500">{patient.gender}, {patient.age} years</span>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex gap-3">
                  <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700">{patient.phone}</span>
                </div>
                {patient.email && (
                  <div className="flex gap-3">
                    <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700">{patient.email}</span>
                  </div>
                )}
                {patient.address && (
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-700">{patient.address}</span>
                  </div>
                )}
              </div>

              {(patient.allergies?.length > 0 || patient.skinConcerns) && (
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                  {patient.allergies?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wide text-red-500 flex items-center gap-1 mb-2">
                        <AlertTriangle className="w-3 h-3" /> Allergies
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {patient.allergies.map(a => (
                          <span key={a} className="px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-md border border-red-100">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {patient.skinConcerns && (
                    <div>
                      <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Primary Concern</h3>
                      <p className="text-sm text-slate-700">{patient.skinConcerns}</p>
                    </div>
                  )}
                </div>
              )}
           </div>
        </div>

        {/* Right column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="treatments">Treatments</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appointments" className="mt-6 bg-white border border-slate-200 rounded-xl p-6 min-h-[300px]">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Appointment History</h3>
              <p className="text-sm text-slate-500 text-center py-8">No appointments found.</p>
            </TabsContent>
            
            <TabsContent value="treatments" className="mt-6 bg-white border border-slate-200 rounded-xl p-6 min-h-[300px]">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Treatment Notes</h3>
              <p className="text-sm text-slate-500 text-center py-8">No treatments recorded.</p>
            </TabsContent>
            
            <TabsContent value="payments" className="mt-6 bg-white border border-slate-200 rounded-xl p-6 min-h-[300px]">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment History</h3>
              <p className="text-sm text-slate-500 text-center py-8">No payments found.</p>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-6 bg-white border border-slate-200 rounded-xl p-6 min-h-[300px] relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">Coming Soon</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Documents & Prescriptions</h3>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">Document uploads coming soon</p>
                <p className="text-xs text-slate-400 mt-1">Upload prescriptions and reports here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
