import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";

export function useStudents() {
  return useQuery({ queryKey: ["students"], queryFn: api.getStudents });
}

export function useStudent(id: number) {
  return useQuery({
    queryKey: ["students", id],
    queryFn: () => api.getStudent(id),
    enabled: id > 0,
  });
}

export function useDrivers() {
  return useQuery({ queryKey: ["drivers"], queryFn: api.getDrivers });
}

export function useDriver(id: number) {
  return useQuery({
    queryKey: ["drivers", id],
    queryFn: () => api.getDriver(id),
    enabled: id > 0,
  });
}

export function useHosts() {
  return useQuery({ queryKey: ["hosts"], queryFn: api.getHosts });
}

export function useHost(id: number) {
  return useQuery({
    queryKey: ["hosts", id],
    queryFn: () => api.getHost(id),
    enabled: id > 0,
  });
}

export function useEvents() {
  return useQuery({ queryKey: ["events"], queryFn: api.getEvents });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => api.getEvent(id),
    enabled: id > 0,
  });
}

export function useLocations() {
  return useQuery({ queryKey: ["locations"], queryFn: api.getLocations });
}

export function useLocation(id: number) {
  return useQuery({
    queryKey: ["locations", id],
    queryFn: () => api.getLocation(id),
    enabled: id > 0,
  });
}

export function useLocationMappings() {
  return useQuery({
    queryKey: ["locationMappings"],
    queryFn: api.getLocationMappings,
  });
}

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: api.getUsers });
}

export function useConfig() {
  return useQuery({ queryKey: ["config"], queryFn: api.getConfig });
}

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: api.getStats });
}

export function useStudentDriverMappingStatus() {
  return useQuery({
    queryKey: ["studentDriverMappingStatus"],
    queryFn: api.getStudentDriverMappingStatus,
  });
}

export function useDriverHostMappingStatus() {
  return useQuery({
    queryKey: ["driverHostMappingStatus"],
    queryFn: api.getDriverHostMappingStatus,
  });
}
