'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getInvite, markInviteUsed, createUser } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Invite } from '@/types';
import toast from 'react-hot-toast';
import { Stethoscope } from 'lucide-react';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (token) {
      getInvite(token).then((data) => {
        if (!data) {
          setErrorStatus('Invalid or expired invite link.');
        } else if (data.used) {
          setErrorStatus('This invite link has already been used.');
        } else {
          setInvite(data);
        }
        setLoading(false);
      });
    }
  }, [token]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setActionLoading(true);
    try {
      // 1. Create firebase auth user
      const cred = await createUserWithEmailAndPassword(auth, invite.email, password);
      
      // 2. Create user in firestore
      await createUser({
        id: cred.user.uid,
        name: fullName,
        email: invite.email,
        role: invite.role,
        clinicId: invite.clinicId,
        createdAt: Date.now()
      });

      // 3. Mark invite as used
      await markInviteUsed(token);

      toast.success('Account created! Please login.');
      
      // Attempt login instantly
      await signInWithEmailAndPassword(auth, invite.email, password);
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-start pt-16 sm:pt-24 justify-center bg-slate-50">
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '16px 16px', opacity: 0.5 }}
      />
      
      <div className="w-full max-w-md relative z-10 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mb-4">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">DermDesk</h1>
          </div>

          {errorStatus ? (
             <div className="text-center space-y-4">
               <div className="text-red-500 font-medium">{errorStatus}</div>
               <button onClick={() => router.push('/login')} className="text-sky-500 hover:underline text-sm">
                 Go to login
               </button>
             </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 text-center mb-6">
                You&apos;ve been invited to manage <strong>{invite?.clinicName}</strong> on DermDesk.
              </p>
              
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Email</label>
                  <input 
                    type="email" 
                    disabled
                    value={invite?.email || ''}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Password</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 block">Confirm Password</label>
                  <input 
                    type="password" 
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" 
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full h-11 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg text-sm active:scale-95 transition-all duration-150 mt-6 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Accept Invite & Create Account'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
