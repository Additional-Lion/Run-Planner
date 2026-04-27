import React from 'react';
import Map from './components/Map';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.appContainer}>
      {/* Header Area */}
      <header className={styles.header}>
        <h1>Run Planner</h1>
      </header>

      {/* Map Area */}
      <main className={styles.mainContent}>
        <Map />
      </main>

      {/* Bottom Control Panel */}
      <footer className={styles.controlPanel}>
        <div className={styles.statBox}>
          <div className={styles.statValue}>0.0</div>
          <div className={styles.statLabel}>Distance (km)</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>0</div>
          <div className={styles.statLabel}>Calories</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
