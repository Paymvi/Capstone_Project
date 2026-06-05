const API = import.meta.env.VITE_API_URL;

console.log("API URL:", API);

export function authHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

async function handleResponse(res, fallbackMessage) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("BACKEND ERROR:", data);
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

async function apiFetch(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,

    // Important:
    // This lets the browser send/receive the HttpOnly auth cookie.
    credentials: "include",

    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
}

// Login API
export async function apiPasswordLogin(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Login failed");
  }

  return res.json();
}

// Get user state
export async function apiGetState() {
  const res = await fetch(`${API}/me/state`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch state");
  }

  return res.json();
}

// Add marker
export async function apiAddMarker(lat, lng, item_id) {
  const res = await apiFetch("/markers", {
    method: "POST",
    body: JSON.stringify({
      lat,
      lng,
      item_id,
    }),
  });

  return handleResponse(res, "Failed to add marker");
}

// Set equipped items
export async function apiSetEquipped(hat, body, outside) {
  const res = await apiFetch("/equip", {
    method: "PUT",
    body: JSON.stringify({
      hat,
      body,
      outside,
    }),
  });

  return handleResponse(res, "Failed to save equipped");
}

// Collect item
export async function apiSetCollected({ markerId, itemId, lat, lng }) {
  const res = await apiFetch("/items/collect", {
    method: "POST",
    body: JSON.stringify({
      markerId,
      itemId,
      lat,
      lng,
    }),
  });

  return handleResponse(res, "Collect failed");
}

// Get items
export async function apiGetItems() {
  const res = await apiFetch("/items", {
    method: "GET",
  });

  return handleResponse(res, "Failed to fetch items");
}

// Register API
export async function apiRegister(username, password) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return handleResponse(res, "Register failed");
}

// Google login
export async function apiGoogleLogin(token) {
  const res = await apiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({
      token,
    }),
  });

  return handleResponse(res, "Google login failed");
}

// Get item drop markers
export async function apiGetMarkers() {
  const res = await apiFetch("/markers", {
    method: "GET",
  });

  return handleResponse(res, "Failed to fetch markers");
}

export async function apiGetNearbyMarkers(lat, lng) {
  const res = await apiFetch(`/markers/nearby?lat=${lat}&lng=${lng}`, {
    method: "GET",
  });

  const data = await handleResponse(res, "Failed to fetch nearby markers");

  return data.markers;
}

export async function apiLogout() {
  const res = await fetch(`${API}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Logout failed");
  }

  return res.json();
}