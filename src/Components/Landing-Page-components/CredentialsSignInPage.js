import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AppProvider } from "@toolpad/core/AppProvider";
import { SignInPage } from "@toolpad/core/SignInPage";
import { useTheme } from "@mui/material/styles";
import { jwtDecode } from "jwt-decode";
import { clearAuthStorage, isTokenExpired } from "../../utils/auth";
import "./Login.css";

const providers = [{ id: "credentials", name: "Email and Password" }];

const signIn = async (provider, formData) => {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const response = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error("Invalid credentials");

    const data = await response.json();
    const token = data.token;
    localStorage.setItem("token", token);
    if (data.profileID) localStorage.setItem("profileID", data.profileID);
    if (data.schoolId || data.schooldId) {
      localStorage.setItem("schoolId", String(data.schoolId ?? data.schooldId));
    }

    // ✅ Decode JWT
    const decoded = jwtDecode(token);
    const role =
      data.role || decoded.role || decoded.roles?.[0] || decoded.authorities?.[0];
    if (role) localStorage.setItem("role", role);

    // ✅ Route based on role
    if (role === "ADMIN" || role === "PRINCIPAL") {
      window.location.replace("/admin");
    } else if (role === "TUTOR") {
      window.location.replace("/tutor-timetable");
    } else if (role === "STUDENT" || role === "USER") {
      window.location.replace("/user");
    } else {
      alert("Unauthorized role. Please contact admin.");
    }

    return true;
  } catch (error) {
    console.error("Login error:", error);
    alert("Invalid email or password. Please try again.");
    return false;
  }
};

export default function CredentialsSignInPage() {
  const theme = useTheme();

  // ✅ Prevent going back to login if already authenticated
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      if (isTokenExpired(token)) {
        clearAuthStorage();
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const role =
          decoded.role ||
          decoded.roles?.[0] ||
          decoded.authorities?.[0] ||
          localStorage.getItem("role");

        if (role === "ADMIN" || role === "PRINCIPAL") {
          window.location.replace("/admin");
        } else if (role === "TUTOR") {
          window.location.replace("/tutor-timetable");
        } else if (role === "STUDENT" || role === "USER") {
          window.location.replace("/user");
        }
      } catch (e) {
        console.error("Invalid token, clearing...");
        clearAuthStorage();
      }
    }
  }, []);

  return (
    <AppProvider theme={theme}>
      <Box className="login-shell">
        <Box className="login-backdrop-orb login-backdrop-orb--one" />
        <Box className="login-backdrop-orb login-backdrop-orb--two" />
        <Box className="login-grid">
          <Box className="login-brand-panel">
            <Typography className="login-kicker">
              <span className="login-brand-script">Laby</span>
            </Typography>
            <Typography variant="h2" className="login-title">
              A calmer way to shape school timetables.
            </Typography>
            <Typography className="login-copy">
              <span className="login-brand-inline">Laby</span> helps school
              teams manage academic-year planning, tutor workloads, and
              timetable visibility from one secure dashboard.
            </Typography>

            <Box className="login-feature-list">
              <Box className="login-feature-pill">Academic year planning</Box>
              <Box className="login-feature-pill">Principal dashboard insights</Box>
              <Box className="login-feature-pill">Tutor & class timetable views</Box>
            </Box>
          </Box>

          <Box className="login-form-panel">
            <SignInPage
              signIn={signIn}
              providers={providers}
              slotProps={{
                emailField: { autoFocus: false },
                form: { noValidate: false },
              }}
            />
          </Box>
        </Box>
      </Box>
    </AppProvider>
  );
}
