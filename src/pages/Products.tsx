import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, formatBDT } from "@/lib/csv";
import type { Product } from "@/integrations/supabase/types-helper";

type Form = Omit<Product, "id" | "created_at" | "updated_at">;
const empty: Form = {
  name: "", product_id: "", category: "", buying_price: 0,
  selling_price: 0, stock_quantity: 0, supplier_name: "",
  product_date: new Date().toISOString().slice(0, 10),
};

const Products = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Form>(empty);

  const load = async () => {
    const [{ data, error }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("name").order("name"),
    ]);
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Product[]);
    setCategories((cats ?? []).map((c: { name: string }) => c.name));
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, product_id: p.product_id, category: p.category,
      buying_price: Number(p.buying_price), selling_price: Number(p.selling_price),
      stock_quantity: p.stock_quantity, supplier_name: p.supplier_name ?? "",
      product_date: p.product_date,
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, supplier_name: form.supplier_name || null };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Product updated" : "Product added");
    setOpen(false); load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const filtered = items.filter((p) =>
    [p.name, p.product_id, p.category, p.supplier_name ?? ""].some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage inventory items"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV(filtered, "products")}>
              <Download size={16} className="mr-2" /> Export
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew} className="bg-gradient-primary"><Plus size={16} className="mr-2" /> Add Product</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Product</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="grid grid-cols-2 gap-4 mt-2">
                  <div className="col-span-2 space-y-2">
                    <Label>Product Name</Label>
                    <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Product ID / SKU</Label>
                    <Input required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-muted-foreground">No categories — add one in Categories page</div>
                        ) : categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Buying Price (৳)</Label>
                    <Input type="number" step="0.01" required value={form.buying_price} onChange={(e) => setForm({ ...form, buying_price: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price (৳)</Label>
                    <Input type="number" step="0.01" required value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Qty</Label>
                    <Input type="number" required value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" required value={form.product_date} onChange={(e) => setForm({ ...form, product_date: e.target.value })} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Supplier Name</Label>
                    <Input value={form.supplier_name ?? ""} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
                  </div>
                  <Button type="submit" className="col-span-2 bg-gradient-primary">{editing ? "Update" : "Save"} Product</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card className="p-4 shadow-soft mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, SKU, category, supplier..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Buy</TableHead>
                <TableHead className="text-right">Sell</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No products</TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{p.product_id}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-right">৳ {formatBDT(Number(p.buying_price))}</TableCell>
                  <TableCell className="text-right">৳ {formatBDT(Number(p.selling_price))}</TableCell>
                  <TableCell className="text-right">
                    <span className={p.stock_quantity <= 5 ? "text-warning font-semibold" : ""}>{p.stock_quantity}</span>
                  </TableCell>
                  <TableCell className="text-sm">{p.supplier_name ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 size={14} className="text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
};

export default Products;
