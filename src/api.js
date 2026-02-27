const API = "http://localhost:5000";

export async function apiLogin(username) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });

  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function apiGetState(userId) {
  const res = await fetch(`${API}/state/${userId}`);
  if (!res.ok) throw new Error("Failed to load state");
  return res.json();
}

export async function apiAddMarker(userId, latitude, longitude) {
  const res = await fetch(`${API}/markers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, latitude, longitude }),
  });

  if (!res.ok) throw new Error("Failed to add marker");
  return res.json();
}

export async function apiSetEquipped(userId, equipped) {
  const res = await fetch(`${API}/equip`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...equipped }),
  });

  if (!res.ok) throw new Error("Failed to save equipped");
  return res.json();
}

export async function apiSetCollected(userId, collectedItems) {
  const res = await fetch("http://localhost:5000/collected", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, collectedItems }),
  });

  if (!res.ok) throw new Error("Failed to save collected items");
  return res.json();
}