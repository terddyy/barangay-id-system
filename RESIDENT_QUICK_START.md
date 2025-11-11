# Resident Login System - Quick Start Guide

## 🚀 Quick Start for Developers

### Step 1: Ensure Server is Running
```bash
cd backend
node server.js
```

You should see: `✅ API running on http://localhost:3000`

---

## 🧪 Test the System (Complete Workflow)

### Prerequisites
You need a resident in the database with:
- ID number (e.g., "PUROK1-2025-001")
- Status: "Released"

If not, create one via admin panel or SQL:
```sql
INSERT INTO residents (fullName, birthDate, address, contact, purokOrPosition, idNumber, status, createdAt)
VALUES ('Juan Dela Cruz', '1990-01-01', '123 Test St', '09171234567', 'Purok 1', 'PUROK1-2025-001', 'Released', datetime('now'));
```

---

## 📝 Test Workflow

### 1. Register Resident Account

```bash
curl -X POST http://localhost:3000/api/resident-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PUROK1-2025-001",
    "password": "TestPassword123",
    "email": "juan@example.com",
    "mobileNumber": "09171234567"
  }'
```

**Expected Response:**
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

---

### 2. Login

```bash
curl -X POST http://localhost:3000/api/resident-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idNumber": "PUROK1-2025-001",
    "password": "TestPassword123"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "resident": {
    "id": 1,
    "idNumber": "PUROK1-2025-001",
    "fullName": "Juan Dela Cruz",
    "email": "juan@example.com",
    "mobileNumber": "09171234567",
    "address": "123 Test St",
    "contact": "09171234567",
    "photoUrl": null,
    "status": "Released"
  }
}
```

**Copy the token** - you'll need it for all subsequent requests!

---

### 3. Get Profile

```bash
curl -X GET http://localhost:3000/api/resident-auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 4. Submit Document Request

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "docType": "Barangay Clearance",
    "purpose": "Employment requirement"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "message": "Request submitted successfully"
}
```

---

### 5. View My Requests

```bash
curl -X GET http://localhost:3000/api/requests \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "residentIdNumber": "PUROK1-2025-001",
    "docType": "Barangay Clearance",
    "purpose": "Employment requirement",
    "status": "Pending",
    "createdAt": "2025-11-12T10:30:00.000Z",
    "updatedAt": null
  }
]
```

---

### 6. Submit Complaint

```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "details": "Street lighting is not working in our area for the past week"
  }'
```

---

### 7. View My Complaints

```bash
curl -X GET http://localhost:3000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 8. View Events

```bash
curl -X GET http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 9. Register for Event (if events exist)

```bash
curl -X POST http://localhost:3000/api/events/1/attendance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 10. Update Profile

```bash
curl -X PUT http://localhost:3000/api/resident-auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "mobileNumber": "09189999999",
    "contact": "09189999999"
  }'
```

---

### 11. Change Password

```bash
curl -X PUT http://localhost:3000/api/resident-auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPassword123",
    "newPassword": "NewSecurePassword456"
  }'
```

---

## 🌐 Using Postman

### Setup:

1. **Import as Collection:**
   - Create new collection "Resident API"
   - Add environment variable `baseUrl` = `http://localhost:3000`
   - Add environment variable `token` = (will be set after login)

2. **Register Request:**
   - Method: POST
   - URL: `{{baseUrl}}/api/resident-auth/register`
   - Body: JSON
   ```json
   {
     "idNumber": "PUROK1-2025-001",
     "password": "TestPassword123",
     "email": "juan@example.com",
     "mobileNumber": "09171234567"
   }
   ```

3. **Login Request:**
   - Method: POST
   - URL: `{{baseUrl}}/api/resident-auth/login`
   - Body: JSON
   ```json
   {
     "idNumber": "PUROK1-2025-001",
     "password": "TestPassword123"
   }
   ```
   - **Tests** tab (to auto-save token):
   ```javascript
   if (pm.response.code === 200) {
     const response = pm.response.json();
     pm.environment.set("token", response.token);
   }
   ```

4. **All Other Requests:**
   - Headers: `Authorization: Bearer {{token}}`

---

## 💻 Using JavaScript (Frontend)

### Complete Example:

```javascript
const API_BASE = 'http://localhost:3000';
let authToken = null;

// 1. Register
async function register() {
  const response = await fetch(`${API_BASE}/api/resident-auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idNumber: 'PUROK1-2025-001',
      password: 'TestPassword123',
      email: 'juan@example.com',
      mobileNumber: '09171234567'
    })
  });
  
  const data = await response.json();
  console.log('Registered:', data);
  return data;
}

// 2. Login
async function login() {
  const response = await fetch(`${API_BASE}/api/resident-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idNumber: 'PUROK1-2025-001',
      password: 'TestPassword123'
    })
  });
  
  const data = await response.json();
  authToken = data.token; // Save token
  console.log('Logged in:', data);
  return data;
}

// 3. Get Profile
async function getProfile() {
  const response = await fetch(`${API_BASE}/api/resident-auth/profile`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  const data = await response.json();
  console.log('Profile:', data);
  return data;
}

// 4. Submit Document Request
async function submitRequest() {
  const response = await fetch(`${API_BASE}/api/requests`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      docType: 'Barangay Clearance',
      purpose: 'Employment requirement'
    })
  });
  
  const data = await response.json();
  console.log('Request submitted:', data);
  return data;
}

// 5. View My Requests
async function getMyRequests() {
  const response = await fetch(`${API_BASE}/api/requests`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  const data = await response.json();
  console.log('My requests:', data);
  return data;
}

// 6. Submit Complaint
async function submitComplaint() {
  const response = await fetch(`${API_BASE}/api/complaints`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      details: 'Street lighting not working'
    })
  });
  
  const data = await response.json();
  console.log('Complaint submitted:', data);
  return data;
}

// 7. View Events
async function getEvents() {
  const response = await fetch(`${API_BASE}/api/events`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  
  const data = await response.json();
  console.log('Events:', data);
  return data;
}

// 8. Register for Event
async function registerForEvent(eventId) {
  const response = await fetch(`${API_BASE}/api/events/${eventId}/attendance`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  
  const data = await response.json();
  console.log('Registered for event:', data);
  return data;
}

// Complete workflow
async function runCompleteWorkflow() {
  try {
    // Register (skip if already registered)
    // await register();
    
    // Login
    await login();
    
    // Get profile
    await getProfile();
    
    // Submit request
    await submitRequest();
    
    // View requests
    await getMyRequests();
    
    // Submit complaint
    await submitComplaint();
    
    // View events
    await getEvents();
    
    console.log('✅ Complete workflow successful!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run it!
runCompleteWorkflow();
```

---

## 🐛 Troubleshooting

### Issue: "ID number not found"
**Solution:** The resident must be created by staff first. Add resident to database.

### Issue: "ID not yet released"
**Solution:** Update resident status to "Released":
```sql
UPDATE residents SET status = 'Released' WHERE idNumber = 'PUROK1-2025-001';
```

### Issue: "Account already exists"
**Solution:** This ID number already has an account. Use login instead.

### Issue: "Invalid credentials"
**Solution:** Check password spelling or try registering first.

### Issue: "No auth token"
**Solution:** Add `Authorization: Bearer YOUR_TOKEN` header to request.

### Issue: "Invalid/expired token"
**Solution:** Token expired (7 days). Login again to get new token.

---

## 📊 Verify in Database

### Check if resident was created:
```sql
SELECT * FROM residents WHERE idNumber = 'PUROK1-2025-001';
```

### Check if account was created:
```sql
SELECT * FROM resident_auth WHERE idNumber = 'PUROK1-2025-001';
```

### Check requests:
```sql
SELECT * FROM requests WHERE residentIdNumber = 'PUROK1-2025-001';
```

### Check complaints:
```sql
SELECT * FROM complaints WHERE residentIdNumber = 'PUROK1-2025-001';
```

### Check audit log:
```sql
SELECT * FROM audit_log WHERE byUser = 'PUROK1-2025-001' ORDER BY ts DESC;
```

---

## 🎯 Success Indicators

After running the complete workflow, you should see:
- ✅ Resident account created in `resident_auth` table
- ✅ Login successful with token returned
- ✅ Profile data retrieved
- ✅ Document request in `requests` table with status "Pending"
- ✅ Complaint in `complaints` table with status "Open"
- ✅ Multiple entries in `audit_log` table
- ✅ `lastLogin` timestamp updated in `resident_auth`

---

## 📚 Additional Resources

- **Full API Documentation:** See `RESIDENT_LOGIN_API.md`
- **Implementation Details:** See `RESIDENT_IMPLEMENTATION_SUMMARY.md`
- **Run Tests:** `node backend/tests/resident-auth.test.js`

---

## ✨ Quick Reference

**Base URL:** `http://localhost:3000`

**Auth Header Format:** `Authorization: Bearer <token>`

**Token Lifespan:** 7 days

**Main Endpoints:**
- Register: `POST /api/resident-auth/register`
- Login: `POST /api/resident-auth/login`
- Profile: `GET /api/resident-auth/profile`
- Requests: `GET/POST /api/requests`
- Complaints: `GET/POST /api/complaints`
- Events: `GET /api/events`

---

**Happy Testing! 🚀**
