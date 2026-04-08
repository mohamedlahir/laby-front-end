import React, { useState } from "react";
import { Box, Button, TextField, Typography, Alert, Paper, Container, CircularProgress } from "@mui/material";
import TutorTimetable from "../Admin/DashboardSection/TutorTimetable";
import { API_BASE } from "../../config/api";

export default function TutorDashboard() {
  
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeLeave, setActiveLeave] = useState(null);

  const applySelfLeave = async () => {
    setError("");
    setSuccess("");

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
  const res = await fetch(`${API_BASE}/scheduler/tutor/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromDate, toDate, reason }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && body.message) || res.statusText || "Failed to apply leave");
      }

      const respBody = await res.json().catch(() => null);
      setSuccess("Leave applied successfully");
      setActiveLeave({ fromDate, toDate, reason, response: respBody });
      // clear form
      setFromDate("");
      setToDate("");
      setReason("");
    } catch (err) {
      setError(err?.message || "Failed to apply leave");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "360px 1fr" }, gap: 3 }}>
        <Paper sx={{ p: 3, borderRadius: 3 }} elevation={3}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>My Leave</Typography>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 1 }}>{success}</Alert>}

          {activeLeave ? (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>On Leave</Typography>
              <Typography>{`From: ${activeLeave.fromDate}`}</Typography>
              <Typography>{`To: ${activeLeave.toDate}`}</Typography>
              {activeLeave.reason && <Typography sx={{ mt: 1, color: 'text.secondary' }}>{`Reason: ${activeLeave.reason}`}</Typography>}
            </Box>
          ) : (
            <Typography sx={{ mb: 2, color: 'text.secondary' }}>You have no active leave. Apply below to request a substitute.</Typography>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextFieldWithLabel label="From" type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
            <TextFieldWithLabel label="To" type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
            <TextFieldWithLabel label="Reason" value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Optional explanation" />

            <Button variant="contained" onClick={applySelfLeave} disabled={loading} sx={{ mt: 1 }}>
              {loading ? <CircularProgress size={18} /> : 'Apply Leave'}
            </Button>
          </Box>
        </Paper>

        <Box>
          <TutorTimetable />
        </Box>
      </Box>
    </Container>
  );
}

function TextFieldWithLabel({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <TextField
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      InputLabelProps={type === 'date' ? { shrink: true } : undefined}
      size="small"
      placeholder={placeholder}
    />
  );
}
