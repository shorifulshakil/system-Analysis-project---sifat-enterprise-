import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, Pencil, Search, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatBDT } from "@/lib/csv";
import type { Employee } from "@/integrations/supabase/types-helper";

type EmpForm = Omit<Employee, "id" | "created_at" | "updated_at">;
const emptyEmp: EmpForm = {
  name: "",
  mobile: "",
  address: "",
  nid_number: "",
  date_of_birth: "",
  photo_url: "",
  current_salary: 0,
  joining_date: new Date().toISOString().slice(0, 10),
  status: "active",
};

const Employees = () => {
  const [items, setItems] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmpForm>(emptyEmp);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Employee[]);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyEmp); setOpen(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({
      name: e.name, mobile: e.mobile, address: e.address ?? "", nid_number: e.nid_number ?? "",
      date_of_birth: e.date_of_birth ?? "", photo_url: e.photo_url ?? "",
      current_salary: Number(e.current_salary), joining_date: e.joining_date, status: e.status,
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      address: form.address || null,
      nid_number: form.nid_number || null,
      date_of_birth: form.date_of_birth || null,
      photo_url: form.photo_url || null,
    };
    const { error } = editing
      ? await supabase.from("employees").update(payload).eq("id", editing.id)
      : await supabase.from("employees").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Employee updated" : "Employee added");
    setOpen(false); load();
  };

  const remove = async (e: Employee) => {
    if (!confirm(`Delete ${e.name}? This will also remove all salary records.`)) return;
    const { error } = await supabase.from("employees").delete().eq("id", e.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("employee-photos").upload(path, file);
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("employee-photos").getPublicUrl(path);
    setForm((f) => ({ ...f, photo_url: data.publicUrl }));
    setUploading(false);
    toast.success("Photo uploaded");
  };

  const filtered = items.filter((e) =>
    !search || [e.name, e.mobile, e.nid_number ?? ""].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage staff details and photos"
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/salary"><Wallet size={16} className="mr-2" /> Salary</Link>
            </Button>
            <Button onClick={openNew} className="bg-gradient-primary">
              <Plus size={16} className="mr-2" /> New Employee
            </Button>
          </div>
        }
      />

      <Card className="p-4 shadow-soft mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, mobile or NID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>NID</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No employees</TableCell></TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={e.photo_url ?? undefined} alt={e.name} />
                      <AvatarFallback>{e.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-sm">{e.mobile}</TableCell>
                  <TableCell className="text-sm">{e.nid_number ?? "—"}</TableCell>
                  <TableCell className="text-sm">{e.date_of_birth ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold">৳ {formatBDT(Number(e.current_salary))}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${e.status === "active" ? "bg-primary/10 text-primary" : "bg-secondary"}`}>
                      {e.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(e)}><Trash2 size={14} className="text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Employee Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Employee" : "Add Employee"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4 mt-2">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={form.photo_url || undefined} alt="Preview" />
                <AvatarFallback>{form.name.slice(0, 2).toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Label>Photo URL or Upload</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste image URL..."
                    value={form.photo_url ?? ""}
                    onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  />
                  <Button type="button" variant="outline" asChild disabled={uploading}>
                    <label className="cursor-pointer">
                      <Upload size={14} className="mr-1" /> {uploading ? "..." : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mobile *</Label>
                <Input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NID Number</Label>
                <Input value={form.nid_number ?? ""} onChange={(e) => setForm({ ...form, nid_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth ?? ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Salary (৳)</Label>
                <Input type="number" step="0.01" value={form.current_salary}
                  onChange={(e) => setForm({ ...form, current_salary: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Joining Date</Label>
                <Input type="date" value={form.joining_date}
                  onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-primary">{editing ? "Save changes" : "Add employee"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Employees;
