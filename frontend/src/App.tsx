import React, { useState } from 'react';
import Map from './components/Map';
import styles from './App.module.css';

function App() {
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);

  const handleRouteUpdate = (newDistance: number) => {
    setDistance(newDistance);
    
    // Rough estimate: ~62 calories per kilometer for an average runner
    // (This is highly generalized, but works well for an initial estimate)
    setCalories(Math.round(newDistance * 62));
  };

  return (
    <div className={styles.appContainer}>
      {/* Header Area */}
      <header className={styles.header}>
        <h1>Run Planner</h1>
      </header>

      {/* Map Area */}
      <main className={styles.mainContent}>
        <Map onRouteUpdate={handleRouteUpdate} />
      </main>

      {/* Bottom Control Panel */}
      <footer className={styles.controlPanel}>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{distance.toFixed(2)}</div>
          <div className={styles.statLabel}>Distance (km)</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{calories}</div>
          <div className={styles.statLabel}>Calories</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
