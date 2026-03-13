import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Users,
  Trash2,
  ChevronDown,
  Mail,
  Phone,
  Shield,
  Clock,
  X,
  Check,
  KeyRound,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "../../components/ui/sheet";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { useUsers } from "../../lib/hooks/useApiQueries";
import { api, type User, type UserRoleEnum } from "../../api";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Form schemas
// ---------------------------------------------------------------------------

const userSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  userName: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().optional().default(""),
  userRoleEnum: z.enum(["Basic", "Admin"]).default("Basic"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type UserFormValues = z.infer<typeof userSchema>;

const editUserSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  userName: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string().optional().default(""),
  userRoleEnum: z.enum(["Basic", "Admin"]).default("Basic"),
  enable: z.boolean().default(true),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

// ---------------------------------------------------------------------------
// Create user form (Sheet)
// ---------------------------------------------------------------------------

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullname: "",
      userName: "",
      email: "",
      phoneNumber: "",
      userRoleEnum: "Basic",
      password: "",
    },
  });

  const role = watch("userRoleEnum");

  const mutation = useMutation({
    mutationFn: (values: UserFormValues) => api.createUser(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      reset();
      onSuccess();
    },
  });

  const onSubmit = (values: UserFormValues) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
      <h2 className="mb-6 text-lg font-semibold text-foreground">Add User</h2>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Full name *
          </label>
          <Input {...register("fullname")} placeholder="John Doe" />
          {errors.fullname && (
            <p className="mt-1 text-xs text-red-500">{errors.fullname.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Username *
          </label>
          <Input {...register("userName")} placeholder="johndoe" />
          {errors.userName && (
            <p className="mt-1 text-xs text-red-500">{errors.userName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Email *
          </label>
          <Input {...register("email")} type="email" placeholder="john@example.com" />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Phone
          </label>
          <Input {...register("phoneNumber")} placeholder="+1 (555) 000-0000" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Role *
          </label>
          <Select
            value={role}
            onValueChange={(v) => setValue("userRoleEnum", v as UserRoleEnum)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Password *
          </label>
          <Input {...register("password")} type="password" placeholder="Min 6 characters" />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
        <Button type="submit" disabled={mutation.isPending} className="flex-1">
          {mutation.isPending ? "Saving..." : "Create User"}
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
// Inline edit form (inside expanded row)
// ---------------------------------------------------------------------------

function InlineEditForm({
  user,
  onDone,
}: {
  user: User;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullname: user.fullname,
      userName: user.userName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? "",
      userRoleEnum: user.userRoleEnum,
      enable: user.enable,
    },
  });

  const role = watch("userRoleEnum");

  const mutation = useMutation({
    mutationFn: (values: EditUserFormValues) => api.updateUser(user.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onDone();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onDone();
    },
  });

  const [resetSent, setResetSent] = useState(false);
  const resetMutation = useMutation({
    mutationFn: () => api.sendPasswordReset(user.id),
    onSuccess: () => setResetSent(true),
  });

  const onSubmit = (values: EditUserFormValues) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Full name
          </label>
          <Input {...register("fullname")} className="h-9 text-sm" />
          {errors.fullname && (
            <p className="mt-0.5 text-xs text-red-500">{errors.fullname.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Username
          </label>
          <Input {...register("userName")} className="h-9 text-sm" />
          {errors.userName && (
            <p className="mt-0.5 text-xs text-red-500">{errors.userName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Email
          </label>
          <Input {...register("email")} type="email" className="h-9 text-sm" />
          {errors.email && (
            <p className="mt-0.5 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Phone
          </label>
          <Input {...register("phoneNumber")} className="h-9 text-sm" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Role
          </label>
          <Select
            value={role}
            onValueChange={(v) => setValue("userRoleEnum", v as UserRoleEnum)}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              {...register("enable")}
              className="h-4 w-4 rounded border-border"
            />
            Account enabled
          </label>
        </div>
      </div>

      {(mutation.isError || deleteMutation.isError || resetMutation.isError) && (
        <p className="mt-2 text-xs text-red-500">
          {((mutation.error || deleteMutation.error || resetMutation.error) as Error)?.message ||
            "Something went wrong."}
        </p>
      )}

      {resetSent && (
        <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" />
          Password reset email sent to {user.email}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={resetMutation.isPending || resetSent}
          onClick={() => {
            if (window.confirm(`Send password reset email to ${user.email}?`)) {
              resetMutation.mutate();
            }
          }}
        >
          <KeyRound className="mr-1 h-3.5 w-3.5" />
          {resetMutation.isPending ? "Sending..." : resetSent ? "Reset Sent" : "Send Password Reset"}
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm(`Delete user "${user.fullname}"?`)) {
              deleteMutation.mutate();
            }
          }}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// User row with expandable inline edit
// ---------------------------------------------------------------------------

function UserRow({
  user,
  isExpanded,
  onToggle,
  onCollapse,
}: {
  user: User;
  isExpanded: boolean;
  onToggle: () => void;
  onCollapse: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card transition-shadow",
        isExpanded && "shadow-md ring-1 ring-primary/20"
      )}
    >
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* Avatar / initials */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            user.enable
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {user.fullname
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>

        {/* Name + username */}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="truncate">{user.fullname}</span>
            {user.userRoleEnum === "Admin" ? (
              <Badge className="text-[10px] px-1.5 py-0">Admin</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Basic</Badge>
            )}
            {!user.enable && (
              <Badge variant="outline" className="border-red-500/30 text-red-500 text-[10px] px-1.5 py-0">
                Disabled
              </Badge>
            )}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user.userName} &middot; {user.email}
          </p>
        </div>

        {/* Meta on desktop */}
        <div className="hidden items-center gap-4 sm:flex">
          {user.phoneNumber && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {user.phoneNumber}
            </span>
          )}
          {user.lastLoggedInDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(user.lastLoggedInDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Expanded edit form */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-4">
          {/* Mobile meta */}
          <div className="mb-3 flex flex-wrap gap-3 sm:hidden">
            {user.phoneNumber && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {user.phoneNumber}
              </span>
            )}
            {user.lastLoggedInDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(user.lastLoggedInDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <InlineEditForm user={user} onDone={onCollapse} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="hidden h-3 w-24 sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.fullname.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.userName.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl text-foreground">Users</h1>
            {!isLoading && (
              <p className="text-sm text-muted-foreground">
                {users?.length ?? 0} total
              </p>
            )}
          </div>
        </div>

        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <CreateUserForm onSuccess={() => setCreateOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, username..."
          className="pl-9"
        />
      </div>

      {/* User list */}
      {isLoading ? (
        <CardSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">
          {search ? "No users match your search." : "No users yet."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isExpanded={expandedId === user.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === user.id ? null : user.id))
              }
              onCollapse={() => setExpandedId(null)}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
