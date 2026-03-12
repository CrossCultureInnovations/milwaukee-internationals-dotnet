import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { MapPin, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { api, type Location } from "../../api";
import { useLocations } from "../../lib/hooks/useApiQueries";
import { LocationGraph } from "./LocationGraph";
import { Container } from "../../components/layout/Container";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
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

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  description: z.string().optional().default(""),
  rank: z.coerce.number().int().min(0, "Rank must be 0 or greater"),
});

type LocationFormValues = z.infer<typeof locationSchema>;

function LocationForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
}: {
  defaultValues?: LocationFormValues;
  onSubmit: (values: LocationFormValues) => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: defaultValues ?? { name: "", address: "", description: "", rank: 0 },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Name
        </label>
        <Input {...register("name")} placeholder="Location name" />
        {errors.name && (
          <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Address
        </label>
        <Input {...register("address")} placeholder="Full address" />
        {errors.address && (
          <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Description
        </label>
        <Input {...register("description")} placeholder="Optional description" />
        {errors.description && (
          <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Rank
        </label>
        <Input type="number" {...register("rank")} placeholder="0" />
        {errors.rank && (
          <p className="mt-1 text-xs text-destructive">{errors.rank.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
        <SheetClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </SheetClose>
      </div>
    </form>
  );
}

function DeleteConfirmation({
  location,
  onConfirm,
  onCancel,
  isPending,
}: {
  location: Location;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete{" "}
        <span className="font-medium text-foreground">{location.name}</span>? This
        action cannot be undone.
      </p>
      <div className="flex items-center gap-2">
        <Button variant="default" onClick={onConfirm} disabled={isPending}>
          {isPending ? "Deleting..." : "Delete"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function LocationsPage() {
  const queryClient = useQueryClient();
  const { data: locations, isLoading } = useLocations();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: LocationFormValues) => api.createLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LocationFormValues }) =>
      api.updateLocation(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setEditingLocation(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setDeletingLocation(null);
    },
  });

  const filtered = (locations ?? [])
    .filter((loc) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.address.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.rank - b.rank);

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl text-foreground">Locations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tour locations and their order
          </p>
        </div>

        <Sheet open={createOpen} onOpenChange={setCreateOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </SheetTrigger>
          <SheetContent>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Add Location
            </h2>
            <LocationForm
              onSubmit={(values) => createMutation.mutate(values)}
              isPending={createMutation.isPending}
              submitLabel="Create Location"
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            All Locations
            {!isLoading && (
              <Badge variant="secondary" className="ml-2">
                {filtered.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search ? "No locations match your search" : "No locations yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Description
                  </TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <Badge variant="outline">{location.rank}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {location.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {location.address}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {location.description || "\u2014"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingLocation(location)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingLocation(location)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <Sheet
        open={editingLocation !== null}
        onOpenChange={(open) => {
          if (!open) setEditingLocation(null);
        }}
      >
        <SheetContent>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Edit Location
          </h2>
          {editingLocation && (
            <LocationForm
              key={editingLocation.id}
              defaultValues={{
                name: editingLocation.name,
                address: editingLocation.address,
                description: editingLocation.description,
                rank: editingLocation.rank,
              }}
              onSubmit={(values) =>
                updateMutation.mutate({ id: editingLocation.id, payload: values })
              }
              isPending={updateMutation.isPending}
              submitLabel="Save Changes"
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Sheet */}
      <Sheet
        open={deletingLocation !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingLocation(null);
        }}
      >
        <SheetContent>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Delete Location
          </h2>
          {deletingLocation && (
            <DeleteConfirmation
              location={deletingLocation}
              onConfirm={() => deleteMutation.mutate(deletingLocation.id)}
              onCancel={() => setDeletingLocation(null)}
              isPending={deleteMutation.isPending}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Location mapping graph */}
      <div className="mt-6">
        <LocationGraph />
      </div>
    </Container>
  );
}
