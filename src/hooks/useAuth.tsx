import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface AuthCtx {
  user: {
    id: number;
    email: string;
    role: string;
    full_name?: string;
    phone_number?: string;
    nid?: string;
    dob?: string;
    address?: string;
  } | null;
  session: { access_token: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    details?: { full_name?: string; phone_number?: string; nid?: string; dob?: string; address?: string },
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ id: number; email: string; role: string; nid?: string; dob?: string; address?: string } | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        setSession({ access_token: token });
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || "Sign in failed") };
      
      localStorage.setItem("token", data.session.access_token);
      localStorage.setItem("user", JSON.stringify(data.session.user));
      setSession(data.session);
      setUser(data.session.user);
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Network error") };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    details?: { full_name?: string; phone_number?: string; nid?: string; dob?: string; address?: string },
  ) => {
    try {
      const payload = { email, password, ...details };
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || "Sign up failed") };
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Network error") };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
