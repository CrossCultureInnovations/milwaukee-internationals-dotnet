const API_URL = "/api";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem("token");
  else localStorage.setItem("token", token);
}

async function request<T = unknown>(
  path: string,
  opts: RequestInit = {},
  absolutePath?: string
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = absolutePath ?? `${API_URL}${path}`;
  const res = await fetch(url, { ...opts, headers });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    let message = res.statusText || "Request failed";
    let body: unknown = null;
    try {
      if (contentType.includes("application/json")) {
        body = await res.json();
        const b = body as Record<string, string>;
        message =
          b?.error || b?.message || b?.detail || b?.title || message;
      } else {
        const text = await res.text();
        if (text) message = text;
      }
    } catch {
      // ignore parse errors
    }
    if (res.status === 401) message = message || "Unauthorized.";
    if (res.status === 403) message = message || "Forbidden.";
    throw new ApiError(message, res.status, body);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types — mirror C# entities
// ---------------------------------------------------------------------------

export type UserRoleEnum = "Basic" | "Admin";
export type RolesEnum = "Driver" | "Navigator";

export type Student = {
  id: number;
  fullname: string;
  major: string;
  university: string;
  email: string;
  phone: string;
  country: string;
  interests: string;
  familySize: number;
  displayId: string;
  needCarSeat: boolean;
  kosherFood: boolean;
  isPresent: boolean;
  driverRefId: number | null;
  driver: Driver | null;
  isFamily: boolean;
  year: number;
  events: EventStudentRelationship[];
  registeredOn: string;
};

export type Driver = {
  id: number;
  email: string;
  phone: string;
  fullname: string;
  displayId: string;
  capacity: number;
  requireNavigator: boolean;
  navigator: string;
  role: RolesEnum;
  students: Student[];
  hostRefId: number | null;
  host: Host | null;
  isPresent: boolean;
  haveChildSeat: boolean;
  year: number;
  registeredOn: string;
};

export type Host = {
  id: number;
  email: string;
  phone: string;
  fullname: string;
  address: string;
  drivers: Driver[];
  year: number;
};

export type MilwaukeeEvent = {
  id: number;
  name: string;
  description: string;
  dateTime: string;
  address: string;
  students: EventStudentRelationship[];
  year: number;
};

export type EventStudentRelationship = {
  id: number;
  studentId: number;
  eventId: number;
};

export type Location = {
  id: number;
  rank: number;
  year: number;
  name: string;
  address: string;
  description: string;
};

export type LocationMapping = {
  id: number;
  sourceId: number;
  source: Location | null;
  sinkId: number;
  sink: Location | null;
  year: number;
  description: string;
};

export type User = {
  id: number;
  fullname: string;
  userName: string;
  email: string;
  phoneNumber: string;
  userRoleEnum: UserRoleEnum;
  lastLoggedInDate: string;
  enable: boolean;
};

export type GlobalConfigs = {
  id: number;
  yearValue: number;
  eventFeature: boolean;
  emailTestMode: boolean;
  smsTestMode: boolean;
  theme: string;
  disallowDuplicateStudents: boolean;
  recordApiEvents: boolean;
  qrInStudentEmail: boolean;
  maxLimitStudentSeats: number;
  maxLimitDrivers: number;
  tourDate: string;
  arrivalTimeForHost: string;
  tourAddress: string;
  tourLocation: string;
  locationWizardFeature: boolean;
  emailSenderOnBehalf: string;
};

export type TourInfo = {
  tourAddress: string;
  tourDate: string;
  tourLocation: string;
};

export type StatsViewModel = {
  countStudents: number;
  countDependents: number;
  countDrivers: number;
  countHosts: number;
  year: number;
  countDistinctCountries: number;
  currentYear: boolean;
  activeYear: boolean;
  countryDistribution: Record<string, number>;
  countPresentStudents: number;
};

// View models
export type LoginViewModel = { username: string; password: string };
export type RegisterViewModel = {
  phoneNumber: string;
  fullname: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
};
export type DriverLoginViewModel = { email: string; driverId: string };
export type AttendanceViewModel = { id: number; attendance: boolean };
export type NewStudentDriverMappingViewModel = {
  studentId: number;
  driverId: number;
};
export type NewDriverHostMappingViewModel = {
  driverId: number;
  hostId: number;
};
export type TokenViewModel = { token: string };

// Auth response
export type LoginResponse = {
  token: string;
  userName: string;
  email: string;
};

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const api = {
  // Auth
  login: (payload: LoginViewModel) =>
    request<LoginResponse>("/jwtidentity/Login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload: RegisterViewModel) =>
    request("/jwtidentity/Register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => request("/jwtidentity/Logout", { method: "POST" }),
  refresh: () => request<LoginResponse>("/jwtidentity/Refresh"),
  me: () => request<User>("/jwtidentity"),

  // Students
  getStudents: () => request<Student[]>("/student"),
  getStudent: (id: number) => request<Student>(`/student/${id}`),
  createStudent: (payload: Partial<Student>) =>
    request<Student>("/student", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStudent: (id: number, payload: Partial<Student>) =>
    request<Student>(`/student/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteStudent: (id: number) =>
    request(`/student/${id}`, { method: "DELETE" }),

  // Drivers
  getDrivers: () => request<Driver[]>("/driver"),
  getDriver: (id: number) => request<Driver>(`/driver/${id}`),
  createDriver: (payload: Partial<Driver>) =>
    request<Driver>("/driver", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDriver: (id: number, payload: Partial<Driver>) =>
    request<Driver>(`/driver/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteDriver: (id: number) =>
    request(`/driver/${id}`, { method: "DELETE" }),
  driverLogin: (payload: DriverLoginViewModel) =>
    request<Driver>("/driver/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Hosts
  getHosts: () => request<Host[]>("/host"),
  getHost: (id: number) => request<Host>(`/host/${id}`),
  createHost: (payload: Partial<Host>) =>
    request<Host>("/host", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateHost: (id: number, payload: Partial<Host>) =>
    request<Host>(`/host/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteHost: (id: number) => request(`/host/${id}`, { method: "DELETE" }),

  // Events
  getEvents: () => request<MilwaukeeEvent[]>("/event"),
  getEvent: (id: number) => request<MilwaukeeEvent>(`/event/${id}`),
  createEvent: (payload: Partial<MilwaukeeEvent>) =>
    request<MilwaukeeEvent>("/event", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateEvent: (id: number, payload: Partial<MilwaukeeEvent>) =>
    request<MilwaukeeEvent>(`/event/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteEvent: (id: number) => request(`/event/${id}`, { method: "DELETE" }),
  mapStudentToEvent: (eventId: number, studentId: number) =>
    request(`/event/map/${eventId}/${studentId}`, { method: "POST" }),
  unmapStudentFromEvent: (eventId: number, studentId: number) =>
    request(`/event/unmap/${eventId}/${studentId}`, { method: "POST" }),
  getEventInfo: (id: number) => request(`/event/Info/${id}`),
  getEventEmail: () => request("/event/Email"),

  // Locations
  getLocations: () => request<Location[]>("/location"),
  getLocation: (id: number) => request<Location>(`/location/${id}`),
  createLocation: (payload: Partial<Location>) =>
    request<Location>("/location", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateLocation: (id: number, payload: Partial<Location>) =>
    request<Location>(`/location/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteLocation: (id: number) =>
    request(`/location/${id}`, { method: "DELETE" }),

  // Location Mappings
  getLocationMappings: () => request<LocationMapping[]>("/locationmapping"),
  getLocationMapping: (id: number) =>
    request<LocationMapping>(`/locationmapping/${id}`),
  createLocationMapping: (payload: Partial<LocationMapping>) =>
    request<LocationMapping>("/locationmapping", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateLocationMapping: (id: number, payload: Partial<LocationMapping>) =>
    request<LocationMapping>(`/locationmapping/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteLocationMapping: (id: number) =>
    request(`/locationmapping/${id}`, { method: "DELETE" }),

  // Student-Driver Mapping
  getStudentDriverMappingStatus: () =>
    request("/studentdrivermapping/Status"),
  mapStudentToDriver: (payload: NewStudentDriverMappingViewModel) =>
    request("/studentdrivermapping/Map", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  unmapStudentFromDriver: (payload: NewStudentDriverMappingViewModel) =>
    request("/studentdrivermapping/UnMap", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  emailStudentDriverMappings: () =>
    request("/studentdrivermapping/EmailMappings", { method: "POST" }),

  // Driver-Host Mapping
  getDriverHostMappingStatus: () =>
    request("/driverhostmapping/Status"),
  mapDriverToHost: (payload: NewDriverHostMappingViewModel) =>
    request("/driverhostmapping/Map", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  unmapDriverFromHost: (payload: NewDriverHostMappingViewModel) =>
    request("/driverhostmapping/UnMap", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  emailDriverHostMappings: () =>
    request("/driverhostmapping/EmailMappings", { method: "POST" }),

  // Users
  getUsers: () => request<User[]>("/user"),
  getUser: (id: number) => request<User>(`/user/${id}`),
  createUser: (payload: Partial<User>) =>
    request<User>("/user", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateUser: (id: number, payload: Partial<User>) =>
    request<User>(`/user/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: number) => request(`/user/${id}`, { method: "DELETE" }),

  // Config
  getConfig: () => request<GlobalConfigs>("/config"),
  updateConfig: (payload: GlobalConfigs) =>
    request<GlobalConfigs>("/config", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getConnectionString: () =>
    request<{ connectionString: string; provider: string }>("/config/connection-string"),

  // Attendance
  setStudentAttendance: (payload: AttendanceViewModel) =>
    request("/attendance/Student/SetAttendance", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  setDriverAttendance: (payload: AttendanceViewModel) =>
    request("/attendance/Driver/SetAttendance", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendDriverCheckIn: () =>
    request("/attendance/Driver/SendCheckIn", { method: "POST" }),
  sendStudentCheckIn: () =>
    request("/attendance/Student/SendCheckIn", { method: "POST" }),

  // Push Notifications
  getPushTokens: () => request("/pushnotification/token"),
  savePushToken: (payload: TokenViewModel) =>
    request("/pushnotification/token", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deletePushToken: (payload: TokenViewModel) =>
    request("/pushnotification/token", {
      method: "DELETE",
      body: JSON.stringify(payload),
    }),

  // Registration (public, no auth)
  getStudentRegistrationStatus: () =>
    request<{ isOpen: boolean }>("/registration/student/status"),
  getDriverRegistrationStatus: () =>
    request<{ isOpen: boolean }>("/registration/driver/status"),
  registerStudent: (payload: Partial<Student>) =>
    request<{ success: boolean }>("/registration/student", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  registerDriver: (payload: Partial<Driver>) =>
    request<{ success: boolean }>("/registration/driver", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Tour
  getTourInfo: () => request<TourInfo>("/tour/info"),

  // Stats (route is /stats, not /api/stats)
  getStats: () =>
    request<StatsViewModel[]>("/stats", {}, "/stats"),
  getCountryDistribution: () =>
    request<Record<string, Record<string, number>>>(
      "/stats/CountryDistribution",
      {},
      "/stats/CountryDistribution"
    ),
};
