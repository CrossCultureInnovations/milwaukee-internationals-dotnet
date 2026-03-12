import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../../components/ui/select";
import { useUsers } from "../../lib/hooks/useApiQueries";
import { api, type User, type UserRoleEnum } from "../../api";

// ---------------------------------------------------------------------------
// Form schema
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
// Create user form
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
// Edit user form
// ---------------------------------------------------------------------------

function EditUserForm({
  user,
  onSuccess,
}: {
  user: User;
  onSuccess: () => void;
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
      onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess();
    },
  });

  const onSubmit = (values: EditUserFormValues) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
      <h2 className="mb-6 text-lg font-semibold text-foreground">Edit User</h2>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Full name *
          </label>
          <Input {...register("fullname")} />
          {errors.fullname && (
            <p className="mt-1 text-xs text-red-500">{errors.fullname.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Username *
          </label>
          <Input {...register("userName")} />
          {errors.userName && (
            <p className="mt-1 text-xs text-red-500">{errors.userName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Email *
          </label>
          <Input {...register("email")} type="email" />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Phone
          </label>
          <Input {...register("phoneNumber")} />
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
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

      <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
        <Button type="submit" disabled={mutation.isPending} className="flex-1">
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this user?")) {
              deleteMutation.mutate();
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleteMutation.isPending ? "Deleting..." : "Delete"}
        </Button>
        <SheetClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </SheetClose>
      </div>

      {(mutation.isError || deleteMutation.isError) && (
        <p className="mt-2 text-xs text-red-500">
          {((mutation.error || deleteMutation.error) as Error)?.message ||
            "Something went wrong."}
        </p>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Table skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
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

export function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Username</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Last Login</TableHead>
              <TableHead>Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  {search ? "No users match your search." : "No users yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => setEditingUser(user)}
                >
                  <TableCell className="font-medium text-foreground">
                    {user.fullname}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {user.userName}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {user.email}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {user.phoneNumber || "\u2014"}
                  </TableCell>
                  <TableCell>
                    {user.userRoleEnum === "Admin" ? (
                      <Badge>Admin</Badge>
                    ) : (
                      <Badge variant="secondary">Basic</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {user.lastLoggedInDate
                      ? new Date(user.lastLoggedInDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "\u2014"}
                  </TableCell>
                  <TableCell>
                    {user.enable ? (
                      <Badge variant="outline" className="border-green-500/30 text-green-600">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500/30 text-red-500">
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit sheet */}
      <Sheet
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      >
        <SheetContent className="flex flex-col">
          {editingUser && (
            <EditUserForm
              key={editingUser.id}
              user={editingUser}
              onSuccess={() => setEditingUser(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </Container>
  );
}
