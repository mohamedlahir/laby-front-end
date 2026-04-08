import * as React from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AppProvider } from "@toolpad/core/AppProvider";
import { useTheme } from "@mui/material/styles";
import { jwtDecode } from "jwt-decode";
import { clearAuthStorage, isTokenExpired } from "../../utils/auth";
import { API_BASE } from "../../config/api";
import { Link } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import "./Login.css";

const signIn = async ({ email, password }) => {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw new Error("Invalid email or password");

    const data = await response.json();
    const token = data.token;
    localStorage.setItem("token", token);
    if (data.profileID) localStorage.setItem("profileID", data.profileID);
    if (data.schoolId || data.schooldId) {
      localStorage.setItem("schoolId", String(data.schoolId ?? data.schooldId));
    }

    const decoded = jwtDecode(token);
    const role =
      data.role || decoded.role || decoded.roles?.[0] || decoded.authorities?.[0];
    if (role) localStorage.setItem("role", role);

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
    throw error;
  }
};

function SignInForm({
  form,
  submitting,
  error,
  onChange,
  onSubmit,
  mode = "inline",
  onClose,
}) {
  const isDialog = mode === "dialog";

  return (
    <Box className={isDialog ? "signin-dialog-card" : "signin-card"}>
      {isDialog ? (
        <Box className="signin-dialog-header">
          <Typography className="signin-dialog-title">Sign in</Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      ) : (
        <>
          <Box className="signin-card__topline">
            {/* <span className="signin-card__badge">Secure access</span>
            <span className="signin-card__price">₹30 / user / month</span> */}
          </Box>

          {/* <Box className="signin-card__header">
            <Box>
              <Typography className="signin-card__title">Sign in</Typography>
              <Typography className="signin-card__copy">
                Access academic planning, tutor visibility, and timetable operations in one calm workspace.
              </Typography>
            </Box>
          </Box> */}

          {/* <Box className="signin-card__feature-strip">
            <Box className="signin-card__mini-stat">
              <VerifiedUserRoundedIcon fontSize="small" />
              <span>Secure JWT login</span>
            </Box>
            <Box className="signin-card__mini-stat">
              <InsightsRoundedIcon fontSize="small" />
              <span>Live timetable visibility</span>
            </Box>
          </Box> */}
        </>
      )}

      <Box component="form" className="signin-card__form" onSubmit={onSubmit}>
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={onChange("email")}
          fullWidth
          required
          autoFocus={isDialog}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AlternateEmailRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={onChange("password")}
          fullWidth
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Button type="submit" variant="contained" className="signin-card__submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in with email and password"}
        </Button>
      </Box>

      {!isDialog ? (
        <Box className="signin-card__footer">
          <Typography className="signin-card__footer-text">
            New to Laby? {" "}
            <Link to="/register" className="register-footnote__link" onClick={onClose}>
              Create your account
            </Link>
          </Typography>
          <Typography className="signin-card__footer-text signin-card__footer-text--muted">
            Built for schools, principals, tutors, and academic-year planning teams.
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

export default function CredentialsSignInPage() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError("");
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signIn(form);
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

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
  }, []);

  return (
    <AppProvider theme={theme}>
      <Box className="login-shell layout-bleed">
        <Box className="login-backdrop-orb login-backdrop-orb--one" />
        <Box className="login-backdrop-orb login-backdrop-orb--two" />

        <Box className="public-topbar">
          <Link to="/" className="public-brand">
            <span className="public-brand__script">Laby</span>
          </Link>

          <Box className="public-nav">
            <Link to="/pricing" className="public-nav__link">
              Pricing
            </Link>
            <Link to="/register" className="public-nav__link public-nav__link--outline">
              Register
            </Link>
            <Button onClick={handleOpen} variant="contained" className="public-nav__button">
              Sign in
            </Button>
          </Box>
        </Box>

        <Box className="login-grid login-grid--auth">
          <Box className="login-brand-panel">
            <Typography variant="h2" className="login-title">
              A calmer way to manage school operations.
            </Typography>
            <Typography className="login-copy">
              Laby is a lightweight, secure timetabling platform built for schools and education teams.
              It helps administrators, tutors, and principals plan the academic year, balance tutor workloads,
              and publish clear timetables to students and parents.
            </Typography>

            <Box className="login-feature-list hero-features">
              <Box className="login-feature-pill">Academic year planning</Box>
              <Box className="login-feature-pill">Principal dashboard insights</Box>
              <Box className="login-feature-pill">Tutor & class timetable views</Box>
              <Box className="login-feature-pill">Leave & availability management</Box>
            </Box>

            <Box className="hero-cta">
              <Button component={Link} to="/register" variant="contained" className="hero-cta__primary">
                Get Started Free
              </Button>
              <Button variant="outlined" className="hero-cta__secondary">
                Book Demo
              </Button>
              <Button onClick={handleOpen} variant="text" className="hero-cta__link">
                Login for existing users
              </Button>
            </Box>

            <Box className="login-proof-row">
              <Box className="login-proof-card">
                <AutoAwesomeRoundedIcon fontSize="small" />
                <Box>
                  <strong>Everything your school needs</strong>
                  <span>From planning to payments — one unified system built for leadership teams.</span>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box className="login-form-panel">
            <Box className="preview-stack">
              <Box className="preview-card preview-card--dashboard">
                <Box className="preview-card__header">
                  <span className="preview-pill">Admin dashboard</span>
                  <span className="preview-date">Live metrics</span>
                </Box>
                <Box className="preview-metrics">
                  <Box className="preview-metric">
                    <span>Utilization</span>
                    <strong>28%</strong>
                  </Box>
                  <Box className="preview-metric">
                    <span>Conflicts</span>
                    <strong>0</strong>
                  </Box>
                  <Box className="preview-metric">
                    <span>Tutors</span>
                    <strong>80</strong>
                  </Box>
                </Box>
                <Box className="preview-chart">
                  <span />
                  <span />
                  <span />
                </Box>
              </Box>

              <Box className="preview-card preview-card--timetable">
                <Box className="preview-card__header">
                  <span className="preview-pill">Timetable view</span>
                  <span className="preview-date">Week overview</span>
                </Box>
                <Box className="preview-grid">
                  {Array.from({ length: 24 }).map((_, idx) => (
                    <span key={idx} />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ className: "signin-dialog-paper" }}
        >
          <DialogContent className="signin-dialog-content">
            <SignInForm
              form={form}
              submitting={submitting}
              error={error}
              onChange={handleChange}
              onSubmit={handleSubmit}
              mode="dialog"
              onClose={handleClose}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </AppProvider>
  );
}
