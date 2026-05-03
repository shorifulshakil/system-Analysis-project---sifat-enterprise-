import { useState, FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const USERNAME_DOMAIN = "gmail.com";

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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nid, setNid] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const email = resolveEmail(identifier);
    const { error } =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, { full_name: fullName, phone_number: phone, nid, dob, address });
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
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" required autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" required autoComplete="tel" />
                </div>
              </>
            )}
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
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nid">NID Number</Label>
                  <Input id="nid" type="text" value={nid} onChange={(e) => setNid(e.target.value)} placeholder="Enter NID number" required autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required autoComplete="bday" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your address" required autoComplete="street-address" />
                </div>
              </>
            )}
            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

        </Card>
      </div>
    </div>
  );
};

export default Auth;
