import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { API_BASE } from "../../../../config/api";

export default function ApplyLeave() {
  const { mode } = useColorScheme();
  const isDarkMode = mode === "dark";
  const [tutorCode, setTutorCode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const applyLeave = async () => {
    setError("");
    setSuccess("");

    if (!tutorCode) {
      setError("Please enter a Tutor Code");
      return;
    }
    if (!fromDate || !toDate) {
      setError("Please select both from and to dates");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    setLoading(true);
    try {
  const res = await fetch(`${API_BASE}/scheduler/annual-timetable/leave/substitute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tutorCode, fromDate, toDate }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && body.message) || res.statusText || "Failed to apply leave");
      }

      setSuccess("Leave applied successfully");
      setTutorCode("");
      setFromDate("");
      setToDate("");
    } catch (err) {
      setError(err?.message || "Failed to apply leave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={4}
        sx={{
          borderRadius: "20px",
          p: { xs: 2, md: 4 },
          background: isDarkMode
            ? "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(17,24,39,0.98))"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          border: isDarkMode ? "1px solid rgba(51,65,85,0.72)" : "1px solid rgba(226,232,240,0.9)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: isDarkMode ? "#60a5fa" : "#2563eb", fontWeight: 800 }}>
              Tutor Management
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 800, color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
              Apply Leave / Request Substitute
            </Typography>
            <Typography sx={{ color: isDarkMode ? "#94a3b8" : "#64748b", mt: 0.5 }}>
              Quickly assign a substitute by applying leave for the tutor for a date range.
            </Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            label="Tutor Code"
            value={tutorCode}
            onChange={(e) => setTutorCode(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />

          <TextField
            label="From"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 180 }}
          />

          <TextField
            label="To"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 180 }}
          />

          <Button
            variant="contained"
            onClick={applyLeave}
            disabled={loading}
            sx={{ borderRadius: "12px", px: 3, fontWeight: 800 }}
          >
            {loading ? <CircularProgress size={18} /> : "Apply Leave"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
