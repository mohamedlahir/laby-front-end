import { jwtDecode } from "jwt-decode";

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("schoolId");
  localStorage.removeItem("profileID");
}

export function isTokenExpired(token) {
  if (!token) return true;

  try {
    const decoded = jwtDecode(token);
    if (!decoded?.exp) return false;
    return decoded.exp * 1000 <= Date.now();
  } catch (e) {
    return true;
  }
}

