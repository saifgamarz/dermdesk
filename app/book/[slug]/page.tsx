'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getClinicBySlug, createAppointment, createPatient } from '@/lib/firestore';
import { Clinic } from '@/types';
import { CalendarDays, Clock, User, CheckCircle2, Stethoscope, MapPin, Phone } from 'lucide-react';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking State
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [details, setDetails] = useState({ name: '', phone: '', email: '', concern: 'Consultation', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      getClinicBySlug(slug).then(c => {
        setClinic(c);
        setLoading(false);
      });
    }
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
       <LoadingSkeleton className="h-[400px] w-full max-w-md rounded-2xl" />
    </div>
  );

  if (!clinic) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
       <div>
         <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-slate-400" />
         </div>
         <h1 className="text-2xl font-bold text-slate-900 mb-2">Clinic Not Found</h1>
         <p className="text-slate-500">Please check the correct booking link.</p>
       </div>
    </div>
  );

  const availableTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

  const handleSubmit = async () => {
    if (!details.name || !details.phone) {
      return toast.error("Please fill required details");
    }
    
    setSubmitting(true);
    try {
      // Create patient record
      const patientId = await createPatient(clinic.id, {
        name: details.name,
        phone: details.phone,
        email: details.email,
        age: 0, // default dummy, patient can update at desk
        gender: 'Other',
        allergies: [],
        skinConcerns: details.concern,
      });

      // Create appointment
      await createAppointment(clinic.id, {
        patientId,
        patientName: details.name,
        doctorId: '', // Auto assign or leave empty
        date: selectedDate,
        time: selectedTime,
        treatmentType: details.concern,
        status: 'Scheduled',
        notes: details.notes
      });
      
      setStep(4);
    } catch (e: any) {
      toast.error(e.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
           <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-4">
             <Stethoscope className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{clinic.name}</h1>
           <div className="flex flex-wrap justify-center gap-4 mt-3 text-sm text-slate-500">
             <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {clinic.address || 'Address not listed'}</div>
             <div className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {clinic.phone}</div>
           </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 py-8">
        {step < 4 && (
          <div className="flex items-center justify-between mb-8 px-4 relative">
             <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -z-10 rounded-full -translate-y-1/2"></div>
             <div className="absolute top-1/2 left-0 h-1 bg-sky-500 -z-10 rounded-full -translate-y-1/2 transition-all duration-300" style={{ width: `${(step-1)*50}%` }}></div>
             
             {[1, 2, 3].map(num => (
               <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                 step >= num ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white border-slate-300 text-slate-400'
               }`}>
                 {num}
               </div>
             ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-sky-500" /> Date Selection
              </h2>
              <input 
                type="date" 
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]} // Prevents past dates
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button 
                disabled={!selectedDate}
                onClick={() => setStep(2)}
                className="w-full mt-6 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                Show Available Times
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-sky-500" /> Time slot for {selectedDate}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableTimes.map(t => (
                  <button 
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedTime === t 
                        ? 'bg-sky-500 text-white border-sky-500 shadow-md ring-2 ring-sky-500 ring-offset-2' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                 <button onClick={() => setStep(1)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50">Back</button>
                 <button onClick={() => setStep(3)} disabled={!selectedTime} className="flex-2 w-full py-3 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 disabled:opacity-50">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-sky-500" /> Patient Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Full Name *</label>
                  <input type="text" value={details.name} onChange={e => setDetails({...details, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Phone Number *</label>
                  <input type="tel" value={details.phone} onChange={e => setDetails({...details, phone: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Reason for visit</label>
                  <select value={details.concern} onChange={e => setDetails({...details, concern: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white">
                    <option>Consultation</option>
                    <option>Acne Treatment</option>
                    <option>Hair Fall</option>
                    <option>Laser Hair Removal</option>
                    <option>Skin Pigmentation</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Additional Notes</label>
                  <textarea value={details.notes} onChange={e => setDetails({...details, notes: e.target.value})} rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white resize-none" placeholder="Any past history or specific doctor request?" />
                </div>
              </div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                 <button onClick={() => setStep(2)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50">Back</button>
                 <button onClick={handleSubmit} disabled={submitting} className="flex-2 w-[60%] py-3 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 disabled:opacity-50 flex items-center justify-center">
                   {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Booking'}
                 </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
              <p className="text-slate-500 mb-6">Your appointment is scheduled for<br/><strong className="text-slate-900">{selectedDate} at {selectedTime}</strong></p>
              
              <div className="p-4 bg-slate-50 rounded-xl text-left border border-slate-100 mb-8 max-w-sm mx-auto">
                <div className="text-sm border-b border-slate-200 pb-2 mb-2">
                  <span className="text-slate-500 uppercase text-xs font-medium tracking-wide block mb-0.5">Patient</span>
                  <span className="text-slate-900 font-medium">{details.name}</span>
                </div>
                <div className="text-sm border-b border-slate-200 pb-2 mb-2">
                  <span className="text-slate-500 uppercase text-xs font-medium tracking-wide block mb-0.5">Clinic Location</span>
                  <span className="text-slate-900 font-medium">{clinic.address || clinic.name}</span>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => {
                    const startDate = selectedDate.replace(/-/g, '');
                    const startTime = selectedTime.replace(':', '') + '00';
                    const endTime = (parseInt(selectedTime.split(':')[0]) + 1).toString().padStart(2, '0') + selectedTime.split(':')[1] + '00';
                    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Appointment+at+${encodeURIComponent(clinic.name)}&dates=${startDate}T${startTime}/${startDate}T${endTime}&details=${encodeURIComponent(`Patient: ${details.name}\nClinic: ${clinic.name}`)}&location=${encodeURIComponent(clinic.address || clinic.name)}`;
                    window.open(calUrl, '_blank');
                  }}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50"
                >
                  Add to Calendar
                </button>
                <button 
                  onClick={() => {
                    setStep(1);
                    setSelectedDate('');
                    setSelectedTime('');
                    setDetails({ name: '', phone: '', email: '', concern: 'Consultation', notes: '' });
                  }} 
                  className="px-6 py-2.5 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600"
                >
                  Book Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
