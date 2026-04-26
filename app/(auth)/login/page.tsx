'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUser, createClinic, createUser, updateUserRole } from '@/lib/firestore';
import { Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'SuperAdmin') {
        router.push('/super-admin');
      } else if (user.role === 'Admin' || user.role === 'Receptionist' || user.role === 'Doctor') {
        router.push('/');
      } else {
        toast.error('Contact your admin to assign a role.');
      }
    }
  }, [user, router]);

  const processUserAfterLogin = async (uid: string, authEmail: string | null, displayName: string | null) => {
    const userDoc = await getUser(uid);
    const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

    if (!userDoc) {
      let finalRole: any = 'Admin';
      if (authEmail && superAdminEmail && authEmail === superAdminEmail) {
        finalRole = 'SuperAdmin';
      }

      if (finalRole !== 'SuperAdmin') {
        const clinicId = await createClinic({
          name: `${displayName || 'My'} Clinic`,
          slug: uid.substring(0, 8),
          phone: '',
          address: '',
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
        await createUser({
          id: uid,
          name: displayName || 'Doctor',
          email: authEmail || '',
          role: finalRole,
          clinicId,
          createdAt: Date.now()
        });
      } else {
        await createUser({
          id: uid,
          name: displayName || 'Super Admin',
          email: authEmail || '',
          role: finalRole,
          createdAt: Date.now()
        });
      }
      router.push(finalRole === 'SuperAdmin' ? '/super-admin' : '/');
      return;
    }

    if (authEmail && superAdminEmail && authEmail === superAdminEmail && userDoc.role !== 'SuperAdmin') {
      await updateUserRole(uid, 'SuperAdmin');
      router.push('/super-admin');
      return;
    }

    if (userDoc.role === 'SuperAdmin') {
      router.push('/super-admin');
    } else {
      router.push('/');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await processUserAfterLogin(cred.user.uid, cred.user.email, cred.user.displayName);
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await processUserAfterLogin(cred.user.uid, cred.user.email, cred.user.displayName);
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-start pt-16 sm:pt-24 justify-center bg-slate-50">
      {/* Dot Pattern Background */}
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
            <p className="text-slate-500 mt-1 text-sm max-w-xs">
              Smart clinic management for modern dermatologists
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full h-11 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
               <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Sign in with Google
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-3 text-xs text-slate-400 font-medium uppercase tracking-wide">
              or continue with email
            </span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-sky-500 hover:text-sky-600 font-medium">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg text-sm active:scale-95 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
