// apiClient.js - Centralized API client for Barangay ID System
const API_BASE = "http://localhost:3000/api";

// Helper to get token from localStorage
function getToken() {
  return localStorage.getItem("token");
}

// Helper for common fetch options
function getHeaders(includeAuth = true, isJson = true) {
  const headers = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

// AUTH
async function apiLogin(usernameOrEmail, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  return await res.json();
}

// RESIDENTS
async function apiGetResidents(search = "", status = "") {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  
  const res = await fetch(`${API_BASE}/residents?${params}`, {
    headers: getHeaders(),
  });
  return await res.json();
}

async function apiGetResident(id) {
  const res = await fetch(`${API_BASE}/residents/${id}`, {
    headers: getHeaders(),
  });
  return await res.json();
}

async function apiGenerateIdNumber(purokOrPosition) {
  const res = await fetch(`${API_BASE}/residents/generate-id`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ purokOrPosition }),
  });
  return await res.json();
}

async function apiAddResident(data) {
  const res = await fetch(`${API_BASE}/residents`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function apiUpdateResident(id, data) {
  const res = await fetch(`${API_BASE}/residents/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function apiUpdateResidentStatus(id, status) {
  const res = await fetch(`${API_BASE}/residents/${id}/status`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return await res.json();
}

async function apiDeleteResident(id) {
  const res = await fetch(`${API_BASE}/residents/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return await res.json();
}

// FILE UPLOAD
async function apiUploadPhoto(file) {
  const formData = new FormData();
  formData.append("photo", file);
  
  const res = await fetch(`${API_BASE}/upload/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return await res.json();
}

async function apiUploadSignature(file) {
  const formData = new FormData();
  formData.append("signature", file);
  
  const res = await fetch(`${API_BASE}/upload/signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  return await res.json();
}

// REQUESTS
async function apiGetRequests(status = "", residentIdNumber = "") {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (residentIdNumber) params.append("residentIdNumber", residentIdNumber);
  
  const res = await fetch(`${API_BASE}/requests?${params}`, {
    headers: getHeaders(),
  });
  return await res.json();
}

async function apiAddRequest(data) {
  const res = await fetch(`${API_BASE}/requests`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function apiUpdateRequestStatus(id, status) {
  const res = await fetch(`${API_BASE}/requests/${id}/status`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return await res.json();
}

// COMPLAINTS
async function apiGetComplaints(status = "") {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  
  const res = await fetch(`${API_BASE}/complaints?${params}`, {
    headers: getHeaders(),
  });
  return await res.json();
}

async function apiAddComplaint(data) {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function apiUpdateComplaintStatus(id, status) {
  const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return await res.json();
}

// EVENTS
async function apiGetEvents(eventType = "") {
  const params = new URLSearchParams();
  if (eventType) params.append("eventType", eventType);
  
  const res = await fetch(`${API_BASE}/events?${params}`, {
    headers: getHeaders(),
  });
  return await res.json();
}

async function apiGetEvent(id) {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    headers: getHeaders(),
  });
  return await res.json();
}

async function apiAddEvent(data) {
  const res = await fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function apiUpdateEvent(id, data) {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function apiDeleteEvent(id) {
  const res = await fetch(`${API_BASE}/events/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return await res.json();
}

async function apiGetEventAttendance(eventId) {
  const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
    headers: getHeaders(),
  });
  return await res.json();
}

async function apiRecordAttendance(eventId, data) {
  const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return await res.json();
}

// AUDIT
async function apiGetAuditLog() {
  const res = await fetch(`${API_BASE}/audit`, {
    headers: getHeaders(),
  });
  return await res.json();
}

// REPORTS
async function apiGetResidentReport() {
  const res = await fetch(`${API_BASE}/reports/residents`, {
    headers: getHeaders(),
  });
  return await res.json();
}

async function apiGetRequestReport() {
  const res = await fetch(`${API_BASE}/reports/requests`, {
    headers: getHeaders(),
  });
  return await res.json();
}
