export type Role = 'SuperAdmin' | 'Admin' | 'Doctor' | 'Receptionist' | 'Patient';

export interface User {
  id: string; // auth.uid
  name: string;
  email: string;
  role: Role;
  clinicId?: string; // Optional for superadmin
  createdAt: number;
}

export interface Invite {
  id: string; // the token
  email: string;
  clinicId: string;
  clinicName: string;
  role: Role;
  used: boolean;
  createdAt: number;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  logoUrl?: string;
  workingHours: Record<string, { open: string; close: string; isClosed: boolean }>;
  createdAt: number;
}

export interface Doctor {
  id: string; // Document ID inside subcollection
  name: string;
  specialization: string;
  photoUrl?: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  address?: string;
  allergies: string[];
  skinConcerns: string;
  createdAt: number;
  lastVisit?: number;
}

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No-show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  treatmentType: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  amount: number;
  mode: 'Cash' | 'Card' | 'UPI' | 'Insurance';
  date: string;
  notes?: string;
  createdAt: number;
}

export interface Reminder {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  phone: string;
  scheduledAt: number; // timestamp
  sentAt?: number; // timestamp
  status: 'Pending' | 'Sent' | 'Failed';
  message: string;
}
