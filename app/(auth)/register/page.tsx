'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createClinic, createUser } from '@/lib/firestore';
import { Stethoscope, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEFAULT_HOURS = {
  open: '09:00',
  close: '18:00',
  isClosed: false
};

const INITIAL_WORKING_HOURS = {
  Monday: { ...DEFAULT_HOURS },
  Tuesday: { ...DEFAULT_HOURS },
  Wednesday: { ...DEFAULT_HOURS },
  Thursday: { ...DEFAULT_HOURS },
  Friday: { ...DEFAULT_HOURS },
  Saturday: { ...DEFAULT_HOURS, isClosed: true },
  Sunday: { ...DEFAULT_HOURS, isClosed: true },
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [clinicData, setClinicData] = useState({ name: '', slug: '', phone: '', address: '' });
  const [adminData, setAdminData] = useState({ name: '', email: '', password: '' });
  const [workingHours, setWorkingHours] = useState(INITIAL_WORKING_HOURS);

  const handleNext = () => {
    if (step === 1 && (!clinicData.name || !clinicData.slug || !clinicData.phone)) {
      return toast.error('Please fill required clinic details');
    }
    if (step === 2 && (!adminData.name || !adminData.email || !adminData.password)) {
      return toast.error('Please fill required admin details');
    }
    setStep(s => s + 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // 1. Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
      
      // 2. Create clinic record
      const clinicId = await createClinic({
        name: clinicData.name,
        slug: clinicData.slug,
        phone: clinicData.phone,
        address: clinicData.address,
        workingHours,
        logoUrl: ''
      });

      // 3. Create user record
      await createUser({
        id: userCredential.user.uid,
        name: adminData.name,
        email: adminData.email,
        role: 'Admin',
        clinicId,
        createdAt: Date.now()
      });

      toast.success('Registration successful!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to register clinic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 py-12">
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.5 }}
      />
      
      <div className="w-full max-w-lg relative z-10 px-4">
        <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-100">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">Clinic Setup</h1>
            </div>
            <div className="text-sm font-medium text-slate-500">
              Step {step} of 3
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className={`h-1.5 flex-1 rounded-full ${step >= idx ? 'bg-sky-500' : 'bg-slate-100'}`} />
            ))}
          </div>

          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-semibold text-slate-900">Clinic Details</h2>
                <div className="space-y-1.5">
                  <Label>Clinic Name *</Label>
                  <Input 
                    value={clinicData.name} 
                    onChange={e => setClinicData({...clinicData, name: e.target.value})} 
                    placeholder="e.g. SkinWell Clinic"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Booking URL Slug *</Label>
                  <Input 
                    value={clinicData.slug} 
                    onChange={e => setClinicData({...clinicData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
                    placeholder="e.g. skinwell"
                  />
                  <p className="text-xs text-slate-500">Patients will book at dermdesk.com/book/{clinicData.slug || 'slug'}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number *</Label>
                  <Input 
                    value={clinicData.phone} 
                    onChange={e => setClinicData({...clinicData, phone: e.target.value})} 
                    placeholder="Clinic contact number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Full Address</Label>
                  <Input 
                    value={clinicData.address} 
                    onChange={e => setClinicData({...clinicData, address: e.target.value})} 
                    placeholder="Physical address"
                  />
                </div>
                <button onClick={handleNext} className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium mt-4">Continue</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-semibold text-slate-900">Admin Account</h2>
                <p className="text-sm text-slate-500 mb-4">Create the master account for this clinic.</p>
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input 
                    value={adminData.name} 
                    onChange={e => setAdminData({...adminData, name: e.target.value})} 
                    placeholder="Dr. First Last"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address *</Label>
                  <Input 
                    type="email"
                    value={adminData.email} 
                    onChange={e => setAdminData({...adminData, email: e.target.value})} 
                    placeholder="admin@clinic.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Password *</Label>
                  <Input 
                    type="password"
                    value={adminData.password} 
                    onChange={e => setAdminData({...adminData, password: e.target.value})} 
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(1)} className="flex-1 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium">Back</button>
                  <button onClick={handleNext} className="flex-1 h-11 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium">Continue</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-semibold text-slate-900">Working Hours</h2>
                <p className="text-sm text-slate-500 mb-4">Set your default availability for appointments.</p>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {Object.entries(workingHours).map(([day, hours]) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-slate-100 rounded-lg bg-slate-50">
                      <div className="flex items-center justify-between sm:w-24">
                        <span className="text-sm font-medium text-slate-700">{day}</span>
                        <label className="sm:hidden flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={hours.isClosed}
                            onChange={e => setWorkingHours(prev => ({...prev, [day]: {...prev[day as keyof typeof INITIAL_WORKING_HOURS], isClosed: e.target.checked}}))}
                            className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                          />
                          Closed
                        </label>
                      </div>
                      <div className="flex-1 flex gap-2">
                        <Input 
                          type="time" 
                          value={hours.open}
                          disabled={hours.isClosed}
                          onChange={e => setWorkingHours(prev => ({...prev, [day]: {...prev[day as keyof typeof INITIAL_WORKING_HOURS], open: e.target.value}}))}
                          className="h-9 w-full bg-white"
                        />
                        <Input 
                          type="time" 
                          value={hours.close}
                          disabled={hours.isClosed}
                          onChange={e => setWorkingHours(prev => ({...prev, [day]: {...prev[day as keyof typeof INITIAL_WORKING_HOURS], close: e.target.value}}))}
                          className="h-9 w-full bg-white"
                        />
                      </div>
                      <label className="hidden sm:flex items-center gap-2 text-sm text-slate-600 cursor-pointer w-20 justify-end">
                        <input 
                          type="checkbox" 
                          checked={hours.isClosed}
                          onChange={e => setWorkingHours(prev => ({...prev, [day]: {...prev[day as keyof typeof INITIAL_WORKING_HOURS], isClosed: e.target.checked}}))}
                          className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                        />
                        Closed
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button onClick={() => setStep(2)} className="flex-1 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium">Back</button>
                  <button onClick={handleRegister} disabled={loading} className="flex-1 h-11 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium flex items-center justify-center">
                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Complete Setup'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
