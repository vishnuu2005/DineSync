const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Table = require('./models/Table');
const Feedback = require('./models/Feedback');
const Floor = require('./models/Floor');
const Category = require('./models/Category');
const PaymentTransaction = require('./models/PaymentTransaction');
const RestaurantSettings = require('./models/RestaurantSettings');
const AuditLog = require('./models/AuditLog');

dotenv.config();

const sampleFloors = [
  { name: 'Ground Floor', description: 'Main cozy café floor with patio access', displayOrder: 1, isActive: true },
  { name: 'First Floor', description: 'Quiet lounge and mezzanine seating', displayOrder: 2, isActive: true },
  { name: 'Rooftop Terrace', description: 'Open-air panoramic dining area', displayOrder: 3, isActive: true },
];

const sampleCategories = [
  { name: 'Coffee', description: 'Freshly roasted single-origin espresso and artisanal blends', displayOrder: 1 },
  { name: 'Tea', description: 'Whole-leaf teas, infusions, and spiced chai', displayOrder: 2 },
  { name: 'Breakfast', description: 'All-day hearty breakfast toasts, bowls, and specials', displayOrder: 3 },
  { name: 'Snacks', description: 'Gourmet sandwiches, loaded fries, and bites', displayOrder: 4 },
  { name: 'Desserts', description: 'Handcrafted pastries, cakes, and warm brownies', displayOrder: 5 },
  { name: 'Other', description: 'Refreshing beverages, coolers, and sides', displayOrder: 6 },
];

const sampleProducts = [
  {
    name: 'Espresso',
    description: 'Rich, bold, concentrated shot of pure dark roasted Arabica coffee beans.',
    price: 120,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 5,
  },
  {
    name: 'Cappuccino',
    description: 'Espresso topped with equal parts steamed milk and thick velvet milk foam.',
    price: 160,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 8,
  },
  {
    name: 'Cafe Latte',
    description: 'Smooth espresso combined with generous steamed milk and a light foam layer.',
    price: 180,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 8,
  },
  {
    name: 'Americano',
    description: 'Double shot of rich espresso diluted with hot filtered water for a clean body.',
    price: 140,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 5,
  },
  {
    name: 'Mocha',
    description: 'Espresso infused with rich dark chocolate, steamed milk, and whipped cream.',
    price: 200,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 10,
  },
  {
    name: 'Cold Coffee',
    description: 'Chilled brewed coffee blended with vanilla cream and served over crushed ice.',
    price: 180,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 7,
  },
  {
    name: 'Iced Latte',
    description: 'Espresso poured over ice cubes and finished with chilled fresh whole milk.',
    price: 190,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 7,
  },
  {
    name: 'Caramel Macchiato',
    description: 'Freshly steamed milk with vanilla-flavored syrup marked with espresso & caramel drizzle.',
    price: 220,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 10,
  },
  {
    name: 'Masala Chai',
    description: 'Traditional spiced Indian tea brewed with cardamom, ginger, cloves, and milk.',
    price: 90,
    category: 'Tea',
    image: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 8,
  },
  {
    name: 'Organic Green Tea',
    description: 'Refreshing whole-leaf green tea with subtle floral notes and antioxidants.',
    price: 110,
    category: 'Tea',
    image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 6,
  },
  {
    name: 'Grilled Cheese Sandwich',
    description: 'Artisanal sourdough stuffed with melted cheddar, mozzarella, and herbs.',
    price: 180,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 12,
  },
  {
    name: 'Classic Veg Burger',
    description: 'Crispy veggie patty with lettuce, tomato, special sauce in a toasted brioche bun.',
    price: 220,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 15,
  },
  {
    name: 'French Fries',
    description: 'Golden crispy potato fries seasoned with sea salt and herbs, served with dip.',
    price: 120,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 10,
  },
  {
    name: 'Garlic Bread with Cheese',
    description: 'Toasted baguette slices smothered in garlic herb butter and melted mozzarella.',
    price: 150,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 10,
  },
  {
    name: 'Avocado Toast',
    description: 'Smashed avocado, cherry tomatoes, microgreens, and poached egg on toasted sourdough.',
    price: 240,
    category: 'Breakfast',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 12,
  },
  {
    name: 'Fudge Chocolate Brownie',
    description: 'Warm, gooey chocolate fudge brownie served with vanilla bean ice cream.',
    price: 130,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 5,
  },
  {
    name: 'Blueberry Muffin',
    description: 'Freshly baked fluffy muffin packed with wild blueberries and crumble topping.',
    price: 100,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 5,
  },
  {
    name: 'Red Velvet Cake',
    description: 'Decadent red velvet sponge layers with smooth cream cheese frosting.',
    price: 180,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 5,
  },
  {
    name: 'Fresh Lemon Mint Cooler',
    description: 'Chilled sparkling lemonade infused with crushed fresh mint leaves and rock salt.',
    price: 120,
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 5,
  },
  {
    name: 'Mango Passion Smoothie',
    description: 'Luscious tropical mango puree blended with Greek yogurt and passionfruit drizzle.',
    price: 160,
    category: 'Other',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80',
    available: true,
    type: 'veg',
    preparationTimeMinutes: 6,
  },
];

const connectDB = require('./config/db');

const seedDatabase = async (exitOnComplete = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
      console.log('Connected to MongoDB for DineSync initialization...');
    }

    // Seed Floors
    console.log('Synchronizing restaurant floors...');
    const createdFloors = [];
    for (const f of sampleFloors) {
      const floor = await Floor.findOneAndUpdate(
        { name: f.name },
        { ...f },
        { upsert: true, new: true }
      );
      createdFloors.push(floor);
    }
    const groundFloorDoc = createdFloors.find((f) => f.name === 'Ground Floor');
    const firstFloorDoc = createdFloors.find((f) => f.name === 'First Floor');
    const rooftopFloorDoc = createdFloors.find((f) => f.name === 'Rooftop Terrace');

    // Seed Categories
    console.log('Synchronizing menu categories...');
    const categoryMap = {};
    for (const cat of sampleCategories) {
      const categoryDoc = await Category.findOneAndUpdate(
        { name: cat.name },
        { ...cat },
        { upsert: true, new: true }
      );
      categoryMap[cat.name] = categoryDoc._id;
    }

    // Seed Tables with Floor associations & unique QR tokens
    console.log('Synchronizing tables and QR tokens...');
    const sampleTables = [
      // Ground Floor Tables (1 to 7 / G-01 to G-07)
      { tableNumber: '1', floor: 'Ground Floor', floorId: groundFloorDoc._id, capacity: 2, status: 'Available' },
      { tableNumber: '2', floor: 'Ground Floor', floorId: groundFloorDoc._id, capacity: 4, status: 'Available' },
      { tableNumber: '3', floor: 'Ground Floor', floorId: groundFloorDoc._id, capacity: 4, status: 'Available' },
      { tableNumber: '4', floor: 'Ground Floor', floorId: groundFloorDoc._id, capacity: 6, status: 'Available' },
      { tableNumber: '5', floor: 'Ground Floor', floorId: groundFloorDoc._id, capacity: 4, status: 'Available' },
      { tableNumber: '6', floor: 'Ground Floor', floorId: groundFloorDoc._id, capacity: 2, status: 'Available' },
      { tableNumber: '7', floor: 'Ground Floor', floorId: groundFloorDoc._id, capacity: 4, status: 'Available' },
      // First Floor Tables (8 to 15 / F-01 to F-08)
      { tableNumber: '8', floor: 'First Floor', floorId: firstFloorDoc._id, capacity: 2, status: 'Available' },
      { tableNumber: '9', floor: 'First Floor', floorId: firstFloorDoc._id, capacity: 4, status: 'Available' },
      { tableNumber: '10', floor: 'First Floor', floorId: firstFloorDoc._id, capacity: 4, status: 'Available' },
      { tableNumber: '11', floor: 'First Floor', floorId: firstFloorDoc._id, capacity: 6, status: 'Available' },
      { tableNumber: '12', floor: 'First Floor', floorId: firstFloorDoc._id, capacity: 4, status: 'Available' },
      { tableNumber: '13', floor: 'First Floor', floorId: firstFloorDoc._id, capacity: 2, status: 'Available' },
      { tableNumber: '14', floor: 'First Floor', floorId: firstFloorDoc._id, capacity: 4, status: 'Available' },
      { tableNumber: '15', floor: 'First Floor', floorId: firstFloorDoc._id, capacity: 6, status: 'Available' },
      // Rooftop Terrace Tables
      { tableNumber: '16', floor: 'Rooftop Terrace', floorId: rooftopFloorDoc._id, capacity: 4, status: 'Available' },
      { tableNumber: '17', floor: 'Rooftop Terrace', floorId: rooftopFloorDoc._id, capacity: 6, status: 'Available' },
    ];

    for (const t of sampleTables) {
      const existing = await Table.findOne({ tableNumber: t.tableNumber });
      if (!existing) {
        await Table.create({
          ...t,
          qrToken: crypto.randomBytes(16).toString('hex'),
        });
      } else {
        // Ensure floorId, floor, and capacity are preserved or populated
        existing.floor = t.floor;
        existing.floorId = t.floorId;
        if (!existing.qrToken) {
          existing.qrToken = crypto.randomBytes(16).toString('hex');
        }
        await existing.save();
      }
    }

    // Seed Products
    console.log('Synchronizing menu products...');
    await Product.deleteMany({ name: { $regex: /^caf. latte/i } });
    for (const p of sampleProducts) {
      await Product.findOneAndUpdate(
        { name: p.name },
        {
          ...p,
          categoryId: categoryMap[p.category],
          priceInPaise: Math.round(p.price * 100),
          isArchived: false,
        },
        { upsert: true, new: true }
      );
    }

    // Seed Users: Admin, Chef, Waiter, Customer
    console.log('Synchronizing staff and demo accounts...');
    const usersToSeed = [
      {
        name: 'DineSync Admin',
        email: 'admin@cafe.com',
        phone: '9876543210',
        password: 'admin123',
        role: 'admin',
      },
      {
        name: 'Head Chef Mario',
        email: 'chef@cafe.com',
        phone: '9876500001',
        password: 'chef123',
        role: 'chef',
      },
      {
        name: 'Floor Captain Liam',
        email: 'waiter@cafe.com',
        phone: '9876500002',
        password: 'waiter123',
        role: 'waiter',
      },
      {
        name: 'Sarah Jenkins',
        email: 'customer@cafe.com',
        phone: '9123456789',
        password: 'customer123',
        role: 'customer',
      },
    ];

    for (const u of usersToSeed) {
      const userExists = await User.findOne({ email: u.email });
      if (!userExists) {
        await User.create(u);
      }
    }

    // Seed Restaurant Settings
    await RestaurantSettings.findOneAndUpdate(
      {},
      {
        restaurantName: process.env.RESTAURANT_NAME || 'DineSync Demo Restaurant',
        tagline: 'Artisan Coffee & Culinary Experience',
        gstin: process.env.RESTAURANT_GSTIN || '29ABCDE1234F1Z5',
        address: process.env.RESTAURANT_ADDRESS || '100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
        phone: process.env.RESTAURANT_PHONE || '+91 98765 43210',
        email: process.env.RESTAURANT_EMAIL || 'contact@dinesync.com',
        currency: 'INR',
        currencySymbol: '₹',
        taxRatePercent: 5.0,
        paymentMode: 'test',
        requirePaymentBeforeKitchen: true,
        allowGuestOrdering: true,
      },
      { upsert: true, new: true }
    );

    // Seed Sample Live Active Kitchen Orders if none exist
    const activeOrderCount = await Order.countDocuments();
    if (activeOrderCount === 0) {
      console.log('Seeding initial active live kitchen orders...');
      const sampleProd = (await Product.findOne({ name: 'Caramel Macchiato' })) || (await Product.findOne());
      const table1 = await Table.findOne({ tableNumber: '1' });
      const table3 = await Table.findOne({ tableNumber: '3' });
      const table10 = await Table.findOne({ tableNumber: '10' });

      if (sampleProd && table1) {
        await Order.create({
          orderNumber: 'ORD-1001',
          table: table1._id,
          tableNumber: table1.tableNumber,
          floor: table1.floor,
          numberOfPersons: 2,
          customerName: 'Aarav Sharma',
          customerPhone: '9876543210',
          items: [
            {
              product: sampleProd._id,
              name: sampleProd.name,
              quantity: 2,
              price: sampleProd.price,
              priceInPaise: sampleProd.priceInPaise,
              image: sampleProd.image,
              type: sampleProd.type,
            },
          ],
          subtotal: sampleProd.price * 2,
          tax: Math.round(sampleProd.price * 2 * 0.05 * 100) / 100,
          totalAmount: Math.round(sampleProd.price * 2 * 1.05 * 100) / 100,
          paymentStatus: 'PAID',
          status: 'Confirmed',
          invoiceNumber: 'INV-20261020-0001',
          paidAt: new Date(Date.now() - 5 * 60 * 1000),
        });

        table1.status = 'Occupied';
        await table1.save();
      }

      if (sampleProd && table3) {
        await Order.create({
          orderNumber: 'ORD-1002',
          table: table3._id,
          tableNumber: table3.tableNumber,
          floor: table3.floor,
          numberOfPersons: 4,
          customerName: 'Priya Patel',
          customerPhone: '9876543211',
          items: [
            {
              product: sampleProd._id,
              name: sampleProd.name,
              quantity: 3,
              price: sampleProd.price,
              priceInPaise: sampleProd.priceInPaise,
              image: sampleProd.image,
              type: sampleProd.type,
            },
          ],
          subtotal: sampleProd.price * 3,
          tax: Math.round(sampleProd.price * 3 * 0.05 * 100) / 100,
          totalAmount: Math.round(sampleProd.price * 3 * 1.05 * 100) / 100,
          paymentStatus: 'PAID',
          status: 'Preparing',
          invoiceNumber: 'INV-20261020-0002',
          paidAt: new Date(Date.now() - 12 * 60 * 1000),
          preparedAt: new Date(Date.now() - 4 * 60 * 1000),
        });

        table3.status = 'Occupied';
        await table3.save();
      }

      if (sampleProd && table10) {
        await Order.create({
          orderNumber: 'ORD-1003',
          table: table10._id,
          tableNumber: table10.tableNumber,
          floor: table10.floor,
          numberOfPersons: 2,
          customerName: 'Rahul Verma',
          customerPhone: '9876543212',
          items: [
            {
              product: sampleProd._id,
              name: sampleProd.name,
              quantity: 1,
              price: sampleProd.price,
              priceInPaise: sampleProd.priceInPaise,
              image: sampleProd.image,
              type: sampleProd.type,
            },
          ],
          subtotal: sampleProd.price,
          tax: Math.round(sampleProd.price * 0.05 * 100) / 100,
          totalAmount: Math.round(sampleProd.price * 1.05 * 100) / 100,
          paymentStatus: 'PAID',
          status: 'Ready',
          invoiceNumber: 'INV-20261020-0003',
          paidAt: new Date(Date.now() - 18 * 60 * 1000),
          preparedAt: new Date(Date.now() - 10 * 60 * 1000),
        });

        table10.status = 'Occupied';
        await table10.save();
      }
    }

    // Seed Audit Log for bootstrap
    await AuditLog.create({
      action: 'SYSTEM_BOOTSTRAP',
      performedByName: 'System Initializer',
      role: 'system',
      targetType: 'Settings',
      details: {
        message: 'DineSync database synchronized with dynamic floors, categories, tables, and staff.',
      },
    });

    console.log('✅ DineSync database synchronized successfully!');
    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seeding error:', error);
    if (exitOnComplete) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = seedDatabase;
