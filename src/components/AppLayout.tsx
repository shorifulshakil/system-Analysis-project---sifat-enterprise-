import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Tag, ShoppingCart, RotateCcw, Receipt, Users, Wallet, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: Tag },
  { to: "/sales", label: "Sales", icon: ShoppingCart },
  { to: "/returns", label: "Returns & Damage", icon: RotateCcw },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/salary", label: "Salary", icon: Wallet },
];

export const AppLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-sidebar text-sidebar-foreground p-2 rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0 lg:static lg:flex",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-6 pt-8 pb-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-accent flex items-center justify-center font-display font-bold text-accent-foreground shadow-glow">
              S
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none">Shifat</h1>
              <p className="text-xs text-sidebar-foreground/60 mt-1">Enterprise</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut size={16} className="mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-0 p-4 lg:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
