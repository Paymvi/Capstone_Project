import { useState } from "react";
import { apiLogin } from "./api";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login({ onLoggedIn }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  async function handleLogin() {
    if (!username.trim()) return;

    const user = await apiLogin(username);

    localStorage.setItem("userId", String(user.id));
    onLoggedIn(user.id);
  }

  const handleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;

      const res = await fetch("http://localhost:5000/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Save JWT
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id);

      onLoggedIn(data.user.id);

      // Redirect to main app
      navigate("/");

    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left">
        <div className="left-content">
          <h1 className="logo">Welcome to Roamie!</h1>
          <h2>Roam together</h2>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <div className="login-card">
          <h2>Login</h2>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              style={{ padding: 8 }}
            />

            <button className="login-btn"
              onClick={handleLogin}
              style={{ marginLeft: 10, padding: 8 }}
            >
              Login
            </button>

            <p>Type any name. It will persist!</p>

            <GoogleLogin className ="google-btn"
              onSuccess={handleSuccess}
              onError={() => console.log("Login Failed")}
            />
        </div>
      </div>
    </div>
  );
}