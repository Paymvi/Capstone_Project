import { useState, useEffect, useRef } from "react";
import './App.css'
import 'leaflet/dist/leaflet.css';
import { Routes, Route, useNavigate, NavLink } from "react-router-dom";

import { apiGetState, apiAddMarker, apiSetEquipped } from "./api";

import { GoogleOAuthProvider } from "@react-oauth/google";

const DEV_MODE = true;


import BackgroundMusic from "./components/BackgroundMusic"

import RaccoonIntro from "./components/RaccoonIntro";

import AdminPage from "./pages/AdminPage";
import Login from "./pages/Login";
import MapScreen from "./pages/MapScreen"
import SecondScreen from "./pages/SecondScreen"
import ProfilePage from "./pages/ProfilePage"
import SecurityLogs from "./pages/SecurityLogs";


import { FiSun, FiBarChart2, FiUser, FiMap, FiPackage } from "react-icons/fi";
import { FaDog, FaPaw } from "react-icons/fa";
import { GiDogHouse } from "react-icons/gi";
import { MdPets } from "react-icons/md"



// Navbar [more mobile friendly]
function TabBar() {
  const tabs = [
    { to: "/", label: "Map", icon: <FiMap /> },
    { to: "/second", label: "Avatar", icon: <MdPets /> },
    { to: "/profile", label: "Profile", icon: <FiUser />},
  ];

  return (
    <nav className="tabbar" aria-label="Bottom Navigation">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.to === "/"} // makes "/" not stay active on every route
          className={({ isActive }) => (isActive ? "tab active" : "tab")}
        >
          <span className="tab-icon" aria-hidden="true">
            {t.icon}
          </span>
          <span className="tab-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showIntro, setShowIntro] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const musicRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpen(false);
    };

    if (menuOpen) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);

  const handleToggleMusic = async (e) => {
    e.stopPropagation();

    if (!musicRef.current) return;

    await musicRef.current.toggleMusic();
    setMusicPlaying(musicRef.current.isPlaying);
  };

  const handleLogout = (e) => {
    e.stopPropagation();

    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    setUserId(null);
    setToken(null);
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);

    if (musicRef.current) {
      setMusicPlaying(musicRef.current.isPlaying);
    }
  };

  const [collectedItems, setCollectedItems] = useState([]);
  const [equipped, setEquipped] = useState({
    hat: null,
    body: null,
    outside: null,
  });

  const [user, setUser] = useState(null);

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
    const savedToken = localStorage.getItem("token");

    if (!savedToken) return;
      setToken(savedToken);

      // try loading state
      apiGetState()
        .then((data) => {
          setUserId(data.userId);

          setUser({
            id: data.userId,
            is_admin: data.is_admin // might be undefined depending on backend
          });          

          setCollectedItems(data.collectedItems || []);
          setEquipped({
            hat: data.equipped?.hat_item_id || null,
            body: data.equipped?.body_item_id || null,
            outside: data.equipped?.outside_item_id || null,
          });

          if (data.markers) {
            setMarkers(
              data.markers.map(m => ({
                latlng: [m.latitude, m.longitude]
              }))
            );
          }
        })
        .catch(() => {
          console.log("Invalid token, forcing login");
          localStorage.removeItem("token");
          setUserId(null);
        });
    
  }, []);

  // Verify token
//   useEffect(() => {
//     if (!token) return;

//     fetch("http://localhost:3000/me", {
//       headers: {
//         Authorization: `Bearer ${token}`
//       }
//     });
// }, []);

  // When user logs in, load their saved state
  useEffect(() => {
  if (!userId) return;

  // if (DEV_MODE) {
  //   console.log("DEV MODE: skipping backend state load");

  //   setCollectedItems([
  //     "hat_crown",
  //     "hat_flower",
  //     "body_coat"
  //   ]);

  //   setEquipped({
  //     hat: "hat_crown",
  //     body: "body_coat",
  //     outside: null
  //   });

  //   return;
  // }
  

  apiGetState()
    .then((data) => {
        setCollectedItems(data.collectedItems || []);
        setEquipped({
          hat: data.equipped?.hat_item_id || null,
          body: data.equipped?.body_item_id || null,
          outside: data.equipped?.outside_item_id || null,
        });

        setUser({
          id: data.userId,
          is_admin: data.is_admin
        });
        
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


  console.log("CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

  if (showIntro && !introDone) {
    return (
      <RaccoonIntro
        onFinish={() => {
          setShowIntro(false);
        }}
      />
    );
  }

return (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    
    {!userId ? (
      <Login
        onLoggedIn={(id) => {
          setUserId(id);
          setToken(localStorage.getItem("token"));
          setShowIntro(true); // 🔥 trigger intro
        }}
      />
    ) : (
      <>
        <BackgroundMusic ref={musicRef} />

        {/* Hamburger Menu */}
        <div className="menu-wrapper">
          <button className="menu-button" onClick={toggleMenu}>
            ☰
          </button>

          {menuOpen && (
            <div className="menu-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="menu-header">Menu</div>

              <button className="menu-item" onClick={handleToggleMusic}>
                {musicPlaying ? "🔇 Stop Music" : "🔊 Play Music"}
              </button>

              <button className="menu-item logout" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
        

        <Routes>
          <Route
            path="/"
            element={
              <MapScreen
                user = {user}
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

          <Route
            path="/profile"
            element={
              <ProfilePage
                userId={userId}
                collectedItems={collectedItems}
                // equipped={equipped}
                // setEquipped={setEquipped}
              />
            }
          />

          <Route path="/admin" element={<AdminPage />} />

          <Route path="/security-logs" element={<SecurityLogs />} />


        </Routes>

        <TabBar />

      </>
    )}
  </GoogleOAuthProvider>
);
}
export default App 
