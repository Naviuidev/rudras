# Rudras Farm Fresh — Milk Subscription & Product Ordering Platform

A complete production-ready platform with React Native mobile app, PHP REST API, MySQL database, and React admin panel.

## Project Structure

```
rudra/
├── .env               # Single config for backend, admin & mobile
├── database/          # MySQL schema & seed data
├── backend/           # PHP 8+ REST API
├── mobile/            # React Native Expo app
├── admin/             # React + Bootstrap 5 admin panel
└── README.md
```

## Technology Stack

| Layer       | Stack                                              |
|-------------|----------------------------------------------------|
| Mobile      | React Native, Expo SDK 52, React Navigation, Paper |
| Backend     | PHP 8+, JWT, PHPMailer, MySQL                      |
| Admin       | React 18, Vite, Bootstrap 5, Chart.js              |
| Database    | MySQL 8.0+                                         |

## Brand Colors

- Primary: `#d9e8c9`
- Secondary: `#d6e8f1`
- Accent: `#2d5016`
- Font: Poppins

---

## Quick Start

### 1. Database Setup

```bash
mysql -u root -p < database/schema.sql
```

Create an admin user is pre-seeded. Admin login uses credentials from `.env`.

### 2. Environment Config

Edit the single root `.env` file with your settings:

```bash
# Project root — one file for everything
rudra/.env
```

Key variables:
```
DB_HOST=localhost
DB_NAME=rudras_farm_fresh
ADMIN_USERNAME=Rudra
ADMIN_PASSWORD=Admin@123
VITE_API_URL=http://localhost:8000/api
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Backend API

```bash
cd backend
composer install
php -S localhost:8000 router.php
```

API base URL: `http://localhost:8000/api`

For development OTP (no email), set in `.env`:
```
APP_ENV=development
```
OTP will be returned in the API response.

### 4. Mobile App

```bash
cd mobile
npm install
# API URL is read from root .env (EXPO_PUBLIC_API_URL)
npx expo start
```

Build for production:
```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

### 5. Admin Panel

```bash
cd admin
npm install
npm run dev
```

Open `http://localhost:3000/admin/login` — login with `Rudra` / `Admin@123` (from `.env`).

---

## API Endpoints

### Authentication
| Method | Endpoint           | Description        |
|--------|--------------------|--------------------|
| POST   | `/auth/send-otp`   | Send 6-digit OTP   |
| POST   | `/auth/verify-otp` | Verify & get JWT   |

### Users & Profile
| Method | Endpoint    | Auth  | Description       |
|--------|-------------|-------|-------------------|
| GET    | `/profile`  | User  | Full profile data |
| PUT    | `/profile`  | User  | Update profile    |
| GET    | `/users`    | Admin | List all users    |

### Products
| Method | Endpoint         | Auth  | Description     |
|--------|------------------|-------|-----------------|
| GET    | `/products`      | —     | List products   |
| GET    | `/products/{id}` | —     | Product detail  |
| POST   | `/products`      | Admin | Create product  |
| PUT    | `/products/{id}` | Admin | Update product  |
| DELETE | `/products/{id}` | Admin | Delete product  |

### Banners
| Method | Endpoint        | Auth  | Description    |
|--------|-----------------|-------|----------------|
| GET    | `/banners`      | —     | Active banners |
| POST   | `/banners`      | Admin | Create banner  |
| PUT    | `/banners/{id}` | Admin | Update banner  |
| DELETE | `/banners/{id}` | Admin | Delete banner  |

### Orders
| Method | Endpoint               | Auth  | Description      |
|--------|------------------------|-------|------------------|
| GET    | `/orders`              | User  | User/admin orders|
| POST   | `/orders`              | User  | Place order      |
| PUT    | `/orders/{id}/status`  | Admin | Update status    |

### Subscriptions
| Method | Endpoint                          | Auth  | Description           |
|--------|-----------------------------------|-------|-----------------------|
| GET    | `/subscriptions/active`           | User  | Active subscription   |
| POST   | `/subscriptions`                  | User  | Start subscription    |
| POST   | `/subscriptions/{id}/pause-dates` | User  | Pause specific dates  |
| PUT    | `/subscriptions/{id}/pause`       | Admin | Pause subscription    |
| PUT    | `/subscriptions/{id}/resume`      | User  | Resume subscription   |
| GET    | `/subscriptions/delivery-logs`    | User  | Delivery history      |

### Other
| Method | Endpoint                | Auth  | Description          |
|--------|-------------------------|-------|----------------------|
| GET    | `/dashboard/stats`      | Admin | Dashboard metrics    |
| GET    | `/cms/{slug}`           | —     | CMS page content     |
| PUT    | `/cms/{slug}`           | Admin | Update CMS page      |
| POST   | `/notifications/send`   | Admin | Send push notification|
| POST   | `/upload`               | Admin | Upload image         |

---

## Milk Subscription — Carry Forward Logic

When a user skips delivery days:
1. Paused dates are stored in `delivery_pauses`
2. `remaining_days` is incremented for each paused day
3. When subscription expires with remaining days > 0, those days carry forward to the next subscription
4. `carried_forward_days` field tracks how many days were carried

Daily delivery processing (cron):
```bash
# Run at 6 AM daily
0 6 * * * php /path/to/backend/cron/daily_delivery.php
```

---

## Database Tables

- `users` — User accounts with role (user/admin)
- `otp_verifications` — Email OTP codes
- `banners` — Home screen banners
- `products` — Product catalog
- `orders` / `order_items` — Product orders
- `subscriptions` — Milk subscriptions
- `delivery_pauses` — Skipped delivery dates
- `delivery_logs` — Daily delivery records
- `notifications` — Push notification log
- `cms_pages` — Privacy policy, terms

---

## Mobile App Screens

1. **Login** — Gmail OTP authentication
2. **Home** — Banners, subscription summary, featured products
3. **Orders** — Cart & order history
4. **Products** — Search, filter, product catalog
5. **Profile** — User info, subscription & order history
6. **Subscription** — Start/pause/manage milk subscription
7. **Product Detail** — Full product view with add to cart

## Admin Panel Pages

1. **Dashboard** — Stats, charts (daily orders, subscription growth)
2. **Banners** — CRUD with image upload
3. **Products** — CRUD with categories
4. **Orders** — View & update order status
5. **Subscriptions** — View, pause, resume
6. **Users** — View registered users
7. **CMS** — Edit privacy policy & terms
8. **Notifications** — Send push notifications

---

## Production Deployment

### Backend
- Use Apache/Nginx with `public/` as document root
- Enable HTTPS
- Set strong `JWT_SECRET`
- Configure SMTP for OTP emails
- Set up daily cron for delivery processing

### Mobile
- Update `API_URL` to production domain
- Configure Expo push notification credentials
- Build with EAS: `eas build --platform all`

### Admin
- `npm run build` → deploy `dist/` to static hosting
- Set `VITE_API_URL` in root `.env` to production API

---

## License

Proprietary — Rudras Farm Fresh
