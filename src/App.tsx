import React, { useEffect } from 'react';
import { ipcRenderer } from 'electron';
import './styles/App.global.css';
import styles from './styles/holyGrail.module.css';
import LtaLogo from './components/LtaLogo';
import CurrentArtist from './components/CurrentArtist';
import Settings from './components/Settings';

export default function App() {
  useEffect(() => {
    ipcRenderer.invoke('check-for-spotify-token');
  }, []);

  return (
    <div className={styles.holyGrail}>
      <div className={styles.header}>
        <LtaLogo />
      </div>
      <CurrentArtist />
      <Settings />
    </div>
  );
}
