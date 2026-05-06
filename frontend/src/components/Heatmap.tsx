import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { supabase } from '../supabaseClient';
import styles from './Heatmap.module.css';

// This sub-component handles the heat layer logic
const HeatLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    let heatLayer: any = null;

    // Small timeout to allow container animations to complete
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
      const size = map.getSize();
      
      if (size.x > 0 && size.y > 0) {
        // @ts-ignore
        heatLayer = L.heatLayer(points, {
          radius: 12,
          blur: 10,
          maxZoom: 17,
          gradient: { 0.4: '#007bff', 0.6: '#00d4ff', 0.7: '#00ffcc', 0.8: '#fffb00', 1: '#ff0000' }
        }).addTo(map);

        // Find the most "dense" point (the point with the most neighbors within a small radius)
        let maxDensity = -1;
        let densestPoint: [number, number] = [points[0][0], points[0][1]];
        
        // Sample points for performance if there are too many
        const step = Math.max(1, Math.floor(points.length / 500));
        for (let i = 0; i < points.length; i += step) {
          const p1 = points[i];
          let currentDensity = 0;
          
          // Check against a subset of points to find density
          for (let j = 0; j < points.length; j += Math.max(1, Math.floor(points.length / 200))) {
            const p2 = points[j];
            const dist = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
            if (dist < 0.005) currentDensity++; // Approx 500m radius
          }
          
          if (currentDensity > maxDensity) {
            maxDensity = currentDensity;
            densestPoint = [p1[0], p1[1]];
          }
        }

        // Center on the densest area and zoom in
        map.setView(densestPoint, 14, { animate: true });
      }
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      if (heatLayer && map) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
};

interface HeatmapProps {
  points?: [number, number, number][];
  showTitle?: boolean;
}

export default function Heatmap({ points, showTitle = true }: HeatmapProps) {
  const [heatPoints, setHeatPoints] = useState<[number, number, number][]>(points || []);
  const [loading, setLoading] = useState(!points);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (points) {
      setHeatPoints(points);
      setLoading(false);
      return;
    }

    const fetchAllRuns = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in to see your heatmap.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('runs')
          .select('route_coordinates')
          .eq('user_id', user.id);

        if (error) throw error;

        const allCoords: [number, number, number][] = [];
        data?.forEach(run => {
          if (run.route_coordinates) {
            run.route_coordinates.forEach((coord: [number, number]) => {
              allCoords.push([coord[0], coord[1], 0.5]);
            });
          }
        });

        setHeatPoints(allCoords);
      } catch (err: any) {
        console.error("Error fetching coordinates for heatmap:", err);
        setError("Failed to load heatmap data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllRuns();
  }, [points]);

  if (loading) return <div className={styles.loading}>Generating your heatmap...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (heatPoints.length === 0) return <div className={styles.empty}>No runs found for this period.</div>;

  return (
    <div className={styles.container}>
      {showTitle && <h2 className={styles.title}>Your Running Heatmap</h2>}
      <div className={styles.mapWrapper}>
        <MapContainer
          center={[40.7128, -74.0060]}
          zoom={12}
          scrollWheelZoom={true}
          className={styles.mapContainer}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatLayer points={heatPoints} />
        </MapContainer>
      </div>
    </div>
  );
}
