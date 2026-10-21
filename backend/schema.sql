-- Gym Management System - MySQL Schema
CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

-- 2.1 users (staff login only)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'receptionist') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 members (no login)
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address VARCHAR(255),
    emergency_contact_name VARCHAR(120),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    join_date DATE DEFAULT (CURRENT_DATE),
    status ENUM('active', 'frozen', 'expired', 'cancelled') DEFAULT 'active',
    registered_by INT,
    CONSTRAINT fk_members_registered_by FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 2.3 trainers (no login)
CREATE TABLE IF NOT EXISTS trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(150),
    specialization VARCHAR(120),
    certification VARCHAR(255),
    hire_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2.4 memberships
CREATE TABLE IF NOT EXISTS memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'frozen', 'cancelled') NOT NULL DEFAULT 'active',
    frozen_from DATE NULL,
    frozen_until DATE NULL,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memberships_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_memberships_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 2.5 payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    membership_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method ENUM('cash', 'card', 'mobile_money', 'bank_transfer') NOT NULL,
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    received_by INT NOT NULL,
    CONSTRAINT fk_payments_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_membership FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_received_by FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 2.6 classes (class types)
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    trainer_id INT,
    duration_minutes INT NOT NULL,
    CONSTRAINT fk_classes_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- 2.7 class_sessions (timetable)
CREATE TABLE IF NOT EXISTS class_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    day_of_week TINYINT NOT NULL, -- 1=Monday, 2=Tuesday, ..., 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_sessions_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- 2.8 attendance (gym check-ins)
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    check_in_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_time DATETIME NULL,
    checked_in_by INT,
    CONSTRAINT fk_attendance_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendance_checked_in_by FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 2.9 products
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_qty INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 5,
    image_url VARCHAR(500) NULL,
    category VARCHAR(100) DEFAULT 'Equipment & Gear',
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
-- Migration statement for existing installations:
-- ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL;
-- ALTER TABLE products ADD COLUMN category VARCHAR(100) DEFAULT 'Equipment & Gear';
-- ALTER TABLE products ADD COLUMN description TEXT NULL;


-- 2.9 product_sales
CREATE TABLE IF NOT EXISTS product_sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    member_id INT NULL,
    quantity INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    sold_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sold_by INT NOT NULL,
    CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    CONSTRAINT fk_sales_sold_by FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE RESTRICT
);
