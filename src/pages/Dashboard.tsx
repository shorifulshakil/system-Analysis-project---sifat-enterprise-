import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { TrendingUp, DollarSign, AlertTriangle, Package, ShoppingBag, Receipt, RotateCcw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { format, startOfDay, startOfWeek, startOfMonth, subDays, parseISO } from "date-fns";
import { formatBDT } from "@/lib/csv";
import type { Product, Sale, Expense, ReturnDamage } from "@/integrations/supabase/types-helper";

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [returns, setReturns] = useState<ReturnDamage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [p, s, e, r] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("sales").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("returns_damages").select("*"),
      ]);
      setProducts((p.data ?? []) as Product[]);
      setSales((s.data ?? []) as Sale[]);
      setExpenses((e.data ?? []) as Expense[]);
      setReturns((r.data ?? []) as ReturnDamage[]);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(new Date());
    const monthStart = startOfMonth(new Date());

    const profitFor = (filter: (d: Date) => boolean) => {
      const sFilt = sales.filter((s) => filter(parseISO(s.sale_date)));
      const eFilt = expenses.filter((x) => filter(parseISO(x.expense_date)));
      const rFilt = returns.filter((x) => filter(parseISO(x.event_date)));
      const totalSales = sFilt.reduce((a, b) => a + Number(b.total_amount), 0);
      const buyingCost = sFilt.reduce((a, b) => {
        const p = productMap.get(b.product_ref);
        return a + Number(p?.buying_price ?? 0) * b.quantity;
      }, 0);
      const totalExp = eFilt.reduce((a, b) => a + Number(b.amount), 0);
      const totalLoss = rFilt.reduce((a, b) => a + Number(b.loss_amount), 0);
      return { totalSales, profit: totalSales - (buyingCost + totalExp + totalLoss), totalExp, totalLoss };
    };

    const daily = profitFor((d) => d >= today);
    const weekly = profitFor((d) => d >= weekStart);
    const monthly = profitFor((d) => d >= monthStart);
    const allTime = profitFor(() => true);
    const lowStock = products.filter((p) => p.stock_quantity <= 5);

    // 7-day trend
    const trend = Array.from({ length: 7 }).map((_, i) => {
      const d = startOfDay(subDays(new Date(), 6 - i));
      const sFilt = sales.filter((s) => startOfDay(parseISO(s.sale_date)).getTime() === d.getTime());
      const totalSales = sFilt.reduce((a, b) => a + Number(b.total_amount), 0);
      return { day: format(d, "EEE"), sales: totalSales };
    });

    // Top sellers
    const topMap = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((s) => {
      const p = productMap.get(s.product_ref);
      if (!p) return;
      const cur = topMap.get(p.id) ?? { name: p.name, qty: 0, revenue: 0 };
      cur.qty += s.quantity;
      cur.revenue += Number(s.total_amount);
      topMap.set(p.id, cur);
    });
    const top = [...topMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

    return { daily, weekly, monthly, allTime, lowStock, trend, top };
  }, [products, sales, expenses, returns]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Overview as of ${format(new Date(), "PPP")}`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Profit" value={`৳ ${formatBDT(stats.daily.profit)}`} icon={TrendingUp} tone="success" hint={`${formatBDT(stats.daily.totalSales)} sales today`} />
        <StatCard label="This Week's Profit" value={`৳ ${formatBDT(stats.weekly.profit)}`} icon={DollarSign} tone="accent" />
        <StatCard label="Monthly Profit" value={`৳ ${formatBDT(stats.monthly.profit)}`} icon={ShoppingBag} tone="default" />
        <StatCard label="Loss (Returns/Damage)" value={`৳ ${formatBDT(stats.allTime.totalLoss)}`} icon={RotateCcw} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Sales (All)" value={`৳ ${formatBDT(stats.allTime.totalSales)}`} icon={ShoppingBag} />
        <StatCard label="Total Expenses" value={`৳ ${formatBDT(stats.allTime.totalExp)}`} icon={Receipt} tone="warning" />
        <StatCard label="Products in Stock" value={String(products.length)} icon={Package} />
        <StatCard label="Low Stock Items" value={String(stats.lowStock.length)} icon={AlertTriangle} tone="warning" hint="≤ 5 units" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2 shadow-soft">
          <h3 className="font-display font-semibold mb-4">Sales — Last 7 Days</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#sg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <h3 className="font-display font-semibold mb-4">Top Selling</h3>
          {stats.top.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.top} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Low Stock Alerts</h3>
          <span className="text-xs text-muted-foreground">{stats.lowStock.length} items</span>
        </div>
        {stats.lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground">All products are well stocked. 🎉</p>
        ) : (
          <div className="space-y-2">
            {stats.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {p.product_id} • {p.category}</p>
                </div>
                <span className="text-sm font-semibold text-warning">{p.stock_quantity} left</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
};

export default Dashboard;
