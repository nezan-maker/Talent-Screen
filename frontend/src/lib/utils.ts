export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}

export function formatShortDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit", year: "numeric" }).format(d);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

