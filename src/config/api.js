// Central API base for the frontend. Use REACT_APP_API_BASE at build time to set the production backend.
// This module normalizes the base so callers can safely build endpoints.
// It accepts several common ways teams configure the base:
// - an absolute URL with scheme (https://api.example.com or https://api.example.com/api)
// - a host without scheme (api.example.com) -> we assume https://
// - a relative path on the same origin (/api or /backend/api)
// - empty/missing -> default to the relative '/api'

let rawBase = (process.env.REACT_APP_API_BASE || "").trim();
// Some CI systems or Dockerfile args accidentally include surrounding quotes
// (e.g. '"/api"' or "'/api'"). Strip a single pair of surrounding
// quotes if present to make the value more forgiving.
rawBase = rawBase.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

// Start by trimming trailing slashes
let normalizedBase = rawBase.replace(/\/+$/g, "");

// If nothing provided, default to a relative '/api' (calls go to same origin)
if (!normalizedBase) {
// If nothing provided, prefer a local backend during development (so dev server
// proxies aren't required). Allow override via REACT_APP_LOCAL_API_BASE. In
// production fall back to the relative '/api' (same-origin).
  if (process.env.NODE_ENV === "development") {
    if(!process.env.REACT_APP_LOCAL_API_BASE){
      console.warn(`REACT_APP_LOCAL_API_BASE is empty: ${process.env.REACT_APP_LOCAL_API_BASE}`);
    }
    const localOverride = (process.env.REACT_APP_LOCAL_API_BASE || "http://localhost:8080").trim();
    normalizedBase = localOverride || "";
  } else {
    normalizedBase = "/api";
  }
  
} else if (!/^https?:\/\//i.test(normalizedBase)) {
  // Not an absolute URL. Handle a few common cases:
  if (normalizedBase.startsWith("/")) {
    // already a relative path like '/api' or '/backend/api' -> keep as-is
  } else if (/\./.test(normalizedBase)) {
    // looks like a host (contains a dot) but missing scheme -> assume https
    normalizedBase = `https://${normalizedBase}`;
  } else {
    // treat as a relative path without leading slash
    normalizedBase = `/${normalizedBase}`;
  }
}

// Ensure the '/api' segment exists at the end of the base
if (!/\/api(\/|$)/.test(normalizedBase)) {
  normalizedBase = normalizedBase.replace(/\/+$/g, "") + "/api";
}

export const API_BASE = normalizedBase;

export function apiUrl(path) {
  // ensures a single slash between base and path
  if (!path) return API_BASE;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
}


//axios create instance with base URL
//HTMX
//ADMIN ACCESSS REVIEW
//Accesebilities (ARIA)