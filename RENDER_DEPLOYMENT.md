# 🚀 Deployment Guide - Render.com

## ✅ GitHub Updated Successfully!

Your changes have been pushed to GitHub:
- Repository: https://github.com/usmili1960/military-headquarters
- Latest commit: MongoDB integration with cookie-based sessions

## 🌐 Deploy to Render.com

### Quick Deploy (Recommended)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Login with your account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select repository: `usmili1960/military-headquarters`
   - Click "Connect"

3. **Configure the Service**
   ```
   Name: military-headquarters
   Region: Oregon (US West) or closest to you
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **Add Environment Variables**
   Click "Environment" tab and add:
   
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-secret-key-here-change-this
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/military-hq?retryWrites=true&w=majority
   ```

   **IMPORTANT:** Replace `MONGODB_URI` with your MongoDB Atlas connection string!

5. **Deploy**
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Your site will be live at: `https://military-headquarters.onrender.com`

---

## 📋 MongoDB Atlas Setup (Required!)

Your app **requires MongoDB** to work. Set it up first:

### Quick MongoDB Atlas Setup

1. **Create Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up (FREE, no credit card needed)

2. **Create Cluster**
   - Click "Build a Database"
   - Choose **FREE** tier (M0)
   - Select cloud provider: AWS
   - Region: Choose closest to Render region
   - Click "Create"

3. **Create Database User**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Username: `military-hq-admin`
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Allow Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Example: `mongodb+srv://military-hq-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/military-hq?retryWrites=true&w=majority`

6. **Add to Render**
   - Go back to Render dashboard
   - Find your web service
   - Go to "Environment" tab
   - Add or update `MONGODB_URI` with your connection string
   - Click "Save Changes"
   - Service will automatically redeploy

---

## 🔧 Alternative: Manual Render Setup

If you prefer manual setup instead of render.yaml:

### Step 1: Create Service

```bash
# Or use Render Dashboard UI
Service Type: Web Service
Repository: https://github.com/usmili1960/military-headquarters
Branch: main
```

### Step 2: Build Settings

```bash
Build Command: npm install
Start Command: npm start
```

### Step 3: Environment Variables

Add these in Render Dashboard:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `JWT_SECRET` | `military-hq-secure-secret-2026-production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |

### Step 4: Advanced Settings

- **Health Check Path**: `/health`
- **Auto-Deploy**: Yes (deploys on every git push)
- **Plan**: Free

---

## ✅ Verify Deployment

### 1. Check Service Status

Go to your Render dashboard → Your service
- Status should show "Live" (green)
- Logs should show: "✅ MongoDB Connected Successfully"

### 2. Test Your Website

Visit your Render URL (e.g., `https://military-headquarters.onrender.com`)

**Test these features:**

1. **Homepage loads** ✅
   ```
   https://your-app.onrender.com/
   ```

2. **Health check works** ✅
   ```
   https://your-app.onrender.com/health
   ```
   Should return:
   ```json
   {
     "status": "ok",
     "mongodb": "connected",
     "timestamp": "2026-01-11T..."
   }
   ```

3. **Register a user** ✅
   - Click "Sign Up"
   - Fill form and register
   - Should succeed

4. **Login as user** ✅
   - Login with registered credentials
   - Dashboard should load
   - **Refresh page** → Still logged in ✅

5. **Admin login** ✅
   ```
   https://your-app.onrender.com/admin-login.html
   Email: admin@military.gov
   Password: Admin@12345
   ```
   - Login should work
   - Dashboard should load with users
   - **Refresh page** → Still logged in ✅

---

## 🔄 Auto-Deploy Enabled

Every time you push to GitHub, Render will automatically:
1. Detect the push
2. Pull latest code
3. Run `npm install`
4. Run `npm start`
5. Deploy new version
6. Notify you when complete

To push future changes:
```bash
cd "/mnt/chromeos/removable/USB Drive/Download/Mili.osmosis (1)/Mili"
git add .
git commit -m "your commit message"
git push origin main
```

Render will deploy automatically in 2-5 minutes!

---

## 📊 What's Been Deployed

### Features Now Live Globally:

✅ **MongoDB Database Integration**
- All user data stored in MongoDB Atlas
- Password hashing with bcryptjs
- Persistent data across restarts

✅ **JWT Authentication**
- Secure token-based authentication
- Cookie-based sessions (not localStorage)
- Sessions survive page refresh

✅ **Admin Panel**
- Real authentication with MongoDB
- View/manage all users
- Full CRUD operations

✅ **User Dashboard**
- Secure user login
- Profile management
- Procedure tracking

✅ **Session Persistence**
- Sessions survive page refresh
- No localStorage dependencies
- Works perfectly on hosted environment

---

## 🚨 Important Notes

### Free Tier Limitations (Render.com)

- ⏱️ Service spins down after 15 minutes of inactivity
- 🔄 First request after spin-down takes 30-60 seconds
- 💾 750 hours/month free (enough for 1 service 24/7)
- 🌐 Custom domain requires paid plan

### Free Tier Limitations (MongoDB Atlas)

- 💾 512 MB storage (plenty for thousands of users)
- 🔄 Shared cluster
- 🌐 No VPC peering
- ⚡ Sufficient for development and small production apps

### To Upgrade (Optional)

**Render:** $7/month for always-on service  
**MongoDB Atlas:** Free tier is usually sufficient

---

## 🆘 Troubleshooting

### "Database unavailable" error

**Problem:** MongoDB not connected

**Solution:**
1. Check `MONGODB_URI` in Render environment variables
2. Verify MongoDB Atlas cluster is running
3. Check Network Access allows 0.0.0.0/0
4. Check database user password is correct

### "Service Unavailable" after deploy

**Problem:** Service is starting or crashed

**Solution:**
1. Check Render logs (Dashboard → Your Service → Logs)
2. Look for error messages
3. Verify all environment variables are set
4. Check MongoDB connection string is valid

### Admin login not working

**Problem:** Admin account not created

**Solution:**
1. Check Render logs for "✅ Default admin account created"
2. Restart service (Dashboard → Manual Deploy)
3. Verify MongoDB is connected

### Sessions not persisting

**Problem:** Cookies not working

**Solution:**
1. Check browser allows cookies
2. CORS should allow credentials (already configured)
3. Check Render URL uses HTTPS (automatically enabled)

---

## 📞 Support

### Check Status

1. **Render Logs**
   ```
   Dashboard → Your Service → Logs tab
   ```

2. **Health Check**
   ```
   https://your-app.onrender.com/health
   ```

3. **MongoDB Logs**
   ```
   Atlas Dashboard → Clusters → Metrics
   ```

### Common Commands

```bash
# Check local git status
git status

# Pull latest from GitHub
git pull origin main

# View Render logs (if CLI installed)
render logs -f

# Restart Render service
# Go to Dashboard → Manual Deploy → Deploy latest commit
```

---

## 🎉 Your Site is Live!

**GitHub Repository:**
https://github.com/usmili1960/military-headquarters

**Render Deployment:**
After setup: `https://your-app-name.onrender.com`

**Admin Credentials:**
- Email: `admin@military.gov`
- Password: `Admin@12345`

**Next Steps:**
1. ✅ Setup MongoDB Atlas (5 minutes)
2. ✅ Create Render service (3 minutes)
3. ✅ Add environment variables
4. ✅ Deploy and test
5. 🎉 Share your live URL!

---

## 📝 Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Render service created
- [ ] GitHub repo connected
- [ ] Environment variables added:
  - [ ] NODE_ENV
  - [ ] PORT
  - [ ] JWT_SECRET
  - [ ] MONGODB_URI
- [ ] Service deployed successfully
- [ ] Health check returns "mongodb": "connected"
- [ ] Can register new user
- [ ] Can login as user
- [ ] Can login as admin
- [ ] Sessions persist after refresh

**Once all checked, your site is globally accessible!** 🚀
