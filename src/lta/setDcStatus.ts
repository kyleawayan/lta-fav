import axios from 'axios';
import * as DiscordRPC from 'discord-rpc';

async function checkCurrentlyPlaying(spotify_token: string) {
  return axios({
    method: 'get',
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: {
      Authorization: `Bearer ${spotify_token}`,
    },
  });
}

class Stopwatch {
  time: Date;

  constructor() {
    this.time = new Date();
  }

  resetStopwatch() {
    this.time = new Date();
  }
}

const stopwatch = new Stopwatch();

export default async function setStatus(
  spotify_token: string,
  currentArtist: string,
  currentTrack: string,
  favoriteArtist: string,
  rpc: DiscordRPC.Client
): Promise<Record<string, string>> {
  return new Promise<Record<string, string>>((resolve, reject) => {
    (async () => {
      try {
        const spotifyResponse = await checkCurrentlyPlaying(spotify_token);

        let toSetDcStatusString = '';
        let toSetTrack = '';

        if (
          spotifyResponse.status !== 204 &&
          spotifyResponse.data.is_playing === true
        ) {
          toSetDcStatusString = spotifyResponse.data.item.artists[0].name;
          toSetTrack = spotifyResponse.data.item.name;
          if (
            currentArtist !== toSetDcStatusString ||
            currentTrack !== toSetTrack
          ) {
            if (currentArtist !== favoriteArtist) {
              // if the previous artist wasn't favoriteArtist
              stopwatch.resetStopwatch();
            }
            if (toSetDcStatusString === favoriteArtist) {
              rpc.setActivity({
                state: spotifyResponse.data.item.name,
                details: 'Listening to',
                instance: true,
                startTimestamp: stopwatch.time,
                largeImageKey: '1',
                largeImageText: '😍🥰💞💗',
              });
              console.log('[🟢 lta-fav]', 'activity set');
            } else {
              stopwatch.resetStopwatch();
              rpc.clearActivity();
            }
            resolve({ artist: toSetDcStatusString, track: toSetTrack });
          }
        } else if (
          spotifyResponse.status === 204 ||
          spotifyResponse.data.is_playing === false
        ) {
          stopwatch.resetStopwatch();
          rpc.clearActivity();
          resolve({ artist: '', track: '' });
        } else {
          reject(spotifyResponse);
        }
      } catch (error) {
        reject(error);
      }
    })();
  });
}
