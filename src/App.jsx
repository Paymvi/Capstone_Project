import { useState } from 'react'
import './App.css'
import L from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';  // initializes and manages the Leaflet map 
import 'leaflet/dist/leaflet.css';
import {  Marker, Popup, useMapEvents } from 'react-leaflet';
import { Routes, Route, useNavigate } from "react-router-dom";
import { useRef } from "react"; // ref flag... it takes note of changes but doesn't actively update/redraw the screen
import { useEffect } from 'react';


// Music
function BackgroundMusic() {

  // This does not cause re renders when changed
  const audioRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false); // Nothing plays under after rendering

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return; // safety check

    audio.loop = true;  // so it loops forever

    // Try to autoplay
    audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {

        // If the autoplay fails (most browsers will block it) just wait for the user to click something
        const startOnClick = () => {
          audio.play();
          setIsPlaying(true);

          // Remove listener after the first click
          window.removeEventListener("click", startOnClick);
        };
        window.addEventListener("click", startOnClick);
      });

  }, []); // empty array

  // This toggle music function plays when the button is clicked
  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      // If it is currently playing, then pause it
      audio.pause();
      setIsPlaying(false);
    } else {
      // If currently paused, then play it
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <>
      {/* The actual audio */}
      <audio ref={audioRef} src="/theme.mpeg" />

      {/* Music control button */}
      <button
        onClick={toggleMusic}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000
        }}
      >
        {isPlaying ? "🔇 Stop Music" : "🔊 Play Music"}
      </button>
    </>
  );
}

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

function SecondScreen({ collectedItems, equipped, setEquipped }) {
  const navigate = useNavigate();

  // ALL Accessories
  // 123456
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
      id: "outside_shield",             // shield
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

  // Unlocked Accessories
  const unlockedAccessories = ACCESSORIES.filter(item =>
    collectedItems.includes(item.id)
  );

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
        items={unlockedAccessories}
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

function MapScreen({ collectedItems, setCollectedItems }) {

  const navigate = useNavigate();

  // Keeps track of saved locations
  const [locations, setLocations] = useState([]);

  const [uiLocked, setUiLocked] = useState(false);

  const [message, setMessage] = useState(null);
  

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

  // This checks to see if you collected an item everytime the map rerenders
  useEffect(() => {
    staticLocations.forEach((loc) => {
      
      // Skip if already collected (using global state)
      if (collectedItems.includes(loc.accessoryId)) return;

      const distance = L.latLng(pegmanPosition)
        .distanceTo(L.latLng(loc.position));

      if (distance <= loc.radius) {
        
        setCollectedItems(prev =>
          prev.includes(loc.accessoryId)
            ? prev
            : [...prev, loc.accessoryId]
        );
        setMessage(`🎉 You've collected the ${loc.title}!!`);

      }
    });
  }, [pegmanPosition, collectedItems]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage(null);
    }, 1000); // 1 second

    return () => clearTimeout(timer);
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

              // Small timeout prevents click firing after drag
              setTimeout(() => {
                isDraggingPegman.current = false;
  
              }, 20);
            },
          }}
        />

        <ClickHandler 
          onMapClick={handleMapClick} 
          uiLocked={uiLocked} 
          isDraggingPegman={isDraggingPegman}
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

function App() {

  const [collectedItems, setCollectedItems] = useState([]);
  // Looks something like: ["hat_crown", "hat_flower"]

  // For selecting loadout (full set of equipped items)
  const [equipped, setEquipped] = useState({
    hat: null,
    body: null,
    outside: null,
  });


  return (
    <>
    <BackgroundMusic />
      <Routes>

        <Route 
          path="/" 
          element={
            <MapScreen 
              collectedItems={collectedItems}
              setCollectedItems={setCollectedItems}

            />
          } 
        />

        <Route 
          path="/second" 
          element={
            <SecondScreen 
              collectedItems={collectedItems}
              equipped={equipped}
              setEquipped={setEquipped}
            />
          } 
        />


      </Routes>
    </>
  );
}

export default App
