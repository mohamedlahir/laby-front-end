import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  Alert,
  Box,
  Collapse,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Paper,
  TextField,
  Slider,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import axios from "axios";

import { apiUrl } from "../../../config/api"; // ✅ FIXED

function formatNumber(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (Number.isInteger(value)) return value.toString();
  return Number(value).toFixed(2);
}

function formatPercent(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(2)}%`;
}

function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PrincipalDashboard() {
  const { mode } = useColorScheme();
  const isDarkMode = mode === "dark";

  const [schoolId, setSchoolId] = useState("");
  const [academicYear, setAcademicYear] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedSchoolId = localStorage.getItem("schoolId");
    if (storedSchoolId) setSchoolId(storedSchoolId);
  }, []);

  // ✅ Fetch academic year
  const fetchCurrentAcademicYear = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !schoolId) return null;

    const res = await axios.get(
      apiUrl("/scheduler/admin/timetable/years"),
      {
        params: { schoolId },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const years = res?.data;
    if (!Array.isArray(years) || years.length === 0) {
      throw new Error("No academic years found");
    }

    const today = new Date(formatDateForApi(new Date()));

    const currentYear =
      years.find((y) => {
        const start = new Date(y.academicYearStart);
        const end = new Date(y.academicYearEnd);
        return today >= start && today <= end;
      }) ||
      [...years].sort(
        (a, b) =>
          new Date(b.academicYearStart) -
          new Date(a.academicYearStart)
      )[0];

    setAcademicYear(currentYear);
    return currentYear;
  }, [schoolId]);

  // ✅ Fetch dashboard
  const fetchOverview = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/");

    if (!schoolId) {
      setError("School ID missing");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const currentYear =
        academicYear || (await fetchCurrentAcademicYear());

      if (!currentYear) throw new Error("Academic year missing");

      const qs = {
        schoolId: String(schoolId),
        academicYearStart: currentYear.academicYearStart,
        academicYearEnd: currentYear.academicYearEnd,
      };

      const [summaryRes, teachersRes] = await Promise.all([
        axios.get(
          apiUrl("/scheduler/principal/dashboard/summary"),
          { params: qs, headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          apiUrl("/scheduler/principal/dashboard/teachers"),
          { params: qs, headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      setOverview({
        summary: summaryRes.data,
        teachers: teachersRes.data || [],
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [academicYear, fetchCurrentAcademicYear, schoolId]);

  useEffect(() => {
    if (schoolId) fetchOverview();
  }, [schoolId, fetchOverview]);

  const summary = overview?.summary;
  const teachers = overview?.teachers || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" fontWeight={800}>
        Principal Dashboard
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {loading && <CircularProgress />}

      {summary && (
        <Box mt={3}>
          <Typography variant="h5">Summary</Typography>
          <pre>{JSON.stringify(summary, null, 2)}</pre>
        </Box>
      )}

      {teachers.length > 0 && (
        <Box mt={3}>
          <Typography variant="h5">Teachers</Typography>
          <pre>{JSON.stringify(teachers, null, 2)}</pre>
        </Box>
      )}
    </Container>
  );
}