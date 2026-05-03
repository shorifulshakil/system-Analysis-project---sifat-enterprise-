# Sifat Enterprise

A complete business management system built with React, TypeScript, Tailwind CSS, and shadcn/ui. This application helps manage products, sales, returns, expenses, employees, and salary records for small-to-medium enterprises.

---

## Database Name

**`sifat_enterprise`**

---

## XAMPP / MySQL Setup

### Step 1: Create the Database
1. Open **phpMyAdmin** (http://localhost/phpmyadmin)
2. Click **New** to create a database
3. Enter database name: `sifat_enterprise`
4. Select **utf8mb4_unicode_ci** as collation
5. Click **Create**

### Step 2: Import the SQL File
1. Select the `sifat_enterprise` database
2. Click the **Import** tab
3. Choose the file: `database.sql` (located in the project root)
4. Click **Go** to import

### Step 3: Default Admin Login
After importing, create your own account or use the login credentials you configured in the database.

---

## Database Schema Overview

| Table | Description |
|-------|-------------|
| `users` | Admin authentication (local auth for XAMPP) |
| `categories` | Product categories (7 default categories included) |
| `products` | Product inventory with stock tracking |
| `sales` | Sales records linked to products |
| `returns_damages` | Product returns and damage records |
| `expenses` | Business expense tracking |
| `employees` | Employee profiles and salary info |
| `salary_records` | Salary payments, increments, and decrements |

### Triggers Included
- **Stock Auto-Decrement**: When a sale is added, product stock decreases automatically
- **Stock Auto-Increment**: When a sale is deleted, product stock is restored
- **Salary Auto-Adjust**: When salary increment/decrement is added, employee's current salary updates automatically
- **Salary Revert**: When salary record is deleted, employee's salary is reverted

---

## Running the Application

### 1. Start the Backend API Server
```bash
npm run server
```
The API will run on `http://localhost:3001`

### 2. Start the Frontend (in a new terminal)
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

### Or run both together
```bash
npm run dev:full
```
*(Requires `concurrently` to be installed: `npm install -g concurrently`)*

---

## Frontend Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or bun
- XAMPP / MySQL running locally

### Install Dependencies
```bash
npm install
```

### Build for Production
```bash
npm run build
```

---

## Project Structure

```
sifat-enterprise/
├── database.sql          # MySQL database schema for XAMPP
├── server/
│   └── index.cjs         # Express.js backend API
├── src/
│   ├── pages/            # Main pages (Dashboard, Products, Sales, etc.)
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── integrations/     # API client (now connects to local backend)
├── supabase/
│   ├── migrations/       # PostgreSQL migrations (legacy)
│   └── functions/        # Edge functions (legacy)
└── public/             # Static assets
```

---

## Features

- **Dashboard** - Overview with stats and charts
- **Products** - Add, edit, delete products with stock management
- **Categories** - Manage product categories
- **Sales** - Record sales with automatic stock deduction
- **Returns & Damages** - Track returned or damaged items
- **Expenses** - Record and categorize business expenses
- **Employees** - Manage employee profiles
- **Salary** - Handle salary payments, increments, and decrements
- **Authentication** - Secure login system with JWT

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Express.js, Node.js
- **Database:** MySQL (via XAMPP / phpMyAdmin)
- **Styling:** Tailwind CSS, shadcn/ui components
- **Charts:** Recharts
- **Icons:** Lucide React

---

## License

This project is built for Sifat Enterprise business use.
