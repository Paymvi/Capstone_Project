import { useState } from 'react'
import './App.css'
import L from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';  // initializes and manages the Leaflet map 
import 'leaflet/dist/leaflet.css';
import {  Marker, Popup, useMapEvents } from 'react-leaflet';
import { Routes, Route, useNavigate } from "react-router-dom";
import { useRef } from "react"; // ref flag... it takes note of changes but doesn't actively update/redraw the screen

function ClickHandler( { onMapClick, uiLocked, isDraggingPegman }){
    useMapEvents({

      // This takes the latitude and longitude of the click and passing it to "handleMapClick"
      click(e) {
        if (!uiLocked && !isDraggingPegman.current){
          onMapClick(e.latlng);
        }
      
      }
    });
    return null;
}

function SecondScreen() {
  const navigate = useNavigate();

  // For selecting loadout (full set of equipped items)
  const [equipped, setEquipped] = useState({
    hat: null,
    body: null,
    outside: null,
  });

  const ACCESSORIES = [
    { 
      id: "hat_crown",                // crown
      type: "hat", 
      name: "Crown", 
      src: "/Roamie-Crown-2.png",
      position: { bottom: "77%", height: "40px", left: "44%" }
    },
    { 
      id: "hat_santahat",             // santahat
      type: "hat", 
      name: "SantaHat", 
      src: "/Roamie-SantaHat.png",
      position: { bottom: "75%", height: "60px", left: "55%" }
    },
    { 
      id: "hat_flower",             // flower
      type: "hat", 
      name: "Flower", 
      src: "/Roamie-Flower.png",
      position: { bottom: "75%", height: "45px", left: "56%" }
    }, 
    { 
      id: "body_coat",                // coat
      type: "body", 
      name: "Coat", 
      src: "/Roamie-Coat-2.png",
      position: { bottom: "8%", height: "90px", left: "45%" }
    
    },
    { 
      id: "outside_item",             // shield
      type: "outside", 
      name: "Shield", 
      src: "/Roamie-Shield-2.png",
      position: { bottom: "10%", height: "100px", left: "65%"}
    },
    { 
      id: "outside_dumbbell",             // dumbbell
      type: "outside", 
      name: "Dumbell", 
      src: "/Roamie-Dumbbell-2.png",
      position: { bottom: "5%", height: "75px", left: "65%"}
    },
    

  ];

  function equipAccessory(item) {
    setEquipped(prev => ({
      ...prev,
      [item.type]: item,     // replaces hat/body/outside automatically
    }));
  }

  function toggleAccessory(item) {
    setEquipped(prev => ({
      ...prev,
      [item.type]: prev[item.type]?.id === item.id ? null : item
    }));
  }

  function AccessoriesPanel({ items, equipped, onSelect }) {
    return (
      <div className="accessory-panel">
        {items.map(item => {
          const isEquipped = equipped[item.type]?.id === item.id;

          return (
            <button
              key={item.id}
              className={`accessory-item ${isEquipped ? "equipped" : ""}`}
              onClick={() => onSelect(item)}
              type="button"
            >
              <img src={item.src} alt={item.name} />
            </button>
          );
        })}
      </div>
      
    );
  }

  return (

    <div className="avatar-screen">
      <div className="room">

        <div>
          <br></br><br></br><br></br>
        </div>

        <h1>Welcome to the Avatar Screen</h1>

        <div className="avatar-container">

          <img src="/Roamie-Dog-2.png" width="230px"></img>


          {/* Accessory */}

          {equipped.hat && (
            <img className="accessory accessory-hat" src={equipped.hat.src} alt={equipped.hat.name} style={equipped.hat.position} />
          )}

          {equipped.body && (
            <img className="accessory accessory-body" src={equipped.body.src} alt={equipped.body.name} style={equipped.body.position} />
          )}

          {equipped.outside && (
            <img className="accessory accessory-outside" src={equipped.outside.src} alt={equipped.outside.name} style={equipped.outside.position}/>
          )}


        </div>
        
      </div>
  <div>
    <AccessoriesPanel
        items={ACCESSORIES}
        equipped={equipped}
        onSelect={toggleAccessory} // or equipAccessory
    />

    <div>
      <br></br>
    </div>

    <div className="buttons">
      <button onClick={() => navigate("/")}>
        Go Back to Map
      </button>
    </div>
    
  </div>
  </div>
)}

function MapScreen() {

  const navigate = useNavigate();

  // Keeps track of saved locations
  const [locations, setLocations] = useState([]);

  const [uiLocked, setUiLocked] = useState(false);
  

  // --------------------------------- Pegman ------------------------------
  const pegmanIcon = new L.Icon ({
    iconUrl: "/Pegman.png",
    iconSize: [20, 40],
    iconAnchor: [20, 40],
  });

  const mapCenter = [43.0401221381528, -71.45140083791992];
  const [pegmanPosition, setPegmanPosition] = useState(mapCenter);
  
  const isDraggingPegman = useRef(false)

  // ------------------------------------------------------------------------

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


    const info = prompt("Name this place:");
    if (!info) return;

    // Get the main/basic info fast
    const basicInfo = await getHumanReadableInfo(latlng.lat, latlng.lng);

    // Make temporary maker
    const newPlace = {
      id: Date.now(),
      latlng,
      info,
      locationInfo: basicInfo,
      // weather: null,
      // wiki: null,
      // loading: true
    }

    // Add this information immediately to the map
    setLocations((prev) => [...prev, newPlace]);

    // Check Wi-Fi before making API calls (is there is none, have an error message)
    if (!navigator.onLine) {
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === newPlace.id
            ? {
                ...loc,
                // loading: false,
                // Note: notice how there is a new variable that stores error messages
                error: "Cannot retrieve information... \ncheck your Wi-Fi connection.",
              }
            : loc
        )
      );
      return; // stop here, don’t call APIs
    }
  
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

        <div className="buttons">
          <button onClick={() => navigate("/second")} >
            Avatar
          </button>
          {/* <button onClick={() => navigate("/third")} >
            Profile
          </button> */}
        </div>
        
    
        {/* This is where the map lives */}
        <MapContainer
          center={mapCenter} // SNHU coordinates
          zoom={16}
          style={{ height: '100%', width: '100%'}}
        >

        {/* TileLayer defines the source of the map imagery */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          detectRetina={true} // High Resolution

        />

        {/* Pegman marker (with coordinate tracking) */}
        <Marker
          position={pegmanPosition}
          icon={pegmanIcon}
          draggable={true}
          eventHandlers={{
            dragstart: () => {
              isDraggingPegman.current = true; // disables map clicking
            },
            dragend: (e) => {
              const newPos = e.target.getLatLng();
              const coords = [newPos.lat, newPos.lng];

              setPegmanPosition(coords);

              console.log("Pegman coordinates:", coords);

              // Small timeout prevents click firindg after drag
              setTimeout(() => {
                isDraggingPegman.current = false;
  
              }, 50);
            },
          }}
        />

        <ClickHandler 
          onMapClick={handleMapClick} 
          uiLocked={uiLocked} 
          isDraggingPegman={isDraggingPegman}
        />

        {locations.map((loc, i) => (
          <Marker key={i} position={loc.latlng} icon={currentIcon || personaIcon}>
            
            <Popup className="custom-popup">
              <div className="popup-content">
                <div className="title">{loc.info}</div>
                
                <div className="section">
                  <div className="info">
                    <span><span className="label">Location:</span> {loc.locationInfo?.city}, {loc.locationInfo?.state}</span>
                    <span><span className="label">Country:</span> {loc.locationInfo?.country}</span>
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


        </MapContainer>

        

    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MapScreen />} />
      <Route path="/second" element={<SecondScreen />} />
    </Routes>
  );
}

export default App
