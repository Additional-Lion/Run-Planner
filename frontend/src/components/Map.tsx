import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './Map.module.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  onRouteUpdate: (distance: number) => void;
}

const LocationMarker = ({ points, setPoints, routeLine }: { points: LatLng[], setPoints: React.Dispatch<React.SetStateAction<LatLng[]>>, routeLine: [number, number][] }) => {
  useMapEvents({
    click(e) {
      setPoints(prevPoints => [...prevPoints, e.latlng]);
    },
  });

  return (
    <>
      {points.map((p, idx) => (
        <Marker key={idx} position={p} />
      ))}
      {routeLine.length > 0 && (
        <Polyline positions={routeLine} color="#e74c3c" weight={5} opacity={0.8} />
      )}
    </>
  );
};

const Map: React.FC<MapProps> = ({ onRouteUpdate }) => {
  // Default center coordinates (London)
  const defaultCenter: [number, number] = [51.505, -0.09];
  
  // State to hold all the clicked marker points
  const [points, setPoints] = useState<LatLng[]>([]);
  // State to hold the detailed street path returned from OSRM
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);

  // Fetch route from OSRM whenever points change
  useEffect(() => {
    if (points.length < 2) {
      setRouteLine([]);
      onRouteUpdate(0);
      return;
    }

    const fetchRoute = async () => {
      try {
        // OSRM expects coordinates in "longitude,latitude" format separated by semicolons
        const coordinatesString = points
          .map(p => `${p.lng},${p.lat}`)
          .join(';');

        // Use the 'foot' profile for runners
        const url = `http://router.project-osrm.org/route/v1/foot/${coordinatesString}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];
          
          // OSRM returns GeoJSON coordinates as [longitude, latitude]
          // Leaflet expects [latitude, longitude], so we must map and reverse them
          const decodedGeometry: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );
          
          setRouteLine(decodedGeometry);
          
          // OSRM distance is in meters. Convert to kilometers.
          onRouteUpdate(route.distance / 1000);
        }
      } catch (error) {
        console.error("Error fetching route from OSRM:", error);
      }
    };

    fetchRoute();
  }, [points, onRouteUpdate]);

  return (
    <div className={styles.mapWrapper}>
      {/* Optional: Add a subtle loading indicator if points don't match routeLine ends? */}
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        className={styles.mapContainer}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker points={points} setPoints={setPoints} routeLine={routeLine} />
      </MapContainer>
    </div>
  );
};

export default Map;
