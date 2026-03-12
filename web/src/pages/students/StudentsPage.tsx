import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  GraduationCap,
  Car,
  Check,
  Download,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "../../components/ui/sheet";
import { useStudents } from "../../lib/hooks/useApiQueries";
import { api } from "../../api";
import { exportStudentsToExcel } from "../../lib/export";

// ---------------------------------------------------------------------------
// Create student form schema
// ---------------------------------------------------------------------------

const createStudentSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional().default(""),
  university: z.string().optional().default(""),
  major: z.string().optional().default(""),
  country: z.string().optional().default(""),
  interests: z.string().optional().default(""),
  familySize: z.coerce.number().int().min(1).default(1),
  needCarSeat: z.boolean().default(false),
  kosherFood: z.boolean().default(false),
  isFamily: z.boolean().default(false),
});

type CreateStudentValues = z.infer<typeof createStudentSchema>;

// ---------------------------------------------------------------------------
// Create student slide-over form
// ---------------------------------------------------------------------------

function CreateStudentForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<CreateStudentValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      fullname: "",
      email: "",
      phone: "",
      university: "",
      major: "",
      country: "",
      interests: "",
      familySize: 1,
      needCarSeat: false,
      kosherFood: false,
      isFamily: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateStudentValues) => api.createStudent(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      reset();
      onSuccess();
    },
  });

  const onSubmit = (values: CreateStudentValues) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
      <h2 className="mb-6 text-lg font-semibold text-foreground">
        Add Student
      </h2>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Fullname */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Full name *
          </label>
          <Input {...register("fullname")} placeholder="Jane Doe" />
          {errors.fullname && (
            <p className="mt-1 text-xs text-red-500">{errors.fullname.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Email *
          </label>
          <Input {...register("email")} type="email" placeholder="jane@university.edu" />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Phone
          </label>
          <Input {...register("phone")} placeholder="+1 (555) 000-0000" />
        </div>

        {/* University */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            University
          </label>
          <Input {...register("university")} placeholder="University of Wisconsin" />
        </div>

        {/* Major */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Major
          </label>
          <Input {...register("major")} placeholder="Computer Science" />
        </div>

        {/* Country */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Country
          </label>
          <Input {...register("country")} placeholder="India" />
        </div>

        {/* Interests */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Interests
          </label>
          <Input {...register("interests")} placeholder="Hiking, cooking..." />
        </div>

        {/* Family size */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Family size
          </label>
          <Input
            {...register("familySize")}
            type="number"
            min={1}
            className="w-24"
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-1">
          <Controller
            control={control}
            name="needCarSeat"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                Needs car seat
              </label>
            )}
          />
          <Controller
            control={control}
            name="kosherFood"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                Kosher food
              </label>
            )}
          />
          <Controller
            control={control}
            name="isFamily"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                Is a family
              </label>
            )}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
        <Button type="submit" disabled={mutation.isPending} className="flex-1">
          {mutation.isPending ? "Saving..." : "Create Student"}
        </Button>
        <SheetClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </SheetClose>
      </div>

      {mutation.isError && (
        <p className="mt-2 text-xs text-red-500">
          {(mutation.error as Error).message || "Something went wrong."}
        </p>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton rows
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function StudentsPage() {
  const navigate = useNavigate();
  const { data: students, isLoading } = useStudents();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!students) return [];
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.fullname.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.university.toLowerCase().includes(q)
    );
  }, [students, search]);

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl text-foreground">Students</h1>
            {!isLoading && (
              <p className="text-sm text-muted-foreground">
                {students?.length ?? 0} total
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => students && exportStudentsToExcel(students)}
            disabled={!students?.length}
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col">
              <CreateStudentForm onSuccess={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, country, university..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">University</TableHead>
              <TableHead className="hidden md:table-cell">Country</TableHead>
              <TableHead className="hidden lg:table-cell">Family Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mapped</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {search ? "No students match your search." : "No students yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((student) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <TableCell className="font-medium text-foreground">
                    {student.fullname}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {student.email}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {student.university || "\u2014"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {student.country || "\u2014"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {student.familySize}
                  </TableCell>
                  <TableCell>
                    {student.isPresent ? (
                      <Badge className="gap-1">
                        <Check className="h-3 w-3" />
                        Present
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Absent</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.driverRefId != null ? (
                      <Badge variant="outline" className="gap-1">
                        <Car className="h-3 w-3" />
                        Driver
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unmapped</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Container>
  );
}
