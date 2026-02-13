import { useState } from 'react'
import './App.css'
import L from 'leaflet';
import { MapContainer, TileLayer } from 'react-leaflet';  // initializes and manages the Leaflet map 
import 'leaflet/dist/leaflet.css';
import {  Marker, Popup, useMapEvents } from 'react-leaflet';

function App() {
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

        </MapContainer>

    </div>
  )
}

export default App
