export const ORDER_STATUSES = [
  { value: "neu", label: "Neu eingegangen", color: "#6b7280" },
  { value: "in_bearbeitung", label: "Wird gedruckt", color: "#d97706" },
  { value: "fertig", label: "Fertig / abholbereit", color: "#059669" },
  { value: "abgeholt", label: "Abgeholt", color: "#2563eb" },
  { value: "storniert", label: "Storniert", color: "#dc2626" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export function statusLabel(value: string): string {
  return ORDER_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function statusColor(value: string): string {
  return ORDER_STATUSES.find((s) => s.value === value)?.color ?? "#6b7280";
}
