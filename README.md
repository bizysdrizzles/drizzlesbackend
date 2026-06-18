# Bizy's Drizzles Backend API


## Features

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
