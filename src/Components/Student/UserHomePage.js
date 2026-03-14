import React from "react";
import { Box, Typography, Button } from "@mui/material";

export default function UserHomePage() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Typography variant="h4">🎓 Student Dashboard</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Welcome to your student portal.
      </Typography>
      <Button variant="contained" sx={{ mt: 3 }} onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );
}
