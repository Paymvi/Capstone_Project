import { useState, useEffect, useRef } from "react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";

import { apiAddMarker} from "../api";
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

export default function MapScreen({ userId, collectedItems, setCollectedItems, markers, setMarkers })
{
  const navigate = useNavigate();
  const [uiLocked, setUiLocked] = useState(false);
  const [message, setMessage] = useState(null);
  //const [location, setLocations] = 
  

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
  useEffect(() => {
    staticLocations.forEach((loc) => {
      
      // Skip if already collected (using global state)
      if (collectedItems.includes(loc.accessoryId)) return;

      const distance = L.latLng(pegmanPosition)
        .distanceTo(L.latLng(loc.position));

        if (distance <= loc.radius) {
          setCollectedItems(prev => {
            if (prev.includes(loc.accessoryId)) return prev;

            const updated = [...prev, loc.accessoryId];

            // Save to backend (if not in dev mode)
            if (!DEV_MODE) {
              apiSetCollected(loc.accessoryId).catch((err) => {
                console.error("Failed to save collected item:", err);
              });
            }

            return updated;
          });

          setMessage(`🎉 You've collected the ${loc.title}!!`);
        }
    });
  }, [pegmanPosition, collectedItems, userId]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 1000); // 1 second

    return () => clearTimeout(timer);
  }, [message]);


  // Audio for when you collect an item
  useEffect(() => {
    if (!message) return;

    const audio = new Audio("/jingle-1.wav");
    audio.volume = 0.6;
    audio.play();

  }, [message]);


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

    await apiAddMarker(latlng.lat, latlng.lng);

    // Add this information immediately to the map
    setMarkers((prev) => [
      ...prev,
      {
        latlng: [latlng.lat, latlng.lng]
      }
    ]);


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
        
    
        {/* This is where the map lives */}
        <MapContainer
          center={mapCenter} // coordinates
          zoom={16}
          style={{ height: '100%', width: '100%'}}
        >
        
        <RecenterMap position={pegmanPosition} shouldCenter={hasCenteredOnce} />

        {/* TileLayer defines the source of the map imagery */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          detectRetina={true} // High Resolution

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
          // isDraggingPegman={isDraggingPegman}
        />

        {/* Static Markers */}
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
        ))}

        {/* User Added Markers */}
        {markers.map((loc, i) => (
          <Marker key={i} position={loc.latlng} icon={currentIcon || personaIcon}>
            
            <Popup className="custom-popup">
              <div className="popup-content">
                <div className="title">{loc.info || "Saved Location"}</div>
                
                <div className="section">
                  <div className="info">
                    <span>Custom location marker</span>
                  </div>
                </div>

                {/* {loc.loading && (
                  <div className="section">
                    <div className="spinner" />
                    <em>Loading...</em>
                  </div>
                )} */}

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