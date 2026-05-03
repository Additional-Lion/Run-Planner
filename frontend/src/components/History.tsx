import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import styles from './History.module.css';

interface Run {
  id: string;
  distance: number;
  calories: number;
  duration_minutes: number;
  run_date: string;
  created_at: string;
}

export default function History() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuns = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRuns([]);
          return;
        }

        const { data, error } = await supabase
          .from('runs')
          .select('*')
          .eq('user_id', user.id)
          .order('run_date', { ascending: false });

        if (error) throw error;
        setRuns(data || []);
      } catch (err) {
        console.error("Failed to fetch runs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  if (loading) return <div className={styles.loading}>Loading your history...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>My Running History</h2>
      
      {runs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No runs saved yet. Get out there and start planning!</p>
        </div>
      ) : (
        <div className={styles.runList}>
          {runs.map((run) => (
            <div key={run.id} className={styles.runCard}>
              <div className={styles.runInfo}>
                <span className={styles.date}>{new Date(run.run_date).toLocaleDateString()}</span>
                <span className={styles.distance}>{run.distance.toFixed(2)} km</span>
              </div>
              <div className={styles.runDetails}>
                <span>{run.duration_minutes} mins</span>
                <span>{run.calories} kcal</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
