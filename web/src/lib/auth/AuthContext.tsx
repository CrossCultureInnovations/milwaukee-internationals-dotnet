import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  api,
  getToken,
  setToken,
  setUnauthorizedHandler,
  type User,
  type LoginViewModel,
  type RegisterViewModel,
} from "../../api";

export type AuthSession = {
  token: string;
  user: User;
};

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  /** True when the session ended on its own rather than by an explicit logout. */
  sessionExpired: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (payload: RegisterViewModel) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Don't re-hit /jwtidentity more than once per this window on focus changes. */
const REVALIDATE_INTERVAL_MS = 60_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const queryClient = useQueryClient();

  // Read inside callbacks without making them depend on the session.
  const hasSessionRef = useRef(false);
  hasSessionRef.current = !!session;

  const lastCheckedRef = useRef(0);

  const endSession = useCallback(
    (expired: boolean) => {
      setToken(null);
      setSession(null);
      setSessionExpired(expired);
      // Drop cached rows so the next sign-in never renders the old session's data.
      queryClient.clear();
    },
    [queryClient]
  );

  // A 401 on any authenticated request means the token expired or the server
  // restarted with a new signing key. Tear the session down so RequireAuth
  // redirects to the login page instead of leaving a dead shell on screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (hasSessionRef.current) endSession(true);
    });
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setSession(null);
          setIsInitializing(false);
        }
        return;
      }
      try {
        const me = await api.me();
        if (!cancelled) {
          if (me) {
            lastCheckedRef.current = Date.now();
            setSession({ token, user: me });
          } else {
            // 204 / null means token is invalid or expired
            setToken(null);
            setSession(null);
          }
        }
      } catch {
        setToken(null);
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  // The common failure is a tab left open in the background, so re-check the
  // session when it comes forward rather than waiting for the user to click
  // something and get a silent empty screen.
  useEffect(() => {
    async function revalidate() {
      if (!hasSessionRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheckedRef.current < REVALIDATE_INTERVAL_MS) return;

      lastCheckedRef.current = Date.now();
      try {
        // /api/jwtidentity is [AllowAnonymous] and answers 204 (not 401) when
        // the token no longer authenticates, so a null result is the signal.
        const me = await api.me();
        if (!me) endSession(true);
      } catch {
        // A 401 here already went through the unauthorized handler; anything
        // else (offline, 5xx) shouldn't sign the user out.
      }
    }

    document.addEventListener("visibilitychange", revalidate);
    window.addEventListener("focus", revalidate);
    return () => {
      document.removeEventListener("visibilitychange", revalidate);
      window.removeEventListener("focus", revalidate);
    };
  }, [endSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      isInitializing,
      sessionExpired,

      login: async (username, password) => {
        const res = await api.login({ username, password } as LoginViewModel);
        setToken(res.token);
        const me = await api.me();
        lastCheckedRef.current = Date.now();
        setSessionExpired(false);
        setSession({ token: res.token, user: me });
        return me;
      },

      register: async (payload) => {
        await api.register(payload);
      },

      logout: async () => {
        try {
          await api.logout();
        } catch {
          // ignore logout errors
        }
        endSession(false);
      },
    }),
    [session, isInitializing, sessionExpired, endSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
