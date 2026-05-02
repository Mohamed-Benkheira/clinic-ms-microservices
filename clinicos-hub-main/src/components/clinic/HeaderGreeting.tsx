import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "@/lib/auth";

export function HeaderGreeting() {
  const { user } = useAuth();
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);
  const hour = now.hour();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = (user?.name ?? "there").split(" ")[0];
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {greet}, {first}
        </h1>
        <p className="text-sm text-muted-foreground">{now.format("dddd, MMMM D, YYYY")}</p>
      </div>
      <div className="font-mono text-2xl tabular-nums text-foreground/80 sm:text-3xl">
        {now.format("HH:mm:ss")}
      </div>
    </div>
  );
}
