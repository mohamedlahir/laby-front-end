import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import GlobalStyles from "@mui/material/GlobalStyles";
import { createTheme, useColorScheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
// import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
// import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import EventNoteIcon from "@mui/icons-material/EventNote";

import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { ThemeSwitcher } from "@toolpad/core/DashboardLayout";
import { DemoProvider, useDemoRouter } from "@toolpad/core/internal";
import { jwtDecode } from "jwt-decode";
import { clearAuthStorage } from "../../../../utils/auth";

import UserDetailsPage from "../UserDetailsPage";
import Dashboard from "../Dashboard";
import PrincipalDashboard from "../PrincipalDashboard";
import TutorTimetable from "../TutorTimetable";
import ApplyLeave from "../Tutor Management/ApplyLeave";
import TutorDashboard from "../../../Teachers/TutorDashboard";
import GenerateTimetable from "../TimeTable Generation/GenerateTimetable";
import ClassTimetable from "../TimeTable Generation/ClassTimetable";
import Conflicts from "../TimeTable Generation/Conflicts";
import AllConflicts from "../TimeTable Generation/AllConflicts";
import TutorConflicts from "../TimeTable Generation/TutorConflicts";
import ClassroomManagement from "../Setup/ClassroomManagement";
import axios from "axios";

/* ===================== NAVIGATION ===================== */

const NAVIGATION = [
  { segment: "dashboard", title: "Dashboard", icon: <DashboardIcon /> },
  { segment: "tutor-timetable", title: "Tutor Timetable", icon: <EventNoteIcon /> },
  { segment: "class-timetable", title: "Class Timetable", icon: <EventNoteIcon /> },
  { segment: "tutor-management", title: "Tutor Management", icon: <ManageAccountsIcon /> },
  { kind: "header", title: "Setup" },
  { segment: "classroom-management", title: "Classroom Management", icon: <EventNoteIcon /> },
  { segment: "timetable", title: "Time Table Setup", icon: <BarChartOutlinedIcon /> },
  { segment: "conflicts-all", title: "All Conflicts", icon: <EventNoteIcon /> },
  { segment: "conflicts-tutor", title: "Tutor Conflicts", icon: <EventNoteIcon /> },
];

/* ===================== THEME ===================== */

const demoTheme = createTheme({
  cssVariables: { colorSchemeSelector: "data-toolpad-color-scheme" },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#2563eb",
        },
        background: {
          default: "#f6f8fc",
          paper: "#ffffff",
        },
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: {
          main: "#60a5fa",
        },
        background: {
          default: "#0f1115",
          paper: "#111827",
        },
        text: {
          primary: "#e5e7eb",
          secondary: "#94a3b8",
        },
        divider: "rgba(51, 65, 85, 0.72)",
      },
    },
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: "background-color 0.2s ease, color 0.2s ease",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(15, 17, 21, 0.88)"
              : "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(16px)",
          borderBottom:
            theme.palette.mode === "dark"
              ? "1px solid rgba(51, 65, 85, 0.7)"
              : "1px solid rgba(226, 232, 240, 0.9)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 12px 30px rgba(2, 6, 23, 0.3)"
              : "0 10px 30px rgba(15, 23, 42, 0.06)",
          color: theme.palette.mode === "dark" ? "#e5e7eb" : "#0f172a",
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRight:
            theme.palette.mode === "dark"
              ? "1px solid rgba(51, 65, 85, 0.72)"
              : "1px solid rgba(226, 232, 240, 0.95)",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(10,12,16,0.98), rgba(15,17,21,0.98))"
              : "linear-gradient(180deg, #ffffff, #f8fbff)",
          color: theme.palette.mode === "dark" ? "#e5e7eb" : "#111827",
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          margin: "4px 0",
          borderRadius: "16px",
          minHeight: "56px",
          color: theme.palette.mode === "dark" ? "#e5e7eb" : "#111827",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(37, 99, 235, 0.14)"
                : "rgba(37, 99, 235, 0.08)",
            transform: "translateX(2px)",
          },
          "&.Mui-selected": {
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(30,64,175,0.32))"
                : "linear-gradient(135deg, rgba(219,234,254,0.95), rgba(239,246,255,0.95))",
            color: theme.palette.mode === "dark" ? "#93c5fd" : "#2563eb",
            boxShadow:
              theme.palette.mode === "dark"
                ? "inset 0 0 0 1px rgba(96,165,250,0.16)"
                : "inset 0 0 0 1px rgba(147,197,253,0.45)",
          },
          "&.Mui-selected:hover": {
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(30,41,59,0.98), rgba(37,99,235,0.34))"
                : "linear-gradient(135deg, rgba(219,234,254,1), rgba(239,246,255,1))",
          },
        }),
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 42,
          color: "inherit",
        },
      },
    },
  },
});

function HeaderActions() {
  const handleLogout = () => {
    clearAuthStorage();
    window.location.replace("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
      }}
    >
      <ThemeSwitcher />
      <Button
        variant="outlined"
        onClick={handleLogout}
        size="small"
        sx={{
          minHeight: 42,
          px: 2,
          borderRadius: "12px",
          fontWeight: 800,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          borderColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(248, 113, 113, 0.5)"
              : "rgba(239, 68, 68, 0.35)",
          color: (theme) =>
            theme.palette.mode === "dark" ? "#fca5a5" : "#dc2626",
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(127, 29, 29, 0.08)"
              : "rgba(255,255,255,0.85)",
          "&:hover": {
            borderColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(248, 113, 113, 0.8)"
                : "rgba(239, 68, 68, 0.55)",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(127, 29, 29, 0.16)"
                : "rgba(254, 242, 242, 0.9)",
          },
        }}
      >
        Logout
      </Button>
    </Box>
  );
}

/* ===================== PAGE CONTENT ===================== */

function DemoPageContent({ pathname, isDarkMode }) {
  const token = localStorage.getItem("token");
  let userRole = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole =
        decoded.role ||
        decoded.roles?.[0] ||
        localStorage.getItem("role") ||
        null;
    } catch (e) {
      userRole = localStorage.getItem("role") || null;
    }
  }

  if (pathname === "/dashboard") {
    if (userRole === "ADMIN") {
      return <PrincipalDashboard />;
    }

    if (userRole === "TUTOR") {
      return <TutorDashboard />;
    }

    return <Dashboard />;
  }

  if (pathname === "/profile") {
    return <UserDetailsPage />;
  }

  if (pathname === "/timetable") {
    return (
      <Box
        sx={{
          width: "100%",
          px: { xs: 1, md: 2 },
          py: 1,
        }}
      >
        <Box
          sx={{
            mb: 3,
            px: 3,
            py: 3,
            borderRadius: "24px",
            background: isDarkMode
              ? "radial-gradient(circle at 88% 22%, rgba(96,165,250,0.18), transparent 20%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(17,24,39,0.98) 48%, rgba(30,41,59,0.96))"
              : "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(14,165,233,0.06) 55%, rgba(255,255,255,0.96))",
            border: isDarkMode
              ? "1px solid rgba(96, 165, 250, 0.28)"
              : "1px solid rgba(147, 197, 253, 0.35)",
            boxShadow: isDarkMode
              ? "0 24px 48px rgba(2, 6, 23, 0.45)"
              : "0 20px 45px rgba(15, 23, 42, 0.08)",
            position: "relative",
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              background: isDarkMode
                ? "linear-gradient(120deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.08) 40%, rgba(96,165,250,0.06) 100%)"
                : "none",
              pointerEvents: "none",
            },
          }}
        >
          <Typography
            variant="overline"
            sx={{
              position: "relative",
              zIndex: 1,
              display: "block",
              color: isDarkMode ? "#60a5fa" : "#2563eb",
              fontWeight: 800,
              letterSpacing: "0.14em",
              mb: 1,
            }}
          >
            Scheduler Workspace
          </Typography>
          <Typography
            variant="h4"
            sx={{
              position: "relative",
              zIndex: 1,
              fontWeight: 800,
              color: isDarkMode ? "#f8fafc" : "#0f172a",
              mb: 1,
              textShadow: isDarkMode
                ? "0 2px 18px rgba(15, 23, 42, 0.45)"
                : "none",
            }}
          >
            Timetable Management
          </Typography>
          <Typography
            sx={{
              position: "relative",
              zIndex: 1,
              color: isDarkMode ? "#cbd5e1" : "#475569",
              maxWidth: 760,
              lineHeight: 1.7,
            }}
          >
            Generate and review academic-year timetables with a cleaner operational view
            for administrators and school leadership.
          </Typography>
        </Box>

        <GenerateTimetable mode="both" />

        <Box sx={{ my: 4 }} />
      </Box>
    );
  }
  if (pathname === "/classroom-management") {
    return (
      <Box
        sx={{
          width: "100%",
          px: { xs: 1, md: 2 },
          py: 1,
        }}
      >
        <ClassroomManagement />
      </Box>
    );
  }
  if (pathname === "/class-timetable") {
    return (
      <Box
        sx={{
          width: "100%",
          px: { xs: 1, md: 2 },
          py: 1,
        }}
      >
        <Box
          sx={{
            mb: 3,
            px: 3,
            py: 3,
            borderRadius: "24px",
            background: isDarkMode
              ? "radial-gradient(circle at 88% 22%, rgba(96,165,250,0.18), transparent 20%), linear-gradient(135deg, rgba(15,23,42,0.98), rgba(17,24,39,0.98) 48%, rgba(30,41,59,0.96))"
              : "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(14,165,233,0.06) 55%, rgba(255,255,255,0.96))",
            border: isDarkMode
              ? "1px solid rgba(96, 165, 250, 0.28)"
              : "1px solid rgba(147, 197, 253, 0.35)",
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
            Setup Workspace
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: isDarkMode ? "#f8fafc" : "#0f172a",
              mb: 1,
            }}
          >
            Class Timetable
          </Typography>
          <Typography sx={{ color: isDarkMode ? "#cbd5e1" : "#475569", maxWidth: 760, lineHeight: 1.7 }}>
            Review the full weekly schedule by class, subject, and assigned tutor.
          </Typography>
        </Box>
        <ClassTimetable />
      </Box>
    );
  }
  if (pathname === "/conflicts") {
    return (
      <Box
        sx={{
          width: "100%",
          px: { xs: 1, md: 2 },
          py: 1,
        }}
      >
        <Conflicts />
      </Box>
    );
  }
  if (pathname === "/conflicts-all") {
    return (
      <Box
        sx={{
          width: "100%",
          px: { xs: 1, md: 2 },
          py: 1,
        }}
      >
        <AllConflicts />
      </Box>
    );
  }

  if (pathname === "/conflicts-tutor") {
    return (
      <Box
        sx={{
          width: "100%",
          px: { xs: 1, md: 2 },
          py: 1,
        }}
      >
        <TutorConflicts />
      </Box>
    );
  }
  if (pathname === "/tutor-timetable") {
    return <TutorTimetable />;
  }

  if (pathname === "/tutor-management") {
    return <ApplyLeave />;
  }

  // fallback for dashboard route: if token role indicates TUTOR, show TutorDashboard

  return (
    <Box
      sx={{
        py: 2,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Typography>Page not found: {pathname}</Typography>
    </Box>
  );
}

DemoPageContent.propTypes = {
  isDarkMode: PropTypes.bool.isRequired,
  pathname: PropTypes.string.isRequired,
};

/* ===================== MAIN LAYOUT ===================== */

function AdminLayoutShell({ router }) {
  const { mode } = useColorScheme();
  const isDarkMode = mode === "dark";
  const [sessionExpired, setSessionExpired] = React.useState(false);

  React.useEffect(() => {
    // register axios interceptor to catch 401 and show a session-expired modal
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        try {
          if (err && err.response && err.response.status === 401) {
            clearAuthStorage();
            setSessionExpired(true);
          }
        } catch (e) {
          // ignore
        }
        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.response.eject(id);
    };
  }, []);

  return (
    <>
      <GlobalStyles
        styles={{
          "body": {
            backgroundColor: isDarkMode ? "#0f1115" : "#f6f8fc",
            color: isDarkMode ? "#e5e7eb" : "#0f172a",
          },
          ".MuiAppBar-root, .MuiAppBar-colorInherit": {
            backgroundColor: `${isDarkMode ? "rgba(15, 17, 21, 0.92)" : "rgba(255, 255, 255, 0.92)"} !important`,
            color: `${isDarkMode ? "#e5e7eb" : "#0f172a"} !important`,
            borderBottom: `${isDarkMode ? "1px solid rgba(51, 65, 85, 0.7)" : "1px solid rgba(226, 232, 240, 0.9)"} !important`,
            boxShadow: `${isDarkMode ? "0 12px 30px rgba(2, 6, 23, 0.3)" : "0 10px 30px rgba(15, 23, 42, 0.06)"} !important`,
            backdropFilter: "blur(16px)",
            backgroundImage: "none !important",
          },
          ".MuiAppBar-root .MuiToolbar-root, .MuiAppBar-colorInherit .MuiToolbar-root": {
            backgroundColor: "transparent !important",
          },
          ".MuiAppBar-root a, .MuiAppBar-colorInherit a": {
            color: `${isDarkMode ? "#93c5fd" : "#60a5fa"} !important`,
          },
          ".MuiDrawer-paper": {
            background: isDarkMode
              ? "linear-gradient(180deg, rgba(10,12,16,0.98), rgba(15,17,21,0.98))"
              : "linear-gradient(180deg, #ffffff, #f8fbff)",
            color: isDarkMode ? "#e5e7eb" : "#111827",
            borderRight: isDarkMode
              ? "1px solid rgba(51, 65, 85, 0.72)"
              : "1px solid rgba(226, 232, 240, 0.95)",
          },
        }}
      />
      <DashboardLayout
        sx={{
          backgroundColor: isDarkMode ? "#0f1115" : "#f6f8fc",
          height: "auto",
          minHeight: "100vh",
          overflow: "visible",
          width: "100%",
          "& .MuiToolbar-root": {
            minHeight: "78px",
            px: { xs: 2, md: 3 },
          },
          "& .MuiList-root": {
            gap: "8px",
            padding: "12px 10px",
          },
          "& .MuiListItemButton-root": {
            margin: "4px 0",
            borderRadius: "16px",
            minHeight: "56px",
            color: isDarkMode ? "#e5e7eb" : "#111827",
            transition: "all 0.2s ease",
          },
          "& .MuiListItemButton-root:hover": {
            backgroundColor: isDarkMode
              ? "rgba(37, 99, 235, 0.14)"
              : "rgba(37, 99, 235, 0.08)",
            transform: "translateX(2px)",
          },
          "& .MuiListItemButton-root.Mui-selected": {
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(30,64,175,0.32))"
              : "linear-gradient(135deg, rgba(219,234,254,0.95), rgba(239,246,255,0.95))",
            color: isDarkMode ? "#93c5fd" : "#2563eb",
            boxShadow: isDarkMode
              ? "inset 0 0 0 1px rgba(96,165,250,0.16)"
              : "inset 0 0 0 1px rgba(147,197,253,0.45)",
          },
          "& .MuiListItemButton-root.Mui-selected:hover": {
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(30,41,59,0.98), rgba(37,99,235,0.34))"
              : "linear-gradient(135deg, rgba(219,234,254,1), rgba(239,246,255,1))",
          },
          "& .MuiListItemIcon-root": {
            minWidth: 42,
            color: "inherit",
          },
          "& .MuiListItemText-primary": {
            fontWeight: 700,
            letterSpacing: "0.01em",
          },
          "& [class*='ToolpadDashboardLayout-appTitle']": {
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: isDarkMode ? "#e5e7eb" : "#2563eb",
          },
          "& [class*='ToolpadDashboardLayout-main']": {
            background: isDarkMode
              ? "radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 18%), #0f1115"
              : "radial-gradient(circle at top right, rgba(37,99,235,0.05), transparent 18%), #f6f8fc",
            minHeight: "calc(100vh - 78px)",
            overflowY: "visible",
            overflowX: "hidden",
            paddingBottom: "32px",
          },
          "& main": {
            overflowY: "visible",
            overflowX: "hidden",
          },
          "& [class*='ToolpadDashboardLayout-content']": {
            minHeight: "100%",
            overflow: "visible",
          },
        }}
        slots={{
          toolbarActions: HeaderActions,
        }}
      >
        <DemoPageContent pathname={router.pathname} isDarkMode={isDarkMode} />

        {/* Session expired modal */}
        {sessionExpired && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(2,6,23,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
            }}
          >
            <div style={{ width: "min(520px, 94%)", background: isDarkMode ? "#0f172a" : "#fff", padding: 20, borderRadius: 12 }}>
              <h3 style={{ marginTop: 0 }}>Session expired</h3>
              <p>Your session has expired. Please login again to continue.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={() => window.location.replace("/")}>Login</Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}

AdminLayoutShell.propTypes = {
  router: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

function DashboardLayoutBranding(props) {
  const router = useDemoRouter("/dashboard");
  const pageTitleMap = {
    "/dashboard": "Dashboard",
    "/profile": "Profile",
    "/classroom-management": "Classroom Management",
    "/timetable": "Time Table Setup",
    "/class-timetable": "Class Timetable",
    "/tutor-timetable": "Tutor Timetable",
    "/tutor-management": "Tutor Management",
    "/conflicts-all": "All Conflicts",
    "/conflicts-tutor": "Tutor Conflicts",
    "/orders": "Orders",
  };
  const currentTitle = pageTitleMap[router.pathname] || "Dashboard";

  return (
    <DemoProvider>
      <AppProvider
        navigation={NAVIGATION}
        router={router}
        theme={demoTheme}
        branding={{
          title: currentTitle,
          homeUrl: "/dashboard",
        }}
      >
        <AdminLayoutShell router={router} />
      </AppProvider>
    </DemoProvider>
  );
}

export default DashboardLayoutBranding;
