import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Home, Search, Plus, Mail, Phone, MapPin, Car, Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from "../../components/ui/sheet";
import { Container } from "../../components/layout/Container";
import { useHosts } from "../../lib/hooks/useApiQueries";
import { api } from "../../api";
import { exportHostsToExcel } from "../../lib/export";

const hostSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
});

type HostFormValues = z.infer<typeof hostSchema>;

export function HostsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: hosts, isLoading } = useHosts();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!hosts) return [];
    if (!search.trim()) return hosts;
    const q = search.toLowerCase();
    return hosts.filter(
      (h) =>
        h.fullname.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q)
    );
  }, [hosts, search]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues: { fullname: "", email: "", phone: "", address: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: HostFormValues) => api.createHost(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
      reset();
      setSheetOpen(false);
    },
  });

  const onSubmit = (values: HostFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Home className="h-5 w-5" />
          </div>
          <h1 className="font-heading text-2xl text-foreground">Hosts</h1>
          {hosts && (
            <Badge variant="secondary">{hosts.length}</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => hosts && exportHostsToExcel(hosts)}
            disabled={!hosts?.length}
          >
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add Host
            </Button>
          </SheetTrigger>
          <SheetContent>
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              New Host
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Full Name
                </label>
                <Input {...register("fullname")} placeholder="Jane Smith" />
                {errors.fullname && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.fullname.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Email
                </label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="jane@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Phone
                </label>
                <Input
                  {...register("phone")}
                  type="tel"
                  placeholder="(414) 555-0100"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Address
                </label>
                <Input
                  {...register("address")}
                  placeholder="123 Main St, Milwaukee, WI"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {createMutation.isError && (
                <p className="text-xs text-destructive">
                  {(createMutation.error as Error).message ||
                    "Failed to create host"}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Host"}
                </Button>
                <SheetClose asChild>
                  <Button type="button" variant="ghost" size="sm">
                    Cancel
                  </Button>
                </SheetClose>
              </div>
            </form>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or address..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Home className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? "No hosts match your search" : "No hosts yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Address
                  </TableHead>
                  <TableHead className="text-right">Drivers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((host) => (
                  <TableRow
                    key={host.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/hosts/${host.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {host.fullname}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {host.email}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {host.phone}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {host.address}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        <Car className="mr-1 h-3 w-3" />
                        {host.drivers?.length ?? 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
