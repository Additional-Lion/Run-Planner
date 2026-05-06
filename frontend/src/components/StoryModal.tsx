import React, { useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';
import './StoryModal.css';

// Custom icons
const createIcon = (color: string) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
  className: 'story-icon'
});

const StartIcon = createIcon('#27ae60');
const FinishIcon = createIcon('#e74c3c');

interface Run {
  id: string;
  distance: number;
  calories: number;
  duration_seconds: number;
  run_date: string;
  route_coordinates: [number, number][];
}

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: Run | null;
}

const FitBounds = ({ coordinates }: { coordinates: [number, number][] }) => {
  const map = useMap();
  React.useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [10, 10] });
    }
  }, [map, coordinates]);
  return null;
};

const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose, run }) => {
  const storyRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !run || run.route_coordinates.length === 0) return null;

  const startPoint = L.latLng(run.route_coordinates[0]);
  const endPoint = L.latLng(run.route_coordinates[run.route_coordinates.length - 1]);

  const handleDownload = async () => {
    if (!storyRef.current) return;
    
    try {
      // Ensure Leaflet has finished rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(storyRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2 // Higher quality
      });
      
      const link = document.createElement('a');
      link.download = `run-story-${run.run_date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to generate story image:", err);
      alert("Failed to generate image. Please try again.");
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs > 0 ? hrs.toString().padStart(2, '0') : null,
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const calculatePace = (distance: number, totalSeconds: number) => {
    if (!distance || !totalSeconds) return '0:00';
    const paceSecondsPerKm = totalSeconds / distance;
    const paceMins = Math.floor(paceSecondsPerKm / 60);
    const paceSecs = Math.round(paceSecondsPerKm % 60);
    return `${paceMins}:${paceSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-modal" onClick={e => e.stopPropagation()}>
        <div className="story-preview-container">
          <div ref={storyRef} className="story-card">
            <div className="story-header">
              <span className="story-app-name">RUN TRACKER</span>
              <span className="story-date">{new Date(run.run_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>
            
            <div className="story-map-container">
              <MapContainer 
                className="story-map" 
                zoomControl={false} 
                dragging={false} 
                touchZoom={false} 
                doubleClickZoom={false} 
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution=""
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polyline positions={run.route_coordinates} color="#007bff" weight={6} opacity={0.9} />
                <Marker position={startPoint} icon={StartIcon} />
                <Marker position={endPoint} icon={FinishIcon} />
                <FitBounds coordinates={run.route_coordinates} />
              </MapContainer>
            </div>

            <div className="story-footer">
              <div className="story-stats">
                <div className="story-stat">
                  <span className="story-stat-value">{run.distance.toFixed(2)}</span>
                  <span className="story-stat-label">DISTANCE (KM)</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-value">{formatDuration(run.duration_seconds)}</span>
                  <span className="story-stat-label">DURATION</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-value">{calculatePace(run.distance, run.duration_seconds)}</span>
                  <span className="story-stat-label">AVG PACE (/KM)</span>
                </div>
              </div>
              <div className="story-brand">
                <div className="brand-dot"></div>
                <span>Captured with Run Tracker</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="story-actions">
          <button className="download-button" onClick={handleDownload}>Download Story Image</button>
          <button className="cancel-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default StoryModal;
