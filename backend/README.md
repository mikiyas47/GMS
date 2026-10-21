# Gym Management System - Backend API (MongoDB)

Production-ready Node.js & Express RESTful API with **MongoDB & Mongoose**, Role-Based Access Control (Admin & Receptionist), automated background jobs, and complete business logic enforcement.

---

## 🍃 MongoDB Configuration (`.env`)

Open [backend/.env](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/.env) and set your **MongoDB Atlas** or local connection string:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=gym_super_secure_jwt_token_secret_key_2026
JWT_EXPIRES_IN=7d

# MongoDB Connection URI (Atlas Cloud or Local)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/gym_management?retryWrites=true&w=majority
```

---

## 🚀 Running the Server

```bash
# 1. Start backend server
npm start

# 2. Or run with hot reload for development
npm run dev

# 3. Run automated tests
npm test
```

When connected to MongoDB, the backend automatically seeds default staff accounts and demo data if the collections are empty.

---

## 🔑 Default Staff Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gym.com` | `Admin@123` | Full administrative control (Staff Accounts, Classes, Timetable, Products, Trainers, Reports, Operations) |
| **Receptionist** | `reception@gym.com` | `Reception@123` | Front-desk operations (Member registration, Attendance check-in, Payments, Store sales) |

---

## 🗄️ MongoDB Mongoose Models

All collections are structured under [src/models/](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/):

1. **[User](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/User.js)** – Staff accounts (`full_name`, `email`, `password_hash`, `role` ['admin', 'receptionist'], `is_active`, `created_at`).
2. **[Member](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/Member.js)** – Gym members (`first_name`, `last_name`, `phone`, `email`, `date_of_birth`, `gender`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `notes`, `join_date`, `status`, `registered_by`).
3. **[Trainer](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/Trainer.js)** – Instructors (`first_name`, `last_name`, `phone`, `email`, `specialization`, `certification`, `hire_date`, `is_active`).
4. **[Membership](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/Membership.js)** – Plan assignments (`member_id`, `plan_name`, `price`, `start_date`, `end_date`, `status`, `frozen_from`, `frozen_until`, `created_by`).
5. **[Payment](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/Payment.js)** – Transactions (`member_id`, `membership_id`, `amount`, `method` ['cash', 'card', 'mobile_money', 'bank_transfer'], `paid_at`, `received_by`).
6. **[Class](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/Class.js)** – Class types (`name`, `description`, `trainer_id`, `duration_minutes`).
7. **[ClassSession](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/ClassSession.js)** – Timetable sessions (`class_id`, `day_of_week` [1-7], `start_time`, `end_time`, `room`, `is_active`).
8. **[Attendance](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/Attendance.js)** – Gym check-ins (`member_id`, `check_in_time`, `check_out_time`, `checked_in_by`).
9. **[Product](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/Product.js)** – Pro-shop inventory (`name`, `price`, `stock_qty`, `reorder_level`, `is_active`).
10. **[ProductSale](file:///c:/Users/hp/Desktop/GYM%20Management%20system/backend/src/models/ProductSale.js)** – Store purchases (`product_id`, `member_id` [optional/walk-in], `quantity`, `total_amount`, `sold_at`, `sold_by`).

---

## 📡 API Endpoints

- **Public**: `GET /api/public/timetable`, `GET /api/public/trainers` (Safe fields only: name & specialization)
- **Auth**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Staff Accounts (Admin)**: `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, `DELETE /api/users/:id`
- **Members**: `GET /api/members`, `POST /api/members`, `GET /api/members/:id`, `PUT /api/members/:id`, `DELETE /api/members/:id` (Admin)
- **Memberships**: `GET /api/memberships`, `POST /api/memberships`, `PATCH /api/memberships/:id/freeze`, `PATCH /api/memberships/:id/unfreeze`
- **Payments**: `GET /api/payments`, `POST /api/payments` (creates/renews plan & recalculates end_date)
- **Trainers (Admin)**: `GET /api/trainers`, `POST /api/trainers`, `PUT /api/trainers/:id`, `DELETE /api/trainers/:id`
- **Classes**: `GET /api/classes`, `POST /api/classes`, `PUT /api/classes/:id`, `DELETE /api/classes/:id` (Admin)
- **Sessions**: `GET /api/sessions`, `POST /api/sessions`, `PUT /api/sessions/:id`, `DELETE /api/sessions/:id` (Admin)
- **Attendance**: `POST /api/attendance/checkin`, `PATCH /api/attendance/:id/checkout`, `GET /api/attendance`
- **Products**: `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` (Admin)
- **Sales**: `POST /api/product-sales`, `GET /api/product-sales`
- **Reports (Admin)**: `GET /api/reports/revenue`, `GET /api/reports/attendance`, `GET /api/reports/expiring-memberships`, `POST /api/reports/run-expiry-check`
