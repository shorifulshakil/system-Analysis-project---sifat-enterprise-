-- =====================================================
-- Sifat Enterprise - Final Fixed Schema (No Default Error)
-- =====================================================

CREATE DATABASE IF NOT EXISTS sifat_enterprise 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sifat_enterprise;

-- =====================================================
-- 1. USERS TABLE (FIXED)
-- =====================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,

  `full_name` VARCHAR(150) NOT NULL DEFAULT 'Unknown User',
  `phone_number` VARCHAR(20) NOT NULL DEFAULT '00000000000',

  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,

  `nid_number` VARCHAR(50),
  `date_of_birth` DATE,
  `address` TEXT,

  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'admin',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Admin (WILL NOT FAIL NOW)
INSERT INTO `users`
(`username`, `email`, `password_hash`, `role`)
VALUES
('admin', 'admin@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- =====================================================
-- 2. CATEGORIES
-- =====================================================
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO `categories` (`name`, `description`) VALUES
('Electronics', 'Phones, accessories, gadgets'),
('Groceries', 'Daily food & kitchen essentials'),
('Stationery', 'Office and school supplies'),
('Clothing', 'Apparel for men, women & kids'),
('Home & Kitchen', 'Household and kitchenware'),
('Beauty', 'Personal care & cosmetics'),
('Toys', 'Toys & games');

-- =====================================================
-- 3. PRODUCTS
-- =====================================================
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `product_id` VARCHAR(100) NOT NULL UNIQUE,
  `category` VARCHAR(100) NOT NULL,
  `buying_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `selling_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `supplier_name` VARCHAR(255),
  `product_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. SALES
-- =====================================================
DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_ref` INT NOT NULL,
  `quantity` INT NOT NULL CHECK (`quantity` > 0),
  `selling_price` DECIMAL(12,2) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `sale_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_sales_product` FOREIGN KEY (`product_ref`) 
  REFERENCES `products`(`id`) ON DELETE RESTRICT
);

-- =====================================================
-- 5. RETURNS & DAMAGES
-- =====================================================
DROP TABLE IF EXISTS `returns_damages`;
CREATE TABLE `returns_damages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_ref` INT NOT NULL,
  `quantity` INT NOT NULL CHECK (`quantity` > 0),
  `reason` ENUM('Return', 'Damage') NOT NULL,
  `loss_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `event_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_returns_product` FOREIGN KEY (`product_ref`) 
  REFERENCES `products`(`id`) ON DELETE RESTRICT
);

-- =====================================================
-- 6. EXPENSES
-- =====================================================
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `category` VARCHAR(100) NOT NULL,
  `expense_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. EMPLOYEES
-- =====================================================
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `address` TEXT,
  `nid_number` VARCHAR(50),
  `date_of_birth` DATE,
  `photo_url` VARCHAR(500),
  `current_salary` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `joining_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. SALARY RECORDS
-- =====================================================
DROP TABLE IF EXISTS `salary_records`;
CREATE TABLE `salary_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `record_type` ENUM('payment', 'increment', 'decrement') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `record_date` DATE NOT NULL DEFAULT (CURRENT_DATE),
  `notes` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_salary_employee` FOREIGN KEY (`employee_id`) 
  REFERENCES `employees`(`id`) ON DELETE CASCADE
);

-- =====================================================
-- TRIGGERS
-- =====================================================
DELIMITER //

CREATE TRIGGER `trg_sale_stock_insert`
AFTER INSERT ON `sales`
FOR EACH ROW
BEGIN
  UPDATE `products` 
  SET `stock_quantity` = `stock_quantity` - NEW.quantity 
  WHERE `id` = NEW.product_ref;
END//

CREATE TRIGGER `trg_sale_stock_delete`
AFTER DELETE ON `sales`
FOR EACH ROW
BEGIN
  UPDATE `products` 
  SET `stock_quantity` = `stock_quantity` + OLD.quantity 
  WHERE `id` = OLD.product_ref;
END//

CREATE TRIGGER `trg_salary_insert`
AFTER INSERT ON `salary_records`
FOR EACH ROW
BEGIN
  IF NEW.record_type = 'increment' THEN
    UPDATE `employees` 
    SET `current_salary` = `current_salary` + NEW.amount 
    WHERE `id` = NEW.employee_id;
  ELSEIF NEW.record_type = 'decrement' THEN
    UPDATE `employees` 
    SET `current_salary` = GREATEST(0, `current_salary` - NEW.amount) 
    WHERE `id` = NEW.employee_id;
  END IF;
END//

CREATE TRIGGER `trg_salary_delete`
AFTER DELETE ON `salary_records`
FOR EACH ROW
BEGIN
  IF OLD.record_type = 'increment' THEN
    UPDATE `employees` 
    SET `current_salary` = GREATEST(0, `current_salary` - OLD.amount) 
    WHERE `id` = OLD.employee_id;
  ELSEIF OLD.record_type = 'decrement' THEN
    UPDATE `employees` 
    SET `current_salary` = `current_salary` + OLD.amount 
    WHERE `id` = OLD.employee_id;
  END IF;
END//

DELIMITER ;

-- =====================================================
-- END
-- =====================================================