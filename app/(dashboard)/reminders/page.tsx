'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Settings, MessageSquare, Send } from 'lucide-react';

export default function RemindersPage() {
  return (
    <>
      <PageHeader title="Patient Reminders" subtitle="Automated SMS and WhatsApp reminders" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[20px]">
        {/* Settings & Template */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">Coming Soon</div>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              Automation Settings
            </h3>
            <div className="opacity-50 pointer-events-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Auto-Reminders</p>
                <p className="text-xs text-slate-500">Send automatically before appt</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>
            
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Send Timing</label>
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white">
                <option>24 hours before</option>
                <option>48 hours before</option>
                <option>Morning of appointment</option>
              </select>
            </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              Message Template
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-mono text-slate-700 mb-4">
              Hi {'{patient_name}'}, this is a reminder for your upcoming appointment at {'{clinic_name}'} on {'{date}'} at {'{time}'}. Reply YES to confirm.
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Custom Notes</label>
              <textarea rows={3} placeholder="Add any extra instructions (e.g. Please bring ID)" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"></textarea>
            </div>
            <button className="w-full mt-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2 rounded-lg text-sm transition-colors">
              Save Template
            </button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden min-h-[400px]">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Delivery Queue</h3>
          </div>
          <div className="p-12 text-center text-slate-500">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
               <Send className="w-6 h-6 text-slate-300" />
             </div>
             <p>No reminders in the queue.</p>
          </div>
        </div>
      </div>
    </>
  );
}
