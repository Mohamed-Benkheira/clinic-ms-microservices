import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/clinic/AppLayout";
import { AdminDashboard } from "@/components/clinic/dashboards/AdminDashboard";
import { DoctorDashboard } from "@/components/clinic/dashboards/DoctorDashboard";
import { ReceptionistDashboard } from "@/components/clinic/dashboards/ReceptionistDashboard";
import { PatientDashboard } from "@/components/clinic/dashboards/PatientDashboard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ClinicOS" }] }),
  component: DashboardRoute,
});

function DashboardRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user, navigate]);
  if (!user) return null;
  return (
    <AppLayout>
      {user.role === "ADMIN" && <AdminDashboard />}
      {user.role === "DOCTOR" && <DoctorDashboard />}
      {user.role === "RECEPTIONIST" && <ReceptionistDashboard />}
      {user.role === "PATIENT" && <PatientDashboard />}
    </AppLayout>
  );
}
