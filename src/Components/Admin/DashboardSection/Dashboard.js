import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
  Menu,
} from "@mui/material";

import {
  Download as DownloadIcon,
  PersonAdd,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";

import * as XLSX from "xlsx";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [roleAnchorEl, setRoleAnchorEl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const usersPerPage = 20;

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    userId: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/users/getuser", {
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

  const applyFilters = (searchValue, roleValue) => {
    let filtered = users;

    if (searchValue) {
      filtered = filtered.filter((user) => {
        const email = user.email?.toLowerCase() || "";
        const firstName = user.firstName?.toLowerCase() || "";
        const lastName = user.lastName?.toLowerCase() || "";

        return (
          email.includes(searchValue) ||
          firstName.includes(searchValue) ||
          lastName.includes(searchValue)
        );
      });
    }

    if (roleValue) {
      filtered = filtered.filter((user) => user.role === roleValue);
    }

    setFilteredUsers(filtered);
    setPage(1);
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    applyFilters(value, roleFilter);
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (page - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + usersPerPage
  );

  const handlePageChange = (_, value) => setPage(value);

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredUsers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "User_Report.xlsx");
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "",
      userId: "",
    });
    setOpen(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setCurrentUser(user);
    setNewUser({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      role: user.role,
      userId: user.userId,
    });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const url = isEditing
      ? `http://localhost:8080/users/update/${currentUser.userId}`
      : "http://localhost:8080/auth/register";

    const method = isEditing ? "PUT" : "POST";
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) throw new Error("Failed to save user");

      setSnackbar({
        open: true,
        message: isEditing ? "User updated successfully!" : "User added successfully!",
        severity: "success",
      });

      handleClose();
      fetchUsers();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Action failed!",
        severity: "error",
      });
    }
  };

  const handleSelectUser = (profileID) => {
    setSelectedUsers((prev) =>
      prev.includes(profileID)
        ? prev.filter((id) => id !== profileID)
        : [...prev, profileID]
    );
  };

  const handleDelete = async () => {
    if (selectedUsers.length === 0) {
      setSnackbar({
        open: true,
        message: "Select users to delete",
        severity: "error",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      for (const id of selectedUsers) {
        await fetch(
          `http://localhost:8080/users/userprofile/delete/${id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      setSnackbar({
        open: true,
        message: "Users deleted successfully!",
        severity: "success",
      });

      fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Typography variant="h4" textAlign="center" mb={4} fontWeight={700}>
        Admin Dashboard
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          gap: 2,
        }}
      >
        <TextField
          label="Search User"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ width: "40%" }}
        />

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={downloadExcel}
            startIcon={<DownloadIcon />}
          >
            Download
          </Button>

          <Button
            variant="outlined"
            onClick={handleOpenAdd}
            startIcon={<PersonAdd />}
          >
            Add User
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "primary.main" }}>
            <TableRow>
              <TableCell sx={{ color: "white" }} />
              <TableCell sx={{ color: "white" }}>First Name</TableCell>
              <TableCell sx={{ color: "white" }}>Last Name</TableCell>
              <TableCell sx={{ color: "white" }}>Email</TableCell>

              <TableCell sx={{ color: "white" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={(e) => setRoleAnchorEl(e.currentTarget)}
                >
                  Role <FilterIcon sx={{ color: "white" }} />
                </Box>
              </TableCell>

              <TableCell sx={{ color: "white" }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <Menu
            anchorEl={roleAnchorEl}
            open={Boolean(roleAnchorEl)}
            onClose={() => setRoleAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                setRoleFilter("");
                applyFilters(searchTerm, "");
                setRoleAnchorEl(null);
              }}
            >
              All Roles
            </MenuItem>
            <MenuItem
              onClick={() => {
                setRoleFilter("ADMIN");
                applyFilters(searchTerm, "ADMIN");
                setRoleAnchorEl(null);
              }}
            >
              Admin
            </MenuItem>
            <MenuItem
              onClick={() => {
                setRoleFilter("STAFF");
                applyFilters(searchTerm, "STAFF");
                setRoleAnchorEl(null);
              }}
            >
              Staff
            </MenuItem>
            <MenuItem
              onClick={() => {
                setRoleFilter("STUDENT");
                applyFilters(searchTerm, "STUDENT");
                setRoleAnchorEl(null);
              }}
            >
              Student
            </MenuItem>
            <MenuItem
              onClick={() => {
                setRoleFilter("PRINCIPAL");
                applyFilters(searchTerm, "PRINCIPAL");
                setRoleAnchorEl(null);
              }}
            >
              Principal
            </MenuItem>
          </Menu>

          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.profileID}>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.profileID)}
                    onChange={() => handleSelectUser(user.profileID)}
                  />
                </TableCell>

                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>

                <TableCell>
                  <IconButton onClick={() => handleOpenEdit(user)}>
                    <EditIcon color="primary" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredUsers.length > usersPerPage && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
          />
        </Box>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? "Edit User" : "Add User"}</DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="First Name"
            name="firstName"
            value={newUser.firstName}
            onChange={handleInputChange}
          />

          <TextField
            label="Last Name"
            name="lastName"
            value={newUser.lastName}
            onChange={handleInputChange}
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            value={newUser.email}
            onChange={handleInputChange}
          />

          {!isEditing && (
            <TextField
              label="Password"
              name="password"
              type="password"
              value={newUser.password}
              onChange={handleInputChange}
            />
          )}

          <TextField
            label="Role"
            name="role"
            select
            value={newUser.role}
            onChange={handleInputChange}
          >
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="STAFF">Staff</MenuItem>
            <MenuItem value="STUDENT">Student</MenuItem>
            <MenuItem value="PRINCIPAL">Principal</MenuItem>
          </TextField>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="outlined">
            {isEditing ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((prev) => ({ ...prev, open: false }))
        }
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
