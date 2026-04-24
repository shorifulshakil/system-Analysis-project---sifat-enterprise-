import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Copy, Check, LogIn, LayoutDashboard, Package, Tag, X,
  ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Truck,
} from "lucide-react";
import { toast } from "sonner";
import { formatBDT } from "@/lib/csv";
import type { Product } from "@/integrations/supabase/types-helper";

// Deterministic color from string for product placeholder art
const palette = [
  ["#1e3a8a", "#3b82f6"], ["#0f766e", "#14b8a6"], ["#7c2d12", "#f97316"],
  ["#581c87", "#a855f7"], ["#831843", "#ec4899"], ["#064e3b", "#10b981"],
  ["#0c4a6e", "#0ea5e9"], ["#713f12", "#eab308"],
];
const colorFor = (s: string) => {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};
const initialsOf = (s: string) =>
  s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "P";

const ProductArt = ({ name, className = "" }: { name: string; className?: string }) => {
  const [a, b] = colorFor(name);
  return (
    <div
      className={`relative flex items-center justify-center font-display font-bold text-white overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      <span className="text-5xl tracking-tight drop-shadow-sm">{initialsOf(name)}</span>
      <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
    </div>
  );
};

// Hero slides
const slides = [
  {
    eyebrow: "Live product catalogue",
    title: "Discover every product in our shop — instantly.",
    subtitle: "Browse hundreds of items, search by name or unique product ID, and view full details in one tap.",
    icon: ShoppingBag,
    gradient: "linear-gradient(135deg, hsl(222 56% 16%), hsl(215 55% 32%))",
  },
  {
    eyebrow: "Fresh arrivals",
    title: "Brand new stock added every week.",
    subtitle: "From electronics to groceries — explore the latest items added to our inventory.",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, hsl(213 60% 30%), hsl(199 89% 48%))",
  },
  {
    eyebrow: "Reliable supply",
    title: "Trusted by dealers across Bangladesh.",
    subtitle: "Real-time stock visibility, transparent pricing, and quick reference IDs for easy ordering.",
    icon: Truck,
    gradient: "linear-gradient(135deg, hsl(222 50% 18%), hsl(213 60% 50%))",
  },
];

const Home = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>("All");
  const [active, setActive] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      else setItems((data ?? []) as Product[]);
      setLoading(false);
    })();
  }, []);

  // Auto-rotate slides every 5s; pause when tab hidden
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) setSlide((s) => (s + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Focus search input when opened, scroll to results
  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [searchOpen]);

  // Close search on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((p) => p.category))).sort()],
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.product_id.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [items, search, category]);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast.success("Product ID copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  const goToResults = () => {
    document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-accent flex items-center justify-center font-display font-bold text-accent-foreground shadow-glow">
              S
            </div>
            <div className="leading-tight hidden sm:block">
              <div className="font-display font-bold text-base">Shifat Enterprise</div>
              <div className="text-[11px] text-muted-foreground">Inventory & Sales</div>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {/* Expanding search */}
            <div className="flex items-center">
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  searchOpen ? "w-56 sm:w-72 mr-1 opacity-100" : "w-0 mr-0 opacity-0"
                }`}
              >
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") goToResults();
                    }}
                    placeholder="Search by name or product ID…"
                    className="h-9 pl-9 pr-3 text-sm"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (searchOpen && search) goToResults();
                  setSearchOpen((o) => !o);
                }}
                aria-label={searchOpen ? "Close search" : "Open search"}
                className="shrink-0"
              >
                {searchOpen ? <X size={18} /> : <Search size={18} />}
              </Button>
            </div>

            {user ? (
              <Button asChild size="sm" className="bg-gradient-primary">
                <Link to="/dashboard">
                  <LayoutDashboard size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-gradient-primary">
                <Link to="/auth">
                  <LogIn size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">Admin Login</span>
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero slider */}
      <section className="relative overflow-hidden">
        <div className="relative h-[420px] sm:h-[460px] lg:h-[500px]">
          {slides.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  i === slide ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                style={{ background: s.gradient }}
                aria-hidden={i !== slide}
              >
                {/* Decorative shapes */}
                <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
                <div className="absolute -left-24 -bottom-32 h-80 w-80 rounded-full bg-white/5" />
                <div className="absolute right-1/4 bottom-1/4 h-40 w-40 rounded-full bg-white/[0.04] blur-2xl" />

                <div className="relative container mx-auto h-full flex items-center px-4">
                  <div className="max-w-3xl text-primary-foreground">
                    <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full mb-5">
                      <Icon size={14} />
                      <span className="text-xs font-medium tracking-wide">{s.eyebrow}</span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.15]">
                      {s.title}
                    </h1>
                    <p className="text-primary-foreground/80 mt-4 text-base lg:text-lg max-w-2xl">
                      {s.subtitle}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={goToResults}
                        className="font-semibold"
                      >
                        Browse products
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setSearchOpen(true)}
                        className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
                      >
                        <Search size={16} className="mr-2" /> Search
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Prev / Next controls */}
          <button
            onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur transition"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setSlide((s) => (s + 1) % slides.length)}
            aria-label="Next slide"
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur transition"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Catalogue */}
      <section id="catalogue" className="container mx-auto px-4 py-10 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold">All Products</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {loading
                ? "Loading…"
                : search
                ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for “${search}”`
                : `${filtered.length} of ${items.length} items`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                  category === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No products match your search.</p>
            {(search || category !== "All") && (
              <Button
                variant="link"
                onClick={() => { setSearch(""); setCategory("All"); }}
                className="mt-1"
              >
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className="text-left group"
              >
                <Card className="overflow-hidden shadow-soft hover:shadow-elegant transition-all duration-300 group-hover:-translate-y-1">
                  <ProductArt name={p.name} className="aspect-square w-full" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-semibold text-foreground line-clamp-1">{p.name}</h3>
                      {p.stock_quantity > 0 ? (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">In stock</Badge>
                      ) : (
                        <Badge variant="destructive" className="shrink-0 text-[10px]">Out</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Tag size={11} /> <span className="truncate">{p.category}</span>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                      <div className="font-display text-lg font-bold text-foreground">
                        ৳ {formatBDT(Number(p.selling_price))}
                      </div>
                      <code className="text-[10px] text-muted-foreground font-mono">#{p.product_id}</code>
                    </div>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Detail modal */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {active && (
            <div className="grid md:grid-cols-2">
              <ProductArt name={active.name} className="aspect-square md:aspect-auto md:min-h-[420px]" />
              <div className="p-6 flex flex-col">
                <DialogHeader className="text-left">
                  <Badge variant="secondary" className="w-fit mb-2 text-[10px]">{active.category}</Badge>
                  <DialogTitle className="font-display text-2xl">{active.name}</DialogTitle>
                </DialogHeader>

                <div className="font-display text-3xl font-bold text-foreground mt-3">
                  ৳ {formatBDT(Number(active.selling_price))}
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Stock</span>
                    <span className={`font-semibold ${active.stock_quantity <= 5 ? "text-warning" : "text-foreground"}`}>
                      {active.stock_quantity > 0 ? `${active.stock_quantity} available` : "Out of stock"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Supplier</span>
                    <span className="text-foreground">{active.supplier_name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Listed on</span>
                    <span className="text-foreground">{new Date(active.product_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-xs text-muted-foreground mb-1.5 font-medium">Product ID</div>
                  <div className="flex items-center gap-2 bg-muted/60 rounded-lg p-2 pl-3">
                    <code className="flex-1 font-mono text-sm text-foreground truncate">{active.product_id}</code>
                    <Button size="sm" variant="secondary" onClick={() => copyId(active.product_id)}>
                      {copied ? <Check size={14} className="mr-1.5 text-success" /> : <Copy size={14} className="mr-1.5" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-border mt-10">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Shifat Enterprise. All rights reserved.</div>
          <div>Built for dealers & shop owners.</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
