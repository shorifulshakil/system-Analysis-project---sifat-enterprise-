import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const USERNAME_DOMAIN = "gmail.com";
const DEMO_USERNAME = "admin@gmail.com";
const DEMO_PASSWORD = "admin123";

const resolveEmail = (identifier: string) => {
  const id = identifier.trim();
  return id.includes("@") ? id : `${id}@${USERNAME_DOMAIN}`;
};

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const email = resolveEmail(identifier);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (mode === "signup") {
      toast.success("Account created. You can sign in now.");
      setMode("signin");
    } else {
      toast.success("Welcome back");
      navigate("/dashboard");
    }
  };

  const fillDemo = () => {
    setIdentifier(DEMO_USERNAME);
    setPassword(DEMO_PASSWORD);
    setMode("signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-accent items-center justify-center font-display font-bold text-2xl text-accent-foreground shadow-glow mb-4">
            S
          </div>
          <h1 className="text-3xl font-display font-bold text-primary-foreground">Shifat Enterprise</h1>
          <p className="text-primary-foreground/70 mt-2 text-sm">Inventory & Sales Management</p>
        </div>

        <Card className="p-6 shadow-elegant">
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === "signin" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >Sign in</button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${mode === "signup" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
            >Create account</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{mode === "signin" ? "Email or Username" : "Email"}</Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={mode === "signin" ? "admin or you@example.com" : "you@example.com"}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </div>
            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Demo Admin</p>
            <div className="flex items-center justify-between gap-2 text-xs bg-muted/60 rounded-md p-3">
              <div className="space-y-0.5 font-mono">
                <div>username: <span className="text-foreground font-semibold">{DEMO_USERNAME}</span></div>
                <div>password: <span className="text-foreground font-semibold">{DEMO_PASSWORD}</span></div>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={fillDemo}>Use</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
