const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../src/models/Product');
const User = require('../src/models/User');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
 
const products = [
  {
    name: 'French Vanilla',
    description: 'Rich and creamy French vanilla coffee sauce. Perfect for adding a smooth, sweet vanilla flavor to your favorite coffee drinks.',
    price: 12.99,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500',
    isActive: true,
    type: 'sauce'
  },
  {
    name: 'White Mocha',
    description: 'Luxurious white chocolate mocha sauce. Indulgent and velvety, this sauce brings the perfect blend of white chocolate sweetness to your beverages.',
    price: 14.99,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500',
    isActive: true,
    type: 'sauce'
  },
  {
    name: 'Bundle (French Vanilla + White Mocha)',
    description: 'Get both of our signature sauces in one convenient bundle! Save money while enjoying the best of both worlds - creamy French Vanilla and rich White Mocha.',
    price: 24.99,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500',
    isActive: true,
    type: 'bundle'
  },
];

const adminUser = {
  fullName: 'Aya Enaba',
  email: 'admin@bizysdrizzles.com',
  phoneNumber: '1234567890',
  password: 'admin123',
  role: 'admin',
   saucesOrderedCount: 0 
};

const seedDB = async () => {
  try {
    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({ email: adminUser.email });

    // Insert products
    const createdProducts = await Product.insertMany(products);
    console.log('✅ Products seeded successfully');
    console.log(`   - ${createdProducts.length} products created`);

    // Create admin user
    const admin = await User.create(adminUser);
    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${admin.role}`);

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
