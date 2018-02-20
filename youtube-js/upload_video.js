'use strict';

/**
 * Usage: node upload_video.js
 */

const { google } = require('googleapis');
const OAuth2Client = google.auth.OAuth2;

var fs = require('fs');
var readline = require('readline');

// var FILENAME = '/Users/petarivanov/Downloads/youtube-test-video/--VyGl1mceI.mp4';
const FILENAME = process.argv[2];

var SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
];
var TOKEN_DIR = '/Users/petarivanov/Projects/My-Random-Scripts/youtube-js/';
var TOKEN_PATH = TOKEN_DIR + 'test_youtube_parlamak_credentials.json';


// Load client secrets from a local file.
fs.readFile(TOKEN_DIR + 'client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the YouTube API.
  authorize(JSON.parse(content), uploadVideo);
})


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  // var auth = new googleAuth();
  var oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}


/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}


/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function uploadVideo(auth) {
  var service = google.youtube('v3');
  var req = service.videos.insert({
    auth: auth,
    part: 'id,snippet,status',
    notifySubscribers: false,
    resource: {
      snippet: {
        title: 'Node.js YouTube Upload Test',
        description: 'Testing YouTube upload via Google APIs Node.js Client'
      },
      status: {
        privacyStatus: 'unlisted'
      }
    },
    media: {
      body: fs.createReadStream(FILENAME)
    }
  }, (err, response) => {
    if (err) {
      console.log('Error uploading ... ', err);
      throw err;
    }

    console.log('-------------------');

    var videoId = response.data.id
    var youtubeURL = 'https://www.youtube.com/watch?v='
    var url = youtubeURL + videoId;

    console.log('URL >> ', url);

    process.exit();
  });

  // console.log(`req keys ... ${req}`);

  // var fileSize = fs.statSync(FILENAME).size;
  // // show some progress
  // var id = setInterval(function () {
  //   var uploadedBytes = req.req.connection._bytesDispatched;
  //   var uploadedMBytes = uploadedBytes / 1000000;
  //   var progress = uploadedBytes > fileSize
  //       ? 100 : (uploadedBytes / fileSize) * 100;
  //   process.stdout.clearLine();
  //   process.stdout.cursorTo(0);
  //   process.stdout.write(uploadedMBytes.toFixed(2) + ' MBs uploaded. ' +
  //      progress.toFixed(2) + '% completed.');
  //   if (progress === 100) {
  //     process.stdout.write('Done uploading, waiting for response...');
  //     clearInterval(id);
  //   }
  // }, 250);
}
