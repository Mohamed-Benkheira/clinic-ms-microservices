import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import dayjs from "dayjs";
import { ArrowLeft, Phone, Mail, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/clinic/AppLayout";
import { MOCK_DOCTORS, MOCK_APPOINTMENTS, MOCK_PATIENTS } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { RingProgress } from "@/components/clinic/RingProgress";

export const Route = createFileRoute("/doctors/$id")({
  head: () => ({ meta: [{ title: "Doctor profile — ClinicOS" }] }),
  component: DoctorProfileRoute,
});

function DoctorProfileRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  useEffect(() => { if (!user) navigate({ to: "/" }); }, [user, navigate]);
  if (!user) return null;

  const d = MOCK_DOCTORS.find((x) => x.id === id);
  if (!d) return <AppLayout><Card className="p-8 text-center">Doctor not found.</Card></AppLayout>;

  const appts = MOCK_APPOINTMENTS.filter((a) => a.doctorId === id);
  const today = appts.filter((a) => dayjs(a.datetime).isSame(dayjs(), "day"));
  const tomorrow = appts.filter((a) => dayjs(a.datetime).isSame(dayjs().add(1, "day"), "day"));
  const week = appts.filter((a) => dayjs(a.datetime).isAfter(dayjs().add(1, "day")) && dayjs(a.datetime).isBefore(dayjs().add(8, "day")));
  const myPatients = Array.from(new Set(appts.map((a) => a.patientId))).map((pid) => MOCK_PATIENTS.find((p) => p.id === pid)).filter(Boolean);

  const weekData = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => ({ day, count: 2 + Math.round(Math.random() * 4) + (i === 1 ? 2 : 0) }));

  return (
    <AppLayout>
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate({ to: "/doctors" })}><ArrowLeft className="h-4 w-4" /> Back to doctors</Button>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card className="sticky top-4 p-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-2xl font-semibold text-[var(--clinic-blue-strong)]">
              {d.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <h2 className="mt-3 text-lg font-semibold">{d.name}</h2>
            <p className="text-sm text-muted-foreground">{d.specialty}</p>
            <Badge className="mt-2" style={{ backgroundColor: d.status === "AVAILABLE" ? "var(--clinic-green-soft)" : "var(--clinic-red-soft)", color: d.status === "AVAILABLE" ? "var(--clinic-green)" : "var(--clinic-red)" }}>{d.status}</Badge>
            <div className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {d.license}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {d.phone}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {d.email}</div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-center">
              <div><div className="text-lg font-semibold">4.8</div><div className="text-xs text-muted-foreground">Rating</div></div>
              <div><div className="text-lg font-semibold">{myPatients.length}</div><div className="text-xs text-muted-foreground">Patients</div></div>
              <div><div className="text-lg font-semibold">92%</div><div className="text-xs text-muted-foreground">Complete</div></div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-8">
          <Tabs defaultValue="schedule">
            <TabsList>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="patients">My patients</TabsTrigger>
              <TabsTrigger value="perf">Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="schedule" className="space-y-4">
              {[{ label: "Today", items: today }, { label: "Tomorrow", items: tomorrow }, { label: "This week", items: week }].map((g) => (
                <Card key={g.label} className="p-5">
                  <h3 className="font-semibold">{g.label}</h3>
                  <ul className="mt-3 space-y-2">
                    {g.items.length === 0 ? <li className="text-sm text-muted-foreground">Nothing scheduled.</li> :
                      g.items.map((a) => {
                        const p = MOCK_PATIENTS.find((x) => x.id === a.patientId);
                        return (
                          <li key={a.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                            <div><span className="font-mono font-semibold text-[var(--clinic-blue-strong)]">{dayjs(a.datetime).format("MMM D HH:mm")}</span> · {p?.name} · {a.reason}</div>
                            <StatusBadge status={a.status} />
                          </li>
                        );
                      })}
                  </ul>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="patients">
              <Card className="p-4">
                <ul className="divide-y">
                  {myPatients.map((p, i) => (
                    <li key={p!.id} onClick={() => navigate({ to: "/patients/$id", params: { id: p!.id } })} style={{ padding: 12, borderRadius: 4, cursor: "pointer" }} className="flex items-center gap-3 hover:bg-accent">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-xs font-semibold text-[var(--clinic-blue-strong)]">{p!.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div>
                      <div className="flex-1"><div className="text-sm font-medium">{p!.name}</div><div className="text-xs text-muted-foreground">Last visit: {i + 1} week{i ? "s" : ""} ago</div></div>
                    </li>
                  ))}
                </ul>
              </Card>
            </TabsContent>
            <TabsContent value="perf">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="p-5">
                  <h3 className="font-semibold">Weekly appointments</h3>
                  <div className="mt-3 h-48">
                    <ResponsiveContainer>
                      <BarChart data={weekData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--clinic-border-subtle)" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="count" fill="var(--clinic-blue)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="flex items-center justify-around p-5">
                  <RingProgress value={92} color="var(--clinic-green)" label={<><span className="text-lg font-semibold">92%</span><span className="text-[10px] text-muted-foreground">completion</span></>} />
                  <div className="space-y-2 text-sm">
                    <div><div className="text-xs text-muted-foreground">Cancellation</div><div className="text-lg font-semibold text-[var(--clinic-red)]">8%</div></div>
                    <div><div className="text-xs text-muted-foreground">Avg duration</div><div className="text-lg font-semibold">28m</div></div>
                    <div><div className="text-xs text-muted-foreground">Satisfaction</div><div className="text-lg font-semibold text-[var(--clinic-green)]">4.8/5</div></div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}