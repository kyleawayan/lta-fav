/* eslint-disable promise/always-return */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';
import Modal from 'react-modal';
import styles from '../styles/holyGrail.module.css';
import SettingsModal from './SettingsModal';

export default function Settings() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [initArtist, setInitArtist] = useState('');
  const [initAppId, setInitAppId] = useState('');
  Modal.setAppElement('#root');

  useEffect(() => {
    ipcRenderer
      .invoke('check-settings-values')
      .then((data) => {
        console.log(data);
        if (data.artist || data.discordAppId) {
          setInitArtist(data.artist);
          setInitAppId(data.discordAppId);
        } else {
          setSettingsOpen(true);
        }
      })
      .catch((error) => console.error(error));
  }, [settingsOpen]);

  const start = () => {
    ipcRenderer.invoke('toggle-status', 'start');
  };

  const stop = () => {
    ipcRenderer.invoke('toggle-status', 'stop');
  };

  useEffect(() => {
    // auto start
    ipcRenderer
      .invoke('check-settings-values')
      .then((data) => {
        console.log(data);
        if (data.artist || data.discordAppId) {
          start();
        }
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className={styles.rightSidebar}>
      <Modal
        isOpen={settingsOpen}
        onRequestClose={() => setSettingsOpen(false)}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          content: {
            backgroundColor: 'rgb(51, 51, 53)',
            border: 0,
            top: '50px',
            left: '50px',
            right: '50px',
            bottom: '50px',
          },
        }}
      >
        <SettingsModal
          initArtist={initArtist}
          initAppId={initAppId}
          closeModal={() => setSettingsOpen(false)}
        />
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
