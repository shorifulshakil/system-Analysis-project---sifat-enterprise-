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

type Form = { product_ref: number; quantity: string; selling_price: string; sale_date: string };
const empty: Form = { product_ref: 0, quantity: "", selling_price: "", sale_date: new Date().toISOString().slice(0, 10) };

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
    if (s.error) toast.error(`Failed to load sales: ${s.error.message}`);
    if (p.error) toast.error(`Failed to load products: ${p.error.message}`);
    setSales((s.data ?? []) as Sale[]);
    setProducts((p.data ?? []) as Product[]);
  };
  useEffect(() => { load(); }, []);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const onProduct = (id: string) => {
    const numId = Number(id);
    const p = productMap.get(numId);
    setForm((f) => ({ ...f, product_ref: numId, selling_price: p ? String(p.selling_price) : "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = productMap.get(form.product_ref);
    if (!p) return toast.error("Select a product");
    const qty = Number(form.quantity);
    const price = Number(form.selling_price);
    if (!qty || qty <= 0) return toast.error("Quantity must be greater than 0");
    if (!price || price <= 0) return toast.error("Price must be greater than 0");
    if (qty > p.stock_quantity) return toast.error(`Only ${p.stock_quantity} in stock`);
    const total_amount = qty * price;
    const { error } = await supabase.from("sales").insert({ ...form, quantity: qty, selling_price: price, total_amount });
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
                    <Select value={String(form.product_ref || "")} onValueChange={onProduct}>
                      <SelectTrigger>
                        {form.product_ref ? (
                          <span>{productMap.get(form.product_ref)?.name}</span>
                        ) : (
                          <span className="text-muted-foreground">Select product</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)} disabled={p.stock_quantity <= 0}>
                            {p.name} ({p.stock_quantity} left)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min={1} required placeholder="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling Price (৳)</Label>
                      <Input type="number" step="0.01" required placeholder="0" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" required value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} />
                  </div>
                  <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-display font-bold text-lg">৳ {formatBDT((Number(form.quantity) || 0) * (Number(form.selling_price) || 0))}</span>
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
