import { useEffect, useMemo, useState } from "react";
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
import { Plus, Trash2, Search, TrendingUp, TrendingDown, Banknote, Download, Wallet } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV, formatBDT } from "@/lib/csv";
import type { Employee, SalaryRecord } from "@/integrations/supabase/types-helper";

type SalaryForm = {
  employee_id: string;
  record_type: "payment" | "increment" | "decrement";
  amount: number;
  record_date: string;
  notes: string;
};
const emptyForm: SalaryForm = {
  employee_id: "",
  record_type: "payment",
  amount: 0,
  record_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

const Salary = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SalaryForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [empFilter, setEmpFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const load = async () => {
    const [{ data: emps }, { data: recs }] = await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("salary_records").select("*").order("record_date", { ascending: false }),
    ]);
    setEmployees((emps ?? []) as Employee[]);
    setRecords((recs ?? []) as SalaryRecord[]);
  };
  useEffect(() => { load(); }, []);

  const empMap = useMemo(() => {
    const m = new Map<string, Employee>();
    employees.forEach((e) => m.set(e.id, e));
    return m;
  }, [employees]);

  const openNew = (employeeId?: string) => {
    setForm({ ...emptyForm, employee_id: employeeId ?? "" });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) return toast.error("Select an employee");
    const { error } = await supabase.from("salary_records").insert({
      employee_id: form.employee_id,
      record_type: form.record_type,
      amount: form.amount,
      record_date: form.record_date,
      notes: form.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Salary record saved");
    setOpen(false);
    load();
  };

  const remove = async (r: SalaryRecord) => {
    if (!confirm("Delete this record? Employee salary will be re-adjusted.")) return;
    const { error } = await supabase.from("salary_records").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const filtered = records.filter((r) => {
    const emp = empMap.get(r.employee_id);
    const okSearch = !search || (emp?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const okEmp = empFilter === "all" || r.employee_id === empFilter;
    const okType = typeFilter === "all" || r.record_type === typeFilter;
    return okSearch && okEmp && okType;
  });

  const totals = filtered.reduce(
    (acc, r) => {
      if (r.record_type === "payment") acc.paid += Number(r.amount);
      else if (r.record_type === "increment") acc.inc += Number(r.amount);
      else acc.dec += Number(r.amount);
      return acc;
    },
    { paid: 0, inc: 0, dec: 0 }
  );

  const exportRows = filtered.map((r) => ({
    date: r.record_date,
    employee: empMap.get(r.employee_id)?.name ?? "",
    type: r.record_type,
    amount: r.amount,
    notes: r.notes ?? "",
  }));

  return (
    <>
      <PageHeader
        title="Salary"
        description="Pay salaries, manage increments and decrements"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV(exportRows, "salary-records")}>
              <Download size={16} className="mr-2" /> Export
            </Button>
            <Button onClick={() => openNew()} className="bg-gradient-primary">
              <Plus size={16} className="mr-2" /> New Record
            </Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Banknote size={12} /> Total Paid</div>
          <div className="font-display font-bold text-xl">৳ {formatBDT(totals.paid)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp size={12} className="text-primary" /> Increments</div>
          <div className="font-display font-bold text-xl">৳ {formatBDT(totals.inc)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown size={12} className="text-destructive" /> Decrements</div>
          <div className="font-display font-bold text-xl">৳ {formatBDT(totals.dec)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Wallet size={12} /> Records</div>
          <div className="font-display font-bold text-xl">{filtered.length}</div>
        </Card>
      </div>

      {/* Employee quick view: current salary per employee */}
      <Card className="shadow-soft mb-4 overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-display font-semibold">Current Salary by Employee</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="text-right">Current Salary</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No employees yet</TableCell></TableRow>
              ) : employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={e.photo_url ?? undefined} />
                        <AvatarFallback>{e.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{e.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{e.mobile}</TableCell>
                  <TableCell className="text-right font-semibold">৳ {formatBDT(Number(e.current_salary))}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openNew(e.id)}>
                      <Plus size={14} className="mr-1" /> Record
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 shadow-soft mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by employee name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={empFilter} onValueChange={setEmpFilter}>
          <SelectTrigger><SelectValue placeholder="All employees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="increment">Increment</SelectItem>
            <SelectItem value="decrement">Decrement</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Records table */}
      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>
              ) : filtered.map((r) => {
                const emp = empMap.get(r.employee_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.record_date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={emp?.photo_url ?? undefined} />
                          <AvatarFallback>{emp?.name.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{emp?.name ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded capitalize ${
                        r.record_type === "payment" ? "bg-secondary"
                        : r.record_type === "increment" ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                      }`}>{r.record_type}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">৳ {formatBDT(Number(r.amount))}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.notes ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* New record dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Salary Record</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} — ৳ {formatBDT(Number(e.current_salary))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.record_type}
                  onValueChange={(v) => setForm({ ...form, record_type: v as SalaryForm["record_type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">Pay Salary</SelectItem>
                    <SelectItem value="increment">Increment</SelectItem>
                    <SelectItem value="decrement">Decrement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (৳)</Label>
                <Input type="number" step="0.01" required value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" required value={form.record_date}
                onChange={(e) => setForm({ ...form, record_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">
              {form.record_type === "payment"
                ? "Records a salary payment (does not change current salary)."
                : form.record_type === "increment"
                ? "Increases the employee's current salary by this amount."
                : "Decreases the employee's current salary by this amount."}
            </p>
            <Button type="submit" className="w-full bg-gradient-primary">Save record</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Salary;
