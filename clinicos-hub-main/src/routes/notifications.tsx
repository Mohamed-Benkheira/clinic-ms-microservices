import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Plus,
  Trash2,
  Eye,
  RotateCw,
  Bell,
  Percent,
  Clock,
  Pencil,
  Copy,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { usePatients } from "@/hooks/use-patients";
import {
  useNotifications,
  useComposeNotification,
  useResendNotification,
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useNotificationSettings,
  useUpdateNotificationSettings,
  type NotificationTemplate as BackendTemplate,
  type ComposePayload,
} from "@/hooks/use-notifications";
import type {
  Notification,
  NotificationChannel,
  NotificationTemplate,
  NotificationStatus,
} from "@/lib/types";
import { AppLayout } from "@/components/clinic/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

dayjs.extend(relativeTime);

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — ClinicOS" }] }),
  component: NotificationsRoute,
  validateSearch: (s: Record<string, unknown>): { compose?: boolean; patientId?: string } => ({
    compose: typeof s.compose === "boolean" ? s.compose : undefined,
    patientId: typeof s.patientId === "string" ? s.patientId : undefined,
  }),
});

interface RawNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  patient_email?: string;
  patient_phone?: string;
  patient_name?: string;
  channel?: string;
  email_status?: string;
  wa_status?: string;
  wa_error?: string;
  email_error?: string;
  user_id?: number;
}

function normalizeNotification(b: RawNotification): Notification {
  const channel: NotificationChannel =
    b.channel === "Both" ? "WhatsApp" : ((b.channel as NotificationChannel) ?? "Email");
  let status: NotificationStatus = "PENDING";
  if (channel === "Email") {
    status =
      b.email_status === "SENT" ? "SENT" : b.email_status === "FAILED" ? "FAILED" : "PENDING";
  } else if (channel === "WhatsApp") {
    status = b.wa_status === "SENT" ? "SENT" : b.wa_status === "FAILED" ? "FAILED" : "PENDING";
  }
  return {
    id: String(b.id),
    patientId: String(b.user_id ?? ""),
    message: b.body,
    channel,
    status,
    timestamp: b.created_at,
  };
}

function normalizeTemplate(b: BackendTemplate): NotificationTemplate {
  const ch: NotificationChannel =
    b.channel === "Both" ? "WhatsApp" : ((b.channel as NotificationChannel) ?? "Email");
  return {
    id: String(b.id),
    label: b.label,
    body: b.body,
    channel: ch,
    createdAt: b.created_at,
  };
}

const CHANNELS: NotificationChannel[] = ["WhatsApp", "Email"];
const CHANNEL_COLORS: Record<NotificationChannel, { bg: string; fg: string }> = {
  SMS: { bg: "var(--clinic-blue-soft)", fg: "var(--clinic-blue-strong)" },
  WhatsApp: { bg: "var(--clinic-green-soft)", fg: "var(--clinic-green)" },
  Email: { bg: "var(--clinic-indigo-soft)", fg: "var(--clinic-indigo)" },
};
const STATUS_COLORS: Record<NotificationStatus, { bg: string; fg: string }> = {
  SENT: { bg: "var(--clinic-green-soft)", fg: "var(--clinic-green)" },
  FAILED: { bg: "var(--clinic-red-soft)", fg: "var(--clinic-red)" },
  PENDING: { bg: "var(--clinic-yellow-soft)", fg: "var(--clinic-yellow)" },
};

function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const c = CHANNEL_COLORS[channel];
  return (
    <Badge
      variant="outline"
      style={{ backgroundColor: c.bg, color: c.fg, borderColor: "transparent" }}
    >
      {channel}
    </Badge>
  );
}
function StatusPill({ status }: { status: NotificationStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <Badge
      variant="outline"
      style={{ backgroundColor: c.bg, color: c.fg, borderColor: "transparent" }}
    >
      {status}
    </Badge>
  );
}

function NotificationsRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  // Real data
  const { data: rawNotifications = [], isLoading: notifLoading } = useNotifications();
  const { data: patients = [] } = usePatients();
  const { data: rawTemplates = [] } = useTemplates();
  const { data: settings } = useNotificationSettings();

  const isLoading = notifLoading;

  const composeMutation = useComposeNotification();
  const resendMutation = useResendNotification();
  const createTplMutation = useCreateTemplate();
  const updateTplMutation = useUpdateTemplate();
  const deleteTplMutation = useDeleteTemplate();
  const updateSettingsMutation = useUpdateNotificationSettings();

  const notifications: Notification[] = useMemo(
    () => (rawNotifications as RawNotification[]).map(normalizeNotification),
    [rawNotifications],
  );
  const templates: NotificationTemplate[] = useMemo(
    () => rawTemplates.map(normalizeTemplate),
    [rawTemplates],
  );

  const [filter, setFilter] = useState<"ALL" | NotificationStatus>("ALL");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<Notification | null>(null);

  // template editor state
  const [tplOpen, setTplOpen] = useState(false);
  const [tplEditing, setTplEditing] = useState<NotificationTemplate | null>(null);
  const [tplLabel, setTplLabel] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [tplChannel, setTplChannel] = useState<NotificationChannel>("WhatsApp");

  // compose form state
  const [fPatientId, setFPatientId] = useState("");
  const [fChannel, setFChannel] = useState<NotificationChannel>("WhatsApp");
  const [fMessage, setFMessage] = useState("");
  const [fImmediate, setFImmediate] = useState(true);
  const [fScheduled, setFScheduled] = useState(dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm"));
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const insertPlaceholder = (ph: string) => {
    const ta = messageRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = fMessage.slice(0, start);
    const after = fMessage.slice(end);
    const newText = before + ph + after;
    setFMessage(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + ph.length;
    });
  };

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);

  useEffect(() => {
    if (search.compose) {
      if (search.patientId) setFPatientId(search.patientId);
      setComposeOpen(true);
      navigate({ to: "/notifications", replace: true });
    }
  }, [search.compose, search.patientId, navigate]);

  const stats = useMemo(() => {
    const sent = notifications.filter((n) => n.status === "SENT").length;
    const failed = notifications.filter((n) => n.status === "FAILED").length;
    const pending = notifications.filter((n) => n.status === "PENDING").length;
    const total = notifications.length;
    const successRate = total === 0 ? 0 : Math.round((sent / total) * 100);
    return { sent, failed, pending, successRate };
  }, [notifications]);

  const filtered = useMemo(() => {
    let list = notifications;
    if (filter !== "ALL") list = list.filter((n) => n.status === filter);
    return list.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [notifications, filter]);

  if (!user) return null;
  const isAdmin = user.role === "ADMIN";

  const submitCompose = async () => {
    if (!fPatientId) {
      toast.error("Select a patient");
      return;
    }
    if (fMessage.trim().length < 10) {
      toast.error("Message must be at least 10 characters");
      return;
    }
    if (fMessage.length > 500) {
      toast.error("Message must be at most 500 characters");
      return;
    }
    if (!fImmediate && dayjs(fScheduled).isBefore(dayjs())) {
      toast.error("Scheduled time must be in the future");
      return;
    }
    const patient = patients.find((p) => p.id === fPatientId);
    if (!patient) {
      toast.error("Patient not found");
      return;
    }

    const payload: ComposePayload = {
      patient_id: parseInt(fPatientId, 10),
      body: fMessage.trim(),
      channel: fChannel === "SMS" ? "WhatsApp" : (fChannel as "Email" | "WhatsApp" | "Both"),
      patient_email: patient.email || undefined,
      patient_phone: patient.phone || undefined,
      patient_name: patient.name || undefined,
    };
    try {
      await composeMutation.mutateAsync(payload);
      toast.success(
        fImmediate
          ? "Notification sent"
          : `Scheduled for ${dayjs(fScheduled).format("MMM D, HH:mm")}`,
      );
      setComposeOpen(false);
      setFMessage("");
      setFPatientId("");
      setFChannel("WhatsApp");
      setFImmediate(true);
    } catch {
      toast.error("Failed to send notification");
    }
  };

  const resend = async (id: string) => {
    try {
      await resendMutation.mutateAsync(parseInt(id, 10));
      toast.success("Notification resent");
    } catch {
      toast.error("Failed to resend");
    }
  };

  // ===== Template helpers =====
  const openNewTemplate = () => {
    setTplEditing(null);
    setTplLabel("");
    setTplBody("");
    setTplChannel("WhatsApp");
    setTplOpen(true);
  };
  const openEditTemplate = (t: NotificationTemplate) => {
    setTplEditing(t);
    setTplLabel(t.label);
    setTplBody(t.body);
    setTplChannel(t.channel);
    setTplOpen(true);
  };
  const saveTemplate = async () => {
    if (tplLabel.trim().length < 3) {
      toast.error("Template name must be at least 3 characters");
      return;
    }
    if (tplBody.trim().length < 10) {
      toast.error("Template body must be at least 10 characters");
      return;
    }
    if (tplBody.length > 500) {
      toast.error("Template body too long");
      return;
    }
    try {
      if (tplEditing) {
        await updateTplMutation.mutateAsync({
          id: parseInt(tplEditing.id, 10),
          label: tplLabel.trim(),
          body: tplBody.trim(),
          channel: tplChannel,
          event_type: "manual",
          is_active: true,
        });
        toast.success("Template updated");
      } else {
        await createTplMutation.mutateAsync({
          label: tplLabel.trim(),
          body: tplBody.trim(),
          channel: tplChannel,
          event_type: "manual",
          is_active: true,
        });
        toast.success("Template created");
      }
      setTplOpen(false);
    } catch {
      toast.error(tplEditing ? "Failed to update template" : "Failed to create template");
    }
  };
  const duplicateTemplate = async (t: NotificationTemplate) => {
    try {
      await createTplMutation.mutateAsync({
        label: `${t.label} (copy)`,
        body: t.body,
        channel: t.channel,
        event_type: "manual",
        is_active: true,
      });
      toast.success("Template duplicated");
    } catch {
      toast.error("Failed to duplicate template");
    }
  };
  const confirmDeleteTemplate = async (id: string) => {
    try {
      await deleteTplMutation.mutateAsync(parseInt(id, 10));
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const bulkResend = () => {
    const failedIds = selected.filter(
      (id) => notifications.find((n) => n.id === id)?.status === "FAILED",
    );
    if (failedIds.length === 0) {
      toast("No failed notifications selected");
      return;
    }
    failedIds.forEach((id) => resend(id));
    setSelected([]);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(filtered.map((n) => n.id));
    else setSelected([]);
  };

  const isMutating = composeMutation.isPending || resendMutation.isPending;
  const isTplMutating =
    createTplMutation.isPending || updateTplMutation.isPending || deleteTplMutation.isPending;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">Manage outbound messaging</p>
          </div>
          <Button className="gap-1.5" onClick={() => setComposeOpen(true)}>
            <Send className="h-4 w-4" /> Send Notification
          </Button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="flex items-center gap-3 p-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--clinic-green-soft)", color: "var(--clinic-green)" }}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Sent</div>
              <div className="text-lg font-semibold">{isLoading ? "…" : stats.sent}</div>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: "var(--clinic-red-soft)", color: "var(--clinic-red)" }}
            >
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total Failed</div>
              <div className="text-lg font-semibold">{isLoading ? "…" : stats.failed}</div>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "var(--clinic-yellow-soft)",
                color: "var(--clinic-yellow)",
              }}
            >
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="text-lg font-semibold">{isLoading ? "…" : stats.pending}</div>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "var(--clinic-blue-soft)",
                color: "var(--clinic-blue-strong)",
              }}
            >
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
              <div className="text-lg font-semibold">
                {isLoading ? "…" : `${stats.successRate}%`}
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="log">
          <TabsList>
            <TabsTrigger value="log">Sent log</TabsTrigger>
            {isAdmin && <TabsTrigger value="templates">Templates</TabsTrigger>}
            {isAdmin && <TabsTrigger value="rules">Rules & automation</TabsTrigger>}
          </TabsList>

          <TabsContent value="log" className="space-y-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="ALL">
                  All ({isLoading ? "…" : notifications.length})
                </TabsTrigger>
                <TabsTrigger value="SENT">Sent ({isLoading ? "…" : stats.sent})</TabsTrigger>
                <TabsTrigger value="FAILED">Failed ({isLoading ? "…" : stats.failed})</TabsTrigger>
                <TabsTrigger value="PENDING">
                  Pending ({isLoading ? "…" : stats.pending})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Card className="p-4">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No notifications found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={() => setComposeOpen(true)}
                  >
                    <Send className="h-4 w-4" /> Compose
                  </Button>
                </div>
              ) : (
                <TooltipProvider>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">
                            <Checkbox
                              checked={selected.length > 0 && selected.length === filtered.length}
                              onCheckedChange={(c) => toggleAll(!!c)}
                            />
                          </TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((n) => {
                          const p = patients.find((x) => x.id === n.patientId);
                          return (
                            <TableRow key={n.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selected.includes(n.id)}
                                  onCheckedChange={(c) =>
                                    setSelected((s) =>
                                      c ? [...s, n.id] : s.filter((x) => x !== n.id),
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-[10px] font-semibold text-[var(--clinic-blue-strong)]">
                                    {p?.name
                                      .split(" ")
                                      .map((s) => s[0])
                                      .join("")
                                      .slice(0, 2) ?? "?"}
                                  </div>
                                  <span className="text-sm font-medium">
                                    {p?.name ?? "Unknown"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <ChannelBadge channel={n.channel} />
                              </TableCell>
                              <TableCell className="max-w-[280px]">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="truncate text-sm text-muted-foreground">
                                      {n.message}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">{n.message}</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <StatusPill status={n.status} />
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {dayjs(n.timestamp).fromNow()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {n.status === "SENT" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setView(n)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {n.status === "FAILED" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1"
                                      onClick={() => resend(n.id)}
                                      disabled={isMutating}
                                    >
                                      <RotateCw className="h-3 w-3" /> Resend
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TooltipProvider>
              )}
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="templates">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {templates.length} template{templates.length === 1 ? "" : "s"}
                </p>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={openNewTemplate}
                  disabled={isTplMutating}
                >
                  <Plus className="h-4 w-4" /> New template
                </Button>
              </div>
              {templates.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-10 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No templates yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 gap-1.5"
                    onClick={openNewTemplate}
                  >
                    <Plus className="h-4 w-4" /> Create one
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map((t) => (
                    <Card key={t.id} className="flex flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{t.label}</h3>
                        <ChannelBadge channel={t.channel} />
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{t.body}</p>
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            setFMessage(t.body);
                            setFChannel(t.channel);
                            setComposeOpen(true);
                          }}
                        >
                          Use
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => openEditTemplate(t)}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => duplicateTemplate(t)}
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-[var(--clinic-red)]">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56" align="end">
                            <p className="text-sm">
                              Delete <span className="font-medium">{t.label}</span>?
                            </p>
                            <div className="mt-2 flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => {}}>
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="bg-[var(--clinic-red)] hover:bg-[var(--clinic-red)]/90"
                                onClick={() => confirmDeleteTemplate(t.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="rules">
              <Card className="space-y-4 p-5">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">WhatsApp channel</div>
                    <div className="text-xs text-muted-foreground">
                      Master enable for WhatsApp delivery
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(settings?.whatsapp_enabled)}
                    onCheckedChange={(v) => updateSettingsMutation.mutate({ whatsapp_enabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium">Email channel</div>
                    <div className="text-xs text-muted-foreground">
                      Master enable for Email delivery
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(settings?.email_enabled)}
                    onCheckedChange={(v) => updateSettingsMutation.mutate({ email_enabled: v })}
                  />
                </div>
                {(
                  ["appointment_created", "appointment_cancelled", "appointment_updated"] as const
                ).map((event) => {
                  const s = settings as unknown as Record<string, unknown> | undefined;
                  const enabled = s?.[`${event}_enabled`] as boolean | undefined;
                  const channel = s?.[`${event}_channel`] as string | undefined;
                  const label = event.replace("appointment_", "").replace("_", " ");
                  return (
                    <div
                      key={event}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div className="font-medium capitalize">Appointment {label}</div>
                        <div className="text-xs text-muted-foreground">
                          {channel ?? "Both"} · {enabled ? "Enabled" : "Disabled"}
                        </div>
                      </div>
                      <Switch
                        checked={Boolean(enabled)}
                        onCheckedChange={(v) =>
                          updateSettingsMutation.mutate({ [`${event}_enabled`]: v } as Record<
                            string,
                            boolean
                          >)
                        }
                      />
                    </div>
                  );
                })}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={bulkResend}>
            <RotateCw className="h-3 w-3" /> Resend Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Compose notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <Select value={fPatientId} onValueChange={setFPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <RadioGroup
                value={fChannel}
                onValueChange={(v) => setFChannel(v as NotificationChannel)}
                className="flex gap-2 rounded-lg border bg-muted p-1"
              >
                {CHANNELS.filter((c) => c !== "SMS").map((c) => (
                  <Label
                    key={c}
                    htmlFor={`ch-${c}`}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${fChannel === c ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                  >
                    <RadioGroupItem value={c} id={`ch-${c}`} className="sr-only" />
                    {c}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1.5">
              <Label>Quick templates</Label>
              <div className="flex flex-wrap gap-2">
                {templates.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No templates yet — create one in the Templates tab.
                  </span>
                )}
                {templates.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFMessage(t.body);
                      setFChannel(t.channel);
                    }}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Message *</Label>
                <span
                  className={`text-xs ${fMessage.length > 500 ? "text-[var(--clinic-red)]" : "text-muted-foreground"}`}
                >
                  {fMessage.length}/500
                </span>
              </div>
              <Textarea
                ref={messageRef}
                rows={4}
                value={fMessage}
                onChange={(e) => setFMessage(e.target.value)}
                placeholder="Type your message…"
              />
              <div className="flex flex-wrap gap-1.5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3" /> Placeholders:
                </span>
                {[
                  "{{patient_name}}",
                  "{{patient_email}}",
                  "{{patient_phone}}",
                  "{{doctor_name}}",
                  "{{scheduled_date}}",
                  "{{scheduled_time}}",
                  "{{custom_message}}",
                ].map((ph) => (
                  <button
                    key={ph}
                    type="button"
                    className="rounded border border-dashed bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground transition-colors hover:border-[var(--clinic-teal)] hover:text-[var(--clinic-teal)]"
                    onClick={() => insertPlaceholder(ph)}
                  >
                    {ph}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Send immediately</div>
                  <div className="text-xs text-muted-foreground">
                    Otherwise pick a future time below
                  </div>
                </div>
                <Switch checked={fImmediate} onCheckedChange={setFImmediate} />
              </div>
              {!fImmediate && (
                <Input
                  type="datetime-local"
                  value={fScheduled}
                  onChange={(e) => setFScheduled(e.target.value)}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposeOpen(false)} disabled={isMutating}>
              Cancel
            </Button>
            <Button onClick={submitCompose} disabled={isMutating}>
              {isMutating ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail view */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Notification details</DialogTitle>
          </DialogHeader>
          {view &&
            (() => {
              const p = patients.find((x) => x.id === view.patientId);
              return (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Patient</span>
                    <span className="font-medium">{p?.name ?? "Unknown"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Channel</span>
                    <ChannelBadge channel={view.channel} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusPill status={view.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivered</span>
                    <span className="font-medium">
                      {dayjs(view.timestamp).format("MMM D, YYYY · HH:mm")}
                    </span>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Message</div>
                    <div className="mt-1 rounded-md bg-muted p-3">{view.message}</div>
                  </div>
                </div>
              );
            })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setView(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template editor dialog */}
      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{tplEditing ? "Edit template" : "New template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input
                value={tplLabel}
                onChange={(e) => setTplLabel(e.target.value)}
                placeholder="Appointment reminder"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Default channel</Label>
              <RadioGroup
                value={tplChannel}
                onValueChange={(v) => setTplChannel(v as NotificationChannel)}
                className="flex gap-2 rounded-lg border bg-muted p-1"
              >
                {CHANNELS.filter((c) => c !== "SMS").map((c) => (
                  <Label
                    key={c}
                    htmlFor={`tch-${c}`}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${tplChannel === c ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                  >
                    <RadioGroupItem value={c} id={`tch-${c}`} className="sr-only" />
                    {c}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Body *</Label>
                <span
                  className={`text-xs ${tplBody.length > 500 ? "text-[var(--clinic-red)]" : "text-muted-foreground"}`}
                >
                  {tplBody.length}/500
                </span>
              </div>
              <Textarea
                rows={5}
                value={tplBody}
                onChange={(e) => setTplBody(e.target.value)}
                placeholder="Hi {name}, ..."
              />
              <p className="text-xs text-muted-foreground">
                Tip: use <code className="rounded bg-muted px-1">{"{name}"}</code> for the
                patient&apos;s name.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTplOpen(false)} disabled={isTplMutating}>
              Cancel
            </Button>
            <Button onClick={saveTemplate} disabled={isTplMutating}>
              {isTplMutating ? "Saving…" : tplEditing ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
