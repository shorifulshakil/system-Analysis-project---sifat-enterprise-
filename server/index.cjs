const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'sifat-enterprise-secret-key';
const PORT = process.env.API_PORT || 3001;

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sifat_enterprise',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper: run query
const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// ===================== AUTH =====================

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const user = rows[0];
    // $2y$ is PHP bcrypt; replace with $2a$ for bcryptjs compatibility
    const hash = user.password_hash.replace(/^\$2y\$/, '$2a$');
    const valid = await bcrypt.compare(password, hash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      session: {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name || null,
          phone_number: user.phone_number || null,
          nid: user.nid_number || null,
          dob: user.date_of_birth || null,
          address: user.address || null,
        },
      },
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name, phone_number, nid, dob, address } = req.body;
    if (!email || !password || !full_name || !phone_number || !nid || !dob || !address) {
      return res.status(400).json({ error: 'Email, password, full name, phone number, NID, date of birth, and address are required' });
    }
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const username = email.split('@')[0];
    await query(
      'INSERT INTO users (username, email, full_name, phone_number, password_hash, role, nid_number, date_of_birth, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, email, full_name, phone_number, hash, 'admin', nid, dob, address],
    );
    res.json({ message: 'Account created' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/session', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Password reset endpoint (for development only)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const hash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===================== CATEGORIES =====================

app.get('/api/categories', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM categories ORDER BY name');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
    res.json({ data: { id: result.insertId, name, description } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    await query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description, req.params.id]);
    res.json({ data: { id: req.params.id, name, description } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ data: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== PRODUCTS =====================

app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const { name, product_id, category, buying_price, selling_price, stock_quantity, supplier_name, product_date } = req.body;
    const result = await query(
      'INSERT INTO products (name, product_id, category, buying_price, selling_price, stock_quantity, supplier_name, product_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, product_id, category, buying_price, selling_price, stock_quantity, supplier_name || null, product_date]
    );
    res.json({ data: { id: result.insertId, ...req.body } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { name, product_id, category, buying_price, selling_price, stock_quantity, supplier_name, product_date } = req.body;
    await query(
      'UPDATE products SET name = ?, product_id = ?, category = ?, buying_price = ?, selling_price = ?, stock_quantity = ?, supplier_name = ?, product_date = ? WHERE id = ?',
      [name, product_id, category, buying_price, selling_price, stock_quantity, supplier_name || null, product_date, req.params.id]
    );
    res.json({ data: { id: req.params.id, ...req.body } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ data: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== SALES =====================

app.get('/api/sales', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM sales ORDER BY sale_date DESC, created_at DESC');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales', authMiddleware, async (req, res) => {
  try {
    const { product_ref, quantity, selling_price, total_amount, sale_date } = req.body;
    const result = await query(
      'INSERT INTO sales (product_ref, quantity, selling_price, total_amount, sale_date) VALUES (?, ?, ?, ?, ?)',
      [product_ref, quantity, selling_price, total_amount, sale_date || new Date().toISOString().slice(0, 10)]
    );
    res.json({ data: { id: result.insertId, ...req.body } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sales/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM sales WHERE id = ?', [req.params.id]);
    res.json({ data: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== RETURNS / DAMAGES =====================

app.get('/api/returns', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM returns_damages ORDER BY event_date DESC, created_at DESC');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/returns', authMiddleware, async (req, res) => {
  try {
    const { product_ref, quantity, reason, loss_amount, event_date } = req.body;
    const result = await query(
      'INSERT INTO returns_damages (product_ref, quantity, reason, loss_amount, event_date) VALUES (?, ?, ?, ?, ?)',
      [product_ref, quantity, reason, loss_amount || 0, event_date || new Date().toISOString().slice(0, 10)]
    );
    res.json({ data: { id: result.insertId, ...req.body } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/returns/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM returns_damages WHERE id = ?', [req.params.id]);
    res.json({ data: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== EXPENSES =====================

app.get('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', authMiddleware, async (req, res) => {
  try {
    const { title, amount, category, expense_date } = req.body;
    const result = await query(
      'INSERT INTO expenses (title, amount, category, expense_date) VALUES (?, ?, ?, ?)',
      [title, amount, category, expense_date || new Date().toISOString().slice(0, 10)]
    );
    res.json({ data: { id: result.insertId, ...req.body } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ data: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== EMPLOYEES =====================

app.get('/api/employees', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', authMiddleware, async (req, res) => {
  try {
    const { name, mobile, address, nid_number, date_of_birth, photo_url, current_salary, joining_date, status } = req.body;
    const result = await query(
      'INSERT INTO employees (name, mobile, address, nid_number, date_of_birth, photo_url, current_salary, joining_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, mobile, address || null, nid_number || null, date_of_birth || null, photo_url || null, current_salary || 0, joining_date || new Date().toISOString().slice(0, 10), status || 'active']
    );
    res.json({ data: { id: result.insertId, ...req.body } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', authMiddleware, async (req, res) => {
  try {
    const { name, mobile, address, nid_number, date_of_birth, photo_url, current_salary, joining_date, status } = req.body;
    await query(
      'UPDATE employees SET name = ?, mobile = ?, address = ?, nid_number = ?, date_of_birth = ?, photo_url = ?, current_salary = ?, joining_date = ?, status = ? WHERE id = ?',
      [name, mobile, address || null, nid_number || null, date_of_birth || null, photo_url || null, current_salary || 0, joining_date || new Date().toISOString().slice(0, 10), status || 'active', req.params.id]
    );
    res.json({ data: { id: req.params.id, ...req.body } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ data: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== SALARY RECORDS =====================

app.get('/api/salary-records', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM salary_records ORDER BY record_date DESC, created_at DESC');
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/salary-records', authMiddleware, async (req, res) => {
  try {
    const { employee_id, record_type, amount, record_date, notes } = req.body;
    const salaryAmount = Number(amount);
    if (!employee_id || !record_type || !salaryAmount || salaryAmount <= 0) {
      return res.status(400).json({ error: 'Employee, type and a valid amount are required' });
    }
    const result = await query(
      'INSERT INTO salary_records (employee_id, record_type, amount, record_date, notes) VALUES (?, ?, ?, ?, ?)',
      [employee_id, record_type, salaryAmount, record_date || new Date().toISOString().slice(0, 10), notes || null]
    );
    if (record_type === 'increment') {
      await query('UPDATE employees SET current_salary = current_salary + ? WHERE id = ?', [salaryAmount, employee_id]);
    } else if (record_type === 'decrement') {
      await query('UPDATE employees SET current_salary = GREATEST(current_salary - ?, 0) WHERE id = ?', [salaryAmount, employee_id]);
    }
    res.json({ data: { id: result.insertId, ...req.body, amount: salaryAmount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/salary-records/:id', authMiddleware, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM salary_records WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Salary record not found' });
    const record = rows[0];
    if (record.record_type === 'increment') {
      await query('UPDATE employees SET current_salary = GREATEST(current_salary - ?, 0) WHERE id = ?', [record.amount, record.employee_id]);
    } else if (record.record_type === 'decrement') {
      await query('UPDATE employees SET current_salary = current_salary + ? WHERE id = ?', [record.amount, record.employee_id]);
    }
    await query('DELETE FROM salary_records WHERE id = ?', [req.params.id]);
    res.json({ data: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== STATIC FILES =====================

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// ===================== HEALTH CHECK =====================

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ===================== FILE UPLOADS =====================

app.post('/api/upload', authMiddleware, async (req, res) => {
  try {
    const { file, filename } = req.body; // base64 file
    if (!file || !filename) return res.status(400).json({ error: 'Missing file or filename' });
    const buffer = Buffer.from(file.split(',')[1] || file, 'base64');
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);
    const publicUrl = `/uploads/${filename}`;
    res.json({ data: { publicUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== START =====================

app.listen(PORT, () => {
  console.log(`Sifat Enterprise API running on http://localhost:${PORT}`);
});
