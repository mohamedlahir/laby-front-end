import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AppProvider } from "@toolpad/core/AppProvider";
import { useTheme } from "@mui/material/styles";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/api";
import "./Login.css";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "PRINCIPAL", label: "Principal" },
  { value: "TUTOR", label: "Tutor" },
  { value: "USER", label: "User" },
];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "ADMIN",
  schoolId: "",
  age: "",
};

export default function RegistrationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = React.useState(initialForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState({ type: "", message: "" });

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setFeedback({
        type: "error",
        message: "Password and confirm password should match.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback({ type: "", message: "" });

      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: form.role,
          schoolId: Number(form.schoolId),
          firstName: form.firstName,
          lastName: form.lastName,
          age: Number(form.age),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create account. Please verify the details and try again.");
      }

      setFeedback({
        type: "success",
        message: "Registration completed successfully. You can sign in now.",
      });
      setForm(initialForm);
      window.setTimeout(() => navigate("/"), 1200);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppProvider theme={theme}>
      <Box className="login-shell">
        <Box className="login-backdrop-orb login-backdrop-orb--one" />
        <Box className="login-backdrop-orb login-backdrop-orb--two" />

        <Box className="public-topbar">
          <Link to="/" className="public-brand">
            <span className="public-brand__script">Laby</span>
          </Link>

          <Box className="public-nav">
            {/* <Link to="/pricing" className="public-nav__link">
              Pricing
            </Link> */}
            {/* <Link to="/" className="public-nav__link public-nav__link--outline">
              Sign in
            </Link> */}
          </Box>
        </Box>

        <Box className="login-grid login-grid--register">
          <Box className="login-brand-panel">
            <Typography className="login-kicker">
              <span className="login-brand-script">Laby</span>
            </Typography>
            <Typography variant="h2" className="login-title">
              Launch your school workspace with confidence.
            </Typography>
            <Typography className="login-copy">
              Create your Laby account to start planning academic years, managing
              tutor workloads, and keeping timetable operations beautifully organized.
            </Typography>

            <Box className="login-feature-list">
              <Box className="login-feature-pill">Fast onboarding</Box>
              <Box className="login-feature-pill">Academic year setup</Box>
              <Box className="login-feature-pill">Timetable-ready workspace</Box>
            </Box>
          </Box>

          <Box className="register-form-card">
            <Typography className="register-title">Create your account</Typography>
            <Typography className="register-subtitle">
              Set up your Laby workspace in a few quick steps.
            </Typography>

            <Box component="form" className="register-form-grid" onSubmit={handleSubmit}>
              <TextField
                label="First Name"
                value={form.firstName}
                onChange={handleChange("firstName")}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={form.lastName}
                onChange={handleChange("lastName")}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                required
                fullWidth
                className="register-form-grid__full"
              />
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={handleChange("password")}
                required
                fullWidth
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                required
                fullWidth
              />
              <TextField
                select
                label="Role"
                value={form.role}
                onChange={handleChange("role")}
                fullWidth
              >
                {ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="School ID"
                type="number"
                value={form.schoolId}
                onChange={handleChange("schoolId")}
                required
                fullWidth
              />
              <TextField
                label="Age"
                type="number"
                value={form.age}
                onChange={handleChange("age")}
                required
                fullWidth
              />

              {feedback.message ? (
                <Box
                  className={`register-feedback ${
                    feedback.type === "success"
                      ? "register-feedback--success"
                      : "register-feedback--error"
                  }`}
                >
                  {feedback.message}
                </Box>
              ) : null}

              <Button
                type="submit"
                variant="contained"
                className="register-submit"
                disabled={submitting}
              >
                {submitting ? "Creating account..." : "Create account"}
              </Button>
            </Box>

            <Typography className="register-footnote">
              Already have an account?{" "}
              <Link to="/" className="register-footnote__link">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </AppProvider>
  );
}
