# Military Headquarters Website - Quick Start Guide

## Installation Requirements

### Option 1: Using Node.js (Recommended)

1. **Download and Install Node.js**
   - Visit https://nodejs.org/
   - Download LTS version (v18 or newer)
   - Run the installer and follow the setup wizard
   - Add Node.js to your PATH

2. **Install Dependencies**
   ```bash
   cd "c:\Users\Gustavo Pablo\OneDrive\Desktop\Mili"
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the Application**
   - Open browser: http://localhost:3000
   - Homepage will load automatically

### Option 2: Using Python (Simple HTTP Server)

If you don't want to install Node.js:

1. **Open PowerShell in the src/pages directory**
   ```bash
   cd "c:\Users\Gustavo Pablo\OneDrive\Desktop\Mili\src\pages"
   ```

2. **Start Python HTTP Server**
   ```bash
   python -m http.server 8000
   ```

3. **Access the Application**
   - Open browser: http://localhost:8000/index.html

### Option 3: Direct File Opening

Simply open the HTML files directly in your browser:
- `src/pages/index.html` - Homepage
- `src/pages/user-dashboard.html` - User Interface
- `src/pages/admin-dashboard.html` - Admin Interface

## Project Structure

```
Mili/
├── src/
│   ├── pages/
│   │   ├── index.html              (Homepage)
│   │   ├── user-dashboard.html     (User Interface)
│   │   └── admin-dashboard.html    (Admin Interface)
│   ├── css/
│   │   ├── style.css               (Global styles)
│   │   ├── homepage.css            (Homepage styles)
│   │   ├── user-dashboard.css      (User dashboard styles)
│   │   └── admin-dashboard.css     (Admin dashboard styles)
│   ├── js/
│   │   ├── translations.js         (Multi-language support)
│   │   ├── homepage.js             (Homepage functionality)
│   │   ├── user-dashboard.js       (User dashboard functionality)
│   │   └── admin-dashboard.js      (Admin dashboard functionality)
│   └── assets/                     (Images folder)
├── images/
│   └── premium_photo-1661964069634-2f493e28a14c.avif (Background image)
├── server/
│   └── app.js                      (Express backend server)
├── package.json                    (Dependencies)
├── .env.example                    (Environment variables template)
├── README.md                       (Documentation)
└── QUICK_START.md                  (This file)
```

## Features Overview

### Homepage Features
✅ Military title and statistics
✅ Military branches slideshow (6 branches)
✅ Language switcher (4 languages)
✅ User/Admin login modals
✅ User registration with verification
✅ Responsive design

### User Interface Features
✅ User profile with passport picture
✅ Active status indicator
✅ Procedures list (admin editable)
✅ Spouse information section
✅ Notification system
✅ Language switcher
✅ Logout confirmation

### Admin Interface Features
✅ User management and search
✅ Email composition
✅ User detail viewing
✅ Status toggle (ACTIVE/INACTIVE)
✅ Procedures management
✅ Spouse information editing
✅ User procedures management

## Testing the Application

### Test User Credentials

**User Login:**
- Military ID: NSS-123456
- Password: password123 (any password works in demo)

**Admin Login:**
- Email: admin@military.gov
- Password: admin123 (any password works in demo)

**User Registration:**
- Fill out all fields
- Military ID must be in format: NSS-XXXXXX
- You'll receive a verification code (any 6 digits work in demo)
- After verification, use credentials to login

## Supported Languages

1. 🇺🇸 English (Default)
2. 🇯🇵 日本語 (Japanese)
3. 🇪🇸 Español (Spanish)
4. 🇰🇷 한국어 (Korean)

Click the globe icon in the top-right to switch languages.

## Browser Compatibility

- ✅ Google Chrome
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ✅ Safari

## Military ID Format

Military IDs must follow this format:
- **Format**: NSS-XXXXXX
- **Example**: NSS-123456
- **Rules**: NSS prefix + hyphen + 6 digits

## File Upload Notes

During user registration, you can upload:
- Passport picture (any image file)

In the user dashboard, you can upload:
- Spouse driver's license (front and back sides)

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
npm start -- --port 3001
```

### Images Not Loading
Place image files in `src/assets/` folder with these names:
- usa-legal-bureau-logo.png
- army-logo.png
- navy-logo.png
- airforce-logo.png
- marines-logo.png
- coastguard-logo.png
- spaceforce-logo.png
- usa-army-logo.png
- default-avatar.png

### Styles Not Loading
Clear browser cache (Ctrl+Shift+Delete) and refresh page.

## Project Status

✅ **Frontend**: Fully developed with HTML/CSS/JavaScript
✅ **Backend**: Express server ready
✅ **Multi-language**: 4 languages supported
✅ **Responsive**: Mobile and desktop optimized

## Next Steps

1. Install required images in `src/assets/` folder
2. Connect to database (MongoDB/PostgreSQL)
3. Implement backend APIs with authentication
4. Add email verification system
5. Deploy to production server

## Support

For issues or questions, refer to the README.md file.

---

**Version**: 1.0.0
**Last Updated**: December 22, 2025
