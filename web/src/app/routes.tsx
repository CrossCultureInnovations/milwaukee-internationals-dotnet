import { Navigate, useRoutes } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";
import { useAuth } from "../lib/auth/AuthContext";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { StudentsPage } from "../pages/students/StudentsPage";
import { StudentDetailPage } from "../pages/students/StudentDetailPage";
import { DriversPage } from "../pages/drivers/DriversPage";
import { DriverDetailPage } from "../pages/drivers/DriverDetailPage";
import { HostsPage } from "../pages/hosts/HostsPage";
import { HostDetailPage } from "../pages/hosts/HostDetailPage";
import { EventsPage } from "../pages/events/EventsPage";
import { EventDetailPage } from "../pages/events/EventDetailPage";
import { LocationsPage } from "../pages/locations/LocationsPage";
import { MappingsPage } from "../pages/mappings/MappingsPage";
import { UsersPage } from "../pages/admin/UsersPage";
import { ConfigPage } from "../pages/admin/ConfigPage";
import { AttendancePage } from "../pages/admin/AttendancePage";
import { ReportsPage } from "../pages/reports/ReportsPage";
import { RegistrationPage } from "../pages/registration/RegistrationPage";
import { EmailToolsPage } from "../pages/email/EmailToolsPage";

function HomeRedirect() {
  const { isAuthenticated, isInitializing } = useAuth();
  if (import.meta.env.DEV) return <Navigate to="/dashboard" replace />;
  if (isInitializing) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

export function AppRoutes() {
  return useRoutes([
    { path: "/", element: <HomeRedirect /> },
    { path: "/login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    { path: "/registration", element: <RegistrationPage /> },
    { path: "/registration/student", element: <RegistrationPage /> },
    { path: "/registration/driver", element: <RegistrationPage /> },
    {
      path: "/dashboard",
      element: (
        <RequireAuth>
          <DashboardPage />
        </RequireAuth>
      ),
    },
    {
      path: "/students",
      element: (
        <RequireAuth>
          <StudentsPage />
        </RequireAuth>
      ),
    },
    {
      path: "/students/:id",
      element: (
        <RequireAuth>
          <StudentDetailPage />
        </RequireAuth>
      ),
    },
    {
      path: "/drivers",
      element: (
        <RequireAuth>
          <DriversPage />
        </RequireAuth>
      ),
    },
    {
      path: "/drivers/:id",
      element: (
        <RequireAuth>
          <DriverDetailPage />
        </RequireAuth>
      ),
    },
    {
      path: "/hosts",
      element: (
        <RequireAuth>
          <HostsPage />
        </RequireAuth>
      ),
    },
    {
      path: "/hosts/:id",
      element: (
        <RequireAuth>
          <HostDetailPage />
        </RequireAuth>
      ),
    },
    {
      path: "/events",
      element: (
        <RequireAuth>
          <EventsPage />
        </RequireAuth>
      ),
    },
    {
      path: "/events/:id",
      element: (
        <RequireAuth>
          <EventDetailPage />
        </RequireAuth>
      ),
    },
    {
      path: "/locations",
      element: (
        <RequireAuth>
          <LocationsPage />
        </RequireAuth>
      ),
    },
    {
      path: "/mappings",
      element: (
        <RequireAuth>
          <MappingsPage />
        </RequireAuth>
      ),
    },
    {
      path: "/users",
      element: (
        <RequireAuth>
          <UsersPage />
        </RequireAuth>
      ),
    },
    {
      path: "/config",
      element: (
        <RequireAuth>
          <ConfigPage />
        </RequireAuth>
      ),
    },
    {
      path: "/attendance",
      element: (
        <RequireAuth>
          <AttendancePage />
        </RequireAuth>
      ),
    },
    {
      path: "/reports",
      element: (
        <RequireAuth>
          <ReportsPage />
        </RequireAuth>
      ),
    },
    {
      path: "/email",
      element: (
        <RequireAuth>
          <EmailToolsPage />
        </RequireAuth>
      ),
    },
  ]);
}
