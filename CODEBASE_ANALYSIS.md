# Barangay ID System - Codebase Analysis

**Analysis Date:** November 10, 2025  
**Analyzer:** CodeScanner-1  
**Project:** Barangay Holy Spirit Digital ID Card System

---

## Executive Summary

The **Barangay Holy Spirit Digital ID System** is a full-stack web application designed for local government unit (LGU) use in the Philippines. It enables barangay officials to digitally manage resident enrollment, generate professional ID cards with 8 customizable templates, print PVC cards, issue official documents (clearances, certificates), and maintain audit trails—all with offline-first capabilities.

**Core Purpose**: Streamline barangay operations by providing a unified system for:
- Resident registration and database management
- ID card generation and printing (8 professional templates)
- Document issuance (Barangay Clearance, Certificate of Indigency, Residency)
- Complaint tracking and reporting
- Biometric verification (AI-powered face matching)

**Technology Stack**:
- **Frontend**: Vanilla JavaScript, HTML5, CSS3, IndexedDB (offline-first)
- **Backend**: Node.js, Express.js, SQLite
- **Authentication**: JWT with role-based access (Admin/Staff)
- **AI/ML**: face-api.js for facial recognition
- **Libraries**: QRCode.js, JsBarcode, bcrypt.js

**Key Architectural Decisions**:
1. **Offline-First**: Uses IndexedDB for client-side data storage, allowing operation without constant server connection
2. **Role-Based Access**: Admin and Staff roles with different permission levels
3. **Template System**: 8 pre-designed ID card themes (Yellow, Blue, Black & Gold, Green, Red, Purple, Orange, Teal)
4. **Security**: JWT authentication, bcrypt password hashing, anti-tamper document hashing
5. **Audit Trail**: Every action logged with timestamp and user attribution

**For New Developers**:
Start by understanding the three main layers:
1. **Frontend UI** (`coreA.html` + `assets/`): Single-page app with tab-based navigation
2. **Backend API** (`backend/server.js` + `routes/`): RESTful Express server with 6 route modules
3. **Data Layer**: Dual storage (IndexedDB for frontend, SQLite for backend)

The system is production-ready for small-scale deployment but would benefit from additional security hardening (HTTPS, stronger JWT secrets, input validation) for wider use.

---

## High-Level Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  (Browser: Chrome/Firefox/Edge - Port 8080)                     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │  Residents   │  │ ID Generator │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   E-Docs     │  │  Complaints  │  │   Reports    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  • coreA.html (Main App)                                         │
│  • login.html (Auth Entry)                                       │
│  • assets/coreA.css (Styling)                                    │
│  • assets/coreA.js (Logic)                                       │
│  • apisClient.js (API Abstraction)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/Fetch API
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND REST API                              │
│         (Node.js + Express - Port 3000)                          │
│                                                                   │
│  server.js (Entry Point)                                         │
│    ↓                                                              │
│  middleware/auth.js (JWT Verification)                           │
│    ↓                                                              │
│  routes/                                                          │
│    ├─ auth.js       → POST /api/login                            │
│    ├─ residents.js  → GET/POST/PUT /api/residents/*              │
│    ├─ request.js    → GET/POST /api/requests                     │
│    ├─ complaints.js → GET/POST /api/complaints                   │
│    ├─ audit.js      → GET/POST /api/audit                        │
│    └─ reports.js    → GET /api/reports/*                         │
└─────────────────────────────────────────────────────────────────┘
                              ↕ SQL Queries
┌─────────────────────────────────────────────────────────────────┐
│                      DATA PERSISTENCE                            │
│                                                                   │
│  Backend: SQLite (digitalid.db)                                  │
│    Tables: users, residents, requests, complaints, audit_log     │
│                                                                   │
│  Frontend: IndexedDB (digital-id-db)                             │
│    Stores: residents, requests, complaints, audit,               │
│            events, eventAttendance                               │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

**1. User Authentication Flow**
```
User enters credentials → login.html
  ↓
apisClient.apiLogin() → POST /api/login
  ↓
routes/auth.js validates against SQLite users table
  ↓
bcrypt compares password hash
  ↓
JWT token generated (24h expiration)
  ↓
Token + user object stored in localStorage
  ↓
Redirect to coreA.html (main app)
```

**2. Resident Registration Flow**
```
Staff fills form in coreA.html → Residents tab
  ↓
Photo uploaded → cropToID() → base64 dataURL
  ↓
Form submit → apiAddResident(token, data)
  ↓
POST /api/residents (with JWT in header)
  ↓
routes/residents.js generates unique ID number
  ↓
SQLite INSERT into residents table
  ↓
Also stored in IndexedDB for offline access
  ↓
Audit log entry created
  ↓
UI refreshes resident table
```

**3. ID Card Generation & Printing Flow**
```
User clicks "Open" on resident row
  ↓
loadToID(residentId) function called
  ↓
Fetch resident from IndexedDB
  ↓
Populate ID card preview (front & back)
  ↓
Apply selected theme (A-H) with CSS classes
  ↓
User clicks "Print Front (PVC)"
  ↓
syncCardToPrintWrappers() clones preview HTML
  ↓
Show print-specific wrapper with exact PVC dimensions
  ↓
window.print() opens browser print dialog
  ↓
Print at 85.6mm × 54mm (CR80 standard PVC size)
```

**4. Document Generation Flow (E-Docs)**
```
Staff submits request form (Clearance/Indigency/etc.)
  ↓
POST /api/requests → stored in SQLite & IndexedDB
  ↓
Request appears in table with "Pending" status
  ↓
Staff clicks "Preview Doc"
  ↓
buildOfficialDocHTML() generates letterhead
  ↓
Includes QR code with verification hash
  ↓
Modal opens with printable document
  ↓
Staff reviews and prints
  ↓
Status updated: Pending → Approved → Released
```

**5. Face Verification Flow (Biometric)**
```
Resident's photo stored during registration
  ↓
Staff opens resident in ID Generator
  ↓
Clicks "Start Camera" → requests webcam access
  ↓
face-api.js models loaded from CDN
  ↓
"Capture & Verify" clicked
  ↓
Canvas snapshot taken from live video
  ↓
face-api.js detects face in both images
  ↓
Computes euclidean distance between descriptors
  ↓
Distance ≤ 0.5 = MATCH (threshold adjustable)
  ↓
Result shown + audit log entry
```

### Key Modules & Responsibilities

#### **Frontend (Client-Side)**

| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| **Authentication** | Login/logout, session management, role-based UI hiding | `login.html`, `coreA.html` (session guard) |
| **Resident Management** | Add/edit/delete residents, photo upload, search | `coreA.html` (Residents tab), `coreA.js` |
| **ID Generation** | Load resident data, render templates A-H, real-time editing | `coreA.html` (ID Generator tab), `coreA.js`, `coreA.css` |
| **Print Engine** | PVC card printing with exact dimensions, theme cloning | `coreA.js` (`printPVC()`), `coreA.css` (@media print) |
| **E-Documents** | Request submission, status tracking, document builder | `coreA.html` (E-Docs tab), `coreA.js` |
| **Face Verification** | Webcam capture, AI face detection/matching | `coreA.js` (face-api.js integration) |
| **Audit Logging** | Track all user actions with timestamps | `coreA.js` (`audit()` function) |
| **Backup/Restore** | Export/import data as CSV/JSON, auto-backup | `coreA.js` (backup functions) |
| **Offline Storage** | IndexedDB for local data persistence | `coreA.js` (`idbOpen()`, IDB functions) |

#### **Backend (Server-Side)**

| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| **API Server** | Express app initialization, CORS, routing | `server.js` |
| **Authentication** | JWT token validation, role checking | `middleware/auth.js` |
| **User Management** | Login endpoint, credential validation | `routes/auth.js` |
| **Resident CRUD** | Resident database operations | `routes/residents.js` |
| **Request Management** | Document request tracking | `routes/request.js` |
| **Complaints** | Feedback submission and retrieval | `routes/complaints.js` |
| **Audit Trail** | Server-side activity logging | `routes/audit.js` |
| **Reporting** | Generate statistics and summaries | `routes/reports.js` |
| **Database** | SQLite schema, seeding, connection | `db.js` |

### External Dependencies

#### **Backend NPM Packages**

| Package | Version | Purpose | Critical? |
|---------|---------|---------|-----------|
| **express** | ^4.19.2 | Web server framework, routing, middleware | ✅ Yes |
| **sqlite3** | ^5.1.7 | SQLite database driver | ✅ Yes |
| **bcryptjs** | ^2.4.3 | Password hashing (bcrypt algorithm) | ✅ Yes |
| **jsonwebtoken** | ^9.0.2 | JWT token generation/verification | ✅ Yes |
| **cors** | ^2.8.5 | Enable cross-origin resource sharing | ✅ Yes |

#### **Frontend CDN Libraries**

| Library | Version | Purpose | Critical? |
|---------|---------|---------|-----------|
| **face-api.js** | 0.22.2 | Face detection, recognition, landmark detection | Partial (verification feature) |
| **qrcodejs** | 1.0.0 | QR code generation for documents | Partial (document verification) |
| **jsbarcode** | 3.11.6 | Barcode generation for ID cards | Partial (ID cards) |

#### **Browser APIs (Native)**

- **IndexedDB**: Offline data storage (residents, requests, complaints, audit, events)
- **Fetch API**: HTTP requests to backend
- **localStorage**: JWT token and user session storage
- **Canvas API**: Image cropping, face verification canvas
- **MediaDevices API**: Webcam access for face verification
- **File API / FileReader**: Photo/signature upload and base64 conversion
- **Print API**: `window.print()` for PVC card and document printing

### Security Considerations

1. **Authentication**: JWT with 24-hour expiration, stored in localStorage
2. **Password Security**: bcrypt hashing with 10 rounds
3. **Authorization**: Middleware checks JWT and role before sensitive operations
4. **Anti-Tamper**: Document hash (`generateAuthHash()`) prevents forgery
5. **Role-Based Access**: Admin-only functions (delete, restore backup)
6. **Audit Trail**: Every action logged with user attribution

**Security Gaps** (For Production):
- JWT secret hardcoded (should use environment variable)
- No HTTPS enforcement (transmits JWT in plaintext over HTTP)
- No rate limiting on login endpoint
- No SQL injection protection (uses synchronous sqlite3 API correctly, but lacks ORM)
- localStorage for JWT (vulnerable to XSS; consider httpOnly cookies)
- CORS enabled for all origins (should whitelist specific domains)

### Deployment Architecture

**Current Setup** (Development/Local):
```
┌─────────────────────────────────────┐
│  Frontend Server (Python HTTP)      │
│  Port: 8080                          │
│  Command: python -m http.server 8080│
└─────────────────────────────────────┘
              ↕ (HTTP)
┌─────────────────────────────────────┐
│  Backend Server (Node.js)            │
│  Port: 3000                          │
│  Command: node server.js             │
└─────────────────────────────────────┘
              ↕ (File I/O)
┌─────────────────────────────────────┐
│  Database (SQLite)                   │
│  File: digitalid.db                  │
└─────────────────────────────────────┘
```

**Recommended Production Setup**:
- Use Nginx/Apache to serve static frontend files
- Use PM2 or systemd to manage Node.js backend process
- Enable HTTPS with Let's Encrypt certificates
- Set proper file permissions on SQLite database
- Use environment variables for secrets
- Implement regular automated backups
- Consider moving to PostgreSQL for better concurrency

---

## Full Directory Tree

```
barangay-id-system/
├── .git/                           # Git version control
├── .gitignore                      # Git ignore rules
├── README.md                       # Project documentation
├── login.html                      # Login page entry point
├── coreA.html                      # Main ID generation interface
├── coreB-resident.html             # Resident management interface
├── coreC.html                      # Template C interface
├── coreD.html                      # Template D interface
├── E.html                          # Template E interface
├── template-test.html              # Template testing page
├── apisClient.js                   # Frontend API communication layer
│
├── assets/                         # Static assets
│   ├── coreA.css                   # Main styling
│   ├── coreA.js                    # Frontend logic
│   ├── Bagong_Pilipinas_logo.png   # Government logo
│   ├── brgy-holy-spirit-logo.jpg   # Barangay logo
│   └── Quezon_City_LGU_logo.jpg    # City logo
│
└── backend/                        # Server-side application
    ├── server.js                   # Main Express server
    ├── db.js                       # Database configuration
    ├── digitalid.db                # SQLite database file
    ├── package.json                # Node.js dependencies
    ├── package-lock.json           # Dependency lock file
    │
    ├── middleware/                 # Express middleware
    │   └── auth.js                 # Authentication middleware
    │
    └── routes/                     # API route handlers
        ├── auth.js                 # Authentication routes
        ├── residents.js            # Resident CRUD operations
        ├── request.js              # Service request routes
        ├── complaints.js           # Complaint management routes
        ├── reports.js              # Report generation routes
        └── audit.js                # Audit log routes
```

---

## File-by-File Analysis

### Root Directory

#### **`.gitignore`**
- **Purpose**: Git ignore configuration
- **Key Content**: Excludes `node_modules/` from version control
- **Dependencies**: None

#### **`README.md`**
- **Purpose**: Comprehensive project documentation
- **Key Sections**:
  - System requirements and installation instructions
  - 8 ID templates (A-H) with descriptions
  - How-to guides for ID creation, printing, and database management
  - File structure, configuration, troubleshooting
- **Dependencies**: None (documentation only)

#### **`login.html`**
- **Purpose**: Authentication entry point for the system
- **Key Features**:
  - Simple email/password login form
  - Calls `apiLogin()` from `apisClient.js`
  - Stores JWT token and user object in `localStorage`
  - Redirects to `coreA.html` on successful login
  - Inline CSS for login card styling
- **Dependencies**: 
  - `apisClient.js` (API communication)
  - Backend API at `http://localhost:3000/api/login`

#### **`coreA.html`** (Main Application - 2,934 lines)
- **Purpose**: Primary ID card generation and management interface
- **Key Features**:
  - **Session Management**: Guards routes, requires authentication
  - **Role-Based Access**: Admin vs Staff permissions
  - **Multiple Pages**: Dashboard, Residents, ID Generator, E-Docs, Complaints, Reports, Settings
  - **8 ID Card Templates** (A-H): Different color schemes and designs
  - **Real-time Editing**: Contenteditable fields on ID preview
  - **Image Management**: Photo upload, drag-and-drop, editing overlays
  - **PVC Card Printing**: Front/back printing with proper dimensions (85.6mm × 54mm)
  - **Face Verification**: AI-powered face matching using face-api.js
  - **QR/Barcode Generation**: For ID cards
  - **IndexedDB Storage**: Offline-first data management
  - **Backup/Restore**: CSV and JSON export/import functionality
- **Key Functions**:
  - `idbOpen()`: Initialize IndexedDB database
  - `loadToID(id)`: Load resident data into ID card preview
  - `printPVC(which)`: Print front or back of ID card
  - `applyTemplate()`: Switch between ID card themes
  - `toggleEditMode(enabled)`: Enable/disable real-time editing
  - `loadModels()`: Load face-api.js models for verification
- **Database Tables**: residents, requests, complaints, audit, events, eventAttendance
- **Dependencies**:
  - `apisClient.js` (API calls)
  - `face-api.js` (facial recognition)
  - `qrcode.js` (QR code generation)
  - `jsbarcode.js` (barcode generation)
  - Inline CSS and JavaScript (comprehensive styling and logic)

#### **`coreB-resident.html`**
- **Purpose**: Resident-focused interface (likely simplified view)
- **Status**: Not analyzed in detail (requires reading)
- **Dependencies**: Similar to coreA.html

#### **`coreC.html`, `coreD.html`, `E.html`**
- **Purpose**: Alternative template pages for different ID designs
- **Status**: Not analyzed in detail
- **Dependencies**: Likely similar structure to coreA.html

#### **`template-test.html`**
- **Purpose**: Testing page for ID card templates
- **Status**: Not analyzed in detail
- **Dependencies**: Template CSS/JS files

#### **`apisClient.js`**
- **Purpose**: Frontend API client - abstraction layer for backend communication
- **Key Functions**:
  - `apiLogin(usernameOrEmail, password)`: Authenticate user
  - `apiGetResidents(token)`: Fetch all residents
  - `apiAddResident(token, data)`: Add new resident
  - `apiUpdateResidentStatus(token, id, status)`: Update ID status
- **API Base URL**: `http://localhost:3000/api`
- **Authentication**: Bearer token in Authorization header
- **Dependencies**: 
  - Fetch API (native browser)
  - Backend Express server

---

### Assets Directory (`assets/`)

#### **`coreA.css`** (1,100+ lines)
- **Purpose**: Complete stylesheet for the application
- **Key Features**:
  - **Design System**: CSS custom properties (variables) for colors, spacing, typography
  - **Responsive Grid**: 12-column layout system
  - **Component Styles**: Cards, tables, forms, buttons, tags, modals
  - **ID Card Themes**: 8 different template designs (A-H)
  - **Print Styles**: Special `@media print` rules for PVC card printing at exact dimensions
  - **Animations**: Fade transitions for theme switching
  - **Mobile-First**: Responsive breakpoints for tablet (900px) and mobile (600px)
  - **Official Document Styles**: Letterhead styling for barangay certificates
- **Design Tokens**:
  - Primary: `#2563eb` (blue)
  - Success: `#16a34a` (green)
  - Error: `#dc2626` (red)
  - Warning: `#d97706` (amber)
- **Dependencies**: None (pure CSS)

#### **`coreA.js`** (1,000+ lines)
- **Purpose**: Core application JavaScript logic
- **Key Functions**:
  - **IndexedDB Management**: Database initialization, CRUD operations
  - **Authentication**: Demo login/logout system
  - **File Handling**: `fileToDataURL()`, `cropToID()` for image processing
  - **Resident Management**: Add, edit, delete, search residents
  - **ID Generation**: `nextIdNumber()` creates unique ID numbers
  - **Template Switching**: `applyTemplate()` with fade animations
  - **Print Logic**: `printPVC()` handles PVC card printing
  - **Face Verification**: Uses face-api.js for biometric matching
  - **Backup/Restore**: `exportAllCSV()`, `exportAllJSON()`, `importBackupJSON()`
  - **Document Generation**: `buildOfficialDocHTML()` creates barangay certificates
  - **QR Code**: `renderQRInto()` generates verification QR codes
  - **Auto-backup**: Weekly Friday 5PM automatic backup
- **Database Schema**:
  - `residents`: id, idno, name, birthdate, address, contact, purok, photo, signature, status, etc.
  - `requests`: rid, idno, doc, purpose, status, createdAt
  - `complaints`: cid, idno, text, createdAt
  - `audit`: ts, action, info
  - `events`: eid, title, desc, date, type
  - `eventAttendance`: aid, eid, residentId, ts
- **Security**:
  - `generateAuthHash()`: Anti-tamper hash for documents
  - `requireStaff()`, `requireAdmin()`: Role-based access control
- **Dependencies**:
  - IndexedDB API
  - face-api.js library
  - QRCode library
  - JsBarcode library

#### **Image Assets**
- **`Bagong_Pilipinas_logo.png`**: Government branding logo
- **`brgy-holy-spirit-logo.jpg`**: Barangay official seal
- **`Quezon_City_LGU_logo.jpg`**: Local government unit logo
- **Purpose**: Used in ID card headers and official documents
- **Format**: PNG and JPG

---

### Backend Directory (`backend/`)

#### **`package.json`**
- **Purpose**: Node.js project configuration and dependencies
- **Project Name**: `digital-id-backend`
- **Version**: 1.0.0
- **Type**: `"module"` (ES6 modules)
- **Main Entry**: `server.js`
- **Scripts**:
  - `start`: `node server.js`
- **Dependencies**:
  - `bcryptjs` (^2.4.3): Password hashing
  - `cors` (^2.8.5): Cross-origin resource sharing
  - `express` (^4.19.2): Web server framework
  - `jsonwebtoken` (^9.0.2): JWT authentication
  - `sqlite3` (^5.1.7): SQLite database driver
- **Node Version**: 14+ recommended

#### **`server.js`**
- **Purpose**: Main Express.js server entry point
- **Key Features**:
  - CORS enabled for cross-origin requests
  - JSON body parser with 5MB limit (for base64 images)
  - Health check endpoint: `/api/health`
  - Route mounting for 6 API modules
- **Routes**:
  - `/api` → `authRoutes` (login)
  - `/api/residents` → `residentRoutes`
  - `/api/requests` → `requestRoutes`
  - `/api/complaints` → `complaintsRoutes`
  - `/api/audit` → `auditRoutes`
  - `/api/reports` → `reportRoutes`
- **Port**: 3000
- **Dependencies**:
  - All route modules
  - `db.js` for database initialization
  - Express, CORS

#### **`db.js`**
- **Purpose**: SQLite database configuration and initialization
- **Key Features**:
  - Creates SQLite database file: `digitalid.db`
  - Schema creation for 5 tables
  - Auto-seeds default users on first run
- **Tables**:
  1. **users**: id, email, username, password_hash, role (admin/staff)
  2. **residents**: id, fullName, birthDate, address, contact, purokOrPosition, emergencyContact, status, idNumber, photoUrl, signatureUrl
  3. **requests**: id, residentIdNumber, docType, purpose, status
  4. **complaints**: id, residentIdNumber, details, ts
  5. **audit_log**: id, action, details, byUser, ts
- **Default Users**:
  - Admin: `admin@example` / `admin123`
  - Staff: `staff@example` / `staff123`
- **Password Hashing**: bcrypt with 10 rounds
- **Dependencies**: sqlite3, bcryptjs

#### **`digitalid.db`**
- **Purpose**: SQLite database file (binary)
- **Contains**: All application data (users, residents, requests, etc.)
- **Location**: Backend root directory
- **Backup**: Should be backed up regularly

---

### Backend Middleware (`backend/middleware/`)

#### **`auth.js`**
- **Purpose**: JWT authentication middleware
- **Key Functions**:
  - `authRequired(req, res, next)`: Validates JWT token from Authorization header
  - `adminOnly(req, res, next)`: Ensures user has admin role
- **JWT Secret**: `"PALITAN-MO-TO-SA-DEPLOYMENT"` (should be changed in production)
- **Token Validation**: 
  - Extracts "Bearer <token>" from headers
  - Verifies token using JWT secret
  - Attaches decoded user data to `req.user`
  - Returns 401 for invalid/missing tokens
  - Returns 403 for non-admin access to admin routes
- **Exports**: `authRequired`, `adminOnly`, `SECRET`
- **Dependencies**: jsonwebtoken

---

### Backend Routes (`backend/routes/`)

#### **`auth.js`**
- **Purpose**: Authentication endpoints
- **Endpoints**:
  - `POST /api/login`: User login
- **Login Flow**:
  1. Accept `usernameOrEmail` and `password`
  2. Query database for user by email or username
  3. Compare password with bcrypt
  4. Generate JWT token (24h expiration)
  5. Return token + user object (id, email, username, role)
- **Error Responses**:
  - 401: Invalid credentials
  - 500: Database error
- **Dependencies**: express, bcryptjs, jsonwebtoken, db

#### **`residents.js`**
- **Purpose**: Resident CRUD operations
- **Endpoints**:
  - `GET /api/residents`: Get all residents (requires auth)
  - `POST /api/residents`: Add new resident (requires auth)
  - `PUT /api/residents/:id/status`: Update resident status (requires auth)
- **Key Logic**:
  - Auto-generates unique ID number: `ID{timestamp}`
  - Stores resident information including photo/signature URLs
  - Defaults status to "Pending"
  - Returns newly created ID number
- **Fields**: fullName, birthDate, address, contact, purokOrPosition, emergencyContact, photoUrl, signatureUrl
- **Dependencies**: express, db, auth middleware

#### **`request.js`**
- **Purpose**: Document request management (Barangay Clearance, Indigency, etc.)
- **Endpoints**:
  - `GET /api/requests`: Get all requests (requires auth)
  - `POST /api/requests`: Submit new request (requires auth)
- **Fields**: residentIdNumber, docType, purpose
- **Default Status**: "Pending"
- **Dependencies**: express, db, auth middleware

#### **`complaints.js`**
- **Purpose**: Complaint/feedback tracking
- **Endpoints**:
  - `GET /api/complaints`: Get all complaints (requires auth)
  - `POST /api/complaints`: Submit complaint (requires auth)
- **Fields**: residentIdNumber, details, ts (timestamp)
- **Auto-timestamp**: Uses ISO string format
- **Dependencies**: express, db, auth middleware

#### **`audit.js`**
- **Purpose**: Audit trail logging
- **Endpoints**:
  - `GET /api/audit`: Get all audit logs (requires auth)
  - `POST /api/audit`: Create audit entry (requires auth)
- **Fields**: action, details, byUser (from JWT), ts (timestamp)
- **Auto-attribution**: Extracts user email from JWT for `byUser` field
- **Dependencies**: express, db, auth middleware

#### **`reports.js`**
- **Purpose**: Generate summary reports
- **Endpoints**:
  - `GET /api/reports/residents`: Get resident statistics (requires auth)
  - `GET /api/reports/requests`: Get request breakdown by doc type (requires auth)
- **Resident Report**: Returns total, approved, pending counts
- **Request Report**: Groups by docType with counts
- **Uses SQL aggregation**: `COUNT()`, `SUM()`, `GROUP BY`
- **Dependencies**: express, db, auth middleware

