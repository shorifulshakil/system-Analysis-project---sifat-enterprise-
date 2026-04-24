CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth write categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update categories" ON public.categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete categories" ON public.categories FOR DELETE TO authenticated USING (true);

INSERT INTO public.categories (name, description) VALUES
  ('Electronics', 'Phones, accessories, gadgets'),
  ('Groceries', 'Daily food & kitchen essentials'),
  ('Stationery', 'Office and school supplies'),
  ('Clothing', 'Apparel for men, women & kids'),
  ('Home & Kitchen', 'Household and kitchenware'),
  ('Beauty', 'Personal care & cosmetics'),
  ('Toys', 'Toys & games')
ON CONFLICT (name) DO NOTHING;