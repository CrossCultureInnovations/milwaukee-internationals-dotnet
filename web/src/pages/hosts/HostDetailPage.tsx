import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Home,
  Mail,
  Phone,
  MapPin,
  Car,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Container } from "../../components/layout/Container";
import { useHost } from "../../lib/hooks/useApiQueries";
import { api } from "../../api";

const hostSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
});

type HostFormValues = z.infer<typeof hostSchema>;

export function HostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const hostId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: host, isLoading, error } = useHost(hostId);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (values: HostFormValues) => api.updateHost(hostId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
      queryClient.invalidateQueries({ queryKey: ["hosts", hostId] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteHost(hostId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosts"] });
      navigate("/hosts");
    },
  });

  function startEditing() {
    if (!host) return;
    reset({
      fullname: host.fullname,
      email: host.email,
      phone: host.phone,
      address: host.address,
    });
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setConfirmDelete(false);
  }

  const onSubmit = (values: HostFormValues) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <Container className="py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error || !host) {
    return (
      <Container className="py-8">
        <Link
          to="/hosts"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to hosts
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Home className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Host not found</p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Back link */}
      <Link
        to="/hosts"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to hosts
      </Link>

      {/* Host details card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            {editing ? "Edit Host" : host.fullname}
          </CardTitle>
          {!editing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Are you sure?
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Confirm"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  Full Name
                </label>
                <Input {...register("fullname")} />
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
                <Input {...register("email")} type="email" />
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
                <Input {...register("phone")} type="tel" />
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
                <Input {...register("address")} />
                {errors.address && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {updateMutation.isError && (
                <p className="text-xs text-destructive">
                  {(updateMutation.error as Error).message ||
                    "Failed to update host"}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <a
                  href={`mailto:${host.email}`}
                  className="text-foreground hover:underline"
                >
                  {host.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Phone:</span>
                <a
                  href={`tel:${host.phone}`}
                  className="text-foreground hover:underline"
                >
                  {host.phone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Address:</span>
                <span className="text-foreground">{host.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">
                  Year: {host.year}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            Assigned Drivers
            <Badge variant="secondary">{host.drivers?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!host.drivers || host.drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Car className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No drivers assigned to this host
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {host.drivers.map((driver) => (
                <Link
                  key={driver.id}
                  to={`/drivers/${driver.id}`}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Car className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {driver.fullname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {driver.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Capacity: {driver.capacity}
                    </Badge>
                    <Badge variant={driver.isPresent ? "default" : "secondary"}>
                      {driver.isPresent ? "Present" : "Absent"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
