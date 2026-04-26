'use client';

import { useAuth } from './useAuth';
import { getClinic } from '../lib/firestore';
import useSWR from 'swr';

export function useClinic() {
  const { user } = useAuth();
  
  const { data: clinic, isLoading } = useSWR(
    user?.clinicId ? `clinic-${user.clinicId}` : null,
    () => getClinic(user!.clinicId as string),
    { fallbackData: null }
  );

  const loading = user?.clinicId ? isLoading : false;

  return { clinic, loading };
}
