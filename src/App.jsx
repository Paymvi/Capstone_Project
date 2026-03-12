import { useState, useEffect, useRef } from "react";
import './App.css'
import 'leaflet/dist/leaflet.css';
import { Routes, Route, useNavigate } from "react-router-dom";

import { apiGetState, apiAddMarker, apiSetEquipped } from "./api";

import { GoogleOAuthProvider } from "@react-oauth/google";

const DEV_MODE = false;

// 

import BackgroundMusic from "./components/BackgroundMusic"

import Login from "./pages/Login";
import MapScreen from "./pages/MapScreen"
import SecondScreen from "./pages/SecondScreen"




function App() {
  const token = localStorage.getItem("token");

  const [collectedItems, setCollectedItems] = useState([]);
  const [equipped, setEquipped] = useState({
    hat: null,
    body: null,
    outside: null,
  });

  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (DEV_MODE) {
      setUserId(1);
      localStorage.setItem("userId", 1);
    }
  }, []);

  const [markers, setMarkers] = useState([]);

  // Auto-login if saved
  useEffect(() => {
    const saved = localStorage.getItem("userId");
    if (saved) {
      setUserId(Number(saved));
    }
  }, []);

  // Verify token
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:3000/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
}, []);

  // When user logs in, load their saved state
  useEffect(() => {
  if (!userId) return;

  if (DEV_MODE) {
    console.log("DEV MODE: skipping backend state load");

    setCollectedItems([
      "hat_crown",
      "hat_flower",
      "body_coat"
    ]);

    setEquipped({
      hat: "hat_crown",
      body: "body_coat",
      outside: null
    });

    return;
  }

  apiGetState()
    .then((data) => {
        setCollectedItems(data.collectedItems || []);
        setEquipped(data.equipped || { hat: null, body: null, outside: null });

        if (data.markers) {
          setMarkers(
            data.markers.map(m => ({
              latlng: [m.latitude, m.longitude]
            }))
          );
        }
      })
      .catch((err) => {
        console.log("User not found, forcing login...");
        localStorage.removeItem("userId");
        setUserId(null);
      });

  }, [userId]);

  if (!userId && !DEV_MODE) {
    return <Login onLoggedIn={(id) => setUserId(id)} />;
  }

  console.log("CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

return (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    
    {!userId ? (
      <Login onLoggedIn={(id) => setUserId(id)} />
    ) : (
      <>
        <BackgroundMusic />

        <div style={{ position: "absolute", top: 50, right: 20, zIndex: 1000 }}>
          <button
            onClick={() => {
              localStorage.removeItem("userId");
              setUserId(null);
            }}
            style={{ padding: 8 }}
          >
            Logout
          </button>
        </div>

        <Routes>
          <Route
            path="/"
            element={
              <MapScreen
                userId={userId}
                collectedItems={collectedItems}
                setCollectedItems={setCollectedItems}
                markers={markers}
                setMarkers={setMarkers}
              />
            }
          />

          <Route
            path="/second"
            element={
              <SecondScreen
                userId={userId}
                collectedItems={collectedItems}
                equipped={equipped}
                setEquipped={setEquipped}
              />
            }
          />
        </Routes>
      </>
    )}
  </GoogleOAuthProvider>
);
}
export default App 
