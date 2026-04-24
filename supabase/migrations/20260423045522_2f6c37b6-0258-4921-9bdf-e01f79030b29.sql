-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  buying_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  supplier_name TEXT,
  product_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_ref UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selling_price NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Returns / Damages table
CREATE TABLE public.returns_damages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_ref UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL CHECK (reason IN ('Return','Damage')),
  loss_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns_damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Authenticated-only policies (single-tenant admin app)
CREATE POLICY "auth read products"   ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write products"  ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete products" ON public.products FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth read sales"   ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write sales"  ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update sales" ON public.sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete sales" ON public.sales FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth read rd"   ON public.returns_damages FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write rd"  ON public.returns_damages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update rd" ON public.returns_damages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete rd" ON public.returns_damages FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth read exp"   ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write exp"  ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update exp" ON public.expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete exp" ON public.expenses FOR DELETE TO authenticated USING (true);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Stock auto-decrement on sale
CREATE OR REPLACE FUNCTION public.handle_sale_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products SET stock_quantity = stock_quantity - NEW.quantity WHERE id = NEW.product_ref;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.products SET stock_quantity = stock_quantity + OLD.quantity WHERE id = OLD.product_ref;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER sales_stock_trigger
AFTER INSERT OR DELETE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.handle_sale_stock();