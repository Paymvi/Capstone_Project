const API = "http://localhost:5000";

// Login API 
export async function apiPasswordLogin(username, password){
    const res = await fetch("http://localhost:5000/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
  });

  if (!res.ok){
    throw new Error("Login failed")
  }

  return res.json();
}

export async function apiGetState() {

  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/me/state", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Failed to load state");

  return res.json();
}

export async function apiAddMarker(latitude, longitude) {

  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/markers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      latitude,
      longitude
    })
  });

  if (!res.ok) throw new Error("Failed to add marker");

  return res.json();
}

export async function apiSetEquipped(hat, body, outside) {

  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/equip", {
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

export async function apiSetCollected(itemId) {

  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/items/collect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      itemId
    })
  });

  if (!res.ok) throw new Error("Failed to collect item");

  return res.json();
}

// Register API 
export async function apiRegister( username, password) {

  const res = await fetch("http://localhost:5000/auth/register", {
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

