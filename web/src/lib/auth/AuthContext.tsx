import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getToken, setToken, type User, type LoginViewModel, type RegisterViewModel } from "../../api";

export type AuthSession = {
  token: string;
  user: User;
};

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (payload: RegisterViewModel) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      isInitializing,

      login: async (username, password) => {
        const res = await api.login({ username, password } as LoginViewModel);
        setToken(res.token);
        const me = await api.me();
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
        setToken(null);
        setSession(null);
      },
    }),
    [session, isInitializing]
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
