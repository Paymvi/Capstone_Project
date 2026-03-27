import { apiPasswordLogin, apiRegister, apiGoogleLogin } from "../api";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login({ onLoggedIn }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {

      const data = await apiPasswordLogin(username, password);

      console.log("LOGIN RESPONSE:", data);

      localStorage.setItem("token", data.token);

      onLoggedIn(data.user.id);

      navigate("/");

    }
    catch (err){
      console.error("Login error", err);
    }
  }

  async function handleRegister(){
    try { 
      const data = await apiRegister(username, password );

      alert("🎉 Account created successfully! 🎉")

      localStorage.setItem("token", data.token);

      navigate("/");
    }
    catch (err){
      console.error("Register error:", err);
    }
  }

  const handleSuccess = async (credentialResponse) => {
    try {

      const token = credentialResponse.credential;

      const data = await apiGoogleLogin(token);

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id);

      onLoggedIn(data.user.id);

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

            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            <button className="login-btn"
              onClick={handleLogin}
              style={{ marginLeft: 10, padding: 8 }}
            >
              Login
            </button>

            <button className="login-btn"
              onClick={handleRegister}
              style={{ marginLeft: 10, padding: 8 }}
            >
              Register
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