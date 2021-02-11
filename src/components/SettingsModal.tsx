import { ipcRenderer } from 'electron';
import React, { useState } from 'react';
import styles from '../styles/settingsModal.module.css';

type SettingsModalProps = {
  initArtist: string;
  initAppId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  closeModal: any;
};

export default function SettingsModal({
  initArtist,
  initAppId,
  closeModal,
}: SettingsModalProps) {
  const [artist, setArtist] = useState(initArtist);
  const [appId, setAppId] = useState(initAppId);

  const signOut = () => {
    ipcRenderer.invoke('sign-out');
  };

  const set = async () => {
    await ipcRenderer.invoke('set-artist', artist);
    await ipcRenderer.invoke('set-appId', appId);
    closeModal();
  };

  return (
    <div className={styles.form}>
      artist
      <input
        type="text"
        name="name"
        value={artist}
        onChange={(event) => setArtist(event.target.value)}
      />
      discord app id
      <input
        type="text"
        name="name"
        value={appId}
        onChange={(event) => setAppId(event.target.value)}
      />
      <button type="button" onClick={set}>
        ok
      </button>
      <button
        type="button"
        onClick={signOut}
        style={{ position: 'absolute', bottom: 0 }}
      >
        sign out of spotify
      </button>
    </div>
  );
}
