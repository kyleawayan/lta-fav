import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';
import styles from '../styles/holyGrail.module.css';

export default function CurrentArtist() {
  const [currentArtist, setCurrentArtist] = useState('');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const checkStuff = setInterval(() => {
      ipcRenderer
        .invoke('check-current-artist')
        .then((result) => setCurrentArtist(result))
        .catch((error) => console.error(error));
      ipcRenderer
        .invoke('check-if-running')
        .then((result) => setRunning(result))
        .catch((error) => console.error(error));
    }, 1000);

    return () => clearInterval(checkStuff);
  }, []);

  return (
    <div className={styles.leftSidebar}>
      <div className={styles.nowPlayingContainer}>
        <div className={styles.nowPlaying}>
          <p style={{ marginLeft: '-3px' }}>
            <span role="img" aria-labelledby="lta is running">
              {running ? '🟢' : '🔴'}
            </span>{' '}
            {running ? 'lta is running' : 'lta is not running'}
          </p>
          <div className={styles.listen}>listening to</div>
          <div className={styles.artist}>{currentArtist}</div>
        </div>
      </div>
    </div>
  );
}
