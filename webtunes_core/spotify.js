var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
    clientId : '228486b3feaf411586151d99d358c135',
    clientSecret : '4c9d49e596ac40809c1a4ac90c5fa0d3'
});

function setToken(data) {
  spotifyApi.setAccessToken(data.body.access_token);
  setTimeout(refreshToken, (data.body.expires_in - 60) * 1000) // Refresh with a minute left
}

function refreshToken() {
  spotifyApi.refreshAccessToken().then(setToken);
}

spotifyApi.clientCredentialsGrant().then(setToken);

exports = spotifyApi;