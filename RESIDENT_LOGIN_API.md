# Resident Login & E-Services API Documentation

## Overview

The Resident Login system allows barangay residents to:
- Register accounts using their Barangay ID number
- Login and access their profile
- Submit document requests (clearance, indigency, certificates)
- File complaints and feedback
- View and register for barangay events
- Update their contact information

---

## Authentication Endpoints

### 1. Register Resident Account

**Endpoint:** `POST /api/resident-auth/register`

**Description:** Creates a new account for a resident using their existing ID number.

**Requirements:**
- Resident must be already registered in the residents table
- ID number must exist and be unique
- Password must be at least 8 characters

**Request Body:**
```json
{
  "idNumber": "PUROK1-2025-001",
  "password": "SecurePassword123",
  "email": "juan@example.com",
  "mobileNumber": "09171234567"
}
```

**Response (201 Created):**
```json
{
  "message": "Account created successfully",
  "resident": {
    "id": 1,
    "idNumber": "PUROK1-2025-001",
    "fullName": "Juan Dela Cruz"
  }
}
```

**Error Responses:**
- `400` - Missing required fields or password too short
- `404` - ID number not found in residents database
- `409` - Account already exists for this ID number

---

### 2. Resident Login

**Endpoint:** `POST /api/resident-auth/login`

**Description:** Authenticates a resident and returns a JWT token.

**Request Body:**
```json
{
  "idNumber": "PUROK1-2025-001",
  "password": "SecurePassword123"
}
```

**Note:** You can use either `idNumber` or `email` in the idNumber field.

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "resident": {
    "id": 1,
    "idNumber": "PUROK1-2025-001",
    "fullName": "Juan Dela Cruz",
    "email": "juan@example.com",
    "mobileNumber": "09171234567",
    "address": "123 Test St, Barangay Test",
    "contact": "09171234567",
    "photoUrl": "/uploads/photos/resident-1.jpg",
    "status": "Released"
  }
}
```

**Token Details:**
- Valid for 7 days
- Contains: `id`, `residentId`, `idNumber`, `role: "resident"`
- Use in Authorization header: `Bearer <token>`

**Error Responses:**
- `400` - Missing credentials
- `401` - Invalid credentials
- `403` - ID not yet released

---

### 3. Get Resident Profile

**Endpoint:** `GET /api/resident-auth/profile`

**Description:** Retrieves the authenticated resident's full profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "idNumber": "PUROK1-2025-001",
  "fullName": "Juan Dela Cruz",
  "birthDate": "1990-01-01",
  "address": "123 Test St, Barangay Test",
  "contact": "09171234567",
  "purokOrPosition": "Purok 1",
  "emergencyContact": "09189999999",
  "household": "Dela Cruz Family",
  "status": "Released",
  "photoUrl": "/uploads/photos/resident-1.jpg",
  "signatureUrl": "/uploads/signatures/resident-1.jpg",
  "email": "juan@example.com",
  "mobileNumber": "09171234567",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "accountCreatedAt": "2025-01-15T00:00:00.000Z",
  "lastLogin": "2025-11-12T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - No token or invalid token
- `404` - Resident profile not found

---

### 4. Update Resident Profile

**Endpoint:** `PUT /api/resident-auth/profile`

**Description:** Updates resident's contact information (limited fields).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "mobileNumber": "09189999999",
  "contact": "09189999999"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully"
}
```

**Error Responses:**
- `400` - Invalid email format
- `401` - No token or invalid token
- `409` - Email already in use

---

### 5. Change Password

**Endpoint:** `PUT /api/resident-auth/change-password`

**Description:** Changes the resident's password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Missing fields or password too short
- `401` - Current password is incorrect or invalid token

---

### 6. Verify Token

**Endpoint:** `GET /api/resident-auth/verify`

**Description:** Verifies if the resident token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "valid": true,
  "resident": {
    "id": 1,
    "idNumber": "PUROK1-2025-001",
    "role": "resident"
  }
}
```

---

## Document Request Endpoints

### 1. Get My Requests

**Endpoint:** `GET /api/requests`

**Description:** Retrieves all document requests for the logged-in resident.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`Pending`, `Approved`, `Released`)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "residentIdNumber": "PUROK1-2025-001",
    "docType": "Barangay Clearance",
    "purpose": "Employment requirement",
    "status": "Approved",
    "createdAt": "2025-11-10T08:00:00.000Z",
    "updatedAt": "2025-11-11T10:00:00.000Z"
  },
  {
    "id": 2,
    "residentIdNumber": "PUROK1-2025-001",
    "docType": "Certificate of Indigency",
    "purpose": "Medical assistance",
    "status": "Pending",
    "createdAt": "2025-11-12T09:00:00.000Z",
    "updatedAt": null
  }
]
```

---

### 2. Submit Document Request

**Endpoint:** `POST /api/requests`

**Description:** Submits a new document request. The resident's ID number is automatically used.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "docType": "Barangay Clearance",
  "purpose": "Employment requirement"
}
```

**Note:** `residentIdNumber` is not required - it's automatically set from the token.

**Response (201 Created):**
```json
{
  "id": 3,
  "message": "Request submitted successfully"
}
```

**Error Responses:**
- `400` - Missing document type
- `403` - ID must be released before requesting documents

---

## Complaint Endpoints

### 1. Get My Complaints

**Endpoint:** `GET /api/complaints`

**Description:** Retrieves all complaints filed by the logged-in resident.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`Open`, `InProgress`, `Resolved`, `Closed`)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "residentIdNumber": "PUROK1-2025-001",
    "details": "Street lighting is not working in our area",
    "status": "InProgress",
    "ts": "2025-11-10T08:00:00.000Z"
  }
]
```

---

### 2. Submit Complaint

**Endpoint:** `POST /api/complaints`

**Description:** Submits a new complaint or feedback.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "details": "Street lighting is not working in our area for the past week"
}
```

**Note:** `residentIdNumber` is automatically set from the token.

**Response (201 Created):**
```json
{
  "id": 2,
  "message": "Complaint submitted successfully"
}
```

---

## Event Endpoints

### 1. Get All Events

**Endpoint:** `GET /api/events`

**Description:** Retrieves all barangay events.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `eventType` (optional): Filter by type (`program`, `relief`, `medical`, `event`, `cleanup`, `assembly`)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Community Clean-Up Drive",
    "description": "Monthly clean-up activity",
    "eventDate": "2025-11-20",
    "eventType": "cleanup",
    "createdAt": "2025-11-01T00:00:00.000Z",
    "createdBy": "admin@example"
  }
]
```

---

### 2. Get Event Details

**Endpoint:** `GET /api/events/:id`

**Description:** Retrieves details of a specific event.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Community Clean-Up Drive",
  "description": "Monthly clean-up activity",
  "eventDate": "2025-11-20",
  "eventType": "cleanup",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "createdBy": "admin@example"
}
```

---

### 3. Register for Event

**Endpoint:** `POST /api/events/:id/attendance`

**Description:** Registers the resident for an event.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (empty - resident info is from token)
```json
{}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "message": "Attendance recorded successfully"
}
```

**Error Responses:**
- `409` - Already registered for this event

---

### 4. Get Event Attendance

**Endpoint:** `GET /api/events/:id/attendance`

**Description:** Retrieves list of attendees for an event.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "eventId": 1,
    "residentId": 1,
    "residentIdNumber": "PUROK1-2025-001",
    "fullName": "Juan Dela Cruz",
    "contact": "09171234567",
    "attendedAt": "2025-11-12T10:00:00.000Z"
  }
]
```

---

## Access Control Summary

### Resident Permissions:
✅ **Can Do:**
- Register and login with ID number
- View and update own profile
- Submit document requests
- View own request history and status
- Submit complaints and feedback
- View own complaint history
- View all barangay events
- Register for events
- View event attendance

❌ **Cannot Do:**
- View other residents' data
- Update request/complaint status (staff only)
- Create, edit, or delete events (staff only)
- Access admin/staff endpoints
- View audit logs
- Generate reports

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Descriptive error message"
}
```

**Common HTTP Status Codes:**
- `200` - OK (success)
- `201` - Created (resource created successfully)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error (database or server error)

---

## Security Features

### Password Security:
- Minimum 8 characters required
- Passwords hashed using bcrypt (10 salt rounds)
- Never stored in plain text

### Token Security:
- JWT tokens expire after 7 days
- Tokens contain role verification
- All endpoints verify token validity
- Tokens cannot be used across different roles

### Data Privacy:
- Residents can only access their own data
- ID must be "Released" status to access services
- Audit logging for all actions

---

## Usage Examples

### Example: Complete Registration and Request Flow

```javascript
// 1. Register account
const registerResponse = await fetch('http://localhost:3000/api/resident-auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    idNumber: 'PUROK1-2025-001',
    password: 'MySecurePass123',
    email: 'juan@example.com',
    mobileNumber: '09171234567'
  })
});

// 2. Login
const loginResponse = await fetch('http://localhost:3000/api/resident-auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    idNumber: 'PUROK1-2025-001',
    password: 'MySecurePass123'
  })
});

const { token } = await loginResponse.json();

// 3. Get profile
const profileResponse = await fetch('http://localhost:3000/api/resident-auth/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 4. Submit document request
const requestResponse = await fetch('http://localhost:3000/api/requests', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    docType: 'Barangay Clearance',
    purpose: 'Employment requirement'
  })
});

// 5. Check request status
const myRequestsResponse = await fetch('http://localhost:3000/api/requests', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 6. Register for event
const eventResponse = await fetch('http://localhost:3000/api/events/1/attendance', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});
```

---

## Database Schema

### resident_auth Table
```sql
CREATE TABLE resident_auth (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  residentId INTEGER UNIQUE NOT NULL,
  idNumber TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  mobileNumber TEXT,
  isVerified INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  lastLogin TEXT,
  FOREIGN KEY (residentId) REFERENCES residents(id) ON DELETE CASCADE,
  FOREIGN KEY (idNumber) REFERENCES residents(idNumber) ON DELETE CASCADE
)
```

---

## Testing

Run the comprehensive test suite:

```bash
cd backend
node tests/resident-auth.test.js
```

**Test Coverage:**
- ✅ Registration validation
- ✅ Login authentication
- ✅ Token generation and verification
- ✅ Profile management
- ✅ Password change
- ✅ Access control
- ✅ Error handling

---

## Support & Troubleshooting

### Common Issues:

**Q: Can't register - "ID number not found"**
- A: The resident must be added to the system by barangay staff first before they can create an account.

**Q: Login fails - "ID not yet released"**
- A: Only residents with "Released" status IDs can login. Contact barangay office to release your ID.

**Q: Token expired error**
- A: Resident tokens expire after 7 days. Login again to get a new token.

**Q: Can't submit document request**
- A: Ensure your ID status is "Released". Pending IDs cannot request documents.

---

## Changelog

### Version 1.0.0 (2025-11-12)
- ✅ Initial implementation of resident authentication
- ✅ Document request system for residents
- ✅ Complaint submission system
- ✅ Event registration system
- ✅ Profile management
- ✅ Comprehensive test coverage
- ✅ Security and access control implementation
