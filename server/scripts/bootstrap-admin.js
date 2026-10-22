const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

dotenv.config();

const bootstrapAdmin = async () => {
  try {
    await connectDB();

    const name = process.env.INITIAL_ADMIN_NAME || 'DineSync Super Administrator';
    const email = (process.env.INITIAL_ADMIN_EMAIL || 'admin@cafe.com').trim().toLowerCase();
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';
    const phone = process.env.INITIAL_ADMIN_PHONE || '9876543210';

    let admin = await User.findOne({ email });

    if (admin) {
      admin.name = name;
      admin.role = 'admin';
      admin.phone = phone;
      admin.password = password; // pre-save hook will hash
      await admin.save();
      console.log(`✅ Administrator account updated for email: ${email}`);
    } else {
      admin = await User.create({
        name,
        email,
        phone,
        password,
        role: 'admin',
      });
      console.log(`✅ Initial Administrator account created for email: ${email}`);
    }

    await AuditLog.create({
      action: 'ADMIN_BOOTSTRAP',
      performedByName: 'Bootstrap Script',
      role: 'admin',
      targetType: 'Staff',
      targetId: admin._id.toString(),
      details: { email, message: 'Admin provisioned via bootstrap script' },
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to bootstrap admin:', error);
    process.exit(1);
  }
};

bootstrapAdmin();
