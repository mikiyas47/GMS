-- Gym Management System - Seed Data
USE gym_management;

-- Insert Staff Users (Admin & Receptionist)
-- Password for admin@gym.com: Admin@123
-- Password for reception@gym.com: Reception@123
INSERT INTO users (id, full_name, email, password_hash, role, is_active) VALUES
(1, 'System Administrator', 'admin@gym.com', '$2b$10$x8r/UXb6bDexdSTLuTLpZexli9WgMT4txcx6hjwG6cENRixNq29K2', 'admin', TRUE),
(2, 'Sarah Jenkins', 'reception@gym.com', '$2b$10$vjrNqPrGjAumO4bgWUWD5e6hs8VZlTmJl6fHRy4nIneq5SfzgMvYm', 'receptionist', TRUE)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- Insert Trainers
INSERT INTO trainers (id, first_name, last_name, phone, email, specialization, certification, hire_date, is_active) VALUES
(1, 'Marcus', 'Stone', '+1-555-0101', 'marcus.stone@gym.com', 'CrossFit & Strength', 'CSCS Certified, Level 3 Trainer', '2023-01-15', TRUE),
(2, 'Elena', 'Rostova', '+1-555-0102', 'elena.rostova@gym.com', 'Yoga & Pilates', 'RYT-500 Master Instructor', '2023-03-20', TRUE),
(3, 'David', 'Kim', '+1-555-0103', 'david.kim@gym.com', 'Boxing & HIIT', 'Golden Gloves Certified Coach', '2023-06-01', TRUE)
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name);

-- Insert Members
INSERT INTO members (id, first_name, last_name, phone, email, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, notes, join_date, status, registered_by) VALUES
(1, 'Alex', 'Morgan', '+1-555-0201', 'alex.m@example.com', '1992-05-14', 'female', '742 Evergreen Terrace', 'Chris Morgan', '+1-555-0991', 'Prefers morning workouts', '2024-01-10', 'active', 1),
(2, 'Michael', 'Scott', '+1-555-0202', 'm.scott@example.com', '1985-03-15', 'male', '1725 Slough Avenue', 'Dwight Schrute', '+1-555-0992', 'Knee sensitivity, low impact cardio only', '2024-02-01', 'active', 2),
(3, 'Jessica', 'Alba', '+1-555-0203', 'jessica@example.com', '1995-08-22', 'female', '404 Ocean Drive', 'Cash Warren', '+1-555-0993', 'No specific health conditions', '2023-11-05', 'expired', 1),
(4, 'Robert', 'Downey', '+1-555-0204', 'robert.d@example.com', '1975-04-04', 'male', '10880 Malibu Point', 'Susan Downey', '+1-555-0994', 'Currently travelling, temporary freeze', '2024-01-15', 'frozen', 2)
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name);

-- Insert Memberships
INSERT INTO memberships (id, member_id, plan_name, price, start_date, end_date, status, frozen_from, frozen_until, created_by) VALUES
(1, 1, 'Annual Premium', 599.00, '2024-01-10', '2027-01-10', 'active', NULL, NULL, 1),
(2, 2, 'Monthly Standard', 59.00, '2026-10-01', '2026-11-01', 'active', NULL, NULL, 2),
(3, 3, 'Monthly Standard', 59.00, '2024-01-01', '2024-02-01', 'expired', NULL, NULL, 1),
(4, 4, 'Annual Premium', 599.00, '2024-01-15', '2027-01-15', 'frozen', '2026-10-05', NULL, 2)
ON DUPLICATE KEY UPDATE plan_name=VALUES(plan_name);

-- Insert Payments
INSERT INTO payments (id, member_id, membership_id, amount, method, paid_at, received_by) VALUES
(1, 1, 1, 599.00, 'card', '2024-01-10 10:15:00', 1),
(2, 2, 2, 59.00, 'cash', '2026-10-01 09:30:00', 2),
(3, 3, 3, 59.00, 'mobile_money', '2024-01-01 14:20:00', 1),
(4, 4, 4, 599.00, 'bank_transfer', '2024-01-15 11:00:00', 2)
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- Insert Classes
INSERT INTO classes (id, name, description, trainer_id, duration_minutes) VALUES
(1, 'HIIT Ignition', 'High-intensity interval training designed to maximize calorie burn and endurance.', 3, 45),
(2, 'Vinyasa Flow Yoga', 'Fluid yoga practice linking breath with dynamic poses for flexibility and core strength.', 2, 60),
(3, 'Power Strength & Conditioning', 'Compound barbell and dumbbell lifting targeting full-body power and hypertrophy.', 1, 60),
(4, 'Boxing Fundamentals', 'Cardio-heavy boxing drills, bag work, and footwork conditioning.', 3, 50)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Class Sessions (Timetable)
-- day_of_week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
INSERT INTO class_sessions (id, class_id, day_of_week, start_time, end_time, room, is_active) VALUES
(1, 1, 1, '07:00:00', '07:45:00', 'Studio A', TRUE),
(2, 2, 1, '08:00:00', '09:00:00', 'Zen Studio', TRUE),
(3, 3, 2, '17:30:00', '18:30:00', 'Main Floor', TRUE),
(4, 4, 3, '18:00:00', '18:50:00', 'Boxing Ring', TRUE),
(5, 1, 4, '07:00:00', '07:45:00', 'Studio A', TRUE),
(6, 2, 5, '08:00:00', '09:00:00', 'Zen Studio', TRUE),
(7, 3, 6, '10:00:00', '11:00:00', 'Main Floor', TRUE)
ON DUPLICATE KEY UPDATE room=VALUES(room);

-- Insert Products
INSERT INTO products (id, name, price, stock_qty, reorder_level, image_url, category, description, is_active) VALUES
(1, 'Optimum Whey Protein 2kg (Vanilla)', 65.00, 24, 5, 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=800&auto=format&fit=crop', 'Supplements & Nutrition', '100% whey isolate with 24g protein per serving and BCAAs for post-workout muscle recovery.', TRUE),
(2, 'Pre-Workout Explosive Energy (Blue Razz)', 38.00, 18, 6, 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=800&auto=format&fit=crop', 'Supplements & Nutrition', 'High-stimulant pre-workout formula with beta-alanine, citrulline malate, and electrolytes.', TRUE),
(3, 'Electrolyte Hydration Drink 500ml', 3.50, 48, 12, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop', 'Hydration & Gear', 'Zero sugar hydration drink enriched with essential minerals, sodium, and potassium.', TRUE),
(4, 'Gym Grips & Wrist Wraps (Pair)', 22.00, 4, 5, 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop', 'Apparel & Accessories', 'Heavy-duty elastic wrist wraps offering rigid joint support for heavy pressing and lifts.', TRUE),
(5, 'Gym Pro Shaker Bottle 700ml', 12.00, 2, 5, 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?q=80&w=800&auto=format&fit=crop', 'Hydration & Gear', 'BPA-free protein shaker with surgical steel mixing ball and 100% leak-proof lid.', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name), image_url=VALUES(image_url), category=VALUES(category), description=VALUES(description);

-- Insert Product Sales
INSERT INTO product_sales (id, product_id, member_id, quantity, total_amount, sold_at, sold_by) VALUES
(1, 3, 1, 2, 7.00, '2026-10-10 10:45:00', 2),
(2, 1, 2, 1, 65.00, '2026-10-11 16:30:00', 1),
(3, 5, NULL, 1, 12.00, '2026-10-12 09:15:00', 2)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

-- Insert Attendance
INSERT INTO attendance (id, member_id, check_in_time, check_out_time, checked_in_by) VALUES
(1, 1, '2026-10-10 07:15:00', '2026-10-10 08:45:00', 2),
(2, 2, '2026-10-11 17:00:00', '2026-10-11 18:30:00', 1),
(3, 1, '2026-10-12 07:10:00', NULL, 2)
ON DUPLICATE KEY UPDATE check_in_time=VALUES(check_in_time);
