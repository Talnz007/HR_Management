  "use client"
  
  import type React from "react"
  import { useEffect } from "react"
  import { useRouter } from "next/navigation"
  import { useAuth } from "../contexts/AuthContext"
  import { CircularProgress, Box } from "@mui/material"
  
  interface ProtectedRouteProps {
    children: React.ReactNode
    requireAdmin?: boolean
  }
  
  export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth()
    const router = useRouter()
  
    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push("/login")
          return
        }
  
        if (requireAdmin && !isAdmin) {
          router.push("/dashboard")
          return
        }
      }
    }, [isAuthenticated, isAdmin, loading, requireAdmin, router])
  
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      )
    }
  
    if (!isAuthenticated) {
      return null
    }
  
    if (requireAdmin && !isAdmin) {
      return null
    }
  
    return <>{children}</>
  }
