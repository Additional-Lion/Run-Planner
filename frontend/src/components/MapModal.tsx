import React from 'react';
import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapModal.css';

// Custom icons for Start and Finish
const createIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
  className: 'custom-icon'
});

const StartIcon = createIcon('#27ae60'); // Green
const FinishIcon = createIcon('#e74c3c'); // Red

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: [number, number][];
}

const FitBounds = ({ coordinates }: { coordinates: [number, number][] }) => {
  const map = useMap();
  React.useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, coordinates]);
  return null;
};

const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, coordinates }) => {
  if (!isOpen || coordinates.length === 0) return null;

  const startPoint = L.latLng(coordinates[0]);
  const endPoint = L.latLng(coordinates[coordinates.length - 1]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        <MapContainer className="modal-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={coordinates} color="blue" weight={5} opacity={0.8} />
          <Marker position={startPoint} icon={StartIcon} />
          <Marker position={endPoint} icon={FinishIcon} />
          <FitBounds coordinates={coordinates} />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapModal;
