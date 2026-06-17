# Architectural Decisions & Technical Explanations

## Table of Contents
1. [Order Edit Window Implementation](#order-edit-window)
2. [Stock Prevention System](#stock-prevention)
3. [Analytics Aggregation](#analytics-aggregation)
4. [Loyalty Program Logic](#loyalty-program)
5. [Cart Persistence Strategy](#cart-persistence)
6. [Security Measures](#security-measures)
7. [Database Design](#database-design)

---

## Order Edit Window

### How It Works

The 15-minute edit window is implemented using a combination of MongoDB timestamps and middleware:

#### 1. **Creation Time Tracking**
When an order is created, we automatically set an `editableUntil` timestamp:

```javascript
orderSchema.pre('save', function (next) {
  if (this.isNew) {
    const editWindow = parseInt(process.env.ORDER_EDIT_WINDOW) || 15;
    this.editableUntil = new Date(Date.now() + editWindow * 60 * 1000);
  }
  next();
});
```

#### 2. **Edit Validation Method**
The Order model includes a method to check if editing is allowed:

```javascript
orderSchema.methods.canBeEdited = function () {
  return this.isEditable && 
         new Date() < this.editableUntil && 
         this.status === 'Pending';
};
```

#### 3. **Automatic Status Update**
Before saving, we update the `isEditable` flag if time has expired:

```javascript
orderSchema.pre('save', function (next) {
  if (new Date() >= this.editableUntil) {
    this.isEditable = false;
  }
  next();
});
```

#### 4. **Controller Enforcement**
The update order controller checks these conditions:

```javascript
if (!order.canBeEdited()) {
  return next(
    new ErrorResponse('Order can no longer be edited. Edit window has closed.', 400)
  );
}
```

### Benefits
- **Configurable**: Edit window can be changed via environment variable
- **Automatic**: No cron jobs needed - validation happens on-demand
- **Clear UX**: Frontend can display countdown timer using `editableUntil`
- **Status-aware**: Only Pending orders can be edited

### Trade-offs
- Requires checking timestamp on every edit attempt
- Doesn't automatically lock orders (could add scheduled job if needed)

---

## Stock Prevention System

### How It Works

Stock management uses **MongoDB Transactions** to ensure atomic operations and prevent race conditions.

#### 1. **Transaction-Based Order Creation**

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Check stock
  if (product.stock < item.quantity) {
    throw new ErrorResponse('Insufficient stock', 400);
  }

  // Decrease stock atomically
  product.stock -= item.quantity;
  await product.save({ session });

  // Create order
  await Order.create([orderData], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
}
```

#### 2. **Read-Check-Update Pattern**
Within a transaction:
1. **Read**: Fetch current product with session lock
2. **Check**: Verify sufficient stock
3. **Update**: Decrease stock and create order
4. **Commit**: All or nothing

#### 3. **Automatic Stock Restoration**
On order cancellation or edit:

```javascript
// Restore stock for old items
for (const item of order.orderItems) {
  const product = await Product.findById(item.product).session(session);
  product.stock += item.quantity;
  await product.save({ session });
}
```

#### 4. **Model-Level Protection**
Product model prevents negative stock:

```javascript
productSchema.pre('save', function (next) {
  if (this.stock < 0) {
    this.stock = 0;
  }
  next();
});
```

### Benefits
- **ACID Compliance**: All operations complete or none do
- **No Overselling**: Transactions prevent race conditions
- **Automatic Rollback**: Failed orders don't affect stock
- **Stock Accuracy**: Restored on cancellations

### Why Transactions?
Without transactions, two concurrent orders could both read stock=1, both pass validation, and both decrease stock, resulting in stock=-1. Transactions serialize these operations.

---

## Analytics Aggregation

### How It Works

Analytics use **MongoDB Aggregation Pipelines** for efficient, real-time calculations.

#### Example: Revenue Per Product

```javascript
const revenuePerProduct = await Order.aggregate([
  // Stage 1: Filter completed orders only
  {
    $match: {
      status: { $in: ['Completed'] },
    },
  },
  
  // Stage 2: Unwind order items array
  { $unwind: '$orderItems' },
  
  // Stage 3: Group by product and calculate totals
  {
    $group: {
      _id: '$orderItems.name',
      totalRevenue: {
        $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] },
      },
      totalQuantity: { $sum: '$orderItems.quantity' },
      orderCount: { $sum: 1 },
    },
  },
  
  // Stage 4: Sort by revenue
  { $sort: { totalRevenue: -1 } },
]);
```

#### Date Range Analytics with $facet

```javascript
const analytics = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: start, $lte: end },
      status: 'Completed',
    },
  },
  {
    $facet: {
      overview: [
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalOrders: { $sum: 1 },
            averageOrderValue: { $avg: '$total' },
          },
        },
      ],
      dailyBreakdown: [...],
      productBreakdown: [...],
    },
  },
]);
```

### Benefits
- **Performance**: Database does the heavy lifting
- **Real-time**: No pre-computed caches to maintain
- **Scalable**: Handles large datasets efficiently
- **Flexible**: Easy to add new metrics

### Pipeline Stages Used
- `$match`: Filter documents
- `$unwind`: Deconstruct arrays
- `$group`: Aggregate calculations
- `$sort`: Order results
- `$project`: Shape output
- `$facet`: Multiple sub-pipelines
- `$lookup`: Join collections (user stats)

### Why Aggregation Over Code?
- **10-100x faster** than fetching all docs and computing in JS
- **Less memory**: Database streams results
- **Indexes**: Can use database indexes
- **Atomic**: Single query vs multiple round trips

---

## Loyalty Program Logic

### How It Works

Loyalty status is automatically managed through Mongoose middleware and business logic.

#### 1. **Automatic Activation**
User model middleware checks order count on every save:

```javascript
userSchema.pre('save', function (next) {
  const loyaltyThreshold = parseInt(process.env.LOYALTY_ORDERS_REQUIRED) || 5;
  if (this.completedOrdersCount >= loyaltyThreshold) {
    this.isLoyaltyMember = true;
  }
  next();
});
```

#### 2. **Order Completion Tracking**
When admin marks order as "Completed":

```javascript
if (status === 'Completed' && oldStatus !== 'Completed' && order.user) {
  const user = await User.findById(order.user);
  if (user) {
    user.completedOrdersCount += 1;
    await user.save(); // Triggers loyalty check middleware
  }
}
```

#### 3. **Automatic Discount Application**
On order creation, check loyalty status:

```javascript
if (!isGuest && req.user && req.user.isLoyaltyMember) {
  const loyaltyDiscount = parseInt(process.env.LOYALTY_DISCOUNT_PERCENT) || 10;
  discount += (subtotal * loyaltyDiscount) / 100;
}
```

### Configuration
Two environment variables control the program:

```env
LOYALTY_ORDERS_REQUIRED=5      # Orders needed for loyalty
LOYALTY_DISCOUNT_PERCENT=10    # Discount for loyalty members
```

### Benefits
- **Zero Manual Work**: Fully automatic
- **Configurable**: Easy to adjust thresholds
- **Transparent**: Users see their progress
- **Fair**: Only completed orders count

### Design Decisions
- **Why count field?**: Prevents expensive Order.count() queries
- **Why on save?**: Ensures status always current
- **Why completed only?**: Cancelled/pending shouldn't count
- **Why guest exclusion?**: Can't track guest order history

---

## Cart Persistence Strategy

### Redux Integration

The cart system is designed to work seamlessly with Redux on the frontend.

#### Architecture Overview

```
Frontend (Redux)          Backend (MongoDB)
================          =================
     Cart State    <--->    Cart Collection
     
Guest Flow:
1. Generate UUID sessionId
2. Store in localStorage
3. Send as x-session-id header
4. Backend creates cart with sessionId

User Flow:
1. User logs in
2. Call /cart/merge endpoint
3. Backend merges guest cart → user cart
4. Redux syncs with merged data
```

#### Guest Cart Implementation

```javascript
// Frontend
const sessionId = localStorage.getItem('sessionId') || uuidv4();
localStorage.setItem('sessionId', sessionId);

// API calls include:
headers: {
  'x-session-id': sessionId
}
```

```javascript
// Backend
let cart;
if (req.user) {
  cart = await Cart.findOne({ user: req.user.id });
} else {
  const sessionId = req.headers['x-session-id'];
  cart = await Cart.findOne({ sessionId });
}
```

#### Cart Merge Algorithm

```javascript
// On login, merge guest cart into user cart
for (const guestItem of guestCart.items) {
  const existingIndex = userCart.items.findIndex(
    (item) => item.product.toString() === guestItem.product.toString()
  );

  if (existingIndex > -1) {
    // Add quantities if product exists
    userCart.items[existingIndex].quantity += guestItem.quantity;
  } else {
    // Add new item
    userCart.items.push(guestItem);
  }
}
```

### Benefits
- **Offline Support**: Cart persists in DB
- **Cross-Device**: User cart available anywhere
- **Guest Support**: No login required to shop
- **Redux Compatible**: API matches Redux patterns
- **Smooth Transition**: Guest → user seamless

### Redux Action Pattern

```javascript
// Optimistic update
dispatch(addToCartOptimistic(item));

// API call
try {
  const response = await api.addToCart(item);
  dispatch(addToCartSuccess(response.data));
} catch (error) {
  dispatch(addToCartFailure());
  dispatch(revertCart()); // Rollback optimistic update
}
```

---

## Security Measures

### 1. **Authentication (JWT)**
- Tokens signed with secret
- 30-day expiration
- Included in httpOnly cookies and response
- Verified on protected routes

### 2. **Authorization (RBAC)**
```javascript
const { protect, authorize } = require('../middleware/auth');

// Admin only
router.delete('/products/:id', protect, authorize('admin'), deleteProduct);
```

### 3. **Password Security**
- bcrypt hashing (10 salt rounds)
- Passwords never returned in responses
- Reset tokens hashed before storage

### 4. **Input Validation**
- express-validator for all inputs
- Type checking, length limits, format validation
- Sanitization to prevent XSS

### 5. **Rate Limiting**
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});
```

### 6. **Data Sanitization**
```javascript
app.use(mongoSanitize()); // Prevents NoSQL injection
```

### 7. **HTTP Headers (Helmet)**
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- Content-Security-Policy

### 8. **CORS Configuration**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

### 9. **Stock Visibility**
```javascript
// Customer endpoints
.select('-stock') // Hide stock field

// Admin endpoints
// Include all fields
```

---

## Database Design

### Schema Relationships

```
User (1) ──────> (many) Orders
User (1) ──────> (1) Cart
User (0/1) ─────> (many) Feedback

Product (1) ────> (many) Cart Items
Product (1) ────> (many) Order Items

PromoCode (0/1) ─> (many) Orders

Order (0/1) ────> (many) Feedback
```

### Embedded vs Referenced

**Embedded Documents:**
- Addresses in User (subdocument array)
- Order items in Order (price snapshot needed)
- Cart items in Cart (simplicity)

**Referenced Documents:**
- User → Order (separate lifecycle)
- Product → Cart items (need live product data)
- User → Cart (1-to-1 relationship)

### Indexing Strategy

```javascript
// User model
{ email: 1 }      // Unique index
{ phoneNumber: 1 } // Unique index

// Cart model
{ user: 1 }       // Faster user cart lookup
{ sessionId: 1 }  // Faster guest cart lookup

// Order model
{ user: 1 }       // User's orders
{ createdAt: -1 } // Recent orders
{ status: 1 }     // Status filtering
```

### Why MongoDB?
- **Flexible schema**: Product attributes vary
- **Aggregation**: Powerful analytics
- **Transactions**: ACID compliance for orders
- **Scalability**: Horizontal scaling ready
- **JSON-native**: Matches Node.js objects

### Data Integrity Measures
- Required fields on schemas
- Validation rules (email format, min/max)
- Unique constraints (email, phone, product name)
- Referential checks in controllers
- Transactions for multi-document operations

---

## Performance Considerations

### 1. **Pagination**
All list endpoints support pagination:
```javascript
const skip = (page - 1) * limit;
await Model.find().skip(skip).limit(limit);
```

### 2. **Selective Field Projection**
```javascript
.select('-password -resetPasswordToken')
.populate('user', 'fullName email') // Only needed fields
```

### 3. **Aggregation Over Iteration**
Analytics use aggregation pipelines instead of fetching and processing in Node.js.

### 4. **Middleware Efficiency**
- Pre-save middleware for automatic fields
- Avoid unnecessary database queries
- Cache computed values

### 5. **Connection Pooling**
Mongoose handles connection pooling automatically.

### Potential Optimizations (Future)
- Redis caching for product catalog
- CDN for product images
- ElasticSearch for product search
- Message queue for email sending
- Read replicas for analytics

---

## Testing Strategy Recommendations

### Unit Tests
- Model methods (canBeEdited, isValid)
- Utility functions
- Middleware logic

### Integration Tests
- API endpoint responses
- Database operations
- Authentication flow

### Transaction Tests
- Order creation with stock
- Concurrent order placement
- Order cancellation

### Tools
- Jest for testing
- Supertest for API tests
- MongoDB Memory Server for test DB

---

## Deployment Considerations

### Environment
- NODE_ENV=production
- Secure JWT_SECRET (32+ characters)
- Real email credentials
- Proper MONGODB_URI with auth

### Production Checklist
- [ ] Enable HTTPS (secure: true for cookies)
- [ ] Configure reverse proxy (nginx)
- [ ] Set up MongoDB replica set
- [ ] Enable database backups
- [ ] Configure logging (Winston)
- [ ] Set up monitoring (PM2, DataDog)
- [ ] API documentation hosting
- [ ] Rate limit tuning
- [ ] CORS whitelist tightening

### Scaling Strategy
1. **Vertical**: Increase server resources
2. **Horizontal**: Load balancer + multiple app servers
3. **Database**: MongoDB sharding
4. **Caching**: Redis for sessions/products
5. **CDN**: Static assets and images

---

This architecture provides a solid foundation for a production e-commerce backend with room for growth and optimization as the business scales.
