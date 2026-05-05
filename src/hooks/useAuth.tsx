import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const normalizeApiError = (err: unknown) => {
  const error = err instanceof Error ? err : new Error("Network error");
  if (error.message === "Failed to fetch") {
    return new Error(`Cannot reach backend API at ${API_URL}. Start the server and refresh the app.`);
  }
  return error;
};

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
  updateProfile: (details: { full_name?: string; phone_number?: string; nid?: string; dob?: string; address?: string }) => Promise<{ error: Error | null }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  loginAs: (userId: number) => Promise<{ error: Error | null }>;
  getUsers: () => Promise<{ data?: any[]; error: Error | null }>;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ id: number; email: string; role: string; full_name?: string; phone_number?: string; nid?: string; dob?: string; address?: string } | null>(null);
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
    } catch (err: unknown) {
      return { error: normalizeApiError(err) };
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
    } catch (err: unknown) {
      return { error: normalizeApiError(err) };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSession(null);
    setUser(null);
  };

  const updateProfile = async (details: { full_name?: string; phone_number?: string; nid?: string; dob?: string; address?: string }) => {
    try {
      const token = session?.access_token;
      if (!token) return { error: new Error("Not authenticated") };
      
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: details.full_name,
          phone_number: details.phone_number,
          nid_number: details.nid,
          date_of_birth: details.dob,
          address: details.address,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || "Update failed") };
      
      setUser(data.data);
      localStorage.setItem("user", JSON.stringify(data.data));
      return { error: null };
    } catch (err: unknown) {
      return { error: normalizeApiError(err) };
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      const token = session?.access_token;
      if (!token) return { error: new Error("Not authenticated") };
      
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || "Password change failed") };
      
      return { error: null };
    } catch (err: unknown) {
      return { error: normalizeApiError(err) };
    }
  };

  const loginAs = async (userId: number) => {
    try {
      const token = session?.access_token;
      if (!token) return { error: new Error("Not authenticated") };
      
      const res = await fetch(`${API_URL}/api/auth/login-as`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || "Login as failed") };
      
      localStorage.setItem("token", data.session.access_token);
      localStorage.setItem("user", JSON.stringify(data.session.user));
      setSession(data.session);
      setUser(data.session.user);
      return { error: null };
    } catch (err: unknown) {
      return { error: normalizeApiError(err) };
    }
  };

  const getUsers = async () => {
    try {
      const token = session?.access_token;
      if (!token) return { error: new Error("Not authenticated") };
      
      const res = await fetch(`${API_URL}/api/auth/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) return { error: new Error(data.error || "Failed to get users") };
      
      return { data: data.data, error: null };
    } catch (err: unknown) {
      return { error: normalizeApiError(err) };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, updateProfile, changePassword, loginAs, getUsers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
