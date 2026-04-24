import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, formatBDT } from "@/lib/csv";
import type { Expense } from "@/integrations/supabase/types-helper";

type Form = Omit<Expense, "id" | "created_at">;
const empty: Form = { title: "", amount: 0, category: "General", expense_date: new Date().toISOString().slice(0, 10) };

const Expenses = () => {
  const [items, setItems] = useState<Expense[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const load = async () => {
    const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    setItems((data ?? []) as Expense[]);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("expenses").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Expense added"); setOpen(false); setForm(empty); load();
  };

  const remove = async (x: Expense) => {
    if (!confirm("Delete this expense?")) return;
    const { error } = await supabase.from("expenses").delete().eq("id", x.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const filtered = items.filter((x) => {
    const okSearch = !search || [x.title, x.category].some((v) => v.toLowerCase().includes(search.toLowerCase()));
    const okDate = !dateFilter || x.expense_date === dateFilter;
    return okSearch && okDate;
  });

  const total = filtered.reduce((a, b) => a + Number(b.amount), 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Track business operating costs"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV(filtered, "expenses")}>
              <Download size={16} className="mr-2" /> Export
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary"><Plus size={16} className="mr-2" /> New Expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount (৳)</Label>
                      <Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" required value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary">Save</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card className="p-4 shadow-soft mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search title or category..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        <div className="text-right text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-display font-bold text-lg">৳ {formatBDT(total)}</span>
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No expenses</TableCell></TableRow>
              ) : filtered.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="text-sm">{x.expense_date}</TableCell>
                  <TableCell className="font-medium">{x.title}</TableCell>
                  <TableCell><span className="text-xs px-2 py-1 rounded bg-secondary">{x.category}</span></TableCell>
                  <TableCell className="text-right font-semibold">৳ {formatBDT(Number(x.amount))}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove(x)}><Trash2 size={14} className="text-destructive" /></Button>
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

export default Expenses;
