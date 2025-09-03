// /home/talnz/PythonProjects/hr-system/hr-management-system/app/update-password/page.tsx
"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container, Paper, TextField, Button, Typography, Box, Alert, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import { createClient } from '@supabase/supabase-js';

// It's safe to keep the Supabase client here as this page interacts directly with Supabase Auth
const supabaseUrl = 'https://mqnvornhhshmlrymthyn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbnZvcm5oaHNobWxyeW10aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NzkwNTMsImV4cCI6MjA3MTE1NTA1M30.1hcrmWIshMKIF7baDYCaAHo1nMl_zBPpQWkUbp9XCy0';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // <-- NEW STATE
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isRecoveryEvent, setIsRecoveryEvent] = useState(false); // Track if we're in recovery mode
    const router = useRouter();

    useEffect(() => {
        // Supabase appends the recovery token as a hash fragment in the URL
        // We listen for the PASSWORD_RECOVERY event which provides the session
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecoveryEvent(true);
                toast.success("You can now set a new password.");
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Client-side validation (FR-3.4)
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            toast.error("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        setError("");

        // The session is automatically set by Supabase from the URL fragment
        const { error: updateError } = await supabase.auth.updateUser({ password });

        setLoading(false);

        if (updateError) {
            // Handle expired/invalid token (FR-4.3)
            setError(updateError.message);
            toast.error(`Error: ${updateError.message}`);
        } else {
            // Success (FR-4.1)
            toast.success("Your password has been updated successfully! Please log in.");
            // Redirect to login (FR-4.2)
            router.push('/login');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Set a New Password
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* The form is shown once the recovery event has fired */}
                    {isRecoveryEvent ? (
                        <Box component="form" onSubmit={handleUpdatePassword} sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="New Password"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {/* --- NEW CONFIRM PASSWORD FIELD (FR-3.3) --- */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm New Password"
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                                {loading ? <CircularProgress size={24} /> : "Update Password"}
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center', my: 3 }}>
                           <Typography variant="body1">Verifying reset link...</Typography>
                           <CircularProgress sx={{mt: 2}} />
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}