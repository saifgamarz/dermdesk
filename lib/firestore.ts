import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Clinic,
  User,
  Patient,
  Appointment,
  Payment,
  Reminder,
  Doctor,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ---------------------------
// Users
// ---------------------------
export async function getUser(userId: string): Promise<User | null> {
  const path = `users/${userId}`;
  try {
    const d = await getDoc(doc(db, 'users', userId));
    return d.exists() ? (d.data() as User) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function createUser(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), {
      ...user,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------
// Clinics
// ---------------------------
export async function getClinic(clinicId: string): Promise<Clinic | null> {
  const path = `clinics/${clinicId}`;
  try {
    const d = await getDoc(doc(db, 'clinics', clinicId));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as Clinic;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function getClinics(): Promise<Clinic[]> {
  const path = `clinics`;
  try {
    const q = query(collection(db, 'clinics'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Clinic));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getClinicBySlug(slug: string): Promise<Clinic | null> {
  const path = `clinics`;
  try {
    const q = query(collection(db, 'clinics'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as Clinic;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return null;
  }
}

export async function createClinic(clinic: Omit<Clinic, 'id' | 'createdAt'>): Promise<string> {
  const path = `clinics`;
  try {
    const ref = doc(collection(db, 'clinics'));
    await setDoc(ref, {
      ...clinic,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function updateClinic(clinicId: string, data: Partial<Clinic>): Promise<void> {
  const path = `clinics/${clinicId}`;
  try {
    await updateDoc(doc(db, 'clinics', clinicId), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------
// Doctors (Subcollection)
// ---------------------------
export async function getDoctors(clinicId: string): Promise<Doctor[]> {
  const path = `clinics/${clinicId}/doctors`;
  try {
    const q = query(collection(db, path));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// ---------------------------
// Patients (Subcollection)
// ---------------------------
export async function getPatients(clinicId: string): Promise<Patient[]> {
  const path = `clinics/${clinicId}/patients`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getPatient(clinicId: string, patientId: string): Promise<Patient | null> {
  const path = `clinics/${clinicId}/patients/${patientId}`;
  try {
    const d = await getDoc(doc(db, path));
    return d.exists() ? ({ id: d.id, ...d.data() } as Patient) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function createPatient(clinicId: string, data: Omit<Patient, 'id' | 'createdAt'>): Promise<string> {
  const path = `clinics/${clinicId}/patients`;
  try {
    const ref = doc(collection(db, path));
    await setDoc(ref, {
      ...data,
      createdAt: Date.now(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

// ---------------------------
// Appointments
// ---------------------------
export async function getAppointments(clinicId: string): Promise<Appointment[]> {
  const path = `clinics/${clinicId}/appointments`;
  try {
    const q = query(collection(db, path), orderBy('date', 'desc'), orderBy('time', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createAppointment(clinicId: string, data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = `clinics/${clinicId}/appointments`;
  try {
    const ref = doc(collection(db, path));
    await setDoc(ref, {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

export async function updateAppointment(clinicId: string, id: string, data: Partial<Appointment>): Promise<void> {
  const path = `clinics/${clinicId}/appointments/${id}`;
  try {
    await updateDoc(doc(db, path), {
      ...data,
      updatedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAppointment(clinicId: string, id: string): Promise<void> {
  const path = `clinics/${clinicId}/appointments/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------
// Invites
// ---------------------------
import { Invite } from '../types';

export async function getInvite(token: string): Promise<Invite | null> {
  const path = `invites/${token}`;
  try {
    const d = await getDoc(doc(db, 'invites', token));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as Invite;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function createInvite(invite: Omit<Invite, 'id'>, token: string): Promise<void> {
  const path = `invites/${token}`;
  try {
    await setDoc(doc(db, 'invites', token), invite);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markInviteUsed(token: string): Promise<void> {
  const path = `invites/${token}`;
  try {
    await updateDoc(doc(db, 'invites', token), { used: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getPayments(clinicId: string): Promise<Payment[]> {
  const path = `clinics/${clinicId}/payments`;
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function createPayment(clinicId: string, data: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
  const path = `clinics/${clinicId}/payments`;
  try {
    const ref = doc(collection(db, path));
    await setDoc(ref, {
      ...data,
      createdAt: Date.now(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

// ---------------------------
// Doctor CRUD
// ---------------------------
export async function addDoctor(clinicId: string, data: { name: string; specialization: string }): Promise<void> {
  const path = `clinics/${clinicId}/doctors`;
  try {
    await addDoc(collection(db, path), { ...data, isActive: true, createdAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteDoctor(clinicId: string, doctorId: string): Promise<void> {
  const path = `clinics/${clinicId}/doctors/${doctorId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
