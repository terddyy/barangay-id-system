// ============================================
// QUICK API REFERENCE GUIDE
// ============================================

/**
 * This file provides quick examples of how to use the service layer
 * in your application. All services are globally accessible via window object.
 * 
 * @see dataService.js for full implementation
 * @see apisClient.js for legacy API functions
 */

// ============================================
// AUTHENTICATION
// ============================================

// Login
const loginResult = await AuthService.login("admin@example.com", "password123");
// Returns: { token: "...", user: { username, email, role } }
// Token is automatically stored in localStorage

// Check if authenticated
const isLoggedIn = AuthService.isAuthenticated();
// Returns: boolean

// Get current user
const currentUser = AuthService.getUser();
// Returns: { username, email, role } or null

// Logout (manual)
localStorage.removeItem("token");
localStorage.removeItem("user");
window.location.href = "index.html";


// ============================================
// RESIDENTS
// ============================================

// Get all residents
const allResidents = await ResidentService.getAll();
// Returns: Array of resident objects

// Search residents
const searchResults = await ResidentService.getAll("John", "Pending");
// Params: (searchTerm, status)
// Returns: Filtered array

// Get single resident
const singleResident = await ResidentService.getById(123);
// Returns: Single resident object

// Generate ID number
const newIdNumber = await ResidentService.generateIdNumber("Purok 1");
// Returns: { idNumber: "BHS-2025-0001" }

// Create resident
const newResident = await ResidentService.create({
  idno: "BHS-2025-0001",
  fname: "John",
  lname: "Doe",
  mname: "Smith",
  suffix: "",
  bdate: "1990-01-15",
  sex: "Male",
  civil: "Single",
  purok: "Purok 1",
  contactNo: "09123456789",
  email: "john@example.com",
  photo: "http://...",
  status: "Pending"
});
// Returns: Created resident with ID

// Update resident
const updated = await ResidentService.update(123, {
  contactNo: "09987654321",
  email: "newemail@example.com"
});
// Returns: Updated resident

// Update status
await ResidentService.updateStatus(123, "Released");
// Params: (id, status) where status = "Pending" | "Released"

// Delete resident (admin only)
await ResidentService.delete(123);
// Returns: { message: "Resident deleted" }

// Get statistics
const stats = await ResidentService.getStats();
// Returns: { total, pending, released }


// ============================================
// E-DOCUMENTS / REQUESTS
// ============================================

// Get all requests
const allRequests = await RequestService.getAll();
// Returns: Array of request objects

// Filter by status
const pendingRequests = await RequestService.getAll("Pending");
// Status options: "Pending", "Approved", "Released", "Rejected"

// Filter by resident ID
const residentRequests = await RequestService.getAll("", "BHS-2025-0001");

// Create request
const newRequest = await RequestService.create({
  residentIdNumber: "BHS-2025-0001",
  residentName: "John Doe",
  docType: "Barangay Clearance",
  purpose: "Employment",
  status: "Pending"
});
// Returns: Created request with ID and timestamp

// Update request status
await RequestService.updateStatus(456, "Approved");
// Status: "Pending" | "Approved" | "Released" | "Rejected"

// Get statistics
const reqStats = await RequestService.getStats();
// Returns: { total, pending, approved, released }


// ============================================
// COMPLAINTS
// ============================================

// Get all complaints
const allComplaints = await ComplaintService.getAll();

// Filter by status
const openComplaints = await ComplaintService.getAll("Open");
// Status: "Open" | "InProgress" | "Resolved" | "Closed"

// Create complaint
const newComplaint = await ComplaintService.create({
  complainant: "John Doe",
  contactNo: "09123456789",
  subject: "Noise complaint",
  description: "Loud music at night",
  status: "Open"
});

// Update status
await ComplaintService.updateStatus(789, "InProgress");

// Get statistics
const compStats = await ComplaintService.getStats();
// Returns: { total, open, inProgress, resolved, closed }


// ============================================
// AUDIT LOGS
// ============================================

// Get all audit logs
const allLogs = await AuditService.getAll();
// Returns: Array of audit entries with user, action, timestamp

// Get recent logs (default 12)
const recentLogs = await AuditService.getRecent(20);
// Returns: Last N audit entries


// ============================================
// EVENTS
// ============================================

// Get all events
const allEvents = await EventService.getAll();

// Filter by type
const meetings = await EventService.getAll("Meeting");
// Types: "Meeting", "Assembly", "Activity", etc.

// Get single event
const event = await EventService.getById(100);

// Create event
const newEvent = await EventService.create({
  eventName: "Community Meeting",
  eventType: "Meeting",
  eventDate: "2025-12-01",
  eventTime: "14:00",
  location: "Barangay Hall",
  description: "Monthly meeting",
  maxAttendees: 100
});

// Update event
await EventService.update(100, {
  maxAttendees: 150,
  location: "Covered Court"
});

// Delete event
await EventService.delete(100);

// Get attendance list
const attendance = await EventService.getAttendance(100);

// Record attendance
await EventService.recordAttendance(100, {
  residentIdNumber: "BHS-2025-0001",
  residentName: "John Doe",
  checkInTime: "14:15"
});

// Get statistics
const eventStats = await EventService.getStats();
// Returns: { total, upcoming, past }


// ============================================
// FILE UPLOADS
// ============================================

// Upload photo (from file input)
const photoInput = document.getElementById("photoInput");
const photoFile = photoInput.files[0];
const photoResult = await UploadService.uploadPhoto(photoFile);
// Returns: { url: "http://localhost:3000/uploads/photos/..." }

// Upload signature
const sigFile = signatureInput.files[0];
const sigResult = await UploadService.uploadSignature(sigFile);
// Returns: { url: "http://localhost:3000/uploads/signatures/..." }


// ============================================
// REPORTS
// ============================================

// Get resident report
const residentReport = await ReportService.getResidentReport();
// Returns: Comprehensive resident statistics

// Get request report
const requestReport = await ReportService.getRequestReport();
// Returns: Document request statistics


// ============================================
// ERROR HANDLING PATTERN
// ============================================

// Recommended pattern for all service calls
async function handleResidentOperation() {
  try {
    // Show loading indicator
    showLoadingSpinner();
    
    // Make service call
    const residents = await ResidentService.getAll();
    
    // Process data
    displayResidents(residents);
    
    // Hide loading indicator
    hideLoadingSpinner();
    
  } catch (error) {
    console.error("❌ Operation failed:", error);
    
    // Show user-friendly error
    showErrorMessage(error.message || "An error occurred");
    
    // Hide loading indicator
    hideLoadingSpinner();
    
    // Handle specific errors
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      // Token expired - redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    }
  }
}


// ============================================
// LEGACY API FUNCTIONS (Backward Compatible)
// ============================================

// If you prefer the old function-based API:
// These are available from apisClient.js

// Login
const result = await apiLogin("admin@example", "password123");

// Residents
const residents = await apiGetResidents();
const residentById = await apiGetResident(123);
const idNumber = await apiGenerateIdNumber("Purok 1");
await apiAddResident(data);
await apiUpdateResident(123, data);
await apiUpdateResidentStatus(123, "Released");
await apiDeleteResident(123);

// Uploads
await apiUploadPhoto(file);
await apiUploadSignature(file);

// Requests
await apiGetRequests();
await apiAddRequest(data);
await apiUpdateRequestStatus(456, "Approved");

// Complaints
await apiGetComplaints();
await apiAddComplaint(data);
await apiUpdateComplaintStatus(789, "Resolved");

// Events
await apiGetEvents();
await apiGetEvent(100);
await apiAddEvent(data);
await apiUpdateEvent(100, data);
await apiDeleteEvent(100);
await apiGetEventAttendance(100);
await apiRecordAttendance(100, data);

// Audit
await apiGetAuditLog();

// Reports
await apiGetResidentReport();
await apiGetRequestReport();


// ============================================
// UTILITY FUNCTIONS
// ============================================

// Check authentication status
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// Get current user info
function getCurrentUser() {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

// Check if user is admin
function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// Format datetime for display
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}


// ============================================
// DEBUGGING HELPERS
// ============================================

// Test all services
async function testAllServices() {
  console.log("🧪 Testing all services...");
  
  try {
    console.log("Testing ResidentService...");
    const residents = await ResidentService.getAll();
    console.log("✅ ResidentService:", residents.length, "residents");
    
    console.log("Testing RequestService...");
    const requests = await RequestService.getAll();
    console.log("✅ RequestService:", requests.length, "requests");
    
    console.log("Testing ComplaintService...");
    const complaints = await ComplaintService.getAll();
    console.log("✅ ComplaintService:", complaints.length, "complaints");
    
    console.log("Testing EventService...");
    const events = await EventService.getAll();
    console.log("✅ EventService:", events.length, "events");
    
    console.log("Testing AuditService...");
    const logs = await AuditService.getRecent(5);
    console.log("✅ AuditService:", logs.length, "recent logs");
    
    console.log("✅ All services working!");
  } catch (error) {
    console.error("❌ Service test failed:", error);
  }
}

// Run in console: testAllServices()
