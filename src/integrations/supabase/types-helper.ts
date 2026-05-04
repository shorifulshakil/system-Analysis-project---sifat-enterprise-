// Convenience domain types for Sifat Enterprise
// Uses MySQL INT primary keys (not UUIDs)
export type Category = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export type Product = {
  id: number;
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
  id: number;
  product_ref: number;
  quantity: number;
  selling_price: number;
  total_amount: number;
  sale_date: string;
  created_at: string;
};

export type ReturnDamage = {
  id: number;
  product_ref: number;
  quantity: number;
  reason: 'Return' | 'Damage';
  loss_amount: number;
  event_date: string;
  created_at: string;
};

export type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  created_at: string;
};

export type Employee = {
  id: number;
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
  id: number;
  employee_id: number;
  record_type: 'payment' | 'increment' | 'decrement';
  amount: number;
  record_date: string;
  notes: string | null;
  created_at: string;
};
