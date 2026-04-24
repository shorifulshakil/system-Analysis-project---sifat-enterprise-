// Convenience domain types for Shifat Enterprise
export type Product = {
  id: string;
  name: string;
  product_id: string;
  category: string;
  buying_price: number;
  selling_price: number;
  stock_quantity: number;
  supplier_name: string | null;
  product_date: string;
  created_at: string;
  updated_at: string;
};

export type Sale = {
  id: string;
  product_ref: string;
  quantity: number;
  selling_price: number;
  total_amount: number;
  sale_date: string;
  created_at: string;
};

export type ReturnDamage = {
  id: string;
  product_ref: string;
  quantity: number;
  reason: 'Return' | 'Damage';
  loss_amount: number;
  event_date: string;
  created_at: string;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  created_at: string;
};

export type Employee = {
  id: string;
  name: string;
  mobile: string;
  address: string | null;
  nid_number: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  current_salary: number;
  joining_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type SalaryRecord = {
  id: string;
  employee_id: string;
  record_type: 'payment' | 'increment' | 'decrement';
  amount: number;
  record_date: string;
  notes: string | null;
  created_at: string;
};
