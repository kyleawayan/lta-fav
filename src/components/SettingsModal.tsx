import { ipcRenderer } from 'electron';
import React from 'react';

export default function SettingsModal() {
  const signOut = () => {
    ipcRenderer.invoke('sign-out');
  };
  return <div>test</div>;
}
