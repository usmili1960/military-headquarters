const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./server/models/Admin');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Resetting admin password...');
  
  const admin = await Admin.findOne({ email: 'admin@military.gov' });
  if (admin) {
    admin.password = await bcrypt.hash('Admin@12345', 10);
    await admin.save();
    console.log('✅ Password reset successfully');
    console.log('Email: admin@military.gov');
    console.log('Password: Admin@12345');
  } else {
    console.log('❌ Admin not found');
  }
  
  mongoose.connection.close();
}).catch(err => console.error('Error:', err.message));
