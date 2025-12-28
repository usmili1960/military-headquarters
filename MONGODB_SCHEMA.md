# MongoDB Schema Documentation for Military Headquarters

## Collections Overview

### 1. Users Collection

Stores all military personnel information with role-based access control.

```javascript
{
  _id: ObjectId,
  userId: Number,
  militaryId: String (format: NSS-XXXXXX, unique),
  fullName: String,
  email: String (unique),
  mobile: String,
  dob: Date,
  rank: String (enum: ['Recruit', 'Private', 'Corporal', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General']),
  status: String (enum: ['active', 'inactive', 'retired', 'deceased']),
  password: String (hashed with bcryptjs),
  photoUrl: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  spouse: {
    name: String,
    email: String,
    mobile: String,
    relationship: String,
    dob: Date
  },
  dependents: [
    {
      name: String,
      relationship: String,
      dob: Date,
      status: String
    }
  ],
  healthStatus: {
    bloodType: String,
    allergies: String,
    medicalConditions: String,
    lastCheckup: Date,
    lastVaccine: Date
  },
  procedures: [
    {
      procedureId: ObjectId,
      name: String,
      description: String,
      assignedDate: Date,
      dueDate: Date,
      completionDate: Date,
      status: String (enum: ['pending', 'in-progress', 'completed', 'rejected']),
      priority: String (enum: ['low', 'medium', 'high']),
      assignedBy: ObjectId (reference to admin user)
    }
  ],
  roles: [String] (enum: ['user', 'admin', 'supervisor']),
  isVerified: Boolean,
  verificationCode: String,
  verificationCodeExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  loginHistory: [
    {
      timestamp: Date,
      ipAddress: String,
      userAgent: String,
      status: String
    }
  ],
  auditLog: [
    {
      timestamp: Date,
      action: String,
      details: String,
      changedBy: ObjectId
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  deletedAt: Date (soft delete)
}
```

### 2. Procedures Collection

Master list of military procedures that can be assigned to users.

```javascript
{
  _id: ObjectId,
  procedureId: Number,
  name: String,
  category: String (enum: ['medical', 'training', 'administrative', 'security']),
  description: String,
  requirements: [String],
  estimatedDuration: Number (in hours),
  priority: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Admin Collection

Stores admin user credentials and permissions.

```javascript
{
  _id: ObjectId,
  adminId: String,
  email: String (unique),
  password: String (hashed),
  fullName: String,
  role: String (enum: ['superadmin', 'admin', 'moderator']),
  permissions: [String],
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Sessions Collection

Stores user session information for authentication.

```javascript
{
  _id: ObjectId,
  sessionId: String,
  userId: ObjectId,
  token: String (JWT),
  refreshToken: String,
  ipAddress: String,
  userAgent: String,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Logs Collection

Audit trail for all system actions.

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  action: String,
  resource: String,
  oldValue: Object,
  newValue: Object,
  ipAddress: String,
  userAgent: String,
  status: String (enum: ['success', 'failure']),
  errorMessage: String,
  createdAt: Date
}
```

### 6. Files Collection

Stores file metadata for uploaded documents.

```javascript
{
  _id: ObjectId,
  fileName: String,
  originalName: String,
  mimeType: String,
  size: Number,
  uploadedBy: ObjectId,
  uploadedFor: ObjectId,
  fileType: String (enum: ['passport', 'certificate', 'document']),
  url: String,
  createdAt: Date,
  expiresAt: Date
}
```

## Indexes for Performance

```javascript
// Users Collection
db.users.createIndex({ militaryId: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ status: 1 });
db.users.createIndex({ rank: 1 });
db.users.createIndex({ createdAt: -1 });

// Procedures Collection
db.procedures.createIndex({ name: 1 });
db.procedures.createIndex({ category: 1 });

// Sessions Collection
db.sessions.createIndex({ userId: 1 });
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Logs Collection
db.logs.createIndex({ userId: 1 });
db.logs.createIndex({ createdAt: -1 });
```

## Data Relationships

```
Users (1) -----> (Many) Procedures
Users (1) -----> (Many) Sessions
Users (1) -----> (Many) Files
Users (1) -----> (Many) Logs
Admin (1) -----> (Many) Users (assigned procedures)
```

## Migration Steps

1. **Create MongoDB database**: military-hq
2. **Create indexes**: Run index creation queries
3. **Import initial data**: Migrate from users.json
4. **Set up backups**: Daily snapshots
5. **Enable sharding**: For production scalability
