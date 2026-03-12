import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Globe,
  LogOut,
  Menu,
  Moon,
  Sun,
  LayoutDashboard,
  GraduationCap,
  Car,
  Home,
  CalendarDays,
  MapPin,
  Link2,
  BarChart3,
  Mail,
  ClipboardCheck,
  Users,
  Settings,
} from "lucide-react";
import { useAuth } from "../../lib/auth/AuthContext";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Container } from "./Container";
import { cn } from "../../lib/utils";
import { useCallback, useEffect, useState } from "react";

type NavEntry = {
  to: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavEntry[];
};

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/students", label: "Students", icon: GraduationCap },
      { to: "/drivers", label: "Drivers", icon: Car },
      { to: "/hosts", label: "Hosts", icon: Home },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/events", label: "Events", icon: CalendarDays },
      { to: "/locations", label: "Locations", icon: MapPin },
      { to: "/mappings", label: "Mappings", icon: Link2 },
      { to: "/attendance", label: "Attendance", icon: ClipboardCheck },
    ],
  },
  {
    label: "Admin",
    items: [
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/email", label: "Email", icon: Mail, adminOnly: true },
      { to: "/users", label: "Users", icon: Users, adminOnly: true },
      { to: "/config", label: "Config", icon: Settings, adminOnly: true },
    ],
  },
];

// Flat list for desktop top bar
const desktopNav: NavEntry[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: GraduationCap },
  { to: "/drivers", label: "Drivers", icon: Car },
  { to: "/hosts", label: "Hosts", icon: Home },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/locations", label: "Locations", icon: MapPin },
  { to: "/mappings", label: "Mappings", icon: Link2 },
  { to: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/email", label: "Email", icon: Mail, adminOnly: true },
  { to: "/users", label: "Users", icon: Users, adminOnly: true },
  { to: "/config", label: "Config", icon: Settings, adminOnly: true },
];

function DesktopNavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-sm transition-colors hover:text-foreground",
          isActive ? "font-medium text-foreground" : "text-muted-foreground"
        )
      }
    >
      {label}
    </NavLink>
  );
}

function MobileNavItem({
  to,
  label,
  icon: Icon,
  onClick,
}: NavEntry & { onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 font-medium text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

export function Topbar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = import.meta.env.DEV || session?.user.userRoleEnum === "Admin";

  const toggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || isAdmin),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 text-foreground transition-opacity hover:opacity-80"
        >
          <Globe className="h-5 w-5 text-primary" />
          <span className="font-heading text-base hidden sm:inline">
            Milwaukee Internationals
          </span>
          <span className="font-heading text-base sm:hidden">MI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 lg:flex">
          {desktopNav
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <DesktopNavItem key={item.to} {...item} />
            ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {session && (
            <>
              <span className="hidden text-sm text-muted-foreground xl:inline">
                {session.user.fullname || session.user.userName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Logout"
                className="hidden lg:inline-flex"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Mobile / tablet menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              {/* User info */}
              {session && (
                <div className="mb-6 mt-4 flex items-center gap-3 border-b border-border/50 pb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {session.user.fullname || session.user.userName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Grouped nav */}
              <nav className="space-y-6">
                {visibleGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => (
                        <MobileNavItem
                          key={item.to}
                          {...item}
                          onClick={() => setMobileOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Bottom actions */}
              {session && (
                <div className="mt-8 border-t border-border/50 pt-4">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
