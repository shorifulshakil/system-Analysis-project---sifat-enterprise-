-- Insert test products for Sifat Enterprise
INSERT INTO `products` (`name`, `product_id`, `category`, `buying_price`, `selling_price`, `stock_quantity`, `supplier_name`, `product_date`)
VALUES
('iPhone 15 Pro', 'PROD-001', 'Electronics', 800.00, 1200.00, 15, 'Apple Distributor', CURDATE()),
('Samsung Galaxy S24', 'PROD-002', 'Electronics', 700.00, 1100.00, 20, 'Samsung Distributor', CURDATE()),
('Dell Laptop', 'PROD-003', 'Electronics', 600.00, 950.00, 8, 'Dell Distributor', CURDATE()),
('Basmati Rice (5kg)', 'PROD-004', 'Groceries', 150.00, 200.00, 50, 'Local Farm', CURDATE()),
('Organic Wheat Flour (2kg)', 'PROD-005', 'Groceries', 60.00, 90.00, 40, 'Local Mill', CURDATE()),
('Notebook A4 (100 pages)', 'PROD-006', 'Stationery', 25.00, 50.00, 100, 'Local Stationery', CURDATE()),
('Ballpoint Pen (Set of 10)', 'PROD-007', 'Stationery', 40.00, 80.00, 75, 'Local Stationery', CURDATE()),
('Cotton T-Shirt', 'PROD-008', 'Clothing', 200.00, 400.00, 30, 'Fashion House', CURDATE()),
('Jeans Pants', 'PROD-009', 'Clothing', 400.00, 700.00, 25, 'Fashion House', CURDATE()),
('Stainless Steel Pot (3L)', 'PROD-010', 'Home & Kitchen', 500.00, 850.00, 18, 'Kitchen Supplies Ltd', CURDATE()),
('Non-stick Frying Pan', 'PROD-011', 'Home & Kitchen', 350.00, 600.00, 22, 'Kitchen Supplies Ltd', CURDATE()),
('Face Moisturizer Cream', 'PROD-012', 'Beauty', 150.00, 300.00, 35, 'Beauty Store', CURDATE()),
('Shampoo Bottle (500ml)', 'PROD-013', 'Beauty', 100.00, 200.00, 45, 'Beauty Store', CURDATE()),
('Building Blocks Toy', 'PROD-014', 'Toys', 300.00, 500.00, 12, 'Toy World', CURDATE()),
('Remote Control Car', 'PROD-015', 'Toys', 1000.00, 1500.00, 5, 'Toy World', CURDATE());
