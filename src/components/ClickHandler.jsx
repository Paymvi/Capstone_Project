import { useMapEvents } from "react-leaflet";

// Note: removed isDraggingPenman
export default function ClickHandler( { onMapClick, uiLocked }){
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