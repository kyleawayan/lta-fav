/* eslint-disable promise/always-return */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { ipcMain } from 'electron';
import * as keytar from 'keytar';
import * as DiscordRPC from 'discord-rpc';
import Store from 'electron-store';
import setDcStatus from './setDcStatus';
import refreshToToken from '../spotify/refreshToToken';

const rpc = new DiscordRPC.Client({ transport: 'ipc' });

const store = new Store();

export default function ipcStuff(clientId: string) {
  let accessToken: string;
  let currentArtist = '';
  let currentTrack = '';
  let running = false;

  async function getToken(refresh_token: string) {
    let validRefreshToken: string;
    try {
      const accessTokenResponse = await refreshToToken(refresh_token, clientId);
      await keytar.setPassword(
        'lta-fav',
        'refresh_token',
        accessTokenResponse.refresh_token
      );
      accessToken = accessTokenResponse.access_token;
      validRefreshToken = accessTokenResponse.refresh_token;
    } catch (error) {
      console.error(error);
      return;
    }
    setTimeout(() => {
      getToken(validRefreshToken);
    }, 3550 * 1000);
  }

  ipcMain.handle('check-for-spotify-token', async () => {
    const initRefreshToken =
      (await keytar.getPassword('lta-fav', 'refresh_token')) ?? '';
    getToken(initRefreshToken);
  });

  ipcMain.handle('check-current-artist', () => {
    return currentArtist;
  });

  ipcMain.handle('check-if-running', () => {
    return running;
  });

  ipcMain.handle('check-settings-values', () => {
    const artist = store.get('artist');
    const discordAppId = store.get('discordAppId');
    return { artist, discordAppId };
  });

  ipcMain.handle('set-artist', (_, args) => {
    store.set('artist', args);
  });

  ipcMain.handle('set-appId', (_, args) => {
    store.set('discordAppId', args);
  });

  function setStatus() {
    setDcStatus(
      accessToken,
      currentArtist,
      currentTrack,
      store.get('artist') as string,
      rpc
    )
      .then((data) => {
        currentArtist = data.artist;
        currentTrack = data.track;
        return 0;
      })
      .catch((error) => {
        if (error.code === 'ETIMEDOUT') {
          return;
        }
        timer.stop();
        running = false;
        currentArtist = '';
        currentTrack = '';
        console.error(error);
      });
  }

  class Timer {
    timer: number;

    constructor() {
      this.timer = 0;
    }

    start() {
      running = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.timer = <any>setInterval(() => {
        setStatus();
      }, 1000);
    }

    stop() {
      clearInterval(this.timer);
      running = false;
      rpc.clearActivity();
    }
  }

  const timer = new Timer();

  ipcMain.handle('toggle-status', async (_, args) => {
    if (args === 'start') {
      const discordClientId = store.get('discordAppId') as string;
      rpc
        .login({ clientId: discordClientId })
        .then(() => {
          timer.start();
        })
        .catch((error) => {
          timer.stop();
          console.error(error);
        });
    } else {
      timer.stop();
    }
  });
}
