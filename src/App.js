import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CredentialsSignInPage from "./Components/Landing-Page-components/CredentialsSignInPage";
import RegistrationPage from "./Components/Landing-Page-components/RegistrationPage";
import PricingPage from "./Components/Landing-Page-components/PricingPage";
import AdminDashboard from "./Components/Admin/DashboardSection/Admin Layout/AdminDashboardLayout";
import UserHomePage from "./Components/Student/UserHomePage";
import TutorTimetable from "./Components/Admin/DashboardSection/TutorTimetable";
import {jwtDecode} from "jwt-decode";
import { clearAuthStorage, isTokenExpired } from "./utils/auth";

function PrivateRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" />;
  if (isTokenExpired(token)) {
    clearAuthStorage();
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const userRole =
      decoded.role || decoded.roles?.[0] || localStorage.getItem("role");
    if (allowedRoles.includes(userRole)) {
      return children;
    } else {
      return <Navigate to="/unauthorized" />;
    }
  } catch (e) {
    clearAuthStorage();
    return <Navigate to="/" replace />;
  }
}

function NotAuthorized() {
  return <h2 style={{ textAlign: "center", marginTop: "3rem" }}>🚫 Access Denied</h2>;
}

export default function App() {
  useEffect(() => {
    const intervalId = setInterval(() => {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (isTokenExpired(token)) {
        clearAuthStorage();
        if (window.location.pathname !== "/") {
          window.location.replace("/");
        }
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CredentialsSignInPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={["ADMIN", "PRINCIPAL"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/user"
          element={
            <PrivateRoute allowedRoles={["STUDENT", "USER"]}>
              <UserHomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tutor-timetable"
          element={
            <PrivateRoute allowedRoles={["TUTOR", "ADMIN"]}>
              <TutorTimetable />
            </PrivateRoute>
          }
        />
        <Route path="/unauthorized" element={<NotAuthorized />} />
      </Routes>
    </Router>
  );
}
