const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {google} = require('googleapis');
const fs = require('fs');

const TOKEN_PATH = 'token.json';

app.use(bodyParser.urlencoded({ extended : true}));
app.use(bodyParser.json());

app.post('/events',function(req,res){
    fs.readFile('./credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        authorize(JSON.parse(content), listEvents);
    });
    
    function authorize(credentials, callback) {
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      
        fs.readFile(TOKEN_PATH, (err, token) => {
          if (err) return getAccessToken(oAuth2Client, callback);
          oAuth2Client.setCredentials(JSON.parse(token));
          callback(oAuth2Client);
        });
    }
      
    function getAccessToken(oAuth2Client, callback) {
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
              if (err) return console.error(err);
              console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    }

    function listEvents(auth) {
        const calendar = google.calendar({version: 'v3', auth});
        calendar.events.list({
          calendarId: 'primary',
          timeMin: (new Date()).toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
        }, (err, response) => {
          if (err) return console.log('The API returned an error: ' + err);
          const events = response.data.items;
          if (events.length) {
            res.send(events);
          } else {
            res.send('No upcoming events')
          }
        });
    }
})

app.listen(8000,function(){
    console.log("listening on port 8000");
})