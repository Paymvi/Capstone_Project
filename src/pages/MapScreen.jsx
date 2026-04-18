import { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";

import { apiAddMarker, apiGetMarkers, apiGetItems, apiGetState  } from "../api";
import { apiSetCollected } from "../api";
import ClickHandler from "../components/ClickHandler"

const DEV_MODE = true;

// Lets map pan to the currrent user location
function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    map.setView(position, map.getZoom(), {
      animate: true,
      duration: 0.8,
    });
  }, [position, map]);

  return null;
}

function AdminMarkerPlacer({ isAdmin, onAddMarker }) {
  useMapEvents({
    click(e) {
      if (!isAdmin) return;

      const { lat, lng } = e.latlng;
      console.log("Admin placing marker:", lat, lng);

      onAddMarker(lat, lng); 
    }
  });

  return null;
}

// Get the distance in meters
function getDistanceMeters(lat1, lng1, lat2, lng2){
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = 
    Math.sin(dLat / 2) ** 2 + 
    Math.cos(toRad(lat1)) * 
      Math.cos(toRad(lat2)) * 
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


// function MapClickHandler({ isAdmin, onAddMarker }) {
//   useMapEvents({
//     click(e) {
//       if (!isAdmin) return;

//       const { lat, lng } = e.latlng;
//       console.log("Clicked at:", lat, lng);

//       onAddMarker(lat, lng);
//     },
//   });

//   return null;
// }

export default function MapScreen({ user, userId, collectedItems, setCollectedItems })
{

  const collectingRef = useRef(new Set());
  const [collectingIds, setCollectingIds] = useState(new Set());

  const handleRefreshLocation = () => {
    if (!liveLocation) {
      setMessage("📡 Waiting for GPS...");
      return;
    }

    setPegmanPosition([...liveLocation]);
    setMessage("📍 Recentered to Pegman!");
  };


  async function loadMarkers() {
    try {
      const data = await apiGetMarkers();

      console.log("MARKER DATA:", data);

      const formatted = data.map(m => ({
        id: m.id,
        latlng: [m.latitude, m.longitude],
        name: m.name,
        image: m.image,
        description: m.description,
        item_id: m.item_id, 
        radius: 30,
      }));

      setMarkers(formatted);
    } catch (err) {
      console.error("Failed to load markers", err);
    }
  } 

  // Handles the collection of item drops
  async function handleCollect(marker) {
    try {
      console.log("COLLECTING:", marker);

      // Send to the backend 
      await apiSetCollected(marker.item_id, liveLocation[0], liveLocation[1]);

      // instant UI
      setCollectedItems((prev) => {
        const safe = prev || [];
        if (safe.includes(marker.item_id)) return safe;
        return [...safe, marker.item_id];
      });

      // Remove marker locally
      setMarkers((prev) => prev.filter((m) => m.item_id !== marker.item_id));
    } catch (err) {
      console.error("Collect failed", err);
      throw err;
    }
  }

  const navigate = useNavigate();
  const [uiLocked, setUiLocked] = useState(false);
  const [message, setMessage] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [collectedIds, setCollectedIds] = useState(new Set());
  const [showItemModal, setShowItemModal] = useState(false);

  const blueMarker = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  console.log("MAPSCREEN MARKERS PROP:", markers);
  

  // --------------------------------- Pegman ------------------------------
  const pegmanIcon = new L.Icon ({
    iconUrl: "Dog-Marker-2.png",
    // iconUrl: "/Roamie-Dog-2.png",
    iconSize: [100, 150],
    iconAnchor: [49, 99],
  });

  const mapCenter = [43.0401221381528, -71.45140083791992];
  const [pegmanPosition, setPegmanPosition] = useState(mapCenter);
  
  // const isDraggingPegman = useRef(false)
  const [locationError, setLocationError] = useState("");
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [hasCenteredOnce, setHasCenteredOnce] = useState(false);


  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this device/browser.");
      setLocationLoading(false);
      return;
    }
  

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];

        if (!DEV_MODE){
          setPegmanPosition(coords);
        }
        setLiveLocation(coords);

        setLocationError("");
        setLocationLoading(false);

      

        if(DEV_MODE){
          console.log("Live location:", coords);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);

        let message = "Unable to retrieve location.";

        if (error.code === 1) {
          message = "Location permission was denied.";
        } else if (error.code === 2) {
          message = "Location unavailable. Try going outside or checking signal.";
        } else if (error.code === 3) {
          message = "Location request timed out.";
        }

        setLocationError(message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!liveLocation) return;
    if (DEV_MODE) return;

    const timer = setTimeout(() => {
      handleRefreshLocation();
    }, 500);

    return () => clearTimeout(timer);
  }, [liveLocation]);


  useEffect(() => {

    // Block admin from collecting items
    if(user?.is_admin){
      return; 
    }

    markers.forEach((marker) => {
      console.log("MARKER:", marker);
    });
    console.log("EFFECT RUNNING");

    if(DEV_MODE){
      console.log("liveLocation:", liveLocation);
      console.log("markers:", markers);
    }

    if (!liveLocation || markers.length === 0) {
      console.log("EXITING EARLY ❌");
      return;
    }

    console.log("PASSED CHECK ✅");


  markers.forEach((marker) => {
    const sourcePosition = DEV_MODE ? pegmanPosition : liveLocation;
    
    const dist = getDistanceMeters(
      sourcePosition[0],
      sourcePosition[1],
      marker.latlng[0],
      marker.latlng[1]
    );

    console.log("DISTANCE:", dist);

    if (
      dist < marker.radius &&
      !collectedIds.has(marker.id) &&
      !collectingRef.current.has(marker.id) &&
      !(collectedItems || []).includes(marker.item_id)
    ) {
      if (!marker.item_id) return;

      console.log("AUTO COLLECT:", marker.name);

      collectingRef.current.add(marker.id); // 🔥 instant, synchronous

      setCollectingIds((prev) => {
        const updated = new Set(prev);
        updated.add(marker.id);
        return updated;
      });

      setCollectedIds((prev) => {
        const updated = new Set(prev);
        updated.add(marker.id);
        return updated;
      });

      handleCollect(marker)
        .then(() => {
          setMessage(`🎉 You've collected the ${marker.name}!!`);
        })
        .catch((err) => {
          console.error("Auto collect failed:", err);
          setMessage(err.message);
        })
        .finally(() => {
          setCollectingIds((prev) => {
            collectingRef.current.delete(marker.id);
            const updated = new Set(prev);
            updated.delete(marker.id);
            return updated;
          });
        });
    }
  });
}, [liveLocation, pegmanPosition, markers, collectedIds, collectingIds, collectedItems, user]);
  
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 1000); // 1 second

    return () => clearTimeout(timer);
  }, [message]);

  // Load items into the dropdown menu
  useEffect(() => {
    async function loadItems() {
      try{
        const data = await apiGetItems();
        setItems(data);
      }
      catch(err){
        console.error("Failed to load items", err);
      }
    }

    loadItems();
  }, []);


  // Audio for when you collect an item
  useEffect(() => {
    if (!message) return;
    if (!message.startsWith("🎉 You've collected")) return;

    const audio = new Audio("/jingle-1.wav");
    audio.volume = 0.6;
    audio.play();

  }, [message]);

  // To load markers from the player view
  useEffect(() => {
    if (!userId) return;
    loadMarkers();
  }, [userId]);


  const [currentIcon, setCurrentIcon] = useState();
  const personaIcon = L.icon({
    iconUrl: '/pin.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -45],

  });

  const getHumanReadableInfo = async (lat, lng) => {

    try {
      // Note: You have to use "template literals" to insert the latitude and longitude
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();

      return {
        city: data.address.city || data.address.town || data.address.village || "Unknown place",
        state: data.address.state || "Unknown",
        country: data.address.country || "Unknown",
        // postcode: data.address.postcode || "N/A"
      }

    } catch (err){
      console.error("Failed to fetch location info:", err);
      return { city: "Unknown", state: "Unknown", country: "Unknown", postcode: "Unknown"}

    }
    
  }

  const handleMapClick = async (latlng) => {
    if (user?.is_admin) return;

    if (!navigator.onLine) {
      setMessage("📡 No internet connection");
      return;
    }
  };

  function handleSelectItem(itemId) {
    setSelectedItem(itemId);
    setShowItemModal(false);
  }
  const selectedItemData = items.find(
    (item) => String(item.item_id) === String(selectedItem)
  );

  async function handleAddMarker(lat, lng) {
    try {
      if (!selectedItem) {
        alert("Select an item first!");
        return;
      }

      await apiAddMarker(lat, lng, selectedItem);
      await loadMarkers();
    } catch (err) {
      console.error("Failed to add marker", err);
    }
  }



  return (
    

    <div style={{ height: '100vh', width: '100vw'}}>

      <button className="locate-btn" onClick={handleRefreshLocation}>
        Recenter📍
      </button>

      <div className="map-tint"></div>

        {locationLoading && (
          <div className="proximity-alert">
            Finding your location...
          </div>
        )}

        {locationError && (
          <div className="proximity-alert">
            {locationError}
          </div>
        )}

        {user?.is_admin && (
          <div className="admin-banner">
            🛠 Admin Mode
          </div>
        )}
        
        
        

        {showItemModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.45)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setShowItemModal(false)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "500px",
                maxHeight: "80vh",
                overflowY: "auto",
                background: "white",
                borderRadius: "16px",
                padding: "16px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h3 style={{ margin: 0 }}>Select an Item</h3>

                <button
                  onClick={() => setShowItemModal(false)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map((item) => (
                  <button
                    key={item.item_id}
                    onClick={() => handleSelectItem(item.item_id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      textAlign: "left",
                      border:
                        String(selectedItem) === String(item.item_id)
                          ? "2px solid #4f46e5"
                          : "1px solid #ddd",
                      background: "white",
                      borderRadius: "12px",
                      padding: "12px",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: "56px",
                        height: "56px",
                        objectFit: "contain",
                        flexShrink: 0,
                      }}
                    />

                    <div>
                      <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                        {item.name}
                      </div>

                      <div style={{ fontSize: "13px", opacity: 0.75 }}>
                        {item.description || "No description available."}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
            

        {/* Security Logs Button */}
        {user?.is_admin && (
          <div className="admin-toolbar">

            {/* Select Item */}
            <div className="admin-card">
              <button
                className="admin-btn"
                onClick={() => setShowItemModal(true)}
              >
                {selectedItemData
                  ? `Selected: ${selectedItemData.name}`
                  : "Select Item"}
              </button>
            </div>

            {/* Security Logs */}
            <div className="admin-card">
              <button
                className="admin-btn"
                onClick={() => navigate("/security-logs")}
              >
                🔐 Security Logs
              </button>
            </div>

          </div>
        )}
    
        {/* This is where the map lives */}
        <MapContainer
          center={mapCenter} // coordinates
          zoom={19}
          style={{ height: '100%', width: '100%'}}
        >
        
        <RecenterMap position={pegmanPosition} />

        {/* TileLayer defines the source of the map imagery */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          detectRetina={true} // High Resolution

        />

        {/* Admin Marker Placement */}
        <AdminMarkerPlacer 
          isAdmin={user?.is_admin}
          onAddMarker={handleAddMarker} 
        />

        {/* Pegman marker (with coordinate tracking) */}
        <Marker
          position={pegmanPosition}
          icon={pegmanIcon}
          draggable={DEV_MODE}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();

              setPegmanPosition([position.lat, position.lng]);
              //setLiveLocation([position.lat, position.lng]); // IMPORTANT for collection logic
            }
          }}
        >
          <Popup>
            You are here
          </Popup>
        </Marker>

        <ClickHandler 
          onMapClick={handleMapClick} 
          uiLocked={uiLocked} 
          isAdmin={user?.is_admin}
          // isDraggingPegman={isDraggingPegman}
        />


        {/* Admin Added Markers */}
        {markers.map((loc, i) => (
          <Marker key={`${i}-${user?.is_admin}`} position={loc.latlng} icon={user?.is_admin ? personaIcon : blueMarker}>
            
            <Popup className="custom-popup">
              <div className="popup-content">
                <div className="title">{loc.name}</div>
              </div>

              <div className="section">
                <div className="info">                
                  <div style={{ textAlign: "center", marginTop: "8px" }}>
                    <img
                      src={loc.image}
                      alt={loc.name}
                      style={{ 
                        width: "80px",
                        marginLeft: "auto",
                        marginRight: "auto"
                      }}
                    />
                  </div>

                  <p style={{ fontSize: "12px", opacity: 0.8 }}>
                    {loc.description}
                  </p>

                  <br></br>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}


        {/* Item drop collection */}
        {message && (
          <div className="proximity-alert">
            {message}

          </div>
        )}


        </MapContainer>

        

    </div>
  )
}