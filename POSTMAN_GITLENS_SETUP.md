# Postman & GitLens - Setup Guide

## ✅ Current Status

### Installed Extensions:

| Extension               | Version | Status    |
| ----------------------- | ------- | --------- |
| **Postman for VS Code** | 1.19.1  | ✅ Active |
| **GitLens**             | 17.8.1  | ✅ Active |
| **Git History**         | 0.6.20  | ✅ Active |

---

## 📮 Postman for VS Code

### Overview

Postman extension for VS Code allows you to test and develop APIs directly in your editor without opening the browser.

### Key Features

- 📝 Manage API requests inline
- 🔄 Test endpoints with variables
- 📊 View responses and headers
- 💾 Save request collections
- 🔑 Environment variables support

### Getting Started

#### 1. **Open API File**

The workspace has a pre-configured `api.http` file with all endpoints.

```
File: api.http (in project root)
```

#### 2. **Available Endpoints**

Your API endpoints include:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login
- `GET /api/users` - Get all users (admin)
- `PUT /api/users/:id` - Update user info
- `POST /api/users/:id/procedures` - Add procedure to user

#### 3. **How to Use in VS Code**

**Option A: REST Client (Recommended)**

```
1. Open api.http file
2. Click "Send Request" above any request
3. View response in panel on right
```

**Option B: Postman Extension**

```
1. Install Postman for VS Code (already done)
2. Open Command Palette (Ctrl+Shift+P)
3. Type "Postman" and select "New Request"
4. Configure your request
5. Click "Send"
```

### Test Your Registration Endpoint

Open `api.http` and find the **User Registration** section:

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "militaryId": "NSS-654321",
  "email": "jane.doe@military.gov",
  "mobile": "+1-202-555-0124",
  "dob": "1988-03-20",
  "rank": "Lieutenant",
  "password": "SecurePass123!",
  "status": "active"
}
```

Click "Send Request" and verify response.

### Using Variables in Postman

Define variables at the top of `api.http`:

```http
@baseUrl = http://localhost:3000
@contentType = application/json
@userId = 1
@token = your_auth_token_here
```

Then use them in requests:

```http
POST {{baseUrl}}/api/users/{{userId}}/procedures
```

---

## 🔧 GitLens - Git Supercharged

### Overview

GitLens enhances VS Code's native Git capabilities with powerful features for version control.

### Key Features

- 👁️ **Blame Annotations** - See who changed each line
- 📜 **Commit History** - Browse commit details
- 🌳 **Repository Map** - Visual repository structure
- 🔀 **Branch Management** - Compare and merge branches
- 📊 **Code Lens** - Inline authorship information

### Getting Started

#### 1. **Initialize Git Repository** (If Not Already Done)

```powershell
cd c:\Users\Gustavo Pablo\OneDrive\Desktop\Mili
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"
git add .
git commit -m "Initial commit"
```

#### 2. **Access GitLens Features**

**Via Command Palette (Ctrl+Shift+P):**

- `GitLens: Show Commit Details`
- `GitLens: Show File History`
- `GitLens: Show Branch History`
- `GitLens: Open Repository Settings`
- `GitLens: Toggle Git Blame`

**Via Source Control Sidebar:**

1. Click **Source Control** icon (left sidebar)
2. Browse commits and changes
3. View file history and blame

#### 3. **Blame View**

Hover over any line of code to see:

- Who changed it
- When it was changed
- The commit message

#### 4. **Commit History**

```
1. Right-click on a file
2. Select "View File History"
3. Browse all commits affecting that file
```

### Useful GitLens Commands

| Command                          | Purpose                          |
| -------------------------------- | -------------------------------- |
| `GitLens: Toggle Git Blame`      | Show/hide blame info on lines    |
| `GitLens: Show Commit Details`   | View detailed commit information |
| `GitLens: Show File History`     | Browse file's commit history     |
| `GitLens: Compare with Previous` | Diff against previous version    |
| `GitLens: Show Branch History`   | View branch history graph        |
| `GitLens: Toggle Code Lens`      | Show inline authorship info      |

### GitLens Settings

Open VS Code Settings (`Ctrl+,`) and search "gitlens" to customize:

```json
{
  "gitlens.blame.enabled": true,
  "gitlens.statusBar.enabled": true,
  "gitlens.codeLens.enabled": true,
  "gitlens.hovers.enabled": true
}
```

---

## 🚀 Quick Reference

### Running Tests with Your APIs

1. **Start Backend Server**

   ```powershell
   npm run dev
   ```

2. **Open api.http**

   - Located in project root
   - Click "Send Request" on any endpoint

3. **Check Response**
   - Response panel opens on right side
   - View status code, headers, body

### Workflow Example

**Scenario: Test user registration**

1. Open `api.http` in VS Code
2. Scroll to "User Registration" section
3. Modify the `militaryId` and `email` to test values
4. Click "Send Request"
5. View response in the panel
6. Check `users.json` to verify data was saved

---

## 📁 Project Files Reference

| File                   | Purpose                       |
| ---------------------- | ----------------------------- |
| `api.http`             | All API endpoints for testing |
| `API_DOCUMENTATION.md` | Detailed API documentation    |
| `server/app.js`        | Backend API routes            |
| `server/users.json`    | File-based user storage       |
| `src/js/homepage.js`   | Frontend API calls            |

---

## ⚠️ Troubleshooting

### Postman: "Cannot reach endpoint"

- ✓ Ensure backend is running: `npm run dev`
- ✓ Verify port 3000 is accessible
- ✓ Check `@baseUrl` variable in api.http

### GitLens: "Not a git repository"

- ✓ Run `git init` in project root
- ✓ Run `git config user.email` and `git config user.name`
- ✓ Make initial commit: `git add . && git commit -m "Initial"`

### Extensions Not Working

- ✓ Reload VS Code: `Ctrl+Shift+P` → `Developer: Reload Window`
- ✓ Reinstall: `code --uninstall-extension [id] && code --install-extension [id]`

---

## 📚 Additional Resources

- [Postman for VS Code Docs](https://www.postman.com/postman-docs/)
- [GitLens Documentation](https://www.gitkraken.com/gitlens/docs)
- [REST Client (Alternative)](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)

---

**Last Updated**: December 29, 2025
**Status**: All tools configured and ready to use
