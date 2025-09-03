"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Receipt as ReceiptIcon,
  SupervisorAccount as ManagerIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  ExitToApp as LogoutIcon,
  Person as ProfileIcon,
  Add as AddIcon
} from "@mui/icons-material";
import { useAuth } from "@/src/contexts/AuthContext";

// Define the drawer width for responsiveness
const drawerWidth = 240;

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

export function Sidebar({ mobileOpen, handleDrawerToggle }: SidebarProps) {
  const { user, isAdmin, isManager, isEmployee, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State for collapsible menu sections
  const [open, setOpen] = useState({
    employees: false,
    attendance: false,
    leaves: false,
    payroll: false,
  });

  const handleToggle = (section: keyof typeof open) => {
    setOpen({ ...open, [section]: !open[section] });
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    const items = [];

    // Dashboard - all users
    items.push(
      <ListItem key="dashboard" disablePadding>
        <ListItemButton
          component={Link}
          href={isAdmin ? "/admin/dashboard" : isManager ? "/manager/dashboard" : "/dashboard"}
          selected={pathname === "/dashboard" || pathname === "/admin/dashboard" || pathname === "/manager/dashboard"}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </ListItem>
    );

    // Admin-specific navigation
    if (isAdmin) {
      items.push(
        <ListItem key="employees-header" disablePadding>
          <ListItemButton onClick={() => handleToggle("employees")}>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Employees" />
            {open.employees ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>,
        <Collapse key="employees-collapse" in={open.employees} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              href="/admin/employees"
              selected={pathname === "/admin/employees"}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="View All" />
            </ListItemButton>
            <ListItemButton
              component={Link}
              href="/admin/employees/add"
              selected={pathname === "/admin/employees/add"}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="Add New" />
            </ListItemButton>
          </List>
        </Collapse>
      );

      // Admin attendance section
      items.push(
        <ListItem key="attendance-header" disablePadding>
          <ListItemButton onClick={() => handleToggle("attendance")}>
            <ListItemIcon>
              <AccessTimeIcon />
            </ListItemIcon>
            <ListItemText primary="Attendance" />
            {open.attendance ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>,
        <Collapse key="attendance-collapse" in={open.attendance} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              href="/admin/attendance"
              selected={pathname === "/admin/attendance"}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <AccessTimeIcon />
              </ListItemIcon>
              <ListItemText primary="View All" />
            </ListItemButton>
          </List>
        </Collapse>
      );

      // Admin leave management
      items.push(
        <ListItem key="leaves-header" disablePadding>
          <ListItemButton onClick={() => handleToggle("leaves")}>
            <ListItemIcon>
              <EventIcon />
            </ListItemIcon>
            <ListItemText primary="Leaves" />
            {open.leaves ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>,
        <Collapse key="leaves-collapse" in={open.leaves} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              href="/admin/leaves"
              selected={pathname === "/admin/leaves"}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <EventIcon />
              </ListItemIcon>
              <ListItemText primary="View All" />
            </ListItemButton>
          </List>
        </Collapse>
      );

      // Admin payroll
      items.push(
        <ListItem key="payroll-header" disablePadding>
          <ListItemButton onClick={() => handleToggle("payroll")}>
            <ListItemIcon>
              <ReceiptIcon />
            </ListItemIcon>
            <ListItemText primary="Payroll" />
            {open.payroll ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>,
        <Collapse key="payroll-collapse" in={open.payroll} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              component={Link}
              href="/admin/payroll"
              selected={pathname === "/admin/payroll"}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <ReceiptIcon />
              </ListItemIcon>
              <ListItemText primary="View All" />
            </ListItemButton>
          </List>
        </Collapse>
      );

      // Admin settings
      items.push(
        <ListItem key="settings" disablePadding>
          <ListItemButton
            component={Link}
            href="/admin/settings"
            selected={pathname === "/admin/settings"}
          >
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      );
    }

    // Manager-specific navigation
    if (isManager && !isAdmin) {
      items.push(
        <ListItem key="team" disablePadding>
          <ListItemButton
            component={Link}
            href="/manager/team"
            selected={pathname === "/manager/team"}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="My Team" />
          </ListItemButton>
        </ListItem>
      );

      items.push(
        <ListItem key="team-attendance" disablePadding>
          <ListItemButton
            component={Link}
            href="/manager/attendance"
            selected={pathname === "/manager/attendance"}
          >
            <ListItemIcon>
              <AccessTimeIcon />
            </ListItemIcon>
            <ListItemText primary="Team Attendance" />
          </ListItemButton>
        </ListItem>
      );

      items.push(
        <ListItem key="leave-requests" disablePadding>
          <ListItemButton
            component={Link}
            href="/manager/leaves"
            selected={pathname === "/manager/leaves"}
          >
            <ListItemIcon>
              <EventIcon />
            </ListItemIcon>
            <ListItemText primary="Leave Requests" />
          </ListItemButton>
        </ListItem>
      );
    }

    // Employee-specific navigation (all users can see these)
    if (!isAdmin) {
      items.push(
        <ListItem key="my-attendance" disablePadding>
          <ListItemButton
            component={Link}
            href="/attendance"
            selected={pathname === "/attendance"}
          >
            <ListItemIcon>
              <AccessTimeIcon />
            </ListItemIcon>
            <ListItemText primary="My Attendance" />
          </ListItemButton>
        </ListItem>
      );

      items.push(
        <ListItem key="my-leaves" disablePadding>
          <ListItemButton
            component={Link}
            href="/leaves"
            selected={pathname === "/leaves"}
          >
            <ListItemIcon>
              <EventIcon />
            </ListItemIcon>
            <ListItemText primary="My Leaves" />
          </ListItemButton>
        </ListItem>
      );

      items.push(
        <ListItem key="request-leave" disablePadding>
          <ListItemButton
            component={Link}
            href="/leave/request"
            selected={pathname === "/leave/request"}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Request Leave" />
          </ListItemButton>
        </ListItem>
      );

      items.push(
        <ListItem key="my-payslips" disablePadding>
          <ListItemButton
            component={Link}
            href="/payslips"
            selected={pathname === "/payslips"}
          >
            <ListItemIcon>
              <ReceiptIcon />
            </ListItemIcon>
            <ListItemText primary="My Payslips" />
          </ListItemButton>
        </ListItem>
      );
    }

    // Profile and Logout - all users
    items.push(
      <Divider key="divider" sx={{ my: 1 }} />,
      <ListItem key="profile" disablePadding>
        <ListItemButton
          component={Link}
          href="/profile"
          selected={pathname === "/profile"}
        >
          <ListItemIcon>
            <ProfileIcon />
          </ListItemIcon>
          <ListItemText primary="My Profile" />
        </ListItemButton>
      </ListItem>,
      <ListItem key="logout" disablePadding>
        <ListItemButton onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </ListItem>
    );

    return items;
  };

  const drawer = (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" noWrap component="div">
            HR System
          </Typography>
          {user && (
            <Typography variant="body2" color="text.secondary">
              {user.username} ({isAdmin ? "Admin" : isManager ? "Manager" : "Employee"})
            </Typography>
          )}
        </Box>
        <List>{getNavItems()}</List>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      aria-label="navigation"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

// AppBar component with hamburger menu for mobile
export function AppHeader({ handleDrawerToggle }: { handleDrawerToggle: () => void }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        padding: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        position: "sticky",
        top: 0,
        zIndex: 1100,
        backgroundColor: theme.palette.background.paper,
        width: "100%",
      }}
    >
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <Typography variant="h6" noWrap component="div">
        HR Management System
      </Typography>
    </Box>
  );
}