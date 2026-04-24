-- Employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT,
  nid_number TEXT,
  date_of_birth DATE,
  photo_url TEXT,
  current_salary NUMERIC NOT NULL DEFAULT 0,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update employees" ON public.employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete employees" ON public.employees FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Salary records: payments, increments, decrements
CREATE TABLE public.salary_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- 'payment' | 'increment' | 'decrement'
  amount NUMERIC NOT NULL DEFAULT 0,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read salary" ON public.salary_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write salary" ON public.salary_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update salary" ON public.salary_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete salary" ON public.salary_records FOR DELETE TO authenticated USING (true);

-- Trigger: when increment/decrement is added, adjust employee's current_salary
CREATE OR REPLACE FUNCTION public.handle_salary_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.record_type = 'increment' THEN
      UPDATE public.employees SET current_salary = current_salary + NEW.amount WHERE id = NEW.employee_id;
    ELSIF NEW.record_type = 'decrement' THEN
      UPDATE public.employees SET current_salary = GREATEST(0, current_salary - NEW.amount) WHERE id = NEW.employee_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.record_type = 'increment' THEN
      UPDATE public.employees SET current_salary = GREATEST(0, current_salary - OLD.amount) WHERE id = OLD.employee_id;
    ELSIF OLD.record_type = 'decrement' THEN
      UPDATE public.employees SET current_salary = current_salary + OLD.amount WHERE id = OLD.employee_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_salary_change
AFTER INSERT OR DELETE ON public.salary_records
FOR EACH ROW EXECUTE FUNCTION public.handle_salary_change();

-- Storage bucket for employee photos
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-photos', 'employee-photos', true);

CREATE POLICY "Public read employee photos" ON storage.objects FOR SELECT USING (bucket_id = 'employee-photos');
CREATE POLICY "Auth upload employee photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'employee-photos');
CREATE POLICY "Auth update employee photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'employee-photos');
CREATE POLICY "Auth delete employee photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'employee-photos');