import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminPage() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [itemId, setItemId] = useState("");
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    fetch(`${API}/me`, {
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));

        if (res.status === 401) {
          setAuthError("unauthorized");
          setUser(null);
          return;
        }

        if (!res.ok) {
          setAuthError("error");
          setUser(null);
          return;
        }

        setUser(data);
      })
      .catch((err) => {
        console.error("Failed to load user:", err);
        setAuthError("error");
        setUser(null);
      });
  }, []);

  async function createMarker() {
    const res = await fetch(`${API}/admin/markers`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude,
        longitude,
        item_id: itemId,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Create marker failed:", data);
      alert(data.error || "Failed to create marker");
      return;
    }

    console.log(data);
    alert("Marker created!");
  }

  if (authError === "unauthorized") {
    return <h1>401 Unauthorized</h1>;
  }

  if (authError === "error") {
    return <h1>Unable to load admin page</h1>;
  }

  if (!user) {
    return <div>Loading...</div>;
  }

  if (!user.is_admin) {
    return <h1>403 Forbidden</h1>;
  }

  return (
    <div style={{ padding: "30px" }}>

      <h1>Admin Panel</h1>

      <input
        placeholder="Latitude"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Longitude"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Item ID (ex: hat_crown)"
        value={itemId}
        onChange={(e) => setItemId(e.target.value)}
      />

      <br /><br />

      <button onClick={createMarker}>
        Create Marker
      </button>

    </div>
  );
}