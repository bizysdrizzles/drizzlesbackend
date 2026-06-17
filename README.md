# Bizy's Drizzles Backend API

Production-ready e-commerce backend for Bizy's Drizzles coffee sauces, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Password reset functionality
  - Login with email or phone number

- **User Management**
  - User registration and profile management
  - Multiple address support
  - Loyalty program (automatic after X completed orders)

- **Product Management**
  - CRUD operations for products
  - Stock management with overselling prevention
  - Admin-only product visibility controls

- **Order Management**
  - Guest and authenticated user orders
  - 15-minute edit window for orders
  - Atomic stock management with MongoDB transactions
  - Order status tracking (Pending → Confirmed → Out for Delivery → Completed)
  - Promo code support

- **Cart Functionality**
  - Persistent cart (Redux-compatible)
  - Guest cart support with session IDs
  - Cart merge on login

- **Promo Codes**
  - Create and manage promo codes
  - Usage limits and expiry dates
  - Validation before order placement

- **Feedback System**
  - Anonymous and authenticated feedback
  - Optional order association

- **Analytics**
  - Sales by product
  - Sales by date range
  - Most purchased products
  - User statistics
  - Order status distribution

- **Security**
  - Helmet.js for HTTP headers
  - Rate limiting
  - Data sanitization
  - CORS configuration
  - Password hashing with bcrypt

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bizys-drizzles-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**

Create a `.env` file in the root directory and copy the contents from `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bizys-drizzles
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# Email Configuration
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@bizysdrizzles.com

# Loyalty Program
LOYALTY_ORDERS_REQUIRED=5
LOYALTY_DISCOUNT_PERCENT=10

# Order Edit Window (minutes)
ORDER_EDIT_WINDOW=15

# CORS
FRONTEND_URL=http://localhost:3000
```

4. **Start MongoDB**

Make sure MongoDB is running on your system:
```bash
# macOS/Linux
sudo systemctl start mongod

# or using Homebrew (macOS)
brew services start mongodb-community
```

5. **Seed the Database**

Populate the database with initial products and admin user:
```bash
npm run seed
```

This will create:
- 3 products (French Vanilla, White Mocha, Bundle)
- 1 admin user (email: admin@bizysdrizzles.com, password: admin123)

6. **Start the Server**

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📁 Project Structure

```
bizys-drizzles-backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/             # Request handlers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── cartController.js
│   │   ├── promoCodeController.js
│   │   ├── feedbackController.js
│   │   ├── analyticsController.js
│   │   └── userController.js
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   ├── PromoCode.js
│   │   └── Feedback.js
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── promoCodeRoutes.js
│   │   ├── feedbackRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/              # Custom middleware
│   │   ├── auth.js
│   │   ├── asyncHandler.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── validators/              # Input validation
│   │   ├── authValidator.js
│   │   ├── productValidator.js
│   │   ├── orderValidator.js
│   │   ├── feedbackValidator.js
│   │   └── promoCodeValidator.js
│   ├── utils/                   # Utility functions
│   │   ├── errorResponse.js
│   │   └── sendEmail.js
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── scripts/
│   └── seed.js                  # Database seeding
├── docs/
│   └── API_DOCUMENTATION.md     # Complete API documentation
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing the API

Use the health check endpoint to verify the server is running:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-02-14T10:30:00.000Z"
}
```

## 📚 API Documentation

Complete API documentation is available in `docs/API_DOCUMENTATION.md`

Base URL: `http://localhost:5000/api`

### Quick Reference

| Resource | Endpoints |
|----------|-----------|
| Authentication | `/auth/*` |
| Products | `/products/*` |
| Orders | `/orders/*` |
| Cart | `/cart/*` |
| Promo Codes | `/promocodes/*` |
| Feedback | `/feedback/*` |
| Analytics | `/analytics/*` |
| Users (Admin) | `/users/*` |

## 🔐 Authentication

Most endpoints require authentication via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

To get a token:
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`

## 🎯 Key Features Explained

### Loyalty Program
- Automatically activates after user completes X orders (configurable via `LOYALTY_ORDERS_REQUIRED`)
- Loyalty members receive Y% discount (configurable via `LOYALTY_DISCOUNT_PERCENT`)
- Discount applies automatically on order creation

### Order Edit Window
- Orders can be edited within 15 minutes of creation (configurable via `ORDER_EDIT_WINDOW`)
- Only orders with status "Pending" can be edited
- Stock is restored and recalculated on edit
- Uses MongoDB transactions for atomic operations

### Stock Management
- Prevents overselling with atomic stock checks
- Uses MongoDB transactions for order placement
- Stock automatically restored on order cancellation
- Stock hidden from customer-facing product endpoints

### Analytics Aggregations
- Uses MongoDB aggregation pipelines for efficient queries
- Real-time calculations (no caching)
- Date range filtering support
- Product and user performance metrics

## 🚨 Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | - |
| JWT_SECRET | Secret for JWT signing | - |
| JWT_EXPIRE | JWT expiration time | 30d |
| LOYALTY_ORDERS_REQUIRED | Orders needed for loyalty status | 5 |
| LOYALTY_DISCOUNT_PERCENT | Loyalty member discount | 10 |
| ORDER_EDIT_WINDOW | Minutes to allow order edits | 15 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run seed       # Seed database with initial data
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

ISC

## 👥 Support

For issues and questions, please open an issue in the repository.
