export function currentStaffIdFor(
  role: "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT",
): string | null {
  if (role === "ADMIN") return "admin";
  if (role === "DOCTOR") return "d1";
  if (role === "RECEPTIONIST") return "r1";
  return null;
}
