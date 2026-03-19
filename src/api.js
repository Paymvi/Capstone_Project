const API = "http://localhost:3000";

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
    throw new Error("Login failed");
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

  const res = await fetch("http://localhost:3000/markers", {
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
export async function apiSetCollected(itemId) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/items/collect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      itemId
    })
  });

  if (!res.ok) {
    throw new Error("Failed to collect item");
  }

  return res.json();
}

//Get items
export async function apiGetItems() {
  const res = await fetch("http://localhost:3000/items");
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

  const res = await fetch("http://localhost:3000/markers", {
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