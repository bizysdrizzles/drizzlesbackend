# 🚀 Quick Setup Guide - Bizy's Drizzles Backend

## Prerequisites Check
Before starting, ensure you have:
- ✅ Node.js v14+ installed (`node --version`)
- ✅ MongoDB v4.4+ installed and running
- ✅ npm or yarn package manager

## Step-by-Step Setup (5 minutes)

### 1. Navigate to Project Directory
```bash
cd bizys-drizzles-backend
```

### 2. Install Dependencies
```bash
npm install
```
This installs all required packages (~2 minutes)

### 3. Configure Environment
```bash
# Create your .env file
cp .env.example .env

# Edit .env with your preferred editor
nano .env   # or code .env, or vim .env
```

**Minimum required changes:**
```env
JWT_SECRET=your-random-secret-key-min-32-chars
MONGODB_URI=mongodb://localhost:27017/bizys-drizzles
```

### 4. Start MongoDB
```bash
# On Linux/macOS
sudo systemctl start mongod

# On macOS with Homebrew
brew services start mongodb-community

# On Windows
net start MongoDB
```

### 5. Seed Database
```bash
npm run seed
```

**You'll see:**
```
✅ Products seeded successfully
   - 3 products created
✅ Admin user created successfully
   Email: admin@bizysdrizzles.com
   Password: admin123
   Role: admin
🎉 Database seeded successfully!
```

### 6. Start Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# OR Production mode
npm start
```

**Server is ready when you see:**
```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

### 7. Test the API
Open a new terminal and run:
```bash
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-02-14T10:30:00.000Z"
}
```

## ✅ You're Done!

The backend is now running at: `http://localhost:5000`

## Next Steps

### Test with Postman
1. Import `docs/Postman_Collection.json` into Postman
2. Login as admin:
   - Email: `admin@bizysdrizzles.com`
   - Password: `admin123`
3. Copy the token from response
4. Set it as `authToken` variable in Postman

### View Products
```bash
curl http://localhost:5000/api/products
```

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phoneNumber": "1234567890",
    "password": "password123"
  }'
```

## 📚 Documentation

- **Complete API Docs**: `docs/API_DOCUMENTATION.md`
- **Architecture Guide**: `docs/ARCHITECTURE.md`
- **Project README**: `README.md`

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in .env or kill process on port 5000

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution:** Run `npm install`

## 🔑 Default Credentials

**Admin Account:**
- Email: `admin@bizysdrizzles.com`
- Password: `admin123`
- Role: `admin`

**⚠️ Change this password in production!**

## 📞 Need Help?

- Check `README.md` for detailed information
- Review `docs/API_DOCUMENTATION.md` for all endpoints
- Read `docs/ARCHITECTURE.md` for technical details

---

**Happy Coding! 🎉**
