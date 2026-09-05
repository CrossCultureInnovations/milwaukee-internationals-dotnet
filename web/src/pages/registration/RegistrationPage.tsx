import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Loader2,
  CheckCircle2,
  MapPin,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { api, ApiError, type Student, type Driver } from "../../api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import { AltchaWidget } from "../../components/AltchaWidget";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Constants (mirrored from backend)
// ---------------------------------------------------------------------------

const UNIVERSITIES = ["UWM", "Marquette", "MSOE", "MATC", "Concordia", "MCW", "Other"];

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

// TourDate is a wall-clock "CST" value everywhere else in the app — the emails
// format it with `{TourDate:HH:mm}` and the admin config page edits the raw
// `yyyy-MM-ddTHH:mm` prefix. The serialized offset just reflects whatever zone
// the server was in when it was saved, so read the components instead of
// letting `new Date()` shift the instant into the visitor's timezone.
function parseTourDate(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, year, month, day, hour, minute] = m;
  return new Date(+year, +month - 1, +day, +hour, +minute);
}

const TOUR_HIGHLIGHTS = ["No cost", "Dinner included", "Families welcome"];

function InfoRow({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Calendar;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3.5 p-4 sm:p-5">
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold leading-snug text-foreground">{title}</p>
        {sub && <p className="text-sm leading-snug text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function TourHeader({ tourDate, tourAddress, tourLocation }: {
  tourDate?: string;
  tourAddress?: string;
  tourLocation?: string;
}) {
  const date = tourDate ? parseTourDate(tourDate) : null;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div>
        <h1 className="font-heading text-[2.6rem] font-normal leading-[1.02] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[3.4rem]">
          {date ? `${date.getFullYear()} Free Tour` : "Free Tour"}
          <br />
          of Milwaukee
        </h1>
        <p className="mt-3.5 max-w-[46ch] text-base leading-[1.55] text-muted-foreground [text-wrap:pretty] sm:text-lg">
          A personal tour — 2 to 4 people per vehicle, not a bus — that ends with
          dinner in an American home.
        </p>
      </div>

      {(date || tourLocation) && (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {date && (
            <InfoRow
              icon={Calendar}
              title={date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              sub={date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            />
          )}
          {tourLocation && (
            <InfoRow icon={MapPin} title={tourLocation} sub={tourAddress} />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {TOUR_HIGHLIGHTS.map((label) => (
          <span
            key={label}
            className="rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>
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

function ThankYou({ type, displayId }: { type: "student" | "driver"; displayId?: string | null }) {
  return (
    <div className="py-12 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
      <h2 className="mt-4 font-heading text-2xl text-foreground">
        Thank you for registering!
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        {type === "student"
          ? "You will receive a confirmation email shortly with your tour details."
          : "You will receive a confirmation email shortly with your driver details."}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        If you need any help, please contact Asher Imtiaz (414-499-5360).
      </p>

      {type === "student" && displayId && (
        <p className="mt-6 text-xs text-muted-foreground">
          Student number: <span className="font-mono font-medium text-foreground">{displayId}</span>
        </p>
      )}
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
  const [altcha, setAltcha] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registeredDisplayId, setRegisteredDisplayId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["registration", "student", "status"],
    queryFn: api.getStudentRegistrationStatus,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Student>) =>
      api.registerStudent({ registration: data, altcha }),
    onSuccess: (res) => {
      setRegisteredDisplayId(res?.displayId ?? null);
      setDone(true);
    },
    onError: (err) => {
      setErrors({
        _server: err instanceof ApiError ? err.message : "Registration failed. Please try again.",
      });
    },
  });

  if (done) return <ThankYou type="student" displayId={registeredDisplayId} />;
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
    if ((statusQuery.data?.captchaEnabled ?? true) && !altcha)
      e.altcha = "Please confirm you are human";
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

      {statusQuery.data?.captchaEnabled && statusQuery.data.challengeUrl && (
        <div className="space-y-1.5">
          <AltchaWidget
            challengeUrl={statusQuery.data.challengeUrl}
            onVerified={setAltcha}
          />
          {errors.altcha && <p className="text-xs text-red-500">{errors.altcha}</p>}
        </div>
      )}

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
  const [altcha, setAltcha] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["registration", "driver", "status"],
    queryFn: api.getDriverRegistrationStatus,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Driver>) =>
      api.registerDriver({ registration: data, altcha }),
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
    if ((statusQuery.data?.captchaEnabled ?? true) && !altcha)
      e.altcha = "Please confirm you are human";
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

      {statusQuery.data?.captchaEnabled && statusQuery.data.challengeUrl && (
        <div className="space-y-1.5">
          <AltchaWidget
            challengeUrl={statusQuery.data.challengeUrl}
            onVerified={setAltcha}
          />
          {errors.altcha && <p className="text-xs text-red-500">{errors.altcha}</p>}
        </div>
      )}

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
      <div className="mx-auto max-w-xl px-4 py-8 sm:py-12 md:max-w-6xl">
        <div className="grid gap-8 md:grid-cols-2 md:items-start md:gap-10 lg:gap-12">
          {/* Tour header */}
          <div className="md:sticky md:top-12">
            <TourHeader
              tourDate={tourQuery.data?.tourDate}
              tourAddress={tourQuery.data?.tourAddress}
              tourLocation={tourQuery.data?.tourLocation}
            />
          </div>

          {/* Registration form */}
          <Card>
            <CardContent className="pt-6">
              {mode === "student" ? <StudentRegistration /> : <DriverRegistration />}
            </CardContent>
          </Card>
        </div>

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
