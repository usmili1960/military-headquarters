# Military Headquarters Website - AI Coding Agent Guide

## Project Overview
A full-stack military administration platform featuring user authentication, role-based dashboards (user/admin), multi-language support, and personnel management. Built with Express.js backend and vanilla JavaScript frontend.

## Architecture

### Frontend Structure (`src/`)
- **Pages**: `index.html` (homepage), `user-dashboard.html`, `admin-dashboard.html`, `admin-login.html`
- **CSS**: Page-specific files (homepage.css, user-dashboard.css, admin-dashboard.css) + shared style.css
- **JS**: Modular scripts for each page + shared translations.js
- **Data Flow**: Forms → API calls → localStorage (state) + backend endpoints

### Backend Structure (`server/app.js`)
- **Single Express server** with in-memory user storage (will migrate to MongoDB)
- **API Pattern**: `/api/auth/*` for authentication, `/api/users/*` for user management
- **Auth Flow**: Military ID (NSS-XXXXXX format) + password → session → dashboard access
- **User Data Model**: id, fullName, militaryId, email, mobile, dob, rank, status, procedures[]

### Key Components
- **Authentication**: Login/signup with Military ID validation (NSS-XXXXXX regex)
- **Modals**: Modal.js pattern for all dialogs (login, signup, spouse, email, etc.)
- **Procedures**: Admin-editable table of military procedures assigned to users
- **Spouse/Dependents**: Separate section in user dashboard with edit modal

## Development Workflows

### Starting Development
```bash
npm install
npm start  # Runs server on localhost:3000
# OR for file-only testing: open src/pages/index.html directly
```

### Adding Features
1. **Frontend**: Edit corresponding page (HTML), style (CSS), function (JS)
2. **Backend**: Add endpoint in app.js with `/api/...` route
3. **Data**: Update user object schema in mockUsers array if needed
4. **Test**: Use browser console + Network tab to verify API calls

### Common Tasks
- **New form field**: Add to HTML → JS form handler → API endpoint → database schema
- **New modal**: Duplicate modal structure in HTML → add open/close event listeners → style in CSS
- **API endpoint**: Follow pattern in app.js (req.body validation → users array mutation → res.json)

## Code Patterns & Conventions

### JavaScript Patterns
- **Modal Management**: Event listeners on close buttons + window click outside
- **Form Handling**: `form.addEventListener('submit', (e) => { e.preventDefault(); ... })`
- **API Calls**: Fetch with JSON headers → .then(res.res.json()) → .then(data) flow
- **Validation**: Military ID regex `/^NSS-\d{6}$/`, email/phone existence checks

### Backend Conventions
- **Error Handling**: Console logs with emoji prefixes (✅, ❌, 📝, 📧) for debugging
- **User Lookup**: `users.find(u => u.militaryId === id)` pattern throughout
- **Response Format**: `{ success: boolean, message?: string, data/user?: object, error?: string }`
- **Middleware Order**: cors → json → static files → routes

### HTML/CSS Naming
- **Classes**: Kebab-case for CSS classes (modal-overlay, status-badge, profile-section)
- **IDs**: camelCase for JS element references (loginModal, userMilID, procedureForm)
- **Data Attributes**: `data-user-id="123"` for dynamic lookups

### Translations System
- **Location**: `src/js/translations.js` with language keys (en, es, ja, ko)
- **Usage**: `translations[currentLanguage]['key-name']` pattern
- **Adding**: Add new key to all language objects, update UI with translation calls

## Integration Points & External Dependencies

### Backend Dependencies
- **express**: Server framework, static file serving
- **cors**: Cross-origin requests for API
- **bcryptjs**: Password hashing (imported but not fully integrated)
- **dotenv**: Environment variables from .env file
- **multer**: File uploads (imported, not yet integrated for passport pictures)
- **nodemailer**: Email verification (imported, TODO: integrate with actual email service)
- **mongoose**: Database ORM (imported, TODO: replace in-memory storage)

### Frontend APIs Consumed
- `POST /api/auth/register`: User registration
- `POST /api/auth/send-verification-code`: Send verification code
- `POST /api/auth/verify`: Verify account
- `POST /api/auth/login`: User login
- `POST /api/auth/admin-login`: Admin login
- `GET /api/users`: Fetch all users (admin only)
- `PUT /api/users/:id`: Update user info/status
- `POST /api/users/:id/procedures`: Add procedure to user

### localStorage Usage
- `adminLoggedIn`: Boolean flag for admin dashboard access protection
- Store for: user session state, form draft data, theme preferences

## Important Notes

### Known Limitations & TODOs
- **No Database**: Currently uses in-memory array (resets on server restart)
- **No Email/SMS**: Verification code endpoints log to console instead of sending
- **No Password Hashing**: bcryptjs imported but not used in registration
- **No File Upload**: Multer imported but passport picture always defaults to placeholder
- **Admin Protection**: Only checks localStorage flag, not secure for production

### Gotchas
- **Military ID Format**: Always validate with `/^NSS-\d{6}$/` - test with NSS-123456
- **Modal Stacking**: Multiple modals use same overlay concept - ensure z-index ordering
- **CORS**: Frontend fetches to localhost:3000 - ensure backend runs on correct port
- **Responsive Design**: Mobile-first approach in CSS, test on 320px+ viewports

### Testing Credentials
- **User Login**: Military ID = NSS-123456, Password = any string (no validation)
- **Admin Login**: Any email/password combo (localStorage flag is only check)
- **Verification Code**: Check browser console for auto-generated 6-digit codes

## File Organization Quick Reference
```
src/pages/          ← HTML templates (endpoints in Express)
src/js/             ← Page logic + shared (translations.js)
src/css/            ← Scoped styles per page + global
server/app.js       ← All backend routes & data logic
package.json        ← Dependencies & scripts
```
