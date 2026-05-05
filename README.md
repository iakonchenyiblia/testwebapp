# Bookify - Professional Services Booking Platform

A production-ready full-stack web application for booking professional services online.

## 🚀 Features

### User Features
- **Search & Filters**: Find services by category, price, rating, location, and availability
- **Service Catalog**: Browse services with detailed information, reviews, and available time slots
- **Online Booking**: Real-time appointment scheduling with conflict prevention
- **Secure Payments**: Stripe integration with mock payment support for development
- **User Dashboard**: Manage bookings, view history, and update profile

### Admin Features
- **Dashboard Analytics**: Revenue, bookings, and popular services overview
- **Service Management**: CRUD operations for services and categories
- **User Management**: View and manage user accounts and roles
- **Booking Management**: View all bookings and update statuses

## 📁 Project Structure

```
/workspace
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, rate limiting
│   │   ├── models/         # Prisma models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic, WebSocket
│   │   ├── utils/          # Helpers, error handling
│   │   ├── validators/     # Zod schemas
│   │   └── index.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json
│   └── Dockerfile
├── frontend/               # Next.js React App
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # API client, utilities
│   │   ├── store/         # Zustand state management
│   │   └── hooks/         # Custom React hooks
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Validation**: Zod
- **Real-time**: WebSocket (ws)
- **Payments**: Stripe

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
```bash
cd /workspace
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start all services**
```bash
docker-compose up -d
```

4. **Run database migrations**
```bash
docker-compose exec backend npx prisma migrate dev
```

5. **Seed the database (optional)**
```bash
docker-compose exec backend npx prisma db seed
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

### Local Development

#### Backend Setup
```bash
cd backend
npm install
cp ../.env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
cp ../.env.example .env.local
npm run dev
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Services
- `GET /api/services` - List services (with filters)
- `GET /api/services/:slug` - Get service details
- `POST /api/services` - Create service (admin)
- `PUT /api/services/:id` - Update service (admin)
- `DELETE /api/services/:id` - Delete service (admin)

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/:slug` - Get category with services

### Bookings
- `GET /api/bookings/my` - Get user's bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `PUT /api/bookings/:id/confirm` - Confirm booking (admin)

### Payments
- `POST /api/payments/create-intent` - Create payment
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/:bookingId` - Get payment status

### Admin
- `GET /api/admin/analytics` - Dashboard analytics
- `GET /api/admin/users` - List users
- `GET /api/admin/bookings/all` - All bookings
- `PUT /api/admin/users/:id/role` - Update user role

## 🔐 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting on auth and booking endpoints
- CORS protection
- Helmet security headers
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- XSS protection

## 🔄 Real-time Updates

WebSocket connection at `ws://localhost:3001/ws` for:
- Booking status updates
- Schedule availability changes
- Admin notifications

## 💳 Payment Integration

The app supports both real Stripe payments and mock payments:

**For real Stripe:**
1. Set `STRIPE_SECRET_KEY` in `.env`
2. Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in frontend

**Mock payments** are used automatically when Stripe keys are not configured.

## 📊 Database Schema

Key tables:
- `users` - User accounts with roles
- `categories` - Service categories (hierarchical)
- `services` - Available services
- `schedules` - Available time slots
- `bookings` - User reservations
- `payments` - Payment records
- `reviews` - Service reviews

## 🎨 Design Principles

- Minimalist, clean UI (Stripe/Apple inspired)
- Mobile-first responsive design
- Dark mode support
- Skeleton loading states
- Smooth animations with Framer Motion
- Accessible components

## 📝 Environment Variables

See `.env.example` for all required variables:

```env
# Database
DB_USER=booking_user
DB_PASSWORD=booking_pass
DB_NAME=booking_db
DB_PORT=5432

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Backend
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Production Docker Build
```bash
docker-compose -f docker-compose.yml build
docker-compose up -d
```

### VPS Deployment
1. Install Docker on your VPS
2. Clone repository
3. Configure `.env` with production values
4. Run `docker-compose up -d`
5. Set up reverse proxy (nginx/Caddy)
6. Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🆘 Support

For issues and questions, please open an issue on GitHub.
