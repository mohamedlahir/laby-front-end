// Central API base for the frontend. Use REACT_APP_API_BASE at build time to set the production backend.
// Normalize API base so it always includes the '/api' segment after host.
// If REACT_APP_API_BASE is provided, we append '/api' if missing.
const rawBase = process.env.REACT_APP_API_BASE || "http://localhost:8080";
let normalizedBase = rawBase.replace(/\/+$/g, ""); // trim trailing slashes
if (!/\/api(\/|$)/.test(normalizedBase)) {
  normalizedBase = `${normalizedBase}/api`;
}

export const API_BASE = normalizedBase;

export function apiUrl(path) {
  // ensures a single slash between base and path
  if (!path) return API_BASE;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}
