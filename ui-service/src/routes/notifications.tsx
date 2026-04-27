import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { CheckCircle2, XCircle, AlertCircle, Send, Plus, Trash2, Eye, RotateCw, Bell, Percent, Clock, Pencil, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAppData } from "@/lib/app-data";
import type { Notification, NotificationChannel, NotificationTemplate } from "@/lib/types";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

dayjs.extend(relativeTime);

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — ClinicOS" }] }),
  component: NotificationsRoute,
  validateSearch: (s: Record<string, unknown>): { compose?: boolean; patientId?: string } => ({
    compose: typeof s.compose === "boolean" ? s.compose : undefined,
    patientId: typeof s.patientId === "string" ? s.patientId : undefined,
  }),
});

const CHANNELS: NotificationChannel[] = ["SMS", "WhatsApp", "Email"];
const CHANNEL_COLORS: Record<NotificationChannel, { bg: string; fg: string }> = {
  SMS: { bg: "var(--clinic-blue-soft)", fg: "var(--clinic-blue-strong)" },
  WhatsApp: { bg: "var(--clinic-green-soft)", fg: "var(--clinic-green)" },
  Email: { bg: "var(--clinic-indigo-soft)", fg: "var(--clinic-indigo)" },
};
const STATUS_COLORS: Record<Notification["status"], { bg: string; fg: string }> = {
  SENT: { bg: "var(--clinic-green-soft)", fg: "var(--clinic-green)" },
  FAILED: { bg: "var(--clinic-red-soft)", fg: "var(--clinic-red)" },
  PENDING: { bg: "var(--clinic-yellow-soft)", fg: "var(--clinic-yellow)" },
};

function ChannelBadge({ channel }: { channel: NotificationChannel }) {
  const c = CHANNEL_COLORS[channel];
  return <Badge variant="outline" style={{ backgroundColor: c.bg, color: c.fg, borderColor: "transparent" }}>{channel}</Badge>;
}
function StatusPill({ status }: { status: Notification["status"] }) {
  const c = STATUS_COLORS[status];
  return <Badge variant="outline" style={{ backgroundColor: c.bg, color: c.fg, borderColor: "transparent" }}>{status}</Badge>;
}

function NotificationsRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { notifications, setNotifications, patients, templates, addTemplate, updateTemplate, removeTemplate } = useAppData();
  const [filter, setFilter] = useState<"ALL" | Notification["status"]>("ALL");
  const [composeOpen, setComposeOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<Notification | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  // template editor state
  const [tplOpen, setTplOpen] = useState(false);
  const [tplEditing, setTplEditing] = useState<NotificationTemplate | null>(null);
  const [tplLabel, setTplLabel] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [tplChannel, setTplChannel] = useState<NotificationChannel>("WhatsApp");
  const [tplDelId, setTplDelId] = useState<string | null>(null);

  // compose form state
  const [fPatientId, setFPatientId] = useState("");
  const [fChannel, setFChannel] = useState<NotificationChannel>("WhatsApp");
  const [fMessage, setFMessage] = useState("");
  const [fImmediate, setFImmediate] = useState(true);
  const [fScheduled, setFScheduled] = useState(dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm"));

  useEffect(() => { if (!user) navigate({ to: "/" }); }, [user, navigate]);

  useEffect(() => {
    if (search.compose) {
      if (search.patientId) setFPatientId(search.patientId);
      setComposeOpen(true);
      navigate({ to: "/notifications", search: { compose: undefined, patientId: undefined }, replace: true });
    }
  }, [search.compose, search.patientId, navigate]);

  if (!user) return null;
  const isAdmin = user.role === "ADMIN";

  const stats = useMemo(() => {
    const sent = notifications.filter((n) => n.status === "SENT").length;
    const failed = notifications.filter((n) => n.status === "FAILED").length;
    const pending = notifications.filter((n) => n.status === "PENDING").length;
    const scheduled = notifications.filter((n) => n.status === "PENDING" && n.scheduledFor && +new Date(n.scheduledFor) > Date.now()).length;
    const total = notifications.length;
    const successRate = total === 0 ? 0 : Math.round((sent / total) * 100);
    return { sent, failed, pending, scheduled, successRate };
  }, [notifications]);

  const filtered = useMemo(() => {
    let list = notifications;
    if (filter !== "ALL") list = list.filter((n) => n.status === filter);
    return list.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  }, [notifications, filter]);

  const simulateDelivery = (id: string) => {
    setTimeout(() => {
      const ok = Math.random() < 0.8;
      setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, status: ok ? "SENT" : "FAILED" } : n)));
      if (ok) toast.success("Notification delivered"); else toast.error("Delivery failed");
    }, 1500);
  };

  const submitCompose = () => {
    if (!fPatientId) { toast.error("Select a patient"); return; }
    if (fMessage.trim().length < 10) { toast.error("Message must be at least 10 characters"); return; }
    if (fMessage.length > 500) { toast.error("Message must be at most 500 characters"); return; }
    if (!fImmediate && dayjs(fScheduled).isBefore(dayjs())) {
      toast.error("Scheduled time must be in the future");
      return;
    }
    const id = `n${Date.now()}`;
    const ts = fImmediate ? dayjs().toISOString() : dayjs(fScheduled).toISOString();
    const newN: Notification = {
      id,
      patientId: fPatientId,
      message: fMessage.trim(),
      channel: fChannel,
      status: "PENDING",
      timestamp: ts,
      scheduledFor: fImmediate ? undefined : dayjs(fScheduled).toISOString(),
    };
    setNotifications((ns) => [newN, ...ns]);
    toast.success(fImmediate ? "Queued for delivery" : `Scheduled for ${dayjs(fScheduled).format("MMM D, HH:mm")}`);
    setComposeOpen(false);
    setFMessage("");
    setFPatientId("");
    setFChannel("WhatsApp");
    setFImmediate(true);
    if (fImmediate) simulateDelivery(id);
  };

  const resend = (id: string) => {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, status: "PENDING", scheduledFor: undefined, timestamp: dayjs().toISOString() } : n)));
    toast("Resending…");
    simulateDelivery(id);
  };

  const cancelScheduled = (id: string) => {
    setNotifications((ns) => ns.filter((n) => n.id !== id));
    toast.success("Scheduled notification cancelled");
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
  const saveTemplate = () => {
    if (tplLabel.trim().length < 3) { toast.error("Template name must be at least 3 characters"); return; }
    if (tplBody.trim().length < 10) { toast.error("Template body must be at least 10 characters"); return; }
    if (tplBody.length > 500) { toast.error("Template body too long"); return; }
    if (tplEditing) {
      updateTemplate(tplEditing.id, { label: tplLabel.trim(), body: tplBody.trim(), channel: tplChannel });
      toast.success("Template updated");
    } else {
      addTemplate({ label: tplLabel.trim(), body: tplBody.trim(), channel: tplChannel });
      toast.success("Template created");
    }
    setTplOpen(false);
  };
  const duplicateTemplate = (t: NotificationTemplate) => {
    addTemplate({ label: `${t.label} (copy)`, body: t.body, channel: t.channel });
    toast.success("Template duplicated");
  };
  const confirmDeleteTemplate = (id: string) => {
    removeTemplate(id);
    setTplDelId(null);
    toast.success("Template deleted");
  };

  const removeOne = (id: string) => {
    setNotifications((ns) => ns.filter((n) => n.id !== id));
    setSelected((s) => s.filter((x) => x !== id));
    toast.success("Deleted");
  };

  const bulkResend = () => {
    const failedIds = selected.filter((id) => notifications.find((n) => n.id === id)?.status === "FAILED");
    if (failedIds.length === 0) { toast("No failed notifications selected"); return; }
    failedIds.forEach((id) => resend(id));
    setSelected([]);
  };
  const bulkDelete = () => {
    setNotifications((ns) => ns.filter((n) => !selected.includes(n.id)));
    toast.success(`Deleted ${selected.length}`);
    setSelected([]);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(filtered.map((n) => n.id));
    else setSelected([]);
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">Manage outbound messaging</p>
          </div>
          <Button className="gap-1.5" onClick={() => setComposeOpen(true)}><Send className="h-4 w-4" /> Send Notification</Button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--clinic-green-soft)", color: "var(--clinic-green)" }}><CheckCircle2 className="h-5 w-5" /></div><div><div className="text-xs text-muted-foreground">Total Sent</div><div className="text-lg font-semibold">{stats.sent}</div></div></Card>
          <Card className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--clinic-red-soft)", color: "var(--clinic-red)" }}><XCircle className="h-5 w-5" /></div><div><div className="text-xs text-muted-foreground">Total Failed</div><div className="text-lg font-semibold">{stats.failed}</div></div></Card>
          <Card className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--clinic-yellow-soft)", color: "var(--clinic-yellow)" }}><AlertCircle className="h-5 w-5" /></div><div><div className="text-xs text-muted-foreground">Pending</div><div className="text-lg font-semibold">{stats.pending}</div></div></Card>
          <Card className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--clinic-blue-soft)", color: "var(--clinic-blue-strong)" }}><Percent className="h-5 w-5" /></div><div><div className="text-xs text-muted-foreground">Success Rate</div><div className="text-lg font-semibold">{stats.successRate}%</div></div></Card>
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
                <TabsTrigger value="ALL">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="SENT">Sent ({stats.sent})</TabsTrigger>
                <TabsTrigger value="FAILED">Failed ({stats.failed})</TabsTrigger>
                <TabsTrigger value="PENDING">Pending ({stats.pending})</TabsTrigger>
              </TabsList>
            </Tabs>

            <Card className="p-4">
              {filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No notifications found</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setComposeOpen(true)}><Send className="h-4 w-4" /> Compose</Button>
                </div>
              ) : (
                <TooltipProvider>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"><Checkbox checked={selected.length > 0 && selected.length === filtered.length} onCheckedChange={(c) => toggleAll(!!c)} /></TableHead>
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
                              <TableCell><Checkbox checked={selected.includes(n.id)} onCheckedChange={(c) => setSelected((s) => (c ? [...s, n.id] : s.filter((x) => x !== n.id)))} /></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-[10px] font-semibold text-[var(--clinic-blue-strong)]">
                                    {p?.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                                  </div>
                                  <span className="text-sm font-medium">{p?.name ?? "Unknown"}</span>
                                </div>
                              </TableCell>
                              <TableCell><ChannelBadge channel={n.channel} /></TableCell>
                              <TableCell className="max-w-[280px]">
                                <Tooltip>
                                  <TooltipTrigger asChild><div className="truncate text-sm text-muted-foreground">{n.message}</div></TooltipTrigger>
                                  <TooltipContent className="max-w-xs">{n.message}</TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <StatusPill status={n.status} />
                                  {n.scheduledFor && +new Date(n.scheduledFor) > Date.now() && (
                                    <Badge variant="outline" className="gap-1" style={{ backgroundColor: "var(--clinic-blue-soft)", color: "var(--clinic-blue-strong)", borderColor: "transparent" }}>
                                      <Clock className="h-3 w-3" /> Scheduled
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {n.scheduledFor && +new Date(n.scheduledFor) > Date.now()
                                  ? `in ${dayjs(n.scheduledFor).fromNow(true)}`
                                  : dayjs(n.timestamp).fromNow()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {n.status === "SENT" && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView(n)}><Eye className="h-4 w-4" /></Button>}
                                  {n.status === "FAILED" && <Button size="sm" variant="outline" className="gap-1" onClick={() => resend(n.id)}><RotateCw className="h-3 w-3" /> Resend</Button>}
                                  {n.status === "PENDING" && n.scheduledFor && +new Date(n.scheduledFor) > Date.now() && (
                                    <Button size="sm" variant="outline" className="gap-1" onClick={() => cancelScheduled(n.id)}>Cancel</Button>
                                  )}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--clinic-red)]"><Trash2 className="h-4 w-4" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56" align="end">
                                      <p className="text-sm">Delete this notification?</p>
                                      <div className="mt-2 flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setDelId(null)}>Cancel</Button>
                                        <Button size="sm" className="bg-[var(--clinic-red)] hover:bg-[var(--clinic-red)]/90" onClick={() => removeOne(n.id)}>Delete</Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
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
                <p className="text-sm text-muted-foreground">{templates.length} template{templates.length === 1 ? "" : "s"}</p>
                <Button size="sm" className="gap-1.5" onClick={openNewTemplate}><Plus className="h-4 w-4" /> New template</Button>
              </div>
              {templates.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-10 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No templates yet</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={openNewTemplate}><Plus className="h-4 w-4" /> Create one</Button>
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
                        <Button size="sm" onClick={() => { setFMessage(t.body); setFChannel(t.channel); setComposeOpen(true); }}>Use</Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => openEditTemplate(t)}><Pencil className="h-3 w-3" /> Edit</Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => duplicateTemplate(t)}><Copy className="h-3 w-3" /> Copy</Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-[var(--clinic-red)]"><Trash2 className="h-3 w-3" /></Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56" align="end">
                            <p className="text-sm">Delete <span className="font-medium">{t.label}</span>?</p>
                            <div className="mt-2 flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setTplDelId(null)}>Cancel</Button>
                              <Button size="sm" className="bg-[var(--clinic-red)] hover:bg-[var(--clinic-red)]/90" onClick={() => confirmDeleteTemplate(t.id)}>Delete</Button>
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
                  <div><div className="font-medium">WhatsApp channel</div><div className="text-xs text-muted-foreground">Master enable for WhatsApp delivery</div></div>
                  <Switch defaultChecked />
                </div>
                {[
                  { trigger: "Appointment booked", channel: "WhatsApp", delay: "Immediately", on: true },
                  { trigger: "24h before appointment", channel: "SMS", delay: "1 day before", on: true },
                  { trigger: "Appointment cancelled", channel: "Email", delay: "Immediately", on: false },
                ].map((r) => (
                  <div key={r.trigger} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium">{r.trigger}</div>
                      <div className="text-xs text-muted-foreground">{r.channel} · {r.delay}</div>
                    </div>
                    <Switch defaultChecked={r.on} />
                  </div>
                ))}
                <Button variant="outline" className="gap-1.5"><Plus className="h-4 w-4" /> Add rule</Button>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
          <span className="text-sm font-medium">{selected.length} selected</span>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={bulkResend}><RotateCw className="h-3 w-3" /> Resend Selected</Button>
          <Button size="sm" variant="outline" className="gap-1.5 border-[var(--clinic-red)] text-[var(--clinic-red)]" onClick={bulkDelete}><Trash2 className="h-3 w-3" /> Delete Selected</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader><DialogTitle>Compose notification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <Select value={fPatientId} onValueChange={setFPatientId}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <RadioGroup value={fChannel} onValueChange={(v) => setFChannel(v as NotificationChannel)} className="flex gap-2 rounded-lg border bg-muted p-1">
                {CHANNELS.map((c) => (
                  <Label key={c} htmlFor={`ch-${c}`} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${fChannel === c ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                    <RadioGroupItem value={c} id={`ch-${c}`} className="sr-only" />
                    {c}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1.5">
              <Label>Quick templates</Label>
              <div className="flex flex-wrap gap-2">
                {templates.length === 0 && <span className="text-xs text-muted-foreground">No templates yet — create one in the Templates tab.</span>}
                {templates.map((t) => (
                  <Button key={t.id} type="button" size="sm" variant="outline" onClick={() => { setFMessage(t.body); setFChannel(t.channel); }}>{t.label}</Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Message *</Label>
                <span className={`text-xs ${fMessage.length > 500 ? "text-[var(--clinic-red)]" : "text-muted-foreground"}`}>{fMessage.length}/500</span>
              </div>
              <Textarea rows={4} value={fMessage} onChange={(e) => setFMessage(e.target.value)} placeholder="Type your message…" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Send immediately</div>
                  <div className="text-xs text-muted-foreground">Otherwise pick a future time below</div>
                </div>
                <Switch checked={fImmediate} onCheckedChange={setFImmediate} />
              </div>
              {!fImmediate && <Input type="datetime-local" value={fScheduled} onChange={(e) => setFScheduled(e.target.value)} />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={submitCompose}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail view */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Notification details</DialogTitle></DialogHeader>
          {view && (() => {
            const p = patients.find((x) => x.id === view.patientId);
            return (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium">{p?.name}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Channel</span><ChannelBadge channel={view.channel} /></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><StatusPill status={view.status} /></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Delivered</span><span className="font-medium">{dayjs(view.timestamp).format("MMM D, YYYY · HH:mm")}</span></div>
                <div><div className="text-muted-foreground">Message</div><div className="mt-1 rounded-md bg-muted p-3">{view.message}</div></div>
              </div>
            );
          })()}
          <DialogFooter><Button variant="outline" onClick={() => setView(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* unused state holder so eslint doesn't complain */}
      <div className="hidden">{delId}{tplDelId}</div>

      {/* Template editor dialog */}
      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
          <DialogHeader><DialogTitle>{tplEditing ? "Edit template" : "New template"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={tplLabel} onChange={(e) => setTplLabel(e.target.value)} placeholder="Appointment reminder" />
            </div>
            <div className="space-y-1.5">
              <Label>Default channel</Label>
              <RadioGroup value={tplChannel} onValueChange={(v) => setTplChannel(v as NotificationChannel)} className="flex gap-2 rounded-lg border bg-muted p-1">
                {CHANNELS.map((c) => (
                  <Label key={c} htmlFor={`tch-${c}`} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${tplChannel === c ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                    <RadioGroupItem value={c} id={`tch-${c}`} className="sr-only" />
                    {c}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Body *</Label>
                <span className={`text-xs ${tplBody.length > 500 ? "text-[var(--clinic-red)]" : "text-muted-foreground"}`}>{tplBody.length}/500</span>
              </div>
              <Textarea rows={5} value={tplBody} onChange={(e) => setTplBody(e.target.value)} placeholder="Hi {name}, ..." />
              <p className="text-xs text-muted-foreground">Tip: use <code className="rounded bg-muted px-1">{"{name}"}</code> for the patient's name.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTplOpen(false)}>Cancel</Button>
            <Button onClick={saveTemplate}>{tplEditing ? "Save changes" : "Create template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}