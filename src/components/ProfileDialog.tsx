import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { User, Lock } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ProfileDialog = () => {
  const { user, updateProfile, changePassword, loginAs, getUsers } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    phone_number: user?.phone_number || "",
    nid: user?.nid || "",
    dob: user?.dob || "",
    address: user?.address || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role === 'admin' && open) {
      getUsers().then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setUsers(data || []);
      });
    }
  }, [user?.role, open]);

  useEffect(() => {
    if (open && user) {
      setForm({
        full_name: user.full_name || "",
        phone_number: user.phone_number || "",
        nid: user.nid || "",
        dob: user.dob || "",
        address: user.address || "",
      });
    }
  }, [open, user]);

  const handleLoginAs = async () => {
    if (!selectedUserId) return toast.error("Select a user");
    setLoading(true);
    const { error } = await loginAs(selectedUserId);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Logged in as selected user");
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await updateProfile({
      full_name: form.full_name || undefined,
      phone_number: form.phone_number || undefined,
      nid: form.nid || undefined,
      dob: form.dob || undefined,
      address: form.address || undefined,
    });
    setLoading(false);
    if (error) {
      return toast.error(error.message);
    }
    toast.success("Profile updated successfully");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    setLoading(true);
    const { error } = await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
    setLoading(false);
    if (error) {
      return toast.error(error.message);
    }
    toast.success("Password changed successfully");
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-2 py-2 h-auto text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md">
          <User size={16} className="mr-2" /> My Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={setTab} className="w-full mt-4">
          <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User size={16} /> Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock size={16} /> Password
            </TabsTrigger>
            {user?.role === 'admin' && (
              <TabsTrigger value="loginAs" className="flex items-center gap-2">
                <User size={16} /> Login As
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Edit Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <Card className="p-4 bg-muted/40 border-none">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nid">NID Number</Label>
                <Input
                  id="nid"
                  value={form.nid}
                  onChange={(e) => setForm({ ...form, nid: e.target.value })}
                  placeholder="Enter your NID number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Enter your address"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          {/* Change Password Tab */}
          <TabsContent value="password" className="space-y-4 mt-4">
            <div className="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
              <p className="text-xs text-muted-foreground">For your security, enter your current password and then choose a new password.</p>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old_password">Current Password</Label>
                <Input
                  id="old_password"
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  placeholder="Enter your current password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter your new password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm your new password"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-primary" disabled={loading}>
                  {loading ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {user?.role === 'admin' && (
            <TabsContent value="loginAs" className="space-y-4 mt-4">
              <div className="rounded-lg bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3">
                <p className="text-xs text-muted-foreground">Select a user to login as. This will switch your session to that user.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_select">Select User</Label>
                  <Select value={selectedUserId?.toString()} onValueChange={(value) => setSelectedUserId(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.full_name || u.email} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleLoginAs} className="flex-1 bg-gradient-primary" disabled={loading || !selectedUserId}>
                    {loading ? "Logging in..." : "Login As"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
