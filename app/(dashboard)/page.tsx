'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { useClinic } from '@/hooks/useClinic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateClinic, getDoctors, addDoctor, deleteDoctor, createInvite } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Doctor } from '@/types';
import { Trash2, Plus, Clock, UserPlus, Copy, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsPage() {
  const { clinic, loading } = useClinic();
  const { user } = useAuth();

  // Clinic Info
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // Working Hours
  const [hours, setHours] = useState<Record<string, { open: string; close: string; isClosed: boolean }>>({});
  const [savingHours, setSavingHours] = useState(false);

  // Doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpec, setDoctorSpec] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);

  // Team
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (clinic) {
      setName(clinic.name || '');
      setSlug(clinic.slug || '');
      setPhone(clinic.phone || '');
      setAddress(clinic.address || '');

      // Init working hours
      const defaultHours: Record<string, any> = {};
      DAYS.forEach(day => {
        defaultHours[day] = clinic.workingHours?.[day] || { open: '09:00', close: '18:00', isClosed: false };
      });
      setHours(defaultHours);

      // Load doctors
      getDoctors(clinic.id).then(setDoctors);
    }
  }, [clinic]);

  // Clinic Info Save
  const handleSave = async () => {
    if (!clinic?.id) return;
    if (!name.trim() || !slug.trim()) { toast.error('Name and slug required'); return; }
    setSaving(true);
    try {
      await updateClinic(clinic.id, { name, slug, phone, address });
      toast.success('Settings saved!');
    } catch (e) {
      toast.error('Failed to save');
    } finally { setSaving(false); }
  };

  // Working Hours Save
  const handleSaveHours = async () => {
    if (!clinic?.id) return;
    setSavingHours(true);
    try {
      await updateClinic(clinic.id, { workingHours: hours });
      toast.success('Working hours updated!');
    } catch (e) {
      toast.error('Failed to update hours');
    } finally { setSavingHours(false); }
  };

  const updateHour = (day: string, field: string, value: string | boolean) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  // Add Doctor
  const handleAddDoctor = async () => {
    if (!clinic?.id || !doctorName.trim()) { toast.error('Doctor name required'); return; }
    setAddingDoctor(true);
    try {
      await addDoctor(clinic.id, { name: doctorName, specialization: doctorSpec });
      const updated = await getDoctors(clinic.id);
      setDoctors(updated);
      setDoctorName(''); setDoctorSpec(''); setShowDoctorForm(false);
      toast.success('Doctor added!');
    } catch (e) {
      toast.error('Failed to add doctor');
    } finally { setAddingDoctor(false); }
  };

  // Delete Doctor
  const handleDeleteDoctor = async (doctorId: string) => {
    if (!clinic?.id) return;
    try {
      await deleteDoctor(clinic.id, doctorId);
      setDoctors(prev => prev.filter(d => d.id !== doctorId));
      toast.success('Doctor removed');
    } catch (e) {
      toast.error('Failed to remove doctor');
    }
  };

  // Team Invite
  const handleInvite = async () => {
    if (!clinic?.id || !inviteEmail.trim()) { toast.error('Email required'); return; }
    setInviting(true);
    try {
      const token = crypto.randomUUID();
      await createInvite({ email: inviteEmail, clinicId: clinic.id, clinicName: clinic.name, role: 'Receptionist', used: false, createdAt: Date.now() }, token);
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      toast.success('Invite created!');
    } catch (e) {
      toast.error('Failed to create invite');
    } finally { setInviting(false); }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your clinic profile, team, and integrations." />

      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="bg-white border text-sm border-slate-200 p-1 w-full flex overflow-x-auto justify-start h-auto rounded-lg mb-6 shadow-sm">
          <TabsTrigger value="clinic" className="rounded-md data-[state=active]:bg-sky-50 data-[state=active]:text-sky-600">Clinic Info</TabsTrigger>
          <TabsTrigger value="hours" className="rounded-md data-[state=active]:bg-sky-50 data-[state=active]:text-sky-600">Working Hours</TabsTrigger>
          <TabsTrigger value="doctors" className="rounded-md data-[state=active]:bg-sky-50 data-[state=active]:text-sky-600">Doctors</TabsTrigger>
          <TabsTrigger value="team" className="rounded-md data-[state=active]:bg-sky-50 data-[state=active]:text-sky-600">Team</TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-md data-[state=active]:bg-sky-50 data-[state=active]:text-sky-600">Integrations</TabsTrigger>
        </TabsList>

        {/* CLINIC INFO */}
        <TabsContent value="clinic" className="mt-0">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl shadow-sm flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Clinic Details</h3>
              <p className="text-sm text-slate-500 mt-1">Update your clinic information and URL slug.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Clinic Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Booking URL Slug</label>
                <input type="text" value={slug} onChange={e => { setSlug(e.target.value); toast('Changing slug will break existing links', { icon: '⚠️', id: 'slug-warn' }); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                <p className="text-xs text-slate-400 mt-1">dermdesk.vercel.app/book/{slug}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Phone Number</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Address</label>
                <textarea rows={3} value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
              </div>
              <button onClick={handleSave} disabled={saving} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </TabsContent>

        {/* WORKING HOURS */}
        <TabsContent value="hours" className="mt-0">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl shadow-sm flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Working Hours</h3>
              <p className="text-sm text-slate-500 mt-1">Manage when the clinic is open for booking.</p>
            </div>
            <div className="space-y-3">
              {DAYS.map(day => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-24 font-medium text-slate-700 text-sm">{day}</div>
                  <div className="flex-1 flex gap-2">
                    <input type="time" value={hours[day]?.open || '09:00'} disabled={hours[day]?.isClosed} onChange={e => updateHour(day, 'open', e.target.value)} className="h-9 w-full bg-white border border-slate-200 rounded-lg px-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-40" />
                    <input type="time" value={hours[day]?.close || '18:00'} disabled={hours[day]?.isClosed} onChange={e => updateHour(day, 'close', e.target.value)} className="h-9 w-full bg-white border border-slate-200 rounded-lg px-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-40" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={hours[day]?.isClosed || false} onChange={e => updateHour(day, 'isClosed', e.target.checked)} className="rounded" /> Closed
                  </label>
                </div>
              ))}
            </div>
            <button onClick={handleSaveHours} disabled={savingHours} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2 w-fit">
              {savingHours ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <><Clock className="w-4 h-4" />Update Hours</>}
            </button>
          </div>
        </TabsContent>

        {/* DOCTORS */}
        <TabsContent value="doctors" className="mt-0">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Doctors</h3>
                <p className="text-sm text-slate-500 mt-1">Manage doctors in your clinic.</p>
              </div>
              <button onClick={() => setShowDoctorForm(true)} className="bg-sky-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-sky-600 active:scale-95 transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Doctor
              </button>
            </div>

            {showDoctorForm && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Doctor Name</label>
                  <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Dr. Priya Sharma" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Specialization</label>
                  <input type="text" value={doctorSpec} onChange={e => setDoctorSpec(e.target.value)} placeholder="Dermatologist" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddDoctor} disabled={addingDoctor} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600 active:scale-95 disabled:opacity-60 flex items-center gap-2">
                    {addingDoctor ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Doctor'}
                  </button>
                  <button onClick={() => setShowDoctorForm(false)} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            )}

            {doctors.length === 0 && !showDoctorForm ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Stethoscope className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm text-slate-500">No doctors added yet</p>
                <p className="text-xs text-slate-400 mt-1">Add a doctor to assign appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-semibold text-sm">
                        {doc.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.specialization || 'General'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteDoctor(doc.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TEAM */}
        <TabsContent value="team" className="mt-0">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl shadow-sm flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Team Access</h3>
              <p className="text-sm text-slate-500 mt-1">Invite receptionists or staff members.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Staff Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="receptionist@clinic.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
              </div>
              <button onClick={handleInvite} disabled={inviting} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600 active:scale-95 disabled:opacity-60 flex items-center gap-2 w-fit">
                {inviting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" />Send Invite</>}
              </button>
            </div>

            {inviteLink && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs font-medium text-emerald-700 mb-2">✅ Invite link created! Share this with your staff:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 flex-1 break-all text-slate-700">{inviteLink}</code>
                  <button onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('Copied!'); }} className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 shrink-0">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="mt-0">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl shadow-sm flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Integrations</h3>
              <p className="text-sm text-slate-500 mt-1">Connect third-party services to enhance your clinic.</p>
            </div>

            {/* WhatsApp/Twilio - Coming Soon */}
            <div className="border border-slate-200 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">Coming Soon</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 font-bold text-sm">W</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">WhatsApp Reminders</p>
                  <p className="text-xs text-slate-500">Auto-send appointment reminders via WhatsApp</p>
                </div>
              </div>
              <div className="space-y-2 opacity-50 pointer-events-none">
                <input type="text" placeholder="Twilio Account SID" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" disabled />
                <input type="password" placeholder="Twilio Auth Token" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" disabled />
                <input type="text" placeholder="WhatsApp Number (+91...)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" disabled />
              </div>
            </div>

            {/* Google Calendar - Coming Soon */}
            <div className="border border-slate-200 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">Coming Soon</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">G</div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Google Calendar Sync</p>
                  <p className="text-xs text-slate-500">Sync appointments with Google Calendar automatically</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
