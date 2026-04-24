import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, formatBDT } from "@/lib/csv";
import type { Product, Sale } from "@/integrations/supabase/types-helper";

type Form = { product_ref: string; quantity: number; selling_price: number; sale_date: string };
const empty: Form = { product_ref: "", quantity: 1, selling_price: 0, sale_date: new Date().toISOString().slice(0, 10) };

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const load = async () => {
    const [s, p] = await Promise.all([
      supabase.from("sales").select("*").order("sale_date", { ascending: false }),
      supabase.from("products").select("*").order("name"),
    ]);
    setSales((s.data ?? []) as Sale[]);
    setProducts((p.data ?? []) as Product[]);
  };
  useEffect(() => { load(); }, []);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const onProduct = (id: string) => {
    const p = productMap.get(id);
    setForm((f) => ({ ...f, product_ref: id, selling_price: p ? Number(p.selling_price) : 0 }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = productMap.get(form.product_ref);
    if (!p) return toast.error("Select a product");
    if (form.quantity > p.stock_quantity) return toast.error(`Only ${p.stock_quantity} in stock`);
    const total_amount = form.quantity * form.selling_price;
    const { error } = await supabase.from("sales").insert({ ...form, total_amount });
    if (error) return toast.error(error.message);
    toast.success("Sale recorded");
    setOpen(false); setForm(empty); load();
  };

  const remove = async (s: Sale) => {
    if (!confirm("Delete this sale? Stock will be restored.")) return;
    const { error } = await supabase.from("sales").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const filtered = sales.filter((s) => {
    const p = productMap.get(s.product_ref);
    const okSearch = !search || (p?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const okDate = !dateFilter || s.sale_date === dateFilter;
    return okSearch && okDate;
  });

  const exportRows = filtered.map((s) => ({
    date: s.sale_date,
    product: productMap.get(s.product_ref)?.name ?? "",
    quantity: s.quantity,
    price: Number(s.selling_price),
    total: Number(s.total_amount),
  }));

  return (
    <>
      <PageHeader
        title="Sales"
        description="Record and review daily sales"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV(exportRows, "sales")}>
              <Download size={16} className="mr-2" /> Export
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary"><Plus size={16} className="mr-2" /> New Sale</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Sale</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={form.product_ref} onValueChange={onProduct}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                            {p.name} ({p.stock_quantity} left)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min={1} required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price (৳)</Label>
                      <Input type="number" step="0.01" required value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" required value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} />
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-display font-bold text-lg">৳ {formatBDT(form.quantity * form.selling_price)}</span>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary">Save Sale</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card className="p-4 shadow-soft mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by product..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No sales</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{s.sale_date}</TableCell>
                  <TableCell className="font-medium">{productMap.get(s.product_ref)?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">{s.quantity}</TableCell>
                  <TableCell className="text-right">৳ {formatBDT(Number(s.selling_price))}</TableCell>
                  <TableCell className="text-right font-semibold">৳ {formatBDT(Number(s.total_amount))}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove(s)}><Trash2 size={14} className="text-destructive" /></Button>
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

export default Sales;
