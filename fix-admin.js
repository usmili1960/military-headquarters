const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('./server/models/Admin');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Deleting old admin...');
  await Admin.deleteOne({ email: 'admin@military.gov' });
  
  console.log('Creating new admin with PLAIN password (model will hash it)...');
  
  const admin = new Admin({
    adminId: 'ADMIN-001',
    email: 'admin@military.gov',
    password: 'Admin@12345',  // Plain password - model will hash it
    fullName: 'System Administrator',
    role: 'superadmin',
    isActive: true
  });
  
  await admin.save();
  console.log('✅ Admin created successfully');
  
  // Verify using the model's comparePassword method
  const test = await admin.comparePassword('Admin@12345');
  console.log('Password verification test:', test ? '✅ PASS' : '❌ FAIL');
  
  mongoose.connection.close();
}).catch(err => console.error('Error:', err.message));
