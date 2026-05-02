export type Role = "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT";

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: "M" | "F";
  dob: string;
  notes: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  license: string;
  phone: string;
  email: string;
  status: "AVAILABLE" | "BUSY";
}

export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type AppointmentType =
  | "Consultation"
  | "Follow-up"
  | "Checkup"
  | "Emergency"
  | "Lab Test"
  | "Imaging";
export type AppointmentDuration =
  | "15 min"
  | "30 min"
  | "45 min"
  | "1 hour"
  | "1.5 hours"
  | "2 hours";
export type PaymentMethod = "CNAS" | "CASNOS" | "Cash" | "Private Insurance";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  datetime: string; // ISO
  reason: string;
  status: AppointmentStatus;
  appointmentType: AppointmentType;
  duration: AppointmentDuration;
  notes?: string;
  notifyPatient: boolean;
  payment?: PaymentMethod;
}

export type NotificationStatus = "SENT" | "FAILED" | "PENDING";
export type NotificationChannel = "WhatsApp" | "Email" | "SMS";
export interface Notification {
  id: string;
  patientId: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  timestamp: string;
  scheduledFor?: string; // ISO — when set & in future, dispatch at that time
}

export interface NotificationTemplate {
  id: string;
  label: string;
  body: string;
  channel: NotificationChannel;
  createdAt: string;
}

// ============= Messaging =============
export interface StaffMember {
  id: string;
  name: string;
  role: "ADMIN" | "DOCTOR" | "RECEPTIONIST";
  specialty?: string;
  avatar?: string;
  online: boolean;
  lastSeen?: string; // ISO
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string; // ISO
  readBy: string[];
  attachmentName?: string;
  replyToId?: string;
  reaction?: string;
}

export interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP";
  name?: string;
  participantIds: string[];
  lastActivity: string; // ISO
  pinned: boolean;
  muted?: boolean;
}
