import { useLocation } from "react-router-dom";
import { Sidebar, MobileHeader } from "../components/layout/Sidebar";
import { AppRoutes } from "./routes";

export function App() {
  const location = useLocation();
  const isPublicRoute =
    new Set(["/login", "/register", "/welcome"]).has(location.pathname) ||
    location.pathname.startsWith("/registration");

  if (isPublicRoute) {
    return <AppRoutes />;
  }

  return (
    <div className="min-h-screen">
      {/* Fixed sidebar on desktop */}
      <Sidebar />

      {/* Mobile top bar */}
      <MobileHeader />

      {/* Main content area, offset by sidebar width on desktop */}
      <main className="min-h-screen lg:pl-60">
        <AppRoutes />
      </main>
    </div>
  );
}
