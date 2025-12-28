# Military Headquarters Website

United States Military Headquarters - Washington DC

## Project Structure

```text
military-hq/
├── src/
│   ├── pages/
│   │   ├── index.html (Homepage)
│   │   ├── user-dashboard.html (User Interface)
│   │   └── admin-dashboard.html (Admin Interface)
│   ├── css/
│   │   ├── style.css (Global styles)
│   │   ├── homepage.css (Homepage specific)
│   │   ├── user-dashboard.css (User dashboard specific)
│   │   └── admin-dashboard.css (Admin dashboard specific)
│   ├── js/
│   │   ├── translations.js (Multi-language support)
│   │   ├── homepage.js (Homepage functionality)
│   │   ├── user-dashboard.js (User dashboard functionality)
│   │   └── admin-dashboard.js (Admin dashboard functionality)
│   └── assets/ (Images and media files)
├── server/
│   └── app.js (Express backend server)
├── package.json
├── .env.example
└── README.md
```

## Features

### Homepage

- ✅ Centered title "UNITED STATES MILITARY HEADQUARTERS (Washington DC)"
- ✅ Language switcher (English, Japanese, Spanish, Korean)
- ✅ Login/Signup modal with "Welcome Comrade" greeting
- ✅ USA Legal Affairs Bureau logo (top-left)
- ✅ Military branches slideshow with descriptions (6 branches)
- ✅ Statistics: 1,332,370 active personnel, 51,456 resignation procedures
- ✅ Information about U.S. Military
- ✅ Transparent USA flag background pattern
- ✅ Separate Admin login section

### User Registration

- ✅ Email/Mobile number
- ✅ Full name
- ✅ Military ID (NSS-XXXXXX format)
- ✅ Date of birth
- ✅ Passport picture upload

### User Authentication

- ✅ Military ID (NSS-XXXXXX format)
- ✅ Password authentication
- ✅ Error handling with validation

### User Interface

- ✅ Profile section with circular passport picture
- ✅ Profile information: Full name, Military ID, Email, Mobile, DOB, Rank
- ✅ Spouse information section
- ✅ Procedures table with status (Pending, In Progress, Completed)
- ✅ Language switcher
- ✅ Search functionality
- ✅ Logout functionality

### Admin Interface

- ✅ User list/table with all registered users
- ✅ Search and filter functionality
- ✅ View/Edit user details
- ✅ User status management (Active, Inactive, Suspended)
- ✅ Procedure management (assign procedures to users)
- ✅ Email compose interface
- ✅ Logout functionality

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation & Running

1. **Install Dependencies**

```bash
npm install
```

1. **Configure Environment**

```bash
cp .env.example .env
```

1. **Start the Server**

```bash
npm start
```

Server will run on `http://localhost:3000`

1. **Access the Application**

Open your browser and navigate to:

```text
http://localhost:3000
```

## Testing Credentials

### User Login

- **Military ID**: NSS-123456
- **Password**: any string (no validation yet)

### Admin Authentication

- **Email**: `admin@military.gov`
- **Password**: any string (no validation yet)

## Technology Stack

### Frontend

- HTML5
- CSS3 (with responsive design)
- JavaScript (ES6+)
- Multi-language support (i18n)

### Backend

- Node.js
- Express.js
- CORS support

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login
- `POST /api/auth/verify` - Email verification

### User Management

- `GET /api/user/:militaryId` - Get user profile
- `PUT /api/user/:militaryId` - Update user profile
- `POST /api/user/:militaryId/procedures` - Add procedure to user

### Admin Management

- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user (admin)
- `DELETE /api/admin/users/:id` - Delete user (admin)
- `POST /api/admin/email` - Send email to users

## Key Features

1. **Role-Based Access Control**

   - User dashboard (after login)
   - Admin dashboard (requires admin authentication)
   - Home page (public access)

2. **Data Management**

   - User profile information storage
   - Procedures assignment and tracking
   - Spouse/dependent information

3. **User Experience**

   - Multi-language support (4 languages)
   - Responsive design for all devices
   - Real-time search and filtering
   - Modal dialogs for forms

4. **Security** (Basic Implementation)
   - Military ID format validation (NSS-XXXXXX)
   - localStorage for session management
   - CORS enabled for API requests

## Database Schema

### User Model

```javascript
{
  id: "unique_id",
  fullName: "John Doe",
  militaryId: "NSS-123456",
  email: "john@military.gov",
  mobile: "+1-202-555-0123",
  dob: "1990-01-15",
  rank: "Colonel",
  status: "Active",
  passport: "image_url",
  procedures: [
    {
      id: "proc_1",
      name: "Medical Check",
      status: "Completed"
    }
  ]
}
```

## Development Notes

- Uses in-memory storage (no database yet)
- Data resets on server restart
- No email/SMS integration (logs to console)
- No file upload for passport pictures (uses placeholders)

## Future Enhancements

- [ ] MongoDB integration for persistent storage
- [ ] Real email/SMS verification
- [ ] Password hashing with bcryptjs
- [ ] Passport picture file upload
- [ ] Enhanced security and authentication
- [ ] User activity logging
- [ ] Advanced analytics dashboard
- [ ] Mobile app version

## Project Status

Status: Development in progress

Latest updates:

## Latest Updates

- Fixed admin dashboard user display issues
- Improved error handling and logging
- Enhanced console debugging capabilities
- Multi-language support implemented

## Support

For issues or questions, please check:

- Browser console (F12) for error messages
- Server console for backend logs
- Verify server is running on port 3000

## License

MIT License - See LICENSE file for details
