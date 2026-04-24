import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Tag } from "lucide-react";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type Form = { name: string; description: string };
const empty: Form = { name: "", description: "" };

const Categories = () => {
  const [items, setItems] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Form>(empty);

  const load = async () => {
    const [{ data: cats, error }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("products").select("category"),
    ]);
    if (error) return toast.error(error.message);
    setItems((cats ?? []) as Category[]);
    const map: Record<string, number> = {};
    (prods ?? []).forEach((p: { category: string }) => {
      map[p.category] = (map[p.category] ?? 0) + 1;
    });
    setCounts(map);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "" });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    };
    if (!payload.name) return toast.error("Name is required");

    const { error } = editing
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Category updated" : "Category added");
    setOpen(false);
    load();
  };

  const remove = async (c: Category) => {
    if (counts[c.name]) {
      return toast.error(`Cannot delete: ${counts[c.name]} product(s) use this category`);
    }
    if (!confirm(`Delete category "${c.name}"?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const filtered = items.filter((c) =>
    [c.name, c.description ?? ""].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organize your products into categories"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="bg-gradient-primary">
                <Plus size={16} className="mr-2" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit" : "Add"} Category</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Electronics"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description for this category"
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary">
                  {editing ? "Update" : "Save"} Category
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4 shadow-soft mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    <Tag className="mx-auto mb-2 h-6 w-6 opacity-50" />
                    No categories yet
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.description ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                        {counts[c.name] ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(c)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
};

export default Categories;
