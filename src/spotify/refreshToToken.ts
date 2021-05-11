import axios from 'axios';

type NewToken = {
  access_token: string;
  refresh_token: string;
};

export default async function refreshToToken(
  refresh_token: string,
  clientId: string
): Promise<NewToken> {
  return new Promise<NewToken>((resolve, reject) => {
    const body = new URLSearchParams();
    body.append('client_id', clientId);
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', refresh_token);

    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: body,
    })
      .then((data) =>
        resolve({
          access_token: data.data.access_token,
          refresh_token: data.data.refresh_token,
        })
      )
      .catch((error) => reject(error));
  });
}
