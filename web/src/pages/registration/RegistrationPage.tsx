import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  Globe,
  GraduationCap,
  Car,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { api, ApiError } from "../../api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Container } from "../../components/layout/Container";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Student registration
// ---------------------------------------------------------------------------

const studentStep1Schema = z.object({
  fullname: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  country: z.string().min(1, "Country is required"),
});

const studentStep2Schema = z.object({
  university: z.string().min(1, "University is required"),
  major: z.string().min(1, "Major is required"),
  interests: z.string().optional(),
});

const studentStep3Schema = z.object({
  familySize: z.coerce.number().min(0),
  isFamily: z.boolean(),
  needCarSeat: z.boolean(),
  kosherFood: z.boolean(),
});

type StudentStep1 = z.infer<typeof studentStep1Schema>;
type StudentStep2 = z.infer<typeof studentStep2Schema>;
type StudentStep3 = z.infer<typeof studentStep3Schema>;

// ---------------------------------------------------------------------------
// Driver registration
// ---------------------------------------------------------------------------

const driverSchema = z.object({
  fullname: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  capacity: z.coerce.number().min(1, "At least 1").max(20),
  haveChildSeat: z.boolean(),
  requireNavigator: z.boolean(),
  navigator: z.string().optional(),
});

type DriverForm = z.infer<typeof driverSchema>;

// ---------------------------------------------------------------------------
// Steps indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all",
            i === current ? "w-8 bg-primary" : i < current ? "w-2 bg-primary/50" : "w-2 bg-border"
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Student multi-step form
// ---------------------------------------------------------------------------

function StudentRegistration() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<StudentStep1 & StudentStep2 & StudentStep3>>({});
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const step1Form = useForm<StudentStep1>({
    resolver: zodResolver(studentStep1Schema),
    defaultValues: formData,
  });
  const step2Form = useForm<StudentStep2>({
    resolver: zodResolver(studentStep2Schema),
    defaultValues: formData,
  });
  const step3Form = useForm<StudentStep3>({
    resolver: zodResolver(studentStep3Schema),
    defaultValues: { familySize: 0, isFamily: false, needCarSeat: false, kosherFood: false, ...formData },
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createStudent(data),
    onSuccess: () => setDone(true),
    onError: (err) => {
      setServerError(err instanceof ApiError ? err.message : "Registration failed");
    },
  });

  if (done) {
    return (
      <div className="py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 font-heading text-xl text-foreground">Registration complete!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for registering. You will receive a confirmation email shortly.
        </p>
      </div>
    );
  }

  const handleStep1 = step1Form.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(1);
  });

  const handleStep2 = step2Form.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  });

  const handleStep3 = step3Form.handleSubmit((data) => {
    const merged = { ...formData, ...data };
    setFormData(merged);
    setServerError(null);
    mutation.mutate(merged);
  });

  return (
    <>
      <StepIndicator current={step} total={3} />

      {serverError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          {serverError}
        </div>
      )}

      {step === 0 && (
        <form onSubmit={handleStep1} className="mt-6 space-y-4">
          <h3 className="font-medium text-foreground">Personal Information</h3>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Full name</label>
            <Input {...step1Form.register("fullname")} />
            {step1Form.formState.errors.fullname && (
              <p className="text-xs text-red-500">{step1Form.formState.errors.fullname.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Email</label>
            <Input type="email" {...step1Form.register("email")} />
            {step1Form.formState.errors.email && (
              <p className="text-xs text-red-500">{step1Form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Phone</label>
            <Input type="tel" {...step1Form.register("phone")} />
            {step1Form.formState.errors.phone && (
              <p className="text-xs text-red-500">{step1Form.formState.errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Country</label>
            <Input {...step1Form.register("country")} />
            {step1Form.formState.errors.country && (
              <p className="text-xs text-red-500">{step1Form.formState.errors.country.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={handleStep2} className="mt-6 space-y-4">
          <h3 className="font-medium text-foreground">Academic Details</h3>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">University</label>
            <Input {...step2Form.register("university")} />
            {step2Form.formState.errors.university && (
              <p className="text-xs text-red-500">{step2Form.formState.errors.university.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Major</label>
            <Input {...step2Form.register("major")} />
            {step2Form.formState.errors.major && (
              <p className="text-xs text-red-500">{step2Form.formState.errors.major.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Interests (optional)</label>
            <Input {...step2Form.register("interests")} />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(0)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button type="submit" className="flex-1">
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep3} className="mt-6 space-y-4">
          <h3 className="font-medium text-foreground">Additional Details</h3>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Family size (dependents)</label>
            <Input type="number" min={0} {...step3Form.register("familySize")} />
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={step3Form.watch("isFamily")}
                onCheckedChange={(v) => step3Form.setValue("isFamily", !!v)}
              />
              <span className="text-sm">Registering as a family</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={step3Form.watch("needCarSeat")}
                onCheckedChange={(v) => step3Form.setValue("needCarSeat", !!v)}
              />
              <span className="text-sm">Need car seat</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={step3Form.watch("kosherFood")}
                onCheckedChange={(v) => step3Form.setValue("kosherFood", !!v)}
              />
              <span className="text-sm">Kosher food required</span>
            </label>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Register"
              )}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Driver registration form
// ---------------------------------------------------------------------------

function DriverRegistration() {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: { capacity: 4, haveChildSeat: false, requireNavigator: false },
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createDriver(data),
    onSuccess: () => setDone(true),
    onError: (err) => {
      setServerError(err instanceof ApiError ? err.message : "Registration failed");
    },
  });

  if (done) {
    return (
      <div className="py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 font-heading text-xl text-foreground">Registration complete!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for volunteering to drive!
        </p>
      </div>
    );
  }

  const onSubmit = handleSubmit((data) => {
    setServerError(null);
    mutation.mutate(data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
          {serverError}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Full name</label>
        <Input {...register("fullname")} />
        {errors.fullname && <p className="text-xs text-red-500">{errors.fullname.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Email</label>
        <Input type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Phone</label>
        <Input type="tel" {...register("phone")} />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Passenger capacity</label>
        <Input type="number" min={1} max={20} {...register("capacity")} />
        {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">Navigator name (optional)</label>
        <Input {...register("navigator")} />
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <Checkbox
            checked={watch("haveChildSeat")}
            onCheckedChange={(v) => setValue("haveChildSeat", !!v)}
          />
          <span className="text-sm">I have a child seat</span>
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={watch("requireNavigator")}
            onCheckedChange={(v) => setValue("requireNavigator", !!v)}
          />
          <span className="text-sm">I need a navigator</span>
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
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
  const [mode, setMode] = useState<"student" | "driver">("student");

  return (
    <Container className="py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <Globe className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-3 font-heading text-2xl text-foreground">
            Milwaukee Internationals Registration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Register as a student or volunteer driver
          </p>
        </div>

        {/* Toggle */}
        <div className="mb-6 flex gap-2 rounded-xl bg-secondary/70 p-1">
          <button
            onClick={() => setMode("student")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition-all",
              mode === "student"
                ? "bg-card font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GraduationCap className="h-4 w-4" />
            Student
          </button>
          <button
            onClick={() => setMode("driver")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm transition-all",
              mode === "driver"
                ? "bg-card font-medium text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Car className="h-4 w-4" />
            Driver
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "student" ? "Student Registration" : "Driver Registration"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "student" ? <StudentRegistration /> : <DriverRegistration />}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
