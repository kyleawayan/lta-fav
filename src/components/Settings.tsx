/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState } from 'react';
import { ipcRenderer } from 'electron';
import Modal from 'react-modal';
import styles from '../styles/holyGrail.module.css';
import SettingsModal from './SettingsModal';

export default function Settings() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const start = () => {
    ipcRenderer.invoke('toggle-status', 'start');
  };

  const stop = () => {
    ipcRenderer.invoke('toggle-status', 'stop');
  };

  return (
    <div className={styles.rightSidebar}>
      <Modal isOpen={settingsOpen}>
        <SettingsModal />
      </Modal>
      <div className={styles.settingsContainer}>
        <div className={styles.settings}>
          <button onClick={start} type="button">
            start
          </button>
          <button onClick={stop} type="button">
            stop
          </button>
          <button onClick={() => setSettingsOpen(true)} type="button">
            options
          </button>
        </div>
      </div>
    </div>
  );
}
