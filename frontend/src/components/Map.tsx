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

// L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  onRouteUpdate: (distance: number, route: [number, number][]) => void;
  onPointCountChange?: (count: number) => void;
  undoPointRef?: React.MutableRefObject<(() => void) | null>;
  clearRouteRef?: React.MutableRefObject<(() => void) | null>;
}

import { useTheme } from '../context/ThemeContext';

const LocationMarker = ({ points, setPoints, routeLine }: { points: LatLng[], setPoints: React.Dispatch<React.SetStateAction<LatLng[]>>, routeLine: [number, number][] }) => {
  const { theme } = useTheme();
  useMapEvents({
    click(e) {
      setPoints(prevPoints => [...prevPoints, e.latlng]);
    },
  });

  // Use distinct blue in light mode, vibrant green in dark mode
  const routeColor = theme === 'light' ? '#3a8ffd' : '#35ec2f';

  return (
    <>
      {points.map((p, idx) => (
        <Marker key={idx} position={p} />
      ))}
      {routeLine.length > 0 && (
        <Polyline positions={routeLine} color={routeColor} weight={5} opacity={0.8} />
      )}
    </>
  );
};

const Map: React.FC<MapProps> = ({ onRouteUpdate, onPointCountChange, undoPointRef, clearRouteRef }) => {
  // Default center coordinates (NYC City Hall Park)
  const defaultCenter: [number, number] = [40.712754, -74.0087971];
  const [map, setMap] = useState<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  // Custom icon for user location (blue dot)
  const userLocationIcon = L.divIcon({
    className: styles.userLocationDot,
    html: `<div class="${styles.dotInner}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  // State to hold all the clicked marker points
  const [points, setPoints] = useState<LatLng[]>([]);
  // State to hold the detailed street path returned from OSRM
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);

  useEffect(() => {
    if (onPointCountChange) onPointCountChange(points.length);
  }, [points, onPointCountChange]);

  useEffect(() => {
    if (undoPointRef) undoPointRef.current = () => setPoints(prev => prev.slice(0, -1));
    if (clearRouteRef) clearRouteRef.current = () => setPoints([]);
  }, [undoPointRef, clearRouteRef]);

  // Handle "Find Me" logic
  useEffect(() => {
    if (!map) return;

    const onLocationFound = (e: L.LocationEvent) => {
      setUserLocation(e.latlng);
    };

    map.on('locationfound', onLocationFound);

    const handleFindMe = () => {
      map.locate({ setView: true, maxZoom: 16 });
    };

    window.addEventListener('find-me', handleFindMe);
    return () => {
      window.removeEventListener('find-me', handleFindMe);
      map.off('locationfound', onLocationFound);
    };
  }, [map]);

  // Fetch route from OSRM whenever points change
  useEffect(() => {
    L.Marker.prototype.options.icon = DefaultIcon;

    if (points.length < 2) { // can't draw line with less than 2 points
      setRouteLine([]);
      onRouteUpdate(0, []);
      return;
    }

    const fetchRoute = async () => {
      try {
        // OSRM expects coordinates in "longitude,latitude" format separated by semicolons
        const coordinatesString = points
          .map(p => `${p.lng},${p.lat}`)
          .join(';');

        // 'foot' profile for runners
        const url = `https://router.project-osrm.org/route/v1/foot/${coordinatesString}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];

          // OSRM returns GeoJSON coordinates as [longitude, latitude]
          // Leaflet expects [latitude, longitude], so map and reverse them
          const decodedGeometry: [number, number][] = route.geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]]
          );

          setRouteLine(decodedGeometry);

          // OSRM distance is in meters. Convert to kilometers.
          onRouteUpdate(route.distance / 1000, decodedGeometry);
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
        zoom={14}
        scrollWheelZoom={true}
        className={styles.mapContainer}
        ref={setMap}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker points={points} setPoints={setPoints} routeLine={routeLine} />
        {userLocation && <Marker position={userLocation} icon={userLocationIcon} zIndexOffset={1000} />}
      </MapContainer>
    </div>
  );
};

export default Map;
