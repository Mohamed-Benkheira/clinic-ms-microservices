import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/clinic/AppLayout";
import { useAuth } from "@/lib/auth";
import { useAppData } from "@/lib/app-data";
import type { Conversation, Message, StaffMember } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import calendar from "dayjs/plugin/calendar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Pin,
  MessageSquare,
  Send,
  Paperclip,
  Info,
  UserPlus,
  CornerUpLeft,
  Smile,
  Copy,
  Check,
  CheckCheck,
  X,
  ArrowLeft,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

dayjs.extend(relativeTime);
dayjs.extend(calendar);

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — ClinicOS" },
      { name: "description", content: "Internal messaging for clinic staff." },
    ],
  }),
  component: MessagesPage,
});

function currentStaffIdFor(role: string): string {
  if (role === "ADMIN") return "admin";
  if (role === "DOCTOR") return "d1";
  if (role === "RECEPTIONIST") return "r1";
  return "admin";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StaffAvatar({
  staff,
  size = 36,
  showOnline = true,
}: {
  staff: StaffMember;
  size?: number;
  showOnline?: boolean;
}) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] font-semibold text-[var(--clinic-blue-strong)]"
        style={{ fontSize: Math.max(10, size * 0.38) }}
      >
        {initials(staff.name)}
      </div>
      {showOnline && staff.online && (
        <span
          className="absolute bottom-0 right-0 block rounded-full border-2 border-card bg-[var(--clinic-green)]"
          style={{ width: Math.max(8, size * 0.28), height: Math.max(8, size * 0.28) }}
        />
      )}
    </div>
  );
}

function GroupAvatar({ members }: { members: StaffMember[] }) {
  const two = members.slice(0, 2);
  return (
    <div className="relative h-9 w-12 shrink-0">
      {two[0] && (
        <div className="absolute left-0 top-0">
          <StaffAvatar staff={two[0]} size={28} showOnline={false} />
        </div>
      )}
      {two[1] && (
        <div className="absolute bottom-0 right-0 ring-2 ring-card rounded-full">
          <StaffAvatar staff={two[1]} size={28} showOnline={false} />
        </div>
      )}
    </div>
  );
}

const PRESET_REPLIES = [
  "Got it, thanks!",
  "Sure thing.",
  "On it!",
  "👍",
  "Can we discuss this later?",
  "I'll check and get back to you.",
];

const REACTIONS = ["👍", "❤️", "😂", "😮", "👏"];

function dateLabel(d: dayjs.Dayjs) {
  if (d.isSame(dayjs(), "day")) return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  if (d.isSame(dayjs(), "year")) return d.format("MMM D");
  return d.format("MMM D, YYYY");
}

function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    staff,
    conversations,
    setConversations,
    messages,
    addMessage,
    addConversation,
    markConversationRead,
    unreadCountFor,
  } = useAppData();

  // PATIENT not allowed
  useEffect(() => {
    if (user && user.role === "PATIENT") {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  if (!user || user.role === "PATIENT") {
    return (
      <AppLayout>
        <div className="text-sm text-muted-foreground">Redirecting…</div>
      </AppLayout>
    );
  }

  const currentUserId = currentStaffIdFor(user.role);
  const currentStaff = staff.find((s) => s.id === currentUserId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [inThreadSearch, setInThreadSearch] = useState("");
  const [showThreadSearch, setShowThreadSearch] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const myConvos = useMemo(
    () => conversations.filter((c) => c.participantIds.includes(currentUserId)),
    [conversations, currentUserId],
  );

  const filteredConvos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = myConvos.filter((c) => {
      if (!q) return true;
      if (c.type === "GROUP") return (c.name ?? "").toLowerCase().includes(q);
      const other = staff.find((s) => c.participantIds.find((p) => p !== currentUserId) === s.id);
      return other?.name.toLowerCase().includes(q);
    });
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return dayjs(b.lastActivity).valueOf() - dayjs(a.lastActivity).valueOf();
    });
  }, [myConvos, search, staff, currentUserId]);

  const pinnedConvos = filteredConvos.filter((c) => c.pinned);
  const otherConvos = filteredConvos.filter((c) => !c.pinned);

  const activeConvo = activeId ? conversations.find((c) => c.id === activeId) ?? null : null;

  const activeMessages = useMemo(() => {
    if (!activeConvo) return [];
    let list = messages.filter((m) => m.conversationId === activeConvo.id);
    if (showThreadSearch && inThreadSearch.trim()) {
      const q = inThreadSearch.toLowerCase();
      list = list.filter((m) => m.content.toLowerCase().includes(q));
    }
    return list.sort((a, b) => dayjs(a.sentAt).valueOf() - dayjs(b.sentAt).valueOf());
  }, [messages, activeConvo, showThreadSearch, inThreadSearch]);

  // Mark read on open
  useEffect(() => {
    if (activeConvo) markConversationRead(activeConvo.id, currentUserId);
  }, [activeConvo, currentUserId, markConversationRead]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, activeId, isTyping]);

  function getConvoName(c: Conversation): string {
    if (c.type === "GROUP") return c.name ?? "Group";
    const other = staff.find((s) => c.participantIds.find((p) => p !== currentUserId) === s.id);
    return other?.name ?? "Conversation";
  }

  function getConvoMembers(c: Conversation): StaffMember[] {
    return c.participantIds.map((id) => staff.find((s) => s.id === id)!).filter(Boolean);
  }

  function getOtherMember(c: Conversation): StaffMember | undefined {
    if (c.type !== "DIRECT") return undefined;
    const otherId = c.participantIds.find((p) => p !== currentUserId);
    return staff.find((s) => s.id === otherId);
  }

  function getLastMessage(cid: string): Message | undefined {
    const list = messages.filter((m) => m.conversationId === cid);
    return list.sort((a, b) => dayjs(b.sentAt).valueOf() - dayjs(a.sentAt).valueOf())[0];
  }

  function handleSelectConvo(id: string) {
    setActiveId(id);
    setReplyTo(null);
    setShowThreadSearch(false);
    setInThreadSearch("");
    setMobilePanelOpen(false);
  }

  function handleSend() {
    if (!activeConvo) return;
    const trimmed = draft.trim();
    if (!trimmed && !pendingAttachment) return;

    addMessage({
      conversationId: activeConvo.id,
      senderId: currentUserId,
      content: trimmed || (pendingAttachment ? "(attachment)" : ""),
      sentAt: new Date().toISOString(),
      readBy: [currentUserId],
      attachmentName: pendingAttachment ?? undefined,
      replyToId: replyTo?.id,
    });
    setDraft("");
    setPendingAttachment(null);
    setReplyTo(null);

    // Simulate typing + auto-reply (30%)
    setTimeout(() => setIsTyping(true), 600);
    setTimeout(() => {
      setIsTyping(false);
      if (Math.random() < 0.3) {
        const others = activeConvo.participantIds.filter((p) => p !== currentUserId);
        const senderId = others[Math.floor(Math.random() * others.length)];
        if (senderId) {
          const reply = PRESET_REPLIES[Math.floor(Math.random() * PRESET_REPLIES.length)];
          addMessage({
            conversationId: activeConvo.id,
            senderId,
            content: reply,
            sentAt: new Date().toISOString(),
            readBy: [senderId, currentUserId],
          });
        }
      }
    }, 2100);
  }

  function togglePin(id: string) {
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  }
  function toggleMute(id: string) {
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c)));
  }
  function renameGroup(id: string, name: string) {
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, name } : c)));
  }
  function removeMember(cid: string, memberId: string) {
    setConversations((cs) =>
      cs.map((c) =>
        c.id === cid ? { ...c, participantIds: c.participantIds.filter((p) => p !== memberId) } : c,
      ),
    );
  }
  function addMember(cid: string, memberId: string) {
    setConversations((cs) =>
      cs.map((c) =>
        c.id === cid && !c.participantIds.includes(memberId)
          ? { ...c, participantIds: [...c.participantIds, memberId] }
          : c,
      ),
    );
  }
  function leaveGroup(cid: string) {
    setConversations((cs) =>
      cs.map((c) =>
        c.id === cid ? { ...c, participantIds: c.participantIds.filter((p) => p !== currentUserId) } : c,
      ),
    );
    setActiveId(null);
    setInfoOpen(false);
  }

  function startDirect(otherId: string) {
    const existing = conversations.find(
      (c) =>
        c.type === "DIRECT" &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(currentUserId) &&
        c.participantIds.includes(otherId),
    );
    if (existing) {
      setActiveId(existing.id);
    } else {
      const created = addConversation({
        type: "DIRECT",
        participantIds: [currentUserId, otherId],
        lastActivity: new Date().toISOString(),
        pinned: false,
      });
      setActiveId(created.id);
    }
    setNewConvoOpen(false);
  }

  function createGroup(name: string, memberIds: string[]) {
    const created = addConversation({
      type: "GROUP",
      name,
      participantIds: Array.from(new Set([currentUserId, ...memberIds])),
      lastActivity: new Date().toISOString(),
      pinned: false,
    });
    setActiveId(created.id);
    setNewConvoOpen(false);
  }

  // Group messages by date for rendering
  const groupedMessages = useMemo(() => {
    const groups: Array<{ label: string; items: Message[] }> = [];
    activeMessages.forEach((m) => {
      const label = dateLabel(dayjs(m.sentAt));
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(m);
      else groups.push({ label, items: [m] });
    });
    return groups;
  }, [activeMessages]);

  return (
    <AppLayout>
      <div
        className="grid h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-[var(--clinic-border-subtle)] bg-card md:h-[calc(100vh-6rem)]"
        style={{ gridTemplateColumns: "minmax(0,1fr)" }}
      >
        <div
          className="grid h-full min-h-0 overflow-hidden md:grid-cols-[300px_minmax(0,1fr)]"
        >
          {/* LEFT PANEL */}
          <aside
            className={cn(
              "flex h-full min-h-0 flex-col border-r border-[var(--clinic-border-subtle)] bg-card",
              activeId ? "hidden md:flex" : "flex",
            )}
          >
            <div className="flex items-center justify-between border-b border-[var(--clinic-border-subtle)] p-4">
              <h1 className="text-base font-semibold">Messages</h1>
              <Button
                size="sm"
                onClick={() => setNewConvoOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New
              </Button>
            </div>
            <div className="border-b border-[var(--clinic-border-subtle)] p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="pl-8"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {pinnedConvos.length > 0 && (
                  <>
                    <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pinned
                    </div>
                    {pinnedConvos.map((c) => (
                      <ConvoItem
                        key={c.id}
                        c={c}
                        active={c.id === activeId}
                        unread={unreadCountFor(c.id, currentUserId)}
                        name={getConvoName(c)}
                        last={getLastMessage(c.id)}
                        members={getConvoMembers(c)}
                        other={getOtherMember(c)}
                        onClick={() => handleSelectConvo(c.id)}
                      />
                    ))}
                  </>
                )}
                {otherConvos.length > 0 && (
                  <>
                    {pinnedConvos.length > 0 && (
                      <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        All
                      </div>
                    )}
                    {otherConvos.map((c) => (
                      <ConvoItem
                        key={c.id}
                        c={c}
                        active={c.id === activeId}
                        unread={unreadCountFor(c.id, currentUserId)}
                        name={getConvoName(c)}
                        last={getLastMessage(c.id)}
                        members={getConvoMembers(c)}
                        other={getOtherMember(c)}
                        onClick={() => handleSelectConvo(c.id)}
                      />
                    ))}
                  </>
                )}
                {filteredConvos.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No conversations
                  </div>
                )}
              </div>
            </ScrollArea>
            <Separator />
            {currentStaff && (
              <div className="flex items-center gap-3 p-3">
                <StaffAvatar staff={currentStaff} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{currentStaff.name}</div>
                  <div className="text-xs capitalize text-muted-foreground">
                    {currentStaff.role.toLowerCase()}
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* RIGHT PANEL */}
          <section
            className={cn(
              "flex h-full min-h-0 flex-col bg-[var(--clinic-surface-bg)]",
              activeId ? "flex" : "hidden md:flex",
            )}
          >
            {!activeConvo && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)]">
                  <MessageSquare className="h-8 w-8 text-[var(--clinic-blue-strong)]" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Select a conversation to start messaging
                </p>
                <p className="text-xs text-muted-foreground">or</p>
                <Button onClick={() => setNewConvoOpen(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" /> New Message
                </Button>
              </div>
            )}

            {activeConvo && (
              <>
                {/* HEADER */}
                <div className="flex items-center justify-between gap-3 border-b border-[var(--clinic-border-subtle)] bg-card px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setActiveId(null)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    {activeConvo.type === "GROUP" ? (
                      <GroupAvatar members={getConvoMembers(activeConvo)} />
                    ) : (
                      getOtherMember(activeConvo) && (
                        <StaffAvatar staff={getOtherMember(activeConvo)!} size={40} />
                      )
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {getConvoName(activeConvo)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activeConvo.type === "GROUP"
                          ? `${activeConvo.participantIds.length} members`
                          : (() => {
                              const o = getOtherMember(activeConvo);
                              if (!o) return "";
                              if (o.online)
                                return (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--clinic-green)]" />
                                    Online
                                  </span>
                                );
                              return o.lastSeen
                                ? `Last seen ${dayjs(o.lastSeen).fromNow()}`
                                : "Offline";
                            })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowThreadSearch((v) => !v);
                        setInThreadSearch("");
                      }}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    {activeConvo.type === "GROUP" && (
                      <AddMemberButton
                        convo={activeConvo}
                        staff={staff}
                        onAdd={(id) => addMember(activeConvo.id, id)}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setInfoOpen(true)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showThreadSearch && (
                  <div className="border-b border-[var(--clinic-border-subtle)] bg-card px-4 py-2">
                    <Input
                      value={inThreadSearch}
                      onChange={(e) => setInThreadSearch(e.target.value)}
                      placeholder="Search in conversation…"
                      autoFocus
                    />
                  </div>
                )}

                {/* MESSAGES */}
                <ScrollArea className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeConvo.id + (showThreadSearch ? "_s" : "")}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-1 p-4"
                    >
                      {groupedMessages.map((group, gi) => (
                        <div key={gi} className="flex flex-col gap-1">
                          <div className="my-3 flex items-center justify-center">
                            <span className="rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                              {group.label}
                            </span>
                          </div>
                          {group.items.map((m, idx) => {
                            const sender = staff.find((s) => s.id === m.senderId);
                            const isMe = m.senderId === currentUserId;
                            const prev = group.items[idx - 1];
                            const consecutive =
                              prev && prev.senderId === m.senderId &&
                              dayjs(m.sentAt).diff(dayjs(prev.sentAt), "minute") < 5;
                            const replyMsg = m.replyToId
                              ? messages.find((x) => x.id === m.replyToId)
                              : null;
                            return (
                              <MessageBubble
                                key={m.id}
                                m={m}
                                sender={sender}
                                isMe={isMe}
                                isGroup={activeConvo.type === "GROUP"}
                                consecutive={!!consecutive}
                                replyMsg={replyMsg ?? null}
                                otherParticipantIds={activeConvo.participantIds.filter(
                                  (p) => p !== currentUserId,
                                )}
                                onReply={() => setReplyTo(m)}
                                onReact={(emoji) => {
                                  toast.success(`Reacted ${emoji}`);
                                }}
                                onCopy={() => {
                                  navigator.clipboard?.writeText(m.content);
                                  toast.success("Copied");
                                }}
                              />
                            );
                          })}
                        </div>
                      ))}
                      {isTyping && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </motion.div>
                  </AnimatePresence>
                </ScrollArea>

                {/* INPUT */}
                <div className="border-t border-[var(--clinic-border-subtle)] bg-card p-3">
                  {replyTo && (
                    <div className="mb-2 flex items-start gap-2 rounded-md border-l-[3px] border-[var(--clinic-blue)] bg-[var(--clinic-blue-soft)]/40 px-3 py-2 text-xs">
                      <CornerUpLeft className="mt-0.5 h-3.5 w-3.5 text-[var(--clinic-blue-strong)]" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[var(--clinic-blue-strong)]">
                          Replying to {staff.find((s) => s.id === replyTo.senderId)?.name ?? ""}
                        </div>
                        <div className="truncate text-muted-foreground">{replyTo.content}</div>
                      </div>
                      <button
                        onClick={() => setReplyTo(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {pendingAttachment && (
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--clinic-blue-soft)] px-3 py-1 text-xs text-[var(--clinic-blue-strong)]">
                      <Paperclip className="h-3 w-3" />
                      <span>{pendingAttachment}</span>
                      <button
                        onClick={() => setPendingAttachment(null)}
                        className="hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1" side="top" align="start">
                        {[
                          { label: "Photo/Video", file: "photo.jpg" },
                          { label: "Document", file: "report.pdf" },
                          { label: "Location", file: "location.txt" },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                            onClick={() => setPendingAttachment(opt.file)}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {opt.label}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={`Message ${getConvoName(activeConvo)}…`}
                      rows={1}
                      className="max-h-[110px] min-h-[40px] resize-none"
                    />
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleSend}
                        disabled={!draft.trim() && !pendingAttachment}
                        className="shrink-0"
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={newConvoOpen}
        onOpenChange={setNewConvoOpen}
        staff={staff.filter((s) => s.id !== currentUserId)}
        currentStaffName={currentStaff?.name ?? "You"}
        onStartDirect={startDirect}
        onCreateGroup={createGroup}
      />

      {/* Info Sheet */}
      {activeConvo && (
        <ConvoInfoSheet
          open={infoOpen}
          onOpenChange={setInfoOpen}
          convo={activeConvo}
          staff={staff}
          currentUserId={currentUserId}
          isAdmin={user.role === "ADMIN"}
          onTogglePin={() => togglePin(activeConvo.id)}
          onToggleMute={() => toggleMute(activeConvo.id)}
          onRename={(name) => renameGroup(activeConvo.id, name)}
          onRemoveMember={(mid) => removeMember(activeConvo.id, mid)}
          onAddMember={(mid) => addMember(activeConvo.id, mid)}
          onLeave={() => leaveGroup(activeConvo.id)}
          onViewProfile={(otherId) => {
            const member = staff.find((s) => s.id === otherId);
            if (member?.role === "DOCTOR") {
              navigate({ to: "/doctors/$id", params: { id: otherId } });
            } else {
              toast.info(`${member?.name} — ${member?.role}`);
            }
          }}
        />
      )}

      {/* Mobile panel toggle (unused placeholder kept for completeness) */}
      <div className="hidden">{mobilePanelOpen ? "" : ""}</div>
    </AppLayout>
  );
}

// =================== Sub-components ===================

function ConvoItem({
  c,
  active,
  unread,
  name,
  last,
  members,
  other,
  onClick,
}: {
  c: Conversation;
  active: boolean;
  unread: number;
  name: string;
  last?: Message;
  members: StaffMember[];
  other?: StaffMember;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "mb-0.5 flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors",
        active
          ? "bg-[var(--clinic-blue-soft)]"
          : "hover:bg-[var(--clinic-gray-soft)]",
      )}
    >
      {c.type === "GROUP" ? (
        <GroupAvatar members={members} />
      ) : other ? (
        <StaffAvatar staff={other} size={40} />
      ) : (
        <div className="h-10 w-10" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("truncate text-sm", active ? "font-semibold text-[var(--clinic-blue-strong)]" : "font-medium text-foreground")}>
            {name}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {dayjs(c.lastActivity).fromNow(true)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {last?.content ?? "No messages yet"}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {c.pinned && <Pin className="h-3 w-3 text-muted-foreground" />}
            <AnimatePresence>
              {unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--clinic-blue)] px-1 text-[10px] font-semibold text-white"
                >
                  {unread}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </button>
  );
}

function MessageBubble({
  m,
  sender,
  isMe,
  isGroup,
  consecutive,
  replyMsg,
  otherParticipantIds,
  onReply,
  onReact,
  onCopy,
}: {
  m: Message;
  sender?: StaffMember;
  isMe: boolean;
  isGroup: boolean;
  consecutive: boolean;
  replyMsg: Message | null;
  otherParticipantIds: string[];
  onReply: () => void;
  onReact: (e: string) => void;
  onCopy: () => void;
}) {
  const readByOther = otherParticipantIds.some((id) => m.readBy.includes(id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex items-end gap-2",
        isMe ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isMe && (
        <div className="w-7 shrink-0">
          {!consecutive && sender && <StaffAvatar staff={sender} size={28} showOnline={false} />}
        </div>
      )}
      <div className={cn("flex max-w-[75%] flex-col", isMe ? "items-end" : "items-start")}>
        {!isMe && isGroup && !consecutive && (
          <span className="mb-0.5 ml-2 text-[11px] font-medium text-muted-foreground">
            {sender?.name}
          </span>
        )}
        <div
          className={cn(
            "relative px-3.5 py-2 text-sm shadow-sm",
            isMe
              ? "bg-[var(--clinic-blue)] text-white"
              : "bg-card text-foreground",
          )}
          style={{
            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          }}
        >
          {replyMsg && (
            <div
              className={cn(
                "mb-1.5 rounded-md border-l-[3px] px-2 py-1 text-xs",
                isMe
                  ? "border-white/70 bg-white/15 text-white/90"
                  : "border-[var(--clinic-blue)] bg-[var(--clinic-blue-soft)]/50 text-muted-foreground",
              )}
            >
              <div className="line-clamp-2">{replyMsg.content}</div>
            </div>
          )}
          {m.attachmentName && (
            <div
              className={cn(
                "mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
                isMe ? "bg-white/15" : "bg-[var(--clinic-gray-soft)]",
              )}
            >
              <Paperclip className="h-3 w-3" />
              <span className="font-medium">{m.attachmentName}</span>
              <span className={cn(isMe ? "opacity-70" : "text-muted-foreground")}>· PDF · 240 KB</span>
            </div>
          )}
          <div className="whitespace-pre-wrap break-words">{m.content}</div>
        </div>
        <div
          className={cn(
            "mt-0.5 flex items-center gap-1 px-2 text-[10px]",
            isMe ? "text-muted-foreground" : "text-muted-foreground",
          )}
        >
          <span>{dayjs(m.sentAt).format("HH:mm")}</span>
          {isMe &&
            (readByOther ? (
              <CheckCheck className="h-3 w-3 text-[var(--clinic-blue)]" />
            ) : (
              <Check className="h-3 w-3" />
            ))}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReply}>
          <CornerUpLeft className="h-3.5 w-3.5" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" side="top">
            <div className="flex gap-0.5">
              {REACTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => onReact(e)}
                  className="rounded p-1.5 text-lg transition-transform hover:scale-125"
                >
                  {e}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground">
      <span className="inline-flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-muted-foreground"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </span>
      <span>typing…</span>
    </div>
  );
}

function NewConversationDialog({
  open,
  onOpenChange,
  staff,
  currentStaffName,
  onStartDirect,
  onCreateGroup,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  staff: StaffMember[];
  currentStaffName: string;
  onStartDirect: (id: string) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setGroupName("");
      setSelected([]);
    }
  }, [open]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="direct">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">Direct Message</TabsTrigger>
            <TabsTrigger value="group">Create Group</TabsTrigger>
          </TabsList>
          <TabsContent value="direct" className="mt-4">
            <div className="flex flex-col gap-1">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-[var(--clinic-gray-soft)]"
                >
                  <StaffAvatar staff={s} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      <Badge variant="secondary" className="mr-1 capitalize">
                        {s.role.toLowerCase()}
                      </Badge>
                      {s.specialty}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onStartDirect(s.id)}>
                    Message
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="group" className="mt-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="group-name">Group name</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Cardiology Team"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="mb-2 block">Members</Label>
                <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-[var(--clinic-blue-soft)] px-2.5 py-1 text-xs text-[var(--clinic-blue-strong)]">
                  You · {currentStaffName}
                </div>
                <div className="max-h-[260px] space-y-1 overflow-y-auto rounded-md border border-[var(--clinic-border-subtle)] p-1">
                  {staff.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-[var(--clinic-gray-soft)]"
                    >
                      <Checkbox
                        checked={selected.includes(s.id)}
                        onCheckedChange={() => toggle(s.id)}
                      />
                      <StaffAvatar staff={s} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {s.role.toLowerCase()} {s.specialty ? `· ${s.specialty}` : ""}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!groupName.trim() || selected.length < 1}
                  onClick={() => onCreateGroup(groupName.trim(), selected)}
                >
                  Create Group
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberButton({
  convo,
  staff,
  onAdd,
}: {
  convo: Conversation;
  staff: StaffMember[];
  onAdd: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const candidates = staff.filter((s) => !convo.participantIds.includes(s.id));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <UserPlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="end">
        {candidates.length === 0 && (
          <div className="px-2 py-3 text-center text-xs text-muted-foreground">
            All staff are in this group
          </div>
        )}
        {candidates.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              onAdd(s.id);
              setOpen(false);
              toast.success(`${s.name} added`);
            }}
            className="flex w-full items-center gap-2 rounded-md p-1.5 text-left hover:bg-accent"
          >
            <StaffAvatar staff={s} size={28} showOnline={false} />
            <span className="text-sm">{s.name}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function ConvoInfoSheet({
  open,
  onOpenChange,
  convo,
  staff,
  currentUserId,
  isAdmin,
  onTogglePin,
  onToggleMute,
  onRename,
  onRemoveMember,
  onAddMember,
  onLeave,
  onViewProfile,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  convo: Conversation;
  staff: StaffMember[];
  currentUserId: string;
  isAdmin: boolean;
  onTogglePin: () => void;
  onToggleMute: () => void;
  onRename: (n: string) => void;
  onRemoveMember: (id: string) => void;
  onAddMember: (id: string) => void;
  onLeave: () => void;
  onViewProfile: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(convo.name ?? "");

  useEffect(() => {
    setName(convo.name ?? "");
    setEditing(false);
  }, [convo.id, convo.name]);

  const members = convo.participantIds.map((id) => staff.find((s) => s.id === id)!).filter(Boolean);
  const other = convo.type === "DIRECT"
    ? staff.find((s) => convo.participantIds.find((p) => p !== currentUserId) === s.id)
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[360px]">
        <SheetHeader>
          <SheetTitle>{convo.type === "GROUP" ? "Group Info" : "Contact Info"}</SheetTitle>
        </SheetHeader>

        {convo.type === "DIRECT" && other && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <StaffAvatar staff={other} size={72} />
              <div className="text-base font-semibold">{other.name}</div>
              <Badge variant="secondary" className="capitalize">
                {other.role.toLowerCase()}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {other.online
                  ? "Online"
                  : other.lastSeen
                    ? `Last seen ${dayjs(other.lastSeen).fromNow()}`
                    : "Offline"}
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{other.role.toLowerCase()}</span>
              </div>
              {other.specialty && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specialty</span>
                  <span className="font-medium">{other.specialty}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs">{other.id}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onViewProfile(other.id)}
            >
              View Profile
            </Button>
            <Separator />
            <div className="flex items-center justify-between">
              <Label>Pin this conversation</Label>
              <Switch checked={convo.pinned} onCheckedChange={onTogglePin} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mute notifications</Label>
              <Switch checked={!!convo.muted} onCheckedChange={onToggleMute} />
            </div>
          </div>
        )}

        {convo.type === "GROUP" && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              {editing && isAdmin ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onRename(name.trim() || convo.name || "Group");
                      setEditing(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <h3 className="flex-1 text-base font-semibold">{convo.name}</h3>
              )}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (editing) {
                      onRename(name.trim() || convo.name || "Group");
                    }
                    setEditing((v) => !v);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Badge variant="secondary">{members.length} members</Badge>
            <Separator />
            <div className="space-y-1">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-[var(--clinic-gray-soft)]"
                >
                  <StaffAvatar staff={m} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {m.name}
                      {m.id === currentUserId && (
                        <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                      )}
                    </div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {m.role.toLowerCase()}
                    </div>
                  </div>
                  {isAdmin && m.id !== currentUserId && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-3" align="end">
                        <div className="text-sm">Remove {m.name}?</div>
                        <div className="mt-2 flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              onRemoveMember(m.id);
                              toast.success(`${m.name} removed`);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              ))}
            </div>
            <AddMemberInline convo={convo} staff={staff} onAdd={onAddMember} />
            <Separator />
            <div className="flex items-center justify-between">
              <Label>Pin this conversation</Label>
              <Switch checked={convo.pinned} onCheckedChange={onTogglePin} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mute notifications</Label>
              <Switch checked={!!convo.muted} onCheckedChange={onToggleMute} />
            </div>
            <Button
              variant="outline"
              className="w-full border-[var(--clinic-red)] text-[var(--clinic-red)] hover:bg-[var(--clinic-red-soft)] hover:text-[var(--clinic-red)]"
              onClick={onLeave}
            >
              Leave Group
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AddMemberInline({
  convo,
  staff,
  onAdd,
}: {
  convo: Conversation;
  staff: StaffMember[];
  onAdd: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const candidates = staff.filter((s) => !convo.participantIds.includes(s.id));
  if (candidates.length === 0) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full gap-1.5">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1">
        {candidates.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              onAdd(s.id);
              setOpen(false);
              toast.success(`${s.name} added`);
            }}
            className="flex w-full items-center gap-2 rounded-md p-1.5 text-left hover:bg-accent"
          >
            <StaffAvatar staff={s} size={28} showOnline={false} />
            <span className="text-sm">{s.name}</span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
