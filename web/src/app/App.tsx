import { useLocation } from "react-router-dom";
import { Topbar } from "../components/layout/Topbar";
import { AppFooter } from "../components/layout/AppFooter";
import { AppRoutes } from "./routes";

export function App() {
  const location = useLocation();
  const isAuthRoute = new Set(["/login", "/register"]).has(location.pathname);

  if (isAuthRoute) {
    return (
      <>
        <AppRoutes />
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <Topbar />
      <main className="min-h-[calc(100vh-8rem)]">
        <AppRoutes />
      </main>
      <AppFooter />
    </>
  );
}
