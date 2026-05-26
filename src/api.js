const API = import.meta.env.VITE_API_URL;

console.log("API URL:", import.meta.env.VITE_API_URL);

export function authHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

// Login API
export async function apiPasswordLogin(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
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
    headers: authHeaders()
  });

  if (!res.ok) {
    throw new Error("Failed to fetch state");
  }

  return res.json();
}


// Add marker
export async function apiAddMarker(lat, lng, item_id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/markers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      lat: lat,
      lng: lng,
      item_id: item_id, // 🔥 MUST BE HERE
    }),
  });

  return res.json();
}


// Set equipped items
export async function apiSetEquipped(hat, body, outside) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/equip`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      hat,
      body,
      outside
    })
  });

  if (!res.ok) {
    throw new Error("Failed to save equipped");
  }

  return res.json();
}


// Collect item
export async function apiSetCollected({ markerId, itemId, lat, lng }) {
  const res = await fetch(`${API}/items/collect`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      markerId,
      itemId,
      lat,
      lng
    })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error("BACKEND ERROR:", data);
    throw new Error(data.error || "Collect failed");
  }

  return data;
}

//Get items
export async function apiGetItems() {
  const res = await fetch(`${API}/items`);
  return res.json();
}

// Register API
export async function apiRegister(username, password) {
  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Register failed");
  }

  return data;
}


// Google login
export async function apiGoogleLogin(token) {
  const res = await fetch(`${API}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Google login failed");
  }

  return data;
}

// Get Item Drop Markers
export async function apiGetMarkers() {
  const token = localStorage.getItem("token");
    console.log("GET MARKERS TOKEN:", token);

  const res = await fetch(`${API}/markers`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if(!res.ok){
      console.log("GET MARKERS TOKEN:", token);
    throw new Error("Failed to fetch markers");
  }

  return res.json();
}