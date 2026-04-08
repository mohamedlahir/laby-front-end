// import React from "react";
// import { Box, Typography, Button } from "@mui/material";


// export default function Demo() {
  // const handleLogout = () => {
  //   localStorage.removeItem("token");
  //   window.location.href = "/";
  // };

//   return (<div >
//     <Button variant="outlined" sx={{ mt: 3, left: "calc(100% - 100px)", display: "inline"}} onClick={handleLogout}>
//         Logout
//       </Button>
//   </div>
      
//   );
// }

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Grid,
  TextField,
  Pagination,
  CircularProgress,
  Container, Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { API_BASE } from "../../../config/api";

export default function Profile() {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const usersPerPage = 50;

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
  const response = await fetch(`${API_BASE}/users/getuser`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch users");

        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle email filter
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchEmail(value);
    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(value)
    );
    setFilteredUsers(filtered);
    setPage(1); // reset pagination on new search
  };

    const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (page - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + usersPerPage
  );

  const handlePageChange = (_, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
 
    <Container maxWidth="xl" sx={{ py: 5 }}>
      {/* 🔍 Search Field */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 4,
        }}
      >
           
        <TextField
          label="Search by Email"
          variant="outlined"
          value={searchEmail}
          onChange={handleSearch}
          sx={{
            width: "100%",
            maxWidth: 400,
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
          }}
        />
        <Button variant="outlined" sx={{ mt: 3, left: "calc(100% - 900px)", display: "inline"}} onClick={handleLogout}>
        Logout
      </Button>
      </Box>

      

      {/* 🧑 User Cards Grid */}
      {filteredUsers.length === 0 ? (
        <Typography
          textAlign="center"
          color="text.secondary"
          sx={{ mt: 8, fontSize: 18 }}
        >
          No users found.
        </Typography>
      ) : (
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="center"
        >
          {paginatedUsers.map((user, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  height: "100%",
                  p: 3,
                  borderRadius: 3,
                  boxShadow: 3,
                  transition: "0.3s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 72,
                    height: 72,
                    mb: 2,
                    fontSize: 28,
                  }}
                >
                  {user.firstName?.[0] || "U"}
                </Avatar>

                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {user.email}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1.5,
                      display: "inline-block",
                      bgcolor: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText,
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontWeight: 500,
                      letterSpacing: 0.3,
                    }}
                  >
                    {user.role}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 📄 Pagination */}
      {filteredUsers.length > usersPerPage && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
}
