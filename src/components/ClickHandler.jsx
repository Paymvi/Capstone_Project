import { useMapEvents } from "react-leaflet";

export default function ClickHandler( { onMapClick, uiLocked, isDraggingPegman }){
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