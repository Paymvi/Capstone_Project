import { useEffect, useState } from "react";

export default function AdminPage() {

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [itemId, setItemId] = useState("");
  const [user, setUser] = useState(null);

  // Load current user
  useEffect(() => {

    const token = localStorage.getItem("token");

    fetch("http://localhost:3000/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => console.error(err));

  }, []);

  async function createMarker() {

    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3000/admin/markers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        latitude,
        longitude,
        item_id: itemId
      })
    });

    const data = await res.json();
    console.log(data);

    alert("Marker created!");
  }

    // Wait for user info
  if (!user) {
    return <div>Loading...</div>;
  }

  // Block non-admins
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