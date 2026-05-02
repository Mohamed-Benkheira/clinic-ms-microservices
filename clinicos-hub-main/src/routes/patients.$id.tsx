import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import dayjs from "dayjs";
import { ArrowLeft, Phone, Mail, FileUp } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/clinic/AppLayout";
import {
  MOCK_PATIENTS,
  MOCK_APPOINTMENTS,
  MOCK_NOTIFICATIONS,
  MOCK_DOCTORS,
} from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/clinic/StatusBadge";
import { RingProgress } from "@/components/clinic/RingProgress";

export const Route = createFileRoute("/patients/$id")({
  head: () => ({ meta: [{ title: "Patient profile — ClinicOS" }] }),
  component: PatientProfileRoute,
});

function PatientProfileRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);
  if (!user) return null;

  const p = MOCK_PATIENTS.find((x) => x.id === id);
  if (!p)
    return (
      <AppLayout>
        <Card className="p-8 text-center">Patient not found.</Card>
      </AppLayout>
    );

  const appts = MOCK_APPOINTMENTS.filter((a) => a.patientId === id);
  const upcoming = appts.filter((a) => a.status === "SCHEDULED");
  const notifs = MOCK_NOTIFICATIONS.filter((n) => n.patientId === id);
  const age = p.dob ? dayjs().diff(dayjs(p.dob), "year") : "—";

  return (
    <AppLayout>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1.5"
        onClick={() => navigate({ to: "/patients" })}
      >
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Button>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card className="sticky top-4 p-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[var(--clinic-blue-soft)] text-2xl font-semibold text-[var(--clinic-blue-strong)]">
              {p.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <h2 className="mt-3 text-lg font-semibold">{p.name}</h2>
            <div className="mt-1 flex items-center justify-center gap-2">
              <Badge variant="outline">ID {p.id}</Badge>
              <Badge
                style={{
                  backgroundColor: "var(--clinic-green-soft)",
                  color: "var(--clinic-green)",
                }}
              >
                ACTIVE
              </Badge>
            </div>
            <div className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {p.phone}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {p.email}
              </div>
              <div className="text-xs">
                Age {age} · {p.gender === "F" ? "Female" : "Male"} · DOB {p.dob || "—"}
              </div>
            </div>
            <div className="mt-5 flex justify-center">
              <RingProgress
                value={78}
                color="var(--clinic-teal)"
                label={
                  <>
                    <span className="text-lg font-semibold">78%</span>
                    <span className="text-[10px] text-muted-foreground">adherence</span>
                  </>
                }
              />
            </div>
          </Card>
        </div>
        <div className="lg:col-span-8">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="appts">Appointments</TabsTrigger>
              <TabsTrigger value="notifs">Notifications</TabsTrigger>
              <TabsTrigger value="docs">Documents</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold">Medical notes</h3>
                <Textarea defaultValue={p.notes} rows={4} className="mt-2" />
              </Card>
              <Card className="p-5">
                <h3 className="font-semibold">Upcoming visits</h3>
                <ul className="mt-3 space-y-2">
                  {upcoming.length === 0 ? (
                    <li className="text-sm text-muted-foreground">No upcoming visits.</li>
                  ) : (
                    upcoming.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between rounded-md border p-2 text-sm"
                      >
                        <div>
                          {dayjs(a.datetime).format("MMM D, HH:mm")} ·{" "}
                          {MOCK_DOCTORS.find((d) => d.id === a.doctorId)?.name}
                        </div>
                        <Button size="sm" variant="ghost" className="text-[var(--clinic-red)]">
                          Cancel
                        </Button>
                      </li>
                    ))
                  )}
                </ul>
              </Card>
            </TabsContent>
            <TabsContent value="appts">
              <Card className="p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm">
                          {dayjs(a.datetime).format("MMM D, YYYY HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {MOCK_DOCTORS.find((d) => d.id === a.doctorId)?.name}
                        </TableCell>
                        <TableCell className="text-sm">{a.reason}</TableCell>
                        <TableCell>
                          <StatusBadge status={a.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
            <TabsContent value="notifs">
              <Card className="p-5">
                <ul className="space-y-3">
                  {notifs.length === 0 ? (
                    <li className="text-sm text-muted-foreground">No notifications.</li>
                  ) : (
                    notifs.map((n) => (
                      <li key={n.id} className="flex items-start gap-3">
                        <span
                          className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              n.status === "SENT" ? "var(--clinic-teal)" : "var(--clinic-red)",
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-sm">{n.message}</div>
                          <div className="text-xs text-muted-foreground">
                            {dayjs(n.timestamp).format("MMM D, HH:mm")} · {n.channel}
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </Card>
            </TabsContent>
            <TabsContent value="docs">
              <Card className="py-12 text-center">
                <FileUp className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">No documents uploaded</p>
                <Button className="mt-3" variant="outline">
                  Upload document
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
