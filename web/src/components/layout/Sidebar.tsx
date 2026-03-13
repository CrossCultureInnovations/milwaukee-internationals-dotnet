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
      { to: "/email", label: "Email", icon: Mail },
      { to: "/users", label: "Users", icon: Users },
      { to: "/config", label: "Config", icon: Settings },
      { to: "/registration/student", label: "Register Student", icon: GraduationCap },
      { to: "/registration/driver", label: "Register Driver", icon: Car },
    ],
  },
];

function SidebarNavItem({
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

function SidebarNav({
  groups,
  onItemClick,
}: {
  groups: NavGroup[];
  onItemClick?: () => void;
}) {
  return (
    <nav className="space-y-2">
      {groups.map((group, index) => (
        <div key={group.label}>
          {index > 0 && (
            <hr className="my-2 border-border/50" />
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <SidebarNavItem key={item.to} {...item} onClick={onItemClick} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Mobile top bar (shown only on small screens)
// ---------------------------------------------------------------------------

export function MobileHeader() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const isAdmin = import.meta.env.DEV || session?.user?.userRoleEnum === "Admin";

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-md lg:hidden">
      <Link
        to="/"
        className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
      >
        <Globe className="h-5 w-5 text-primary" />
        <span className="font-heading text-base">MI</span>
      </Link>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-64 p-0">
            <div className="flex h-full flex-col">
              {/* Logo */}
              <div className="flex h-14 items-center gap-2 border-b border-border/70 px-4">
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-heading text-sm font-semibold">
                  Milwaukee Internationals
                </span>
              </div>

              {/* User */}
              {session && (
                <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-3.5 w-3.5" />
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

              {/* Nav */}
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <SidebarNav groups={visibleGroups} onItemClick={() => setMobileOpen(false)} />
              </div>

              {/* Logout */}
              {session && (
                <div className="border-t border-border/50 px-3 py-3">
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
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Desktop sidebar (always visible on lg+)
// ---------------------------------------------------------------------------

export function Sidebar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const isAdmin = import.meta.env.DEV || session?.user?.userRoleEnum === "Admin";

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
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 border-r border-border/70 bg-background">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
        >
          <Globe className="h-5 w-5 text-primary" />
          <span className="font-heading text-sm font-semibold">
            Milwaukee Internationals
          </span>
        </Link>
      </div>

      {/* User info */}
      {session && (
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-3.5 w-3.5" />
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

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav groups={visibleGroups} />
      </div>

      {/* Bottom actions */}
      <div className="border-t border-border/50 px-3 py-3 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
        {session && (
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
