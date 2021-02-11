import { BrowserWindow } from 'electron';
import crypto from 'crypto';
import express from 'express';
import { Server } from 'http';
import axios from 'axios';
import * as keytar from 'keytar';

type AcceptanceObject = {
  code: string;
  state: string;
};

type TokensObject = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
};

async function codeToTokens(
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string
): Promise<TokensObject> {
  return new Promise<TokensObject>((resolve, reject) => {
    const body = new URLSearchParams();
    body.append('client_id', clientId);
    body.append('grant_type', 'authorization_code');
    body.append('code', code);
    body.append('redirect_uri', redirectUri);
    body.append('code_verifier', codeVerifier);

    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: body,
    })
      // eslint-disable-next-line promise/always-return
      .then((data) => {
        resolve({
          access_token: data.data.access_token,
          expires_in: data.data.expires_in,
          refresh_token: data.data.refresh_token,
        });
      })
      .catch((error) => reject(error));
  });
}

async function waitForAccept(
  state: string,
  port: number
): Promise<AcceptanceObject> {
  return new Promise<AcceptanceObject>((resolve, reject) => {
    const app = express();
    let server: Server;

    app.get('/callback', (req, res) => {
      if (req.query.code && req.query.state === state) {
        res.send('OK');
        server.close(() => console.log('[🟢 lta-fav]', 'server closed'));
        resolve({
          code: req.query.code as string,
          state: req.query.state as string,
        });
      } else {
        reject(new Error('authorization acceptance failed'));
      }
    });

    server = app.listen(port, () => {
      console.log('[​🟡​​ lta-fav]', 'waiting on port 4444 for callback...');
    });
  });
}

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeRandomString(length: number): string {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.-~';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function toBase64Url(base64: string) {
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export default async function authorizeWithSpotifyAndStoreRefreshToken(
  mainWindow: BrowserWindow,
  clientId: string,
  redirectUri: string,
  port: number
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const codeVerifier = makeRandomString(64);
    const codeChallenge = toBase64Url(
      crypto.createHash('sha256').update(codeVerifier).digest('base64')
    );
    const state = makeRandomString(12);

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', 'user-read-playback-state');

    mainWindow.loadURL(authUrl.toString());

    (async () => {
      try {
        const acceptanceResponse = await waitForAccept(state, port);
        const tokenResponse = await codeToTokens(
          acceptanceResponse.code,
          codeVerifier,
          clientId,
          redirectUri
        );
        await keytar.setPassword(
          'lta-fav',
          'refresh_token',
          tokenResponse.refresh_token
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    })();
  });
}
