import { apiPasswordLogin, apiRegister, apiGoogleLogin } from "../api";
import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login({ onLoggedIn }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  //Initialize cooldown directly
  const [cooldown, setCooldown] = useState(() => {
    const saved = localStorage.getItem("loginCooldown");
    if(!saved) {
      return 0;
    }

    const expiry = Number(saved);
    if(isNaN(expiry)){
      return 0;
    }

    const remaining = Math.floor((expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  });

  const isBlocked = cooldown > 0;

  useEffect(() => {
    if(cooldown <= 0){
      return;
    }

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1){
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  // NOTE: Disabled for development speed. Re-enable for demo
  
  // useEffect(() => {
  //   if (cooldown > 0){
  //     localStorage.setItem("loginCooldown", Date.now() + cooldown * 1000);
  //   }
  //   else{
  //     localStorage.removeItem("loginCooldown");
  //   }
  // }, [cooldown]);

  async function handleLogin() {
    try {

      const data = await apiPasswordLogin(username, password);

      setError("");

      console.log("LOGIN RESPONSE:", data);

      localStorage.setItem("token", data.token);

      onLoggedIn(data.user.id);

      navigate("/");

    }
    catch (err){
      console.error("Login error", err);
      setError(err.message);

      if (err.message.includes("Too many")){
        setCooldown(60); // 60 seconds 
      }
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

            {error && (
              <p style={{color: "red", marginBottom: "10px"}}>
                {error}
              </p>
            )}

            {cooldown > 0 && (
              <p style={{color: "purple", marginBottom: "10px" }}>
                Try again in {cooldown}s
              </p>
            )}

            <div className="cooldown-bar-container">
              <div
                className="cooldown-bar"
                style={{
                  width: `${(cooldown / 60) * 100}%`
                }}
              />
            </div>

            <button className="login-btn"
              disabled={isBlocked}
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