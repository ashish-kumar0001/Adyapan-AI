const DICEBEAR_BASE = "https://api.dicebear.com/10.x/avataaars/svg";

export function getDiceBearUrl(seed: string): string {
  const s = encodeURIComponent(seed || "default");
  return `${DICEBEAR_BASE}?seed=${s}`;
}
