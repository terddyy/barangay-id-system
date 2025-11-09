// apiClient.js
const API_BASE = "http://localhost:3000/api";

async function apiLogin(usernameOrEmail, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  return await res.json();
}

async function apiGetResidents(token) {
  const res = await fetch(`${API_BASE}/residents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}

async function apiAddResident(token, data) {
  const res = await fetch(`${API_BASE}/residents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return await res.json();
}

async function apiUpdateResidentStatus(token, id, status) {
  const res = await fetch(`${API_BASE}/residents/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return await res.json();
}
