import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Globe,
  Loader2,
  CheckCircle2,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { api, ApiError, type Student, type Driver } from "../../api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Constants (mirrored from backend)
// ---------------------------------------------------------------------------

const UNIVERSITIES = ["UWM", "Marquette", "MSOE", "Concordia", "MCW", "Other"];

const COUNTRIES = [
  "India", "China",
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
  "Anguilla", "Argentina", "Armenia",
  "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas",
  "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil",
  "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso",
  "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Cayman Islands", "Chad", "Chile", "Colombia", "Congo",
  "Cook Islands", "Costa Rica", "Croatia",
  "Cuba", "Cyprus", "Czech Republic", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Estonia", "Ethiopia",
  "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France",
  "French Polynesia", "French West Indies", "Gabon", "Gambia",
  "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland",
  "Grenada", "Guam", "Guatemala", "Guernsey", "Guinea",
  "Guinea Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong",
  "Hungary", "Iceland", "Indonesia", "Iran", "Iraq",
  "Ireland", "Isle of Man", "Israel", "Italy", "Jamaica", "Japan",
  "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
  "Kyrgyz Republic", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Macau", "Macedonia", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat",
  "Morocco", "Mozambique", "Namibia", "Nepal", "Netherlands",
  "Netherlands Antilles", "New Caledonia", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Puerto Rico", "Qatar",
  "Reunion", "Romania", "Russia", "Rwanda",
  "Samoa", "San Marino",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone",
  "Singapore", "Slovakia", "Slovenia", "South Africa",
  "South Korea", "Spain", "Sri Lanka",
  "St Lucia", "St Vincent", "Sudan", "Suriname",
  "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Togo",
  "Tonga", "Tunisia", "Turkey",
  "Turkmenistan", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan",
  "Venezuela", "Vietnam", "Yemen", "Zambia",
  "Zimbabwe",
];

// Deduplicate countries
const UNIQUE_COUNTRIES = [...new Set(COUNTRIES)];

// ---------------------------------------------------------------------------
// Shared form components
// ---------------------------------------------------------------------------

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border"
      )}
      onClick={() => onChange(!checked)}
    >
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div
        className={cn(
          "flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tour info header
// ---------------------------------------------------------------------------

function TourHeader({ tourDate, tourAddress, tourLocation }: {
  tourDate?: string;
  tourAddress?: string;
  tourLocation?: string;
}) {
  const date = tourDate ? new Date(tourDate) : null;

  return (
    <div className="text-center">
      <div className="mb-6">
        <Globe className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Tour of Milwaukee
        </h1>
        <p className="mt-1 text-lg text-primary font-medium">
          For International Students
        </p>
      </div>

      {date && (
        <div className="mx-auto max-w-md space-y-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm">
          <h2 className="text-center font-heading text-lg font-semibold text-foreground">
            {date.getFullYear()} Free Tour of Milwaukee Registration
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>
              {date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
          {tourLocation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span>{tourLocation}{tourAddress ? ` — ${tourAddress}` : ""}</span>
            </div>
          )}
          <p className="pt-2 text-xs text-muted-foreground text-center">
            Note that this is not a bus tour; it's a personal tour with 2-4 people
            in each vehicle. The tour concludes with a dinner at an American home.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registration closed banner
// ---------------------------------------------------------------------------

function RegistrationClosed({ type }: { type: "student" | "driver" }) {
  return (
    <div className="py-12 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
      <h2 className="mt-4 font-heading text-xl text-foreground">
        Registration Closed
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {type === "student"
          ? "Student registration is currently closed. We have either reached capacity or the tour date has passed."
          : "Driver registration is currently closed. We have either reached capacity or the tour date has passed."}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thank you screen
// ---------------------------------------------------------------------------

function ThankYou({ type }: { type: "student" | "driver" }) {
  return (
    <div className="py-12 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
      <h2 className="mt-4 font-heading text-2xl text-foreground">
        Thank you for registering!
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        {type === "student"
          ? "You will receive a confirmation email shortly with your tour details and QR code."
          : "You will receive a confirmation email shortly with your driver details."}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        If you need any help, please contact Asher Imtiaz (414-499-5360).
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Student registration form
// ---------------------------------------------------------------------------

function StudentRegistration() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [country, setCountry] = useState("");
  const [interests, setInterests] = useState("");
  const [isFamily, setIsFamily] = useState(false);
  const [familySize, setFamilySize] = useState("1");
  const [needCarSeat, setNeedCarSeat] = useState(false);
  const [kosherFood, setKosherFood] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["registration", "student", "status"],
    queryFn: api.getStudentRegistrationStatus,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Student>) => api.registerStudent(data),
    onSuccess: () => setDone(true),
    onError: (err) => {
      setErrors({
        _server: err instanceof ApiError ? err.message : "Registration failed. Please try again.",
      });
    },
  });

  if (done) return <ThankYou type="student" />;
  if (statusQuery.data && !statusQuery.data.isOpen) return <RegistrationClosed type="student" />;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullname.trim()) e.fullname = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    if (!university) e.university = "University is required";
    if (!major.trim()) e.major = "Major is required";
    if (!country) e.country = "Country is required";
    if (isFamily && (parseInt(familySize) < 1 || isNaN(parseInt(familySize))))
      e.familySize = "Family size must be at least 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setErrors({});
    mutation.mutate({
      fullname: fullname.trim(),
      email: email.trim(),
      phone: phone.trim(),
      university,
      major: major.trim(),
      country,
      interests: interests.trim(),
      isFamily,
      familySize: isFamily ? parseInt(familySize) : 0,
      needCarSeat: isFamily ? needCarSeat : false,
      kosherFood,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors._server && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          {errors._server}
        </div>
      )}

      <TextField
        label="Fullname"
        value={fullname}
        onChange={setFullname}
        placeholder="Enter fullname"
        error={errors.fullname}
        required
      />

      <TextField
        label="Email"
        value={email}
        onChange={setEmail}
        type="email"
        placeholder="Enter email"
        error={errors.email}
        required
      />

      <TextField
        label="Phone"
        value={phone}
        onChange={setPhone}
        type="tel"
        placeholder="Enter phone number"
      />

      <SelectField
        label="University"
        value={university}
        onChange={setUniversity}
        options={UNIVERSITIES}
        placeholder="Select university"
        error={errors.university}
        required
      />

      <TextField
        label="Major"
        value={major}
        onChange={setMajor}
        placeholder="Enter your major"
        error={errors.major}
        required
      />

      <SelectField
        label="Country"
        value={country}
        onChange={setCountry}
        options={UNIQUE_COUNTRIES}
        placeholder="Select country"
        error={errors.country}
        required
      />

      <TextField
        label="Tell us some of your interests"
        value={interests}
        onChange={setInterests}
        placeholder="e.g. Hiking, Music, Cooking"
      />

      <div className="border-t border-border pt-4 space-y-3">
        <ToggleField
          label="Registering as a family?"
          description="Toggle if you're bringing family members"
          checked={isFamily}
          onChange={setIsFamily}
        />

        {isFamily && (
          <div className="ml-1 space-y-3 border-l-2 border-primary/20 pl-4">
            <TextField
              label="Family members joining you (not including yourself)"
              value={familySize}
              onChange={setFamilySize}
              type="number"
              error={errors.familySize}
              required
            />
            <ToggleField
              label="Need a child seat?"
              checked={needCarSeat}
              onChange={setNeedCarSeat}
            />
          </div>
        )}

        <ToggleField
          label="Halal or Kosher food"
          checked={kosherFood}
          onChange={setKosherFood}
        />
      </div>

      <Button type="submit" className="w-full h-11 text-base" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering…
          </>
        ) : (
          "Register"
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Driver registration form
// ---------------------------------------------------------------------------

function DriverRegistration() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [haveChildSeat, setHaveChildSeat] = useState(false);
  const [requireNavigator, setRequireNavigator] = useState(true);
  const [navigator, setNavigator] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["registration", "driver", "status"],
    queryFn: api.getDriverRegistrationStatus,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Driver>) => api.registerDriver(data),
    onSuccess: () => setDone(true),
    onError: (err) => {
      setErrors({
        _server: err instanceof ApiError ? err.message : "Registration failed. Please try again.",
      });
    },
  });

  if (done) return <ThankYou type="driver" />;
  if (statusQuery.data && !statusQuery.data.isOpen) return <RegistrationClosed type="driver" />;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullname.trim()) e.fullname = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    if (!phone.trim()) e.phone = "Phone is required";
    const cap = parseInt(capacity);
    if (isNaN(cap) || cap < 1 || cap > 7) e.capacity = "Capacity must be 1-7";
    if (!requireNavigator && !navigator.trim())
      e.navigator = "Navigator name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setErrors({});
    mutation.mutate({
      fullname: fullname.trim(),
      email: email.trim(),
      phone: phone.trim(),
      capacity: parseInt(capacity),
      haveChildSeat,
      requireNavigator,
      navigator: requireNavigator ? "" : navigator.trim(),
      role: "Driver" as const,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors._server && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          {errors._server}
        </div>
      )}

      <TextField
        label="Fullname"
        value={fullname}
        onChange={setFullname}
        placeholder="Enter fullname"
        error={errors.fullname}
        required
      />

      <TextField
        label="Email"
        value={email}
        onChange={setEmail}
        type="email"
        placeholder="Enter email"
        error={errors.email}
        required
      />

      <TextField
        label="Phone"
        value={phone}
        onChange={setPhone}
        type="tel"
        placeholder="Enter phone number"
        error={errors.phone}
        required
      />

      <TextField
        label="Capacity (passengers you can take)"
        value={capacity}
        onChange={setCapacity}
        type="number"
        error={errors.capacity}
        required
      />

      <div className="space-y-3">
        <ToggleField
          label="Have a child seat available?"
          checked={haveChildSeat}
          onChange={setHaveChildSeat}
        />

        <ToggleField
          label="Need a navigator assigned?"
          description="Toggle off if you already have a navigator"
          checked={requireNavigator}
          onChange={setRequireNavigator}
        />

        {!requireNavigator && (
          <div className="ml-1 border-l-2 border-primary/20 pl-4">
            <TextField
              label="Navigator fullname"
              value={navigator}
              onChange={setNavigator}
              placeholder="Enter navigator's full name"
              error={errors.navigator}
              required
            />
          </div>
        )}
      </div>

      <Button type="submit" className="w-full h-11 text-base" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering…
          </>
        ) : (
          "Register as Driver"
        )}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function RegistrationPage() {
  const location = useLocation();
  const mode: "student" | "driver" = location.pathname.endsWith("/driver") ? "driver" : "student";

  const tourQuery = useQuery({
    queryKey: ["tour", "info"],
    queryFn: api.getTourInfo,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        {/* Tour header */}
        <TourHeader
          tourDate={tourQuery.data?.tourDate}
          tourAddress={tourQuery.data?.tourAddress}
          tourLocation={tourQuery.data?.tourLocation}
        />

        {/* Registration form */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            {mode === "student" ? <StudentRegistration /> : <DriverRegistration />}
          </CardContent>
        </Card>

        {/* Footer link */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Milwaukee Internationals &middot;{" "}
          <Link to="/login" className="underline hover:text-foreground">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}
