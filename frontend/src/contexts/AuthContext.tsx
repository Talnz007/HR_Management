"use client"

import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { authService } from "../../app/services/authService";
import { apiService } from "../../app/services/apiService";

// The User interface remains the same
export interface User {
  user_id: string;
  username: string;
  email: string;
  phone: string;
  is_active: boolean;
  role: 'admin' | 'manager' | 'employee'; // Use a strict type for roles
  profile_picture_key?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// A helper function to decode the token and get user data
const getUserFromToken = (token: string): User | null => {
    try {
        const decoded: { sub: string; user_id: string; role: 'admin' | 'manager' | 'employee' } = jwtDecode(token);
        // This is a simplified user object from the token.
        // The full user object will be fetched from /users/me
        return {
            user_id: decoded.user_id,
            username: decoded.sub,
            role: decoded.role,
            // These fields are not in the token but are part of the User interface.
            // They will be populated by the getMe call.
            email: '',
            phone: '',
            is_active: true,
        };
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          console.log("Initializing auth with token");
          // The /users/me endpoint now returns the complete user object with the role
          const userData = await apiService.getMe();
          console.log("User data loaded:", userData);
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user data during init:", error);
          // If getMe fails (e.g., token expired), log out the user
          await logout();
        }
      }
      setLoading(false);
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log("Login attempt for:", username);
      const response = await authService.login(username, password);
      console.log("Login successful, tokens received");

      localStorage.setItem("access_token", response.access_token);
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token);
      }

      // The new token contains the role. We can decode it or fetch from /users/me.
      // Fetching from /users/me is more robust as it gets the full, up-to-date user profile.
      const userData = await apiService.getMe();
      console.log("User data after login:", userData);
      
      setUser(userData);

    } catch (error) {
      console.error("Login failed:", error);
      // Ensure user state is cleared on failed login
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // It's okay if this fails (e.g. network error), we still want to clear client-side data
      await authService.logout(); 
    } catch (error) {
      console.error("Logout API call failed, proceeding with client-side cleanup:", error);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      // Redirect to login to ensure a clean state
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isManager = user?.role?.toLowerCase() === "manager";
  const isEmployee = user?.role?.toLowerCase() === "employee";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isManager,
        isEmployee,
        login,
        logout,
        loading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};