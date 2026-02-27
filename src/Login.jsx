import { useState } from "react";
import { apiLogin } from "./api";

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState("");

  async function handleLogin() {
    if (!username.trim()) return;

    const user = await apiLogin(username);

    localStorage.setItem("userId", String(user.id));
    onLoggedIn(user.id);
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login</h2>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
        style={{ padding: 8 }}
      />

      <button
        onClick={handleLogin}
        style={{ marginLeft: 10, padding: 8 }}
      >
        Login
      </button>

      <p>Type any name. It will persist!</p>
    </div>
  );
}