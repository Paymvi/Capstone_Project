import { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";

import { apiAddMarker, apiGetMarkers, apiGetItems, apiGetState  } from "../api";
import { apiSetCollected } from "../api";
import ClickHandler from "../components/ClickHandler"

const DEV_MODE = false;

// Lets map pan to the currrent user location
function RecenterMap({ position, shouldCenter }) {
  const map = useMap();

  useEffect(() => {
    if (!position || !shouldCenter) return;
    map.setView(position, map.getZoom());
  }, [position, shouldCenter, map]);

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

  const c = 2 * Math.atan(Math.sqrt(a), Math.sqrt(1 - a));

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
    try{
      console.log("COLLECTING: ", marker);

      // Send to the backend 
      await apiSetCollected(marker.item_id);

      // instant UI
      setCollectedItems(prev => {
        const safe = prev || [];
        if (safe.includes(marker.item_id)) return safe;
        return [...safe, marker.item_id];
      });

      // Remove marker locally
      setMarkers((prev) => prev.filter((m) => m.id !== marker.id));
    
    } 
    catch (err){
      console.error("Collect failed", err);
    }
  }

  const navigate = useNavigate();
  const [uiLocked, setUiLocked] = useState(false);
  const [message, setMessage] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [collectedIds, setCollectedIds] = useState(new Set());

  const blueMarker = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  console.log("MAPSCREEN MARKERS PROP:", markers);
  

  // --------------------------------- Pegman ------------------------------
  const pegmanIcon = new L.Icon ({
    iconUrl: "/Pegman.png",
    iconSize: [20, 40],
    iconAnchor: [20, 40],
  });

  const mapCenter = [43.0401221381528, -71.45140083791992];
  const [pegmanPosition, setPegmanPosition] = useState(mapCenter);
  
  // const isDraggingPegman = useRef(false)
  const [locationError, setLocationError] = useState("");
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [hasCenteredOnce, setHasCenteredOnce] = useState(false);

  // ------------------------------------------------------------------------
  // Static locations for item drops
  // Need to turn it into state to update "collected"
  const [staticLocations, setStaticLocations] = useState([
    {
      id: 1,
      position: [43.03881471145394, -71.45190238952638],
      title: "Crown",
      description: "Collect your crown at the library!",
      img: "/Roamie-Crown-2.png",
      accessoryId: "hat_crown",
      radius: 30,   // 30 meters
      collected: false
    },
    {
      id: 2,
      position: [43.039763539565556, -71.45380139350893],
      title: "Flower",
      description: "Flower Power Drop!!!",
      img: "/Roamie-Flower.png",
      accessoryId: "hat_flower",
      radius: 30,
      collected: false
    },
    {
      id: 3,
      position: [43.038673562216715, -71.45618319511415],
      title: "Dumbbell",
      description: "Collect this limited edition dumbbell!",
      img: "/Roamie-Dumbbell-2.png",
      accessoryId: "outside_dumbbell",
      radius: 30,
    },
    {
      id: 4,
      position: [43.03951261124411, -71.45159125328065],
      title: "Santa Hat",
      description: "Santa hat drop!!!",
      img: "/Roamie-SantaHat.png",
      accessoryId: "hat_santahat",
      radius: 30,

    },
    {
      id: 5,
      position: [43.04064962199054, -71.4509153366089],
      title: "Coat",
      description: "Stay warm and collect this fluffy coat!!!",
      img: "/Roamie-Coat-2.png",
      accessoryId: "body_coat",
      radius: 30,
    },
    {
      id: 6,
      position: [43.04091622835737, -71.45213842391969],
      title: "Shield",
      description: "Collect this Shiny Shield!!!",
      img: "/Roamie-Shield-2.png",
      accessoryId: "outside_shield",
      radius: 30,
    }
  ]);

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

        setPegmanPosition(coords);
        setLiveLocation(coords);

        setLocationError("");
        setLocationLoading(false);

        if (!hasCenteredOnce) {
          setHasCenteredOnce(true);
        }

        console.log("Live location:", coords);
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
        timeout: 10000,
        maximumAge: 2000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [hasCenteredOnce]);

  // This checks to see if you collected an item everytime the map rerenders
  // useEffect(() => {
  //   staticLocations.forEach((loc) => {
      
  //     // Skip if already collected (using global state)
  //     if (collectedItems.includes(loc.accessoryId)) return;

  //     const distance = L.latLng(pegmanPosition)
  //       .distanceTo(L.latLng(loc.position));

  //       if (distance <= loc.radius) {
  //         setCollectedItems(prev => {
  //           const safe = prev || [];
  //           if (safe.includes(markers.item_id)) return safe;


  //           // Save to backend (if not in dev mode)
  //           if (!DEV_MODE) {
  //             apiSetCollected(loc.accessoryId).catch((err) => {
  //               console.error("Failed to save collected item:", err);
  //             });
  //           }

  //           return [...safe, markers.item_id];
  //         });

  //         setTimeout(() => setMessage(`🎉 You've collected the ${loc.title}!!`), 2000);
  //       }
  //   });
  // }, [pegmanPosition, collectedItems, userId]);

  useEffect(() => {

    // Block admin from collecting items
    if(user?.is_admin){
      return; 
    }

    markers.forEach((marker) => {
      console.log("MARKER:", marker);
    });
    console.log("EFFECT RUNNING");

    console.log("liveLocation:", liveLocation);
    console.log("markers:", markers);

    if (!liveLocation || markers.length === 0) {
      console.log("EXITING EARLY ❌");
      return;
    }

    console.log("PASSED CHECK ✅");


    markers.forEach((marker) => {
      const dist = getDistanceMeters(
        liveLocation[0],
        liveLocation[1],
        marker.latlng[0],
        marker.latlng[1]
      );

      console.log("DISTANCE:", dist);

      // Pickup radius based on user location
      if (dist < 100 && !collectedIds.has(marker.id)){

        if (!marker.item_id) return;
        
        console.log("AUTO COLLECT:", marker.name);
        
        handleCollect(marker);

        setCollectedIds((prev) => {
          const updated = new Set(prev);
          updated.add(marker.id);
          return updated;
        });

        setTimeout(() => setMessage(`🎉 You've collected the ${markers.name}!!`), 2000);
      }
    });
  }, [liveLocation, markers, collectedIds]);
  
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

    // Stops it from marking up spot after clicking "done"
    // if (isDone) return;

    // Check Wi-Fi before making API calls (if there is none, have an error message)
    if (!navigator.onLine) {
      setMessage("📡 No internet connection");
      return;
    }

    const info = prompt("Name this place:");
    if (!info) return;

    // Get the main/basic info fast
    const basicInfo = await getHumanReadableInfo(latlng.lat, latlng.lng);

    // // Make temporary maker
    // const newPlace = {
    //   id: Date.now(),
    //   latlng,
    //   info,
    //   locationInfo: basicInfo,
    //   // weather: null,
    //   // wiki: null,
    //   // loading: true
    // }

    await apiAddMarker(latlng.lat, latlng.lng, selectedItem);

    // Add this information immediately to the map
    // setMarkers((prev) => [
    //   ...prev,
    //   {
    //     latlng: [latlng.lat, latlng.lng]
    //   }
    // ]);


    // Check Wi-Fi before making API calls (if there is none, have an error message)
    // if (!navigator.onLine) {
    //   setLocations((prev) =>
    //     prev.map((loc) =>
    //       loc.id === newPlace.id
    //         ? {
    //             ...loc,
    //             // loading: false,
    //             // Note: notice how there is a new variable that stores error messages
    //             error: "Cannot retrieve information... \ncheck your Wi-Fi connection.",
    //           }
    //         : loc
    //     )
    //   );
    //   return; // stop here, don’t call APIs
    // }
  
    // Fetch the slower stuff in the background
    // try {
    //   const [weather, wiki] = await Promise.all([
    //     getWeather(latlng.lat, latlng.lng),
    //     getWikidataInfoByCoords(latlng.lat, latlng.lng)
    //   ]);
    //   setLocations((prev) =>
    //     prev.map((loc) =>
    //       loc.id === newPlace.id
    //       ? {...loc, weather, wiki, loading: false}
    //       : loc
    //     )
    //   );

    // } catch (err) {
    //   console.error("Error loading the extra info", err);
    //     setLocations((prev) =>
    //       prev.map((loc) =>
    //         loc.id === newPlace.id
    //         ? { ...loc, weather: null, wiki: null, loading: false}
    //         : loc
    //     )
    //   );

    // }


  };

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

  
  // Adds the edit and delete buttons next to the side bar elements
  const handleEdit = (id) => {
    const newInfo = prompt("Rename this place: ")
    if (newInfo){
      setLocations(prev =>
        prev.map(loc =>
          loc.id === id ? { ...loc, info: newInfo } : loc
        )
      );
    }
  };
  const handleDelete = (id) => {
    // Filter out the locations without that id
    setLocations(prev => prev.filter(loc => loc.id !== id))
    setUiLocked(false); // unlock the map
  };

  return (
    

    <div style={{ height: '100vh', width: '100vw'}}>

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
            🛠 Admin Mode: Click to place items
          </div>
        )}
        
        {/* This is where the dropdown UI will be added */}
        {user?.is_admin && (
          <div style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 1000,
            background: "white",
            padding: "8px",
            borderRadius: "8px"
          }}>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              <option value="">Select Item</option>

              {items.map(item => (
                <option key={item.item_id} value={item.item_id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Security Logs Button */}
        {user?.is_admin && (
          <button className="admin-btn" onClick={() => navigate("/security-logs")}>
            🔐 Security Logs
          </button>
        )}
    
        {/* This is where the map lives */}
        <MapContainer
          center={mapCenter} // coordinates
          zoom={19}
          style={{ height: '100%', width: '100%'}}
        >
        
        <RecenterMap position={pegmanPosition} shouldCenter={hasCenteredOnce} />

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
        <Marker position={pegmanPosition} icon={pegmanIcon}>
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

        {/* Static Markers
        {staticLocations
          .filter((loc) => !collectedItems.includes(loc.accessoryId)) // hide collected ones (uses global state)
          .map((loc) => (
            <Marker key={loc.id} position={loc.position}>
              <Popup className="custom-popup">
                <div className="popup-content">
                  <div className="title">{loc.title}</div>
                </div>


                <div className="section">
                    <div className= "info">
                      
                      <div style={{ textAlign: "center" }}>
                        <img 
                          src={loc.img}
                          alt={loc.title}
                          style={{
                            width: "80px",
                            marginLeft: "auto",
                            marginRight: "auto"
                          }}
                        />
                      </div>

                      {loc.description}

                      <br></br>
                      
                    </div>
                </div>
                
                
              </Popup>
            </Marker>
        ))} */}

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