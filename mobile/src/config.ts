const HARDCODED_API_BASE = "http://192.168.0.166:8000/api";

export function getApiUrl(): string {
  return HARDCODED_API_BASE.replace(/\/$/, "");
}
