import { Link } from "react-router-dom";
import { Globe, GraduationCap, Car } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full bg-card/80 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Globe className="h-10 w-10 text-primary" />
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground">
              Milwaukee Internationals
            </h1>
          </div>
          <p className="mt-3 text-lg text-muted-foreground">
            Free Tour of Milwaukee for International Students
          </p>
        </div>
      </header>

      {/* Split sections */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
        {/* Students - Left */}
        <Link
          to="/registration/student"
          className="group relative flex flex-col items-center justify-center gap-6 p-12 md:p-16
                     bg-primary/5 hover:bg-primary/10 transition-colors duration-300
                     border-b md:border-b-0 md:border-r border-border"
        >
          <div className="rounded-full bg-primary/10 p-6 group-hover:bg-primary/20 transition-colors duration-300">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground group-hover:text-primary transition-colors duration-300">
              Students Enter Here
            </h2>
            <p className="mt-3 text-muted-foreground max-w-sm">
              Register for a free personal tour of Milwaukee and enjoy dinner at an American home.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium text-lg
                           group-hover:shadow-lg transition-shadow duration-300">
            Register as Student
            <span className="group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
          </span>
        </Link>

        {/* Volunteers - Right */}
        <Link
          to="/registration/driver"
          className="group relative flex flex-col items-center justify-center gap-6 p-12 md:p-16
                     bg-secondary/30 hover:bg-secondary/50 transition-colors duration-300"
        >
          <div className="rounded-full bg-accent/30 p-6 group-hover:bg-accent/50 transition-colors duration-300">
            <Car className="h-16 w-16 text-accent-foreground" />
          </div>
          <div className="text-center">
            <h2 className="font-heading text-3xl sm:text-4xl text-foreground group-hover:text-primary transition-colors duration-300">
              Volunteers Enter Here
            </h2>
            <p className="mt-3 text-muted-foreground max-w-sm">
              Sign up to drive international students around Milwaukee and share a meal together.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-background font-medium text-lg
                           group-hover:shadow-lg transition-shadow duration-300">
            Register as Volunteer
            <span className="group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
          </span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Milwaukee Internationals &middot;{" "}
          <Link to="/login" className="underline hover:text-foreground">
            Admin Login
          </Link>
        </p>
      </footer>
    </div>
  );
}
