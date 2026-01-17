const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./server/models/Admin');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  const admin = await Admin.findOne({ email: 'admin@military.gov' });
  if (admin) {
    console.log('✅ Admin exists');
    console.log('Email:', admin.email);
    const match = await bcrypt.compare('Admin@12345', admin.password);
    console.log('Password test:', match ? '✅ VALID' : '❌ INVALID');
  } else {
    console.log('❌ Admin NOT found - Creating...');
    const hashedPassword = await bcrypt.hash('Admin@12345', 10);
    const newAdmin = new Admin({
      adminId: 'ADMIN-001',
      email: 'admin@military.gov',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'superadmin',
      permissions: ['view_users', 'edit_users', 'delete_users', 'assign_procedures', 'manage_procedures', 'view_reports', 'manage_admins', 'view_logs', 'export_data'],
    });
    await newAdmin.save();
    console.log('✅ Admin created');
  }
  mongoose.connection.close();
}).catch(err => console.error('Error:', err.message));
