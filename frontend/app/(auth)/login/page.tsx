// /home/talnz/PythonProjects/hr-system/hr-management-system/app/(auth)/login/page.tsx
"use client"

import React, { useState } from "react";
import { Container, Paper, TextField, Button, Typography, Box, Alert, CircularProgress, Link } from "@mui/material";
import { useAuth } from "@/src/contexts/AuthContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/app/services/authService";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(isAdmin ? "/admin/dashboard" : "/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(username, password);
      toast.success("Login successful!");
      // The useEffect will handle the redirect
    } catch (err: any) {
      console.error("Login error:", err);
      // More specific error handling
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Login failed. Please try again.");
      }
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  // --- REFACTORED FUNCTION TO HANDLE PASSWORD RESET ---
  const handlePasswordReset = async () => {
    const email = prompt("Please enter the email address for your account:");
    if (!email) {
      return; // User cancelled the prompt
    }

    setLoading(true);
    try {
        // Call our backend instead of Supabase directly
        const response = await authService.requestPasswordReset(email);
        // Display the generic success message from the backend (fulfills FR-1.4)
        toast.success(response.message);
    } catch (apiError: any) {
        // Even if the API call fails, we show a generic message for security.
        // The actual error can be logged to an observability tool.
        console.error("Password reset request failed:", apiError);
        toast.success("If an account with that email exists, a password reset link has been sent.");
    } finally {
        setLoading(false);
    }
  };
  // --- END OF REFACTORED FUNCTION ---

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            HR System Login
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 1 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
            {/* --- "FORGOT PASSWORD" LINK (no changes needed here) --- */}
            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link component="button" variant="body2" onClick={handlePasswordReset} disabled={loading}>
                Forgot your password?
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}