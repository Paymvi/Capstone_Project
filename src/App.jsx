import { useState } from 'react'
import './App.css'
import L from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';  // initializes and manages the Leaflet map 
import 'leaflet/dist/leaflet.css';
import {  Marker, Popup, useMapEvents } from 'react-leaflet';

function ClickHandler( { onMapClick, uiLocked }){
    useMapEvents({

      // This takes the latitude and longitude of the click and passing it to "handleMapClick"
      click(e) {
        if (!uiLocked){
          onMapClick(e.latlng);
        }
      
      }
    });
    return null;
}

function App() {

  // Keeps track of saved locations
  const [locations, setLocations] = useState([]);

  const [uiLocked, setUiLocked] = useState(false);

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
    
        {/* This is where the map lives */}
        <MapContainer
          center={[43.0401221381528, -71.45140083791992]} // SNHU coordinates
          zoom={16}
          style={{ height: '90%', width: '90%'}}
        >

        {/* TileLayer defines the source of the map imagery */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          detectRetina={true} // High Resolution

        />

        <ClickHandler onMapClick={handleMapClick} uiLocked={uiLocked}/>

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

export default App
