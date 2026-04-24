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
import type { Product, ReturnDamage } from "@/integrations/supabase/types-helper";

type Form = { product_ref: string; quantity: number; reason: 'Return' | 'Damage'; loss_amount: number; event_date: string };
const empty: Form = { product_ref: "", quantity: 1, reason: "Return", loss_amount: 0, event_date: new Date().toISOString().slice(0, 10) };

const Returns = () => {
  const [items, setItems] = useState<ReturnDamage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const load = async () => {
    const [r, p] = await Promise.all([
      supabase.from("returns_damages").select("*").order("event_date", { ascending: false }),
      supabase.from("products").select("*").order("name"),
    ]);
    setItems((r.data ?? []) as ReturnDamage[]);
    setProducts((p.data ?? []) as Product[]);
  };
  useEffect(() => { load(); }, []);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const onProduct = (id: string) => {
    const p = productMap.get(id);
    setForm((f) => ({ ...f, product_ref: id, loss_amount: p ? Number(p.buying_price) * f.quantity : 0 }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_ref) return toast.error("Select a product");
    const { error } = await supabase.from("returns_damages").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Recorded"); setOpen(false); setForm(empty); load();
  };

  const remove = async (r: ReturnDamage) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("returns_damages").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const filtered = items.filter((r) => {
    const p = productMap.get(r.product_ref);
    const okSearch = !search || (p?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const okDate = !dateFilter || r.event_date === dateFilter;
    return okSearch && okDate;
  });

  const exportRows = filtered.map((r) => ({
    date: r.event_date,
    product: productMap.get(r.product_ref)?.name ?? "",
    quantity: r.quantity,
    reason: r.reason,
    loss: Number(r.loss_amount),
  }));

  return (
    <>
      <PageHeader
        title="Returns & Damage"
        description="Track losses from returns and damaged stock"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV(exportRows, "returns_damage")}>
              <Download size={16} className="mr-2" /> Export
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary"><Plus size={16} className="mr-2" /> New Entry</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Return / Damage</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select value={form.product_ref} onValueChange={onProduct}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min={1} required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v as 'Return' | 'Damage' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Return">Return</SelectItem>
                          <SelectItem value="Damage">Damage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Loss Amount (৳)</Label>
                    <Input type="number" step="0.01" required value={form.loss_amount} onChange={(e) => setForm({ ...form, loss_amount: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary">Save</Button>
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
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Loss</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.event_date}</TableCell>
                  <TableCell className="font-medium">{productMap.get(r.product_ref)?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">{r.quantity}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${r.reason === 'Damage' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                      {r.reason}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-destructive">৳ {formatBDT(Number(r.loss_amount))}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove(r)}><Trash2 size={14} className="text-destructive" /></Button>
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

export default Returns;
