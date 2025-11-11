/**
 * Data Service Layer - Clean Architecture
 * Replaces IndexedDB with Backend API (SQLite)
 * 
 * Benefits:
 * - Centralized data storage in SQLite
 * - Multi-device sync capability
 * - Works in incognito mode
 * - Proper transaction support
 * - Better error handling
 * - Audit trail persistence
 * 
 * @author Senior Software Engineer
 * @date November 10, 2025
 */

// Note: API_BASE is declared in apisClient.js (for backward compatibility)
// Reuse existing API_BASE instead of redeclaring
const API_BASE = window.API_BASE || "http://localhost:3000/api";

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getToken() {
  return localStorage.getItem("token");
}

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

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

// ============================================
// AUTH SERVICE
// ============================================

const AuthService = {
  async login(usernameOrEmail, password) {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    return handleResponse(res);
  },
  
  isAuthenticated() {
    return !!getToken();
  },
  
  getUser() {
    const userRaw = localStorage.getItem("user");
    if (!userRaw) return null;
    try {
      return JSON.parse(userRaw);
    } catch {
      return null;
    }
  }
};

// ============================================
// RESIDENT SERVICE
// ============================================

const ResidentService = {
  /**
   * Get all residents with optional filters
   */
  async getAll(search = "", status = "") {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    
    const res = await fetch(`${API_BASE}/residents?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Get single resident by ID
   */
  async getById(id) {
    const res = await fetch(`${API_BASE}/residents/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Generate unique ID number
   */
  async generateIdNumber(purokOrPosition) {
    const res = await fetch(`${API_BASE}/residents/generate-id`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ purokOrPosition }),
    });
    return handleResponse(res);
  },

  /**
   * Create new resident
   */
  async create(data) {
    const res = await fetch(`${API_BASE}/residents`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  /**
   * Update resident
   */
  async update(id, data) {
    const res = await fetch(`${API_BASE}/residents/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  /**
   * Update resident status (Pending/Released)
   */
  async updateStatus(id, status) {
    const res = await fetch(`${API_BASE}/residents/${id}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  /**
   * Delete resident (admin only)
   */
  async delete(id) {
    const res = await fetch(`${API_BASE}/residents/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Get statistics
   */
  async getStats() {
    const residents = await this.getAll();
    return {
      total: residents.length,
      pending: residents.filter(r => r.status === 'Pending').length,
      released: residents.filter(r => r.status === 'Released').length,
    };
  }
};

// ============================================
// REQUEST SERVICE (E-Documents)
// ============================================

const RequestService = {
  async getAll(status = "", residentIdNumber = "") {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (residentIdNumber) params.append("residentIdNumber", residentIdNumber);
    
    const res = await fetch(`${API_BASE}/requests?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async create(data) {
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateStatus(id, status) {
    const res = await fetch(`${API_BASE}/requests/${id}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async getStats() {
    const requests = await this.getAll();
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'Pending').length,
      approved: requests.filter(r => r.status === 'Approved').length,
      released: requests.filter(r => r.status === 'Released').length,
    };
  }
};

// ============================================
// COMPLAINT SERVICE
// ============================================

const ComplaintService = {
  async getAll(status = "") {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    
    const res = await fetch(`${API_BASE}/complaints?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async create(data) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateStatus(id, status) {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async getStats() {
    const complaints = await this.getAll();
    return {
      total: complaints.length,
      open: complaints.filter(c => c.status === 'Open').length,
      inProgress: complaints.filter(c => c.status === 'InProgress').length,
      resolved: complaints.filter(c => c.status === 'Resolved').length,
      closed: complaints.filter(c => c.status === 'Closed').length,
    };
  }
};

// ============================================
// AUDIT SERVICE
// ============================================

const AuditService = {
  async getAll() {
    const res = await fetch(`${API_BASE}/audit`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getRecent(limit = 12) {
    const logs = await this.getAll();
    return logs.slice(0, limit);
  },

  /**
   * Create audit log entry
   * @param {string} action - Action identifier (e.g., 'id:mark-released')
   * @param {object} details - Additional details about the action
   */
  async create(action, details = {}) {
    try {
      const res = await fetch(`${API_BASE}/audit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ 
          action, 
          details: typeof details === 'object' ? JSON.stringify(details) : details 
        }),
      });
      return handleResponse(res);
    } catch (error) {
      // Audit failures should not break user experience
      console.warn('⚠️ Audit log failed (non-critical):', error.message);
      return null;
    }
  }
};

// ============================================
// EVENTS SERVICE
// ============================================

const EventService = {
  async getAll(eventType = "") {
    const params = new URLSearchParams();
    if (eventType) params.append("eventType", eventType);
    
    const res = await fetch(`${API_BASE}/events?${params}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getById(id) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async create(data) {
    const res = await fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async update(id, data) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async delete(id) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getAttendance(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async recordAttendance(eventId, data) {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getStats() {
    const events = await this.getAll();
    const now = new Date();
    return {
      total: events.length,
      upcoming: events.filter(e => new Date(e.eventDate) > now).length,
      past: events.filter(e => new Date(e.eventDate) <= now).length,
    };
  }
};

// ============================================
// UPLOAD SERVICE
// ============================================

const UploadService = {
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append("photo", file);
    
    const res = await fetch(`${API_BASE}/upload/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return handleResponse(res);
  },

  async uploadSignature(file) {
    const formData = new FormData();
    formData.append("signature", file);
    
    const res = await fetch(`${API_BASE}/upload/signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    return handleResponse(res);
  }
};

// ============================================
// CHATBOT SERVICE - REMOVED
// ============================================
// Chatbot now uses simple FAQ system (no AI/API calls needed)

// ============================================
// REPORTS SERVICE
// ============================================

const ReportService = {
  /**
   * Get comprehensive resident statistics
   */
  async getResidentReport() {
    const res = await fetch(`${API_BASE}/reports/residents`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Get E-Document request statistics
   */
  async getRequestReport() {
    const res = await fetch(`${API_BASE}/reports/requests`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Get complaint statistics
   */
  async getComplaintReport() {
    const res = await fetch(`${API_BASE}/reports/complaints`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  /**
   * Get complete system summary (all statistics)
   */
  async getSummary() {
    const res = await fetch(`${API_BASE}/reports/summary`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  }
};

// ============================================
// EXPORT FOR BACKWARD COMPATIBILITY
// ============================================

// Legacy function names for easier migration
window.ResidentService = ResidentService;
window.RequestService = RequestService;
window.ComplaintService = ComplaintService;
window.AuditService = AuditService;
window.EventService = EventService;
window.UploadService = UploadService;
window.ReportService = ReportService;
window.AuthService = AuthService;
// ChatbotService removed - using simple FAQ helper instead
