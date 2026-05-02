import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Appointment,
  Conversation,
  Doctor,
  Message,
  Notification,
  NotificationTemplate,
  Patient,
  StaffMember,
} from "./types";
import {
  MOCK_APPOINTMENTS,
  MOCK_CONVERSATIONS,
  MOCK_DOCTORS,
  MOCK_MESSAGES,
  MOCK_NOTIFICATIONS,
  MOCK_NOTIFICATION_TEMPLATES,
  MOCK_PATIENTS,
  MOCK_STAFF,
} from "./mock-data";

interface AppDataCtx {
  patients: Patient[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  doctors: Doctor[];
  setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  templates: NotificationTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<NotificationTemplate[]>>;
  addTemplate: (
    t: Omit<NotificationTemplate, "id" | "createdAt"> & { id?: string },
  ) => NotificationTemplate;
  updateTemplate: (id: string, patch: Partial<NotificationTemplate>) => void;
  removeTemplate: (id: string) => void;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  removeAppointment: (id: string) => void;
  addAppointment: (a: Omit<Appointment, "id"> & { id?: string }) => Appointment;
  toggleDoctorStatus: (id: string) => void;
  // messaging
  staff: StaffMember[];
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  addMessage: (m: Omit<Message, "id"> & { id?: string }) => Message;
  addConversation: (c: Omit<Conversation, "id"> & { id?: string }) => Conversation;
  markConversationRead: (conversationId: string, userId: string) => void;
  unreadCountFor: (conversationId: string, userId: string) => number;
}

const Ctx = createContext<AppDataCtx | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(MOCK_PATIENTS);
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(MOCK_NOTIFICATION_TEMPLATES);
  const [staff] = useState<StaffMember[]>(MOCK_STAFF);
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

  const updateAppointment = useCallback((id: string, patch: Partial<Appointment>) => {
    setAppointments((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const removeAppointment = useCallback((id: string) => {
    setAppointments((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const addAppointment = useCallback((a: Omit<Appointment, "id"> & { id?: string }) => {
    const created: Appointment = { ...(a as Appointment), id: a.id ?? `a${Date.now()}` };
    setAppointments((xs) => [created, ...xs]);
    return created;
  }, []);

  const toggleDoctorStatus = useCallback((id: string) => {
    setDoctors((ds) =>
      ds.map((d) =>
        d.id === id ? { ...d, status: d.status === "AVAILABLE" ? "BUSY" : "AVAILABLE" } : d,
      ),
    );
  }, []);

  const addMessage = useCallback((m: Omit<Message, "id"> & { id?: string }) => {
    const created: Message = {
      ...(m as Message),
      id: m.id ?? `m${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    setMessages((xs) => [...xs, created]);
    setConversations((cs) =>
      cs.map((c) => (c.id === created.conversationId ? { ...c, lastActivity: created.sentAt } : c)),
    );
    return created;
  }, []);

  const addConversation = useCallback((c: Omit<Conversation, "id"> & { id?: string }) => {
    const created: Conversation = { ...(c as Conversation), id: c.id ?? `c${Date.now()}` };
    setConversations((cs) => [created, ...cs]);
    return created;
  }, []);

  const markConversationRead = useCallback((conversationId: string, userId: string) => {
    setMessages((xs) =>
      xs.map((m) =>
        m.conversationId === conversationId && !m.readBy.includes(userId)
          ? { ...m, readBy: [...m.readBy, userId] }
          : m,
      ),
    );
  }, []);

  const unreadCountFor = useCallback(
    (conversationId: string, userId: string) =>
      messages.filter(
        (m) =>
          m.conversationId === conversationId &&
          m.senderId !== userId &&
          !m.readBy.includes(userId),
      ).length,
    [messages],
  );

  const addTemplate = useCallback(
    (t: Omit<NotificationTemplate, "id" | "createdAt"> & { id?: string }) => {
      const created: NotificationTemplate = {
        ...t,
        id: t.id ?? `t${Date.now()}`,
        createdAt: new Date().toISOString(),
      } as NotificationTemplate;
      setTemplates((xs) => [created, ...xs]);
      return created;
    },
    [],
  );

  const updateTemplate = useCallback((id: string, patch: Partial<NotificationTemplate>) => {
    setTemplates((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setTemplates((xs) => xs.filter((x) => x.id !== id));
  }, []);

  // Auto-dispatch scheduled notifications when their time arrives.
  const dispatchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const due = notifications.filter(
        (n) =>
          n.status === "PENDING" &&
          n.scheduledFor &&
          +new Date(n.scheduledFor) <= now &&
          !dispatchedRef.current.has(n.id),
      );
      if (due.length === 0) return;
      due.forEach((n) => {
        dispatchedRef.current.add(n.id);
        setTimeout(() => {
          const ok = Math.random() < 0.85;
          setNotifications((ns) =>
            ns.map((x) =>
              x.id === n.id
                ? { ...x, status: ok ? "SENT" : "FAILED", timestamp: new Date().toISOString() }
                : x,
            ),
          );
        }, 600);
      });
    };
    const interval = setInterval(tick, 5000);
    tick();
    return () => clearInterval(interval);
  }, [notifications]);

  return (
    <Ctx.Provider
      value={{
        patients,
        setPatients,
        doctors,
        setDoctors,
        appointments,
        setAppointments,
        notifications,
        setNotifications,
        templates,
        setTemplates,
        addTemplate,
        updateTemplate,
        removeTemplate,
        updateAppointment,
        removeAppointment,
        addAppointment,
        toggleDoctorStatus,
        staff,
        conversations,
        setConversations,
        messages,
        setMessages,
        addMessage,
        addConversation,
        markConversationRead,
        unreadCountFor,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
