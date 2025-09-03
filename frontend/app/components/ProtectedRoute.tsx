"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isAdmin, isManager, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait until authentication status is determined
    }

    const isLoginPage = pathname === "/login";

    if (!isAuthenticated && !isLoginPage) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      // If authenticated user is on the login page, redirect them to their dashboard
      if (isLoginPage) {
        if (isAdmin) router.push("/admin/dashboard");
        else if (isManager) router.push("/manager/dashboard");
        else router.push("/dashboard");
        return;
      }

      const isAdminRoute = pathname.startsWith("/admin");
      const isManagerRoute = pathname.startsWith("/manager");
      
      // If a non-admin tries to access an admin route, redirect
      if (isAdminRoute && !isAdmin) {
        router.push(isManager ? "/manager/dashboard" : "/dashboard");
        return;
      }
      
      // If an employee tries to access a manager route, redirect
      if (isManagerRoute && !isAdmin && !isManager) {
          router.push("/dashboard");
          return;
      }
    }
  }, [loading, isAuthenticated, isAdmin, isManager, pathname, router]);

  // Show a loading skeleton while checking auth, but not on the login page itself
  if (loading && pathname !== '/login') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-1/2 h-1/2 rounded-lg" />
      </div>
    );
  }

  // If not authenticated and not on the login page, the useEffect will redirect,
  // so we can render null or a loader to prevent content flash.
  if (!isAuthenticated && pathname !== '/login') {
    return null; 
  }

  return <>{children}</>;
}