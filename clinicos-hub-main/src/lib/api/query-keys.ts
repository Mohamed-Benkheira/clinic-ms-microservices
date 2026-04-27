export const queryKeys = {
  patients: {
    all: ["patients"] as const,
    list: (page: number) => ["patients", "list", page] as const,
    detail: (id: string) => ["patients", "detail", id] as const,
  },
  doctors: {
    all: ["doctors"] as const,
    list: (page: number) => ["doctors", "list", page] as const,
    detail: (id: string) => ["doctors", "detail", id] as const,
  },
  appointments: {
    all: ["appointments"] as const,
    list: (params: Record<string, unknown>) => ["appointments", "list", params] as const,
    detail: (id: string) => ["appointments", "detail", id] as const,
  },
} as const;
