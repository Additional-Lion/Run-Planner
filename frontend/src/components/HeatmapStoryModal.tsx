import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import './HeatmapStoryModal.css';

interface HeatmapStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: [number, number, number][];
  stats: {
    totalDistance: number;
    totalCalories: number;
    totalDuration: number;
    avgPace: string;
    count: number;
  };
  rangeName: string;
}

const HeatLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // @ts-ignore
    const heatLayer = L.heatLayer(points, {
      radius: 15,
      blur: 12,
      maxZoom: 17,
      gradient: { 0.4: '#007bff', 0.6: '#00d4ff', 0.7: '#00ffcc', 0.8: '#fffb00', 1: '#ff0000' }
    }).addTo(map);

    // Find center and fit bounds
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );

    map.fitBounds(bounds, { padding: [20, 20], animate: false });

    return () => {
      if (heatLayer && map) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
};

const HeatmapStoryModal: React.FC<HeatmapStoryModalProps> = ({ isOpen, onClose, points, stats, rangeName }) => {
  const storyRef = useRef<HTMLDivElement>(null);

  if (!isOpen || points.length === 0) return null;

  const handleDownload = async () => {
    if (!storyRef.current) return;
    
    try {
      // Ensure Leaflet has finished rendering
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const canvas = await html2canvas(storyRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: 2, // Ultra HD output
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          const element = clonedDoc.querySelector('.story-card') as HTMLElement;
          if (element) {
            element.style.transform = 'none';
          }
        }
      });
      
      const link = document.createElement('a');
      link.download = `heatmap-story-${rangeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to generate heatmap story image:", err);
      alert("Failed to generate image. Please try again.");
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="story-overlay" onClick={onClose}>
      <div className="story-modal" onClick={e => e.stopPropagation()}>
        <div className="story-preview-container">
          <div ref={storyRef} className="story-card">
            <div className="story-header">
              <span className="story-app-name">RUN TRACKER</span>
              <span className="story-date">{rangeName.toUpperCase()} HEATMAP</span>
            </div>
            
            <div className="story-map-container">
              <MapContainer 
                className="story-map" 
                zoomControl={false} 
                dragging={false} 
                touchZoom={false} 
                doubleClickZoom={false} 
                scrollWheelZoom={false}
                preferCanvas={true}
                zoomSnap={0}
              >
                <TileLayer
                  attribution=""
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HeatLayer points={points} />
              </MapContainer>
            </div>

            <div className="story-footer">
              <div className="story-stats">
                <div className="story-stat">
                  <span className="story-stat-value">{stats.totalDistance.toFixed(2)}</span>
                  <span className="story-stat-label">TOTAL DISTANCE (KM)</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-value">{stats.count}</span>
                  <span className="story-stat-label">TOTAL RUNS</span>
                </div>
                <div className="story-stat">
                  <span className="story-stat-value">{stats.avgPace}</span>
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
          <button className="download-button" onClick={handleDownload}>Download Heatmap Story</button>
          <button className="cancel-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default HeatmapStoryModal;
