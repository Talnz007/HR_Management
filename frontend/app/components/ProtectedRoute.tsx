"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!isAuthenticated && pathname !== "/login") {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      const isAdminRoute = pathname.startsWith("/admin");
      const isEmployeeRoute = pathname.startsWith("/employee");
      if (isAdmin && isEmployeeRoute) {
        router.push("/admin/dashboard");
        return;
      }
      if (!isAdmin && isAdminRoute) {
        router.push("/employee/dashboard");
        return;
      }
    }
  }, [loading, isAuthenticated, isAdmin, pathname, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-1/2 h-1/2 rounded-lg" />
      </div>
    );
  }

  return <>{children}</>;
}
