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
  // Divider,
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
// import { API_BASE } from "../../../config/api";

function formatNumber(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (Number.isInteger(value)) return value.toString();
  return Number(value).toFixed(2);
}

// const apiUrl ="https://lahir.in/api";
const apiUrl ="http://localhost:8080/api";

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
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  // search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [utilizationMin, setUtilizationMin] = useState(0);
  const [assignedMin, setAssignedMin] = useState(0);
  const [sortBy, setSortBy] = useState("utilizationDesc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    const storedSchoolId = localStorage.getItem("schoolId");
    if (storedSchoolId) {
      setSchoolId(storedSchoolId);
    }
  }, []);

  const summary = overview?.summary;
  const teachers = overview?.teachers || [];
  const teachersList = React.useMemo(() => overview?.teachers || [], [overview?.teachers]);

  const fetchCurrentAcademicYear = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !schoolId) {
      return null;
    }

  // Use axios to fetch academic years (safer construction and param handling)
    const yearsRes = await axios.get(apiUrl + "/scheduler/admin/timetable/years", {
      params: { schoolId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const years = yearsRes?.data;
    if (!Array.isArray(years) || years.length === 0) {
      throw new Error("No academic years found for this school");
    }

    const today = new Date(formatDateForApi(new Date()));
    const currentYear =
      years.find((year) => {
        const start = new Date(year.academicYearStart);
        const end = new Date(year.academicYearEnd);
        return today >= start && today <= end;
      }) ||
      [...years].sort(
        (a, b) =>
          new Date(b.academicYearStart).getTime() -
          new Date(a.academicYearStart).getTime()
      )[0];

    setAcademicYear(currentYear);
    return currentYear;
  }, [schoolId]);

  const fetchOverview = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    if (!schoolId) {
      setError("School ID is missing from the login token.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const currentYear = academicYear || (await fetchCurrentAcademicYear());
      if (!currentYear) {
        throw new Error("Academic year is not available");
      }

      const qs = {
        schoolId: String(schoolId),
        academicYearStart: currentYear.academicYearStart,
        academicYearEnd: currentYear.academicYearEnd,
      };

      const [summaryResponse, teachersResponse] = await Promise.all([
        axios.get(apiUrl + "/scheduler/principal/dashboard/summary", {
          params: qs,
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(apiUrl + "/scheduler/principal/dashboard/teachers", {
          params: qs,
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const summaryData = summaryResponse?.data;
      const teachersData = teachersResponse?.data;

      setOverview({
        summary: summaryData,
        teachers: Array.isArray(teachersData) ? teachersData : [],
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [academicYear, fetchCurrentAcademicYear, schoolId]);

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "Active Days", value: summary.activeDays },
      { label: "Total Periods", value: summary.totalPeriods },
      { label: "Assigned Periods", value: summary.assignedPeriods },
      { label: "Conflict Periods", value: summary.conflictPeriods },
      { label: "Total Tutors", value: summary.totalTutors },
      { label: "Total Capacity", value: summary.totalCapacity },
      {
        label: "Avg Utilization",
        value: formatPercent(summary.averageUtilizationPercent),
      },
    ];
  }, [summary]);

  const selectedYearLabel = useMemo(() => {
    if (summary?.academicYearStart && summary?.academicYearEnd) {
      return `${summary.academicYearStart} to ${summary.academicYearEnd}`;
    }

    if (academicYear?.academicYearStart && academicYear?.academicYearEnd) {
      return `${academicYear.academicYearStart} to ${academicYear.academicYearEnd}`;
    }

    if (summary?.weekStartDate && summary?.weekEndDate) {
      return `${summary.weekStartDate} to ${summary.weekEndDate}`;
    }

    return "";
  }, [academicYear, summary]);

  const filteredTeachers = useMemo(() => {
    if (!teachersList) return [];
    const q = String(searchQuery || "").trim().toLowerCase();
    let list = teachersList.filter((t) => {
      if (q) {
        const id = String(t.tutorId || "").toLowerCase();
        const code = String(t.tutorCode || "").toLowerCase();
        const name = String(t.tutorName || "").toLowerCase();
        if (!id.includes(q) && !code.includes(q) && !name.includes(q)) return false;
      }
      if (typeof t.utilizationPercent === "number") {
        if (t.utilizationPercent < utilizationMin) return false;
      }
      if (typeof t.assignedPeriods === "number") {
        if (t.assignedPeriods < assignedMin) return false;
      }
      return true;
    });

    if (sortBy === "utilizationDesc") {
      list.sort((a, b) => (b.utilizationPercent || 0) - (a.utilizationPercent || 0));
    } else if (sortBy === "utilizationAsc") {
      list.sort((a, b) => (a.utilizationPercent || 0) - (b.utilizationPercent || 0));
    } else if (sortBy === "assignedDesc") {
      list.sort((a, b) => (b.assignedPeriods || 0) - (a.assignedPeriods || 0));
    }

    return list;
  }, [teachersList, searchQuery, utilizationMin, assignedMin, sortBy]);

  const subjectGradeMap = useMemo(() => {
    if (!selectedTeacher) return {};

    const gradeMap = {};

    (selectedTeacher.classWorkloads || []).forEach((classRoom) => {
      const grade = classRoom.classGrade;
      if (!grade) return;

      (classRoom.subjects || []).forEach((subject) => {
        if (!subject?.subjectId) return;
        if (!gradeMap[subject.subjectId]) {
          gradeMap[subject.subjectId] = new Set();
        }
        gradeMap[subject.subjectId].add(String(grade));
      });
    });

    return Object.fromEntries(
      Object.entries(gradeMap).map(([subjectId, grades]) => [
        subjectId,
        [...grades].sort((a, b) => Number(a) - Number(b)),
      ])
    );
  }, [selectedTeacher]);

  useEffect(() => {
    if (schoolId) {
      fetchOverview();
    }
  }, [schoolId, fetchOverview]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 3,
          px: { xs: 2.5, md: 3.5 },
          py: { xs: 2.5, md: 3.5 },
          borderRadius: "24px",
          border: isDarkMode
            ? "1px solid rgba(96, 165, 250, 0.28)"
            : "1px solid rgba(147, 197, 253, 0.35)",
          background: isDarkMode
            ? "radial-gradient(circle at 88% 22%, rgba(96,165,250,0.18), transparent 20%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(17,24,39,0.98) 48%, rgba(30,41,59,0.96))"
            : "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(14,165,233,0.06) 55%, rgba(255,255,255,0.96))",
          boxShadow: isDarkMode
            ? "0 24px 48px rgba(2, 6, 23, 0.45)"
            : "0 20px 45px rgba(15, 23, 42, 0.08)",
        }}
      >
        <Typography
          variant="overline"
          sx={{
            display: "block",
            color: isDarkMode ? "#60a5fa" : "#2563eb",
            fontWeight: 800,
            letterSpacing: "0.14em",
            mb: 1,
          }}
        >
          Leadership Workspace
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: isDarkMode ? "#f8fafc" : "#0f172a",
            mb: 1,
            lineHeight: 1.05,
          }}
        >
          Principal Dashboard
        </Typography>
        <Typography sx={{ color: isDarkMode ? "#cbd5e1" : "#475569", maxWidth: 760 }}>
          Monitor academic-year utilization, spot capacity issues early, and
          drill into teacher workload details from one clean operational view.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: "16px",
            boxShadow: "0 12px 24px rgba(239, 68, 68, 0.12)",
          }}
        >
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {summary && !loading && (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: isDarkMode ? "#f8fafc" : "#0f172a" }}
            >
              Academic Year Summary
            </Typography>
            <Typography sx={{ color: isDarkMode ? "#94a3b8" : "#64748b", mt: 0.5 }}>
              {selectedYearLabel}
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            {summaryCards.map((card) => (
              <Grid key={card.label} item xs={12} sm={6} md={3} lg={3}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: "20px",
                    border: isDarkMode
                      ? "1px solid rgba(51, 65, 85, 0.72)"
                      : "1px solid rgba(148, 163, 184, 0.18)",
                    background: isDarkMode
                      ? "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
                    boxShadow: isDarkMode
                      ? "0 18px 30px rgba(2, 6, 23, 0.28)"
                      : "0 18px 30px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: isDarkMode ? "#93c5fd" : "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontSize: 12,
                      }}
                    >
                      {card.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: isDarkMode ? "#f8fafc" : "#0f172a",
                        mt: 1,
                      }}
                    >
                      {formatNumber(card.value)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {teachers.length > 0 && !loading && (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: isDarkMode ? "#f8fafc" : "#0f172a" }}
            >
              Teacher Workloads
            </Typography>
            <Typography sx={{ color: isDarkMode ? "#94a3b8" : "#64748b", mt: 0.5 }}>
              Capacity, utilization, and academic-year workload visibility for
              each tutor.
            </Typography>
          </Box>

          {/* Search & sort (filters moved into column headers) */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search by tutor code, id, or name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 260 }}
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="sort-by-label">Sort</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                label="Sort"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="utilizationDesc">Utilization (high → low)</MenuItem>
                <MenuItem value="utilizationAsc">Utilization (low → high)</MenuItem>
                <MenuItem value="assignedDesc">Assigned Periods (high → low)</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button variant="outlined" size="small" onClick={() => { setSearchQuery(''); setUtilizationMin(0); setAssignedMin(0); setSortBy('utilizationDesc'); setPage(0); }}>
                Clear
              </Button>
              <Chip label={`${filteredTeachers.length} shown`} color="primary" />
              <Button size="small" variant="text" onClick={() => setFiltersOpen((s) => !s)} sx={{ ml: 1 }}>
                {filtersOpen ? 'Hide filters' : 'Show filters'}
              </Button>
            </Box>
          </Box>

          {/* Collapsible filter panel (sticky) */}
          <Collapse in={filtersOpen} timeout={180} sx={{ mb: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                border: isDarkMode ? '1px solid rgba(148,163,184,0.06)' : '1px solid rgba(14,165,233,0.08)',
                backgroundColor: isDarkMode ? 'rgba(17,24,39,0.6)' : 'rgba(255,255,255,0.9)',
                display: 'flex',
                gap: 3,
                alignItems: 'center',
                position: 'sticky',
                top: 120,
                zIndex: 2,
              }}
            >
              <Box sx={{ minWidth: 260 }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Min utilization (%)</Typography>
                <Slider
                  value={utilizationMin}
                  onChange={(_, v) => { setUtilizationMin(Array.isArray(v) ? v[0] : v); setPage(0); }}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Box>

              <Box sx={{ minWidth: 160 }}>
                <Typography variant="caption" sx={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Min assigned periods</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={assignedMin}
                  onChange={(e) => { setAssignedMin(Number(e.target.value || 0)); setPage(0); }}
                  sx={{ width: 140 }}
                />
              </Box>

              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => { setAssignedMin(0); setUtilizationMin(0); setPage(0); }}>Reset filters</Button>
              </Box>
            </Box>
          </Collapse>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: "24px",
              overflow: "hidden",
              border: isDarkMode
                ? "1px solid rgba(51, 65, 85, 0.72)"
                : "1px solid rgba(148, 163, 184, 0.18)",
              boxShadow: isDarkMode
                ? "0 22px 40px rgba(2, 6, 23, 0.28)"
                : "0 22px 40px rgba(15, 23, 42, 0.08)",
              backgroundColor: isDarkMode ? "#111827" : "#ffffff",
              maxHeight: '60vh',
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead
                sx={{
                  background: isDarkMode ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "linear-gradient(135deg, rgba(226,232,240,0.8), rgba(255,255,255,1))",
                }}
              >
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 12 }}>Tutor Code</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 12 }}>Tutor Name</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 12 }}>Assigned Periods</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 12 }}>Capacity</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 12 }}>Max Daily Hours</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 12 }}>Utilization</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase", fontSize: 12 }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeachers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((teacher, index) => (
                  <TableRow
                    key={teacher.tutorId}
                    sx={{
                      backgroundColor: isDarkMode
                        ? index % 2 === 0
                          ? "#0f172a"
                          : "#111827"
                        : index % 2 === 0
                          ? "#ffffff"
                          : "#f8fbff",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#172033" : "#eef6ff",
                      },
                      "& td": {
                        color: isDarkMode ? "#e5e7eb" : "#0f172a",
                        borderColor: isDarkMode ? "rgba(51, 65, 85, 0.72)" : undefined,
                      },
                    }}
                  >
                    <TableCell>{teacher.tutorCode || teacher.tutorId}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{teacher.tutorName}</TableCell>
                    <TableCell>{teacher.assignedPeriods}</TableCell>
                    <TableCell>{teacher.capacity}</TableCell>
                    <TableCell>{teacher.maxDailyHours}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {formatPercent(teacher.utilizationPercent)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedTeacher(teacher)}
                        sx={{
                          borderRadius: "12px",
                          px: 2,
                          fontWeight: 800,
                          borderColor: isDarkMode ? "rgba(96,165,250,0.45)" : undefined,
                          color: isDarkMode ? "#93c5fd" : undefined,
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredTeachers.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[5,10,20,50]}
          />
        </>
      )}

      <Dialog
        open={Boolean(selectedTeacher)}
        onClose={() => setSelectedTeacher(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: "24px",
            border: isDarkMode
              ? "1px solid rgba(51, 65, 85, 0.72)"
              : "1px solid rgba(148, 163, 184, 0.18)",
            background: isDarkMode
              ? "radial-gradient(circle at top right, rgba(59,130,246,0.14), transparent 26%), linear-gradient(180deg, rgba(15,23,42,0.99), rgba(17,24,39,0.98))"
              : "radial-gradient(circle at top right, rgba(59,130,246,0.10), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.99), rgba(248,250,252,0.98))",
            boxShadow: isDarkMode
              ? "0 28px 50px rgba(2, 6, 23, 0.45)"
              : "0 28px 50px rgba(15, 23, 42, 0.18)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 2,
            px: 3,
            pt: 3,
            borderBottom: isDarkMode
              ? "1px solid rgba(51, 65, 85, 0.72)"
              : "1px solid rgba(226, 232, 240, 0.9)",
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))"
              : "linear-gradient(135deg, rgba(239,246,255,0.95), rgba(255,255,255,0.92))",
          }}
        >
          <Typography
            variant="overline"
            sx={{
              display: "block",
              mb: 0.5,
              color: isDarkMode ? "#60a5fa" : "#2563eb",
              fontWeight: 800,
              letterSpacing: "0.14em",
            }}
          >
            Teacher Detail View
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: isDarkMode ? "#f8fafc" : "#0f172a" }}
          >
            Teacher Details
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          {selectedTeacher && (
            <>
              <Box
                sx={{
                  mb: 3,
                  p: 2.25,
                  borderRadius: "20px",
                  border: isDarkMode
                    ? "1px solid rgba(96, 165, 250, 0.18)"
                    : "1px solid rgba(191, 219, 254, 0.6)",
                  background: isDarkMode
                    ? "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.94))"
                    : "linear-gradient(135deg, rgba(239,246,255,0.95), rgba(255,255,255,0.92))",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: isDarkMode ? "#f8fafc" : "#0f172a" }}
                >
                  {selectedTeacher.tutorName}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.5,
                    mb: 2,
                    color: isDarkMode ? "#94a3b8" : "#475569",
                    fontWeight: 700,
                  }}
                >
                  {selectedTeacher.tutorCode || selectedTeacher.tutorId}
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                    gap: 1.5,
                  }}
                >
                  {[
                    {
                      label: "Assigned Periods",
                      value: selectedTeacher.assignedPeriods,
                    },
                    {
                      label: "Capacity",
                      value: selectedTeacher.capacity,
                    },
                    {
                      label: "Utilization",
                      value: formatPercent(selectedTeacher.utilizationPercent),
                    },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        p: 1.5,
                        borderRadius: "16px",
                        backgroundColor: isDarkMode
                          ? "rgba(30, 41, 59, 0.82)"
                          : "rgba(255, 255, 255, 0.86)",
                        border: isDarkMode
                          ? "1px solid rgba(51, 65, 85, 0.72)"
                          : "1px solid rgba(226, 232, 240, 0.9)",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: isDarkMode ? "#93c5fd" : "#64748b",
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.75,
                          fontSize: 24,
                          fontWeight: 800,
                          color: isDarkMode ? "#f8fafc" : "#0f172a",
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {[
                {
                  title: "Daily Workload",
                  table: (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, color: isDarkMode ? "#93c5fd" : "#334155" }}>Day</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: isDarkMode ? "#93c5fd" : "#334155" }}>Periods</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(selectedTeacher.dailyWorkload || {}).map(
                          ([day, periods]) => (
                            <TableRow key={day}>
                              <TableCell>{day}</TableCell>
                              <TableCell>{periods}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  ),
                },
                {
                  title: "Subject Workloads",
                  table: (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, color: isDarkMode ? "#93c5fd" : "#334155" }}>Subject</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: isDarkMode ? "#93c5fd" : "#334155" }}>Periods</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: isDarkMode ? "#93c5fd" : "#334155" }}>Utilization</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedTeacher.subjectWorkloads || []).map((subject) => (
                          <TableRow key={`${subject.subjectId}-${subject.subjectName}`}>
                            <TableCell>
                              {subject.subjectName}
                              {subjectGradeMap[subject.subjectId]?.length
                                ? ` (${subjectGradeMap[subject.subjectId].join(", ")})`
                                : ""}
                            </TableCell>
                            <TableCell>{subject.periods}</TableCell>
                            <TableCell>{formatPercent(subject.utilizationPercent)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ),
                },
                {
                  title: "Class Workloads",
                  table: (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, color: isDarkMode ? "#93c5fd" : "#334155" }}>Class</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: isDarkMode ? "#93c5fd" : "#334155" }}>Periods</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: isDarkMode ? "#93c5fd" : "#334155" }}>Subjects</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(selectedTeacher.classWorkloads || []).map((classRoom) => {
                          const subjects = (classRoom.subjects || [])
                            .map(
                              (subject) =>
                                `${subject.subjectName} (${subject.periods})`
                            )
                            .join(", ");
                          const grade = classRoom.classGrade ?? "";
                          const section = classRoom.classSection ?? "";
                          const classLabel = section
                            ? `${grade}-${section}`
                            : grade || classRoom.classRoomId;
                          return (
                            <TableRow key={classRoom.classRoomId}>
                              <TableCell>{classLabel}</TableCell>
                              <TableCell>{classRoom.periods}</TableCell>
                              <TableCell>{subjects || "—"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ),
                },
              ].map((section) => (
                <Box
                  key={section.title}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: "20px",
                    backgroundColor: isDarkMode
                      ? "rgba(15, 23, 42, 0.88)"
                      : "rgba(255, 255, 255, 0.86)",
                    border: isDarkMode
                      ? "1px solid rgba(51, 65, 85, 0.72)"
                      : "1px solid rgba(226, 232, 240, 0.9)",
                    boxShadow: isDarkMode
                      ? "0 16px 28px rgba(2, 6, 23, 0.18)"
                      : "0 12px 22px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 1.5,
                      fontWeight: 800,
                      color: isDarkMode ? "#f8fafc" : "#0f172a",
                    }}
                  >
                    {section.title}
                  </Typography>
                  <Box
                    sx={{
                      borderRadius: "16px",
                      overflow: "hidden",
                      "& td, & th": {
                        borderColor: isDarkMode ? "rgba(51, 65, 85, 0.72)" : "#dbe3ef",
                        color: isDarkMode ? "#e5e7eb" : "#0f172a",
                      },
                    }}
                  >
                    {section.table}
                  </Box>
                </Box>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            pt: 1.5,
            borderTop: isDarkMode
              ? "1px solid rgba(51, 65, 85, 0.72)"
              : "1px solid rgba(226, 232, 240, 0.9)",
            backgroundColor: isDarkMode ? "rgba(15,23,42,0.86)" : "rgba(248,250,252,0.88)",
          }}
        >
          <Button
            onClick={() => setSelectedTeacher(null)}
            variant="outlined"
            sx={{
              borderRadius: "12px",
              px: 2.5,
              fontWeight: 800,
              borderColor: isDarkMode ? "rgba(96,165,250,0.45)" : undefined,
              color: isDarkMode ? "#93c5fd" : undefined,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
