# Bizy's Drizzles API Documentation

Base URL: `http://localhost:5000/api`

## Table of Contents
1. [Authentication](#authentication)
2. [Products](#products)
3. [Orders](#orders)
4. [Cart](#cart)
5. [Promo Codes](#promo-codes)
6. [Feedback](#feedback)
7. [Analytics](#analytics)
8. [Users (Admin)](#users-admin)

---

## Authentication

### Register User
**POST** `/auth/register`

**Access:** Public

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "1234567890",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "role": "user",
    "isLoyaltyMember": false,
    "completedOrdersCount": 0
  }
}
```

### Login
**POST** `/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "identifier": "john@example.com",
  "password": "password123"
}
```
*Note: identifier can be email OR phone number*

**Response (200):** Same as Register

### Get Current User
**GET** `/auth/me`

**Access:** Private

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "1234567890",
    "role": "user",
    "addresses": [],
    "isLoyaltyMember": false,
    "completedOrdersCount": 0,
    "createdAt": "2024-02-14T10:00:00.000Z",
    "updatedAt": "2024-02-14T10:00:00.000Z"
  }
}
```

### Update Profile
**PUT** `/auth/profile`

**Access:** Private

**Request Body:**
```json
{
  "fullName": "John Smith",
  "email": "johnsmith@example.com",
  "phoneNumber": "9876543210"
}
```

**Response (200):** Returns updated user object

### Add Address
**POST** `/auth/address`

**Access:** Private

**Request Body:**
```json
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "isDefault": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "isDefault": true
    }
  ]
}
```

### Update Address
**PUT** `/auth/address/:addressId`

**Access:** Private

**Request Body:** Same as Add Address

### Delete Address
**DELETE** `/auth/address/:addressId`

**Access:** Private

### Forgot Password
**POST** `/auth/forgotpassword`

**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": "Email sent"
}
```

### Reset Password
**PUT** `/auth/resetpassword/:resettoken`

**Access:** Public

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

**Response (200):** Returns token and user

---

## Products

### Get All Products
**GET** `/products`

**Access:** Public

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "French Vanilla",
      "description": "Rich and creamy...",
      "price": 12.99,
      "imageUrl": "https://...",
      "isActive": true,
      "inStock": true,
      "createdAt": "2024-02-14T10:00:00.000Z",
      "updatedAt": "2024-02-14T10:00:00.000Z"
    }
  ]
}
```
*Note: Stock is hidden from customers*

### Get Single Product
**GET** `/products/:id`

**Access:** Public

**Response (200):** Single product object

### Create Product
**POST** `/products`

**Access:** Private/Admin

**Request Body:**
```json
{
  "name": "Caramel Sauce",
  "description": "Sweet caramel flavor",
  "price": 13.99,
  "stock": 50,
  "imageUrl": "https://..."
}
```

**Response (201):** Created product object

### Update Product
**PUT** `/products/:id`

**Access:** Private/Admin

**Request Body:** Any product fields to update

### Delete Product (Soft Delete)
**DELETE** `/products/:id`

**Access:** Private/Admin

**Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

### Update Stock
**PATCH** `/products/:id/stock`

**Access:** Private/Admin

**Request Body:**
```json
{
  "quantity": 10,
  "operation": "increase"
}
```
*operation: "increase" or "decrease"*

### Get Admin Products (with stock)
**GET** `/products/admin/all`

**Access:** Private/Admin

---

## Orders

### Create Order
**POST** `/orders`

**Access:** Private/Public (guest)

**For Authenticated Users:**
```json
{
  "orderItems": [
    {
      "product": "507f1f77bcf86cd799439011",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "promoCode": "SAVE10"
}
```

**For Guest Orders (no auth header):**
```json
{
  "orderItems": [...],
  "shippingAddress": {...},
  "promoCode": "SAVE10",
  "isGuest": true,
  "guestEmail": "guest@example.com",
  "guestPhone": "1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "orderItems": [
      {
        "product": "507f1f77bcf86cd799439011",
        "name": "French Vanilla",
        "price": 12.99,
        "quantity": 2,
        "imageUrl": "https://..."
      }
    ],
    "shippingAddress": {...},
    "subtotal": 25.98,
    "discount": 2.60,
    "total": 23.38,
    "promoCodeUsed": {
      "code": "SAVE10",
      "discountPercent": 10
    },
    "status": "Pending",
    "isEditable": true,
    "editableUntil": "2024-02-14T10:15:00.000Z",
    "createdAt": "2024-02-14T10:00:00.000Z"
  }
}
```

### Get My Orders
**GET** `/orders/myorders`

**Access:** Private

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

### Get Single Order
**GET** `/orders/:id`

**Access:** Private

### Update Order (Within 15 Minutes)
**PUT** `/orders/:id`

**Access:** Private

**Request Body:**
```json
{
  "orderItems": [
    {
      "product": "507f1f77bcf86cd799439011",
      "quantity": 3
    }
  ],
  "shippingAddress": {...}
}
```

**Response (200):** Updated order object

**Note:** Can only edit if:
- Order status is "Pending"
- Within 15 minutes of creation
- User is the order owner

### Update Order Status
**PATCH** `/orders/:id/status`

**Access:** Private/Admin

**Request Body:**
```json
{
  "status": "Confirmed"
}
```
*Status options: Pending, Confirmed, Out for Delivery, Completed, Cancelled*

### Cancel Order
**DELETE** `/orders/:id`

**Access:** Private

**Note:** Restores stock automatically

### Get All Orders (Admin)
**GET** `/orders/admin/all`

**Access:** Private/Admin

---

## Cart

**Note:** Cart supports both authenticated users and guests. For guests, include `x-session-id` header with a unique session ID.

### Get Cart
**GET** `/cart`

**Access:** Private/Public

**Headers (for guests):** `x-session-id: <unique-session-id>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "items": [
      {
        "product": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "French Vanilla",
          "price": 12.99,
          "imageUrl": "https://..."
        },
        "quantity": 2
      }
    ],
    "createdAt": "2024-02-14T10:00:00.000Z",
    "updatedAt": "2024-02-14T10:05:00.000Z"
  }
}
```

### Add to Cart
**POST** `/cart`

**Access:** Private/Public

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

### Update Cart Item
**PUT** `/cart/:productId`

**Access:** Private/Public

**Request Body:**
```json
{
  "quantity": 3
}
```
*Set quantity to 0 to remove item*

### Remove from Cart
**DELETE** `/cart/:productId`

**Access:** Private/Public

### Clear Cart
**DELETE** `/cart`

**Access:** Private/Public

### Merge Cart (After Login)
**POST** `/cart/merge`

**Access:** Private

**Request Body:**
```json
{
  "sessionId": "guest-session-id-123"
}
```

**Note:** Merges guest cart into user cart after login

---

## Promo Codes

### Validate Promo Code
**POST** `/promocodes/validate`

**Access:** Public

**Request Body:**
```json
{
  "code": "SAVE10"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "code": "SAVE10",
    "discountPercent": 10
  }
}
```

### Create Promo Code
**POST** `/promocodes`

**Access:** Private/Admin

**Request Body:**
```json
{
  "code": "SAVE20",
  "discountPercent": 20,
  "expiryDate": "2024-12-31T23:59:59.000Z",
  "usageLimit": 100
}
```

### Get All Promo Codes
**GET** `/promocodes`

**Access:** Private/Admin

### Get Active Promo Codes
**GET** `/promocodes/active`

**Access:** Private/Admin

### Update Promo Code
**PUT** `/promocodes/:id`

**Access:** Private/Admin

### Delete Promo Code
**DELETE** `/promocodes/:id`

**Access:** Private/Admin

---

## Feedback

### Create Feedback
**POST** `/feedback`

**Access:** Public (Optional auth)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Great products! Fast delivery.",
  "rating": 5,
  "order": "507f1f77bcf86cd799439011"
}
```
*Note: rating and order are optional*

### Get All Feedback
**GET** `/feedback`

**Access:** Private/Admin

### Get Single Feedback
**GET** `/feedback/:id`

**Access:** Private/Admin

### Delete Feedback
**DELETE** `/feedback/:id`

**Access:** Private/Admin

---

## Analytics

All analytics endpoints require **Admin** authentication.

### Get Sales Analytics
**GET** `/analytics/sales`

**Access:** Private/Admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 5432.10,
      "totalOrders": 234,
      "averageOrderValue": 23.21
    },
    "revenuePerProduct": [
      {
        "_id": "French Vanilla",
        "totalRevenue": 2599.01,
        "totalQuantity": 200,
        "orderCount": 150
      }
    ],
    "ordersPerDay": [
      {
        "date": "2024-02-14T00:00:00.000Z",
        "count": 15,
        "revenue": 345.50
      }
    ]
  }
}
```

### Get Analytics by Date Range
**GET** `/analytics/daterange?startDate=2024-01-01&endDate=2024-01-31`

**Access:** Private/Admin

**Query Parameters:**
- `startDate` (required): ISO 8601 date
- `endDate` (required): ISO 8601 date

### Get Most Purchased Products
**GET** `/analytics/popular`

**Access:** Private/Admin

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "productName": "French Vanilla",
      "totalQuantity": 500,
      "totalRevenue": 6495.00,
      "orderCount": 350
    }
  ]
}
```

### Get User Statistics
**GET** `/analytics/users`

**Access:** Private/Admin

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "loyaltyMembers": 320,
    "regularUsers": 930,
    "topCustomers": [...]
  }
}
```

### Get Order Status Distribution
**GET** `/analytics/orders/status`

**Access:** Private/Admin

---

## Users (Admin)

All user management endpoints require **Admin** authentication.

### Get All Users
**GET** `/users`

**Access:** Private/Admin

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

### Get Single User
**GET** `/users/:id`

**Access:** Private/Admin

### Update User
**PUT** `/users/:id`

**Access:** Private/Admin

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "email": "newemail@example.com",
  "phoneNumber": "9876543210",
  "role": "admin"
}
```

### Delete User
**DELETE** `/users/:id`

**Access:** Private/Admin

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- 200: OK
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

---

## Notes

### Redux Cart Integration

The cart API is designed to work seamlessly with Redux:

1. **Guest Users:** Use a unique session ID (e.g., UUID) stored in localStorage
   - Include as `x-session-id` header in all cart requests

2. **After Login:** Call `/cart/merge` with the guest session ID to merge carts

3. **Redux Actions:** 
   - Optimistically update Redux state
   - Make API call in background
   - Sync Redux with API response

### Order Edit Window

Orders can only be edited if ALL conditions are met:
1. Order status is "Pending"
2. Within 15 minutes of creation (configurable)
3. User is the order owner

### Loyalty Program

- Automatically tracked in User model
- Activates when `completedOrdersCount >= LOYALTY_ORDERS_REQUIRED`
- Discount applies automatically on order creation
- Guest orders don't count towards loyalty

### Stock Management

- All stock operations use MongoDB transactions
- Prevents race conditions and overselling
- Stock automatically restored on order cancellation/edit
- Hidden from customer endpoints for security
