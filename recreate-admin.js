const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./server/models/Admin');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Deleting old admin...');
  await Admin.deleteOne({ email: 'admin@military.gov' });
  
  console.log('Creating new admin...');
  const hashedPassword = await bcrypt.hash('Admin@12345', 10);
  
  const admin = new Admin({
    adminId: 'ADMIN-001',
    email: 'admin@military.gov',
    password: hashedPassword,
    fullName: 'System Administrator',
    role: 'superadmin',
    permissions: ['view_users', 'edit_users', 'delete_users', 'assign_procedures', 'manage_procedures', 'view_reports', 'manage_admins', 'view_logs', 'export_data'],
    isActive: true
  });
  
  await admin.save();
  console.log('✅ Admin created successfully');
  
  // Verify password
  const test = await bcrypt.compare('Admin@12345', admin.password);
  console.log('Password verification test:', test ? '✅ PASS' : '❌ FAIL');
  
  mongoose.connection.close();
}).catch(err => console.error('Error:', err.message));
