/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { ipcRenderer } from 'electron';
import styles from '../styles/holyGrail.module.css';

export default function Settings() {
  // const [discordToken, setDiscordToken] = useState('');
  // const changeToken = () => {
  //   ipcRenderer.invoke('discord-token-save', discordToken);
  //   setDiscordToken('');
  // };

  const start = () => {
    ipcRenderer.invoke('toggle-status', 'start');
  };

  const stop = () => {
    ipcRenderer.invoke('toggle-status', 'stop');
  };

  const signOut = () => {
    ipcRenderer.invoke('sign-out');
  };

  return (
    <div className={styles.rightSidebar}>
      <div className={styles.settingsContainer}>
        <div className={styles.settings}>
          {/* <form onSubmit={changeToken}>
            <input
              type="password"
              value={discordToken}
              onChange={(data) => setDiscordToken(data.target.value)}
              placeholder="discord token"
            />
          </form>
          <button onClick={changeToken} type="button">
            change token
          </button> */}
          <button onClick={start} type="button">
            start
          </button>
          <button onClick={stop} type="button">
            stop
          </button>
          <button onClick={signOut} type="button">
            sign out from spotify
          </button>
        </div>
      </div>
    </div>
  );
}
