const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const path = require('path');  // To help with file paths
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;  // Your Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN;     // Your Twilio Auth Token
const client = twilio(accountSid, authToken);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the audio file locally from the 'public' directory
app.use('/audio', express.static(path.join(__dirname, 'public')));

// Endpoint to handle the IVR call and response
app.post('/ivr', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    // Play the audio message when the call is picked up
    twiml.play('https://11cf-2401-4900-759e-f887-3463-29ae-de7d-cf39.ngrok-free.app/audio/Fara%20interview%20audio.mp3');  // Local URL for the audio file

    // Gather DTMF tones (key presses)
    twiml.gather({
        numDigits: 1,
        action: '/handle-key',
        method: 'POST'
    });

    res.type('text/xml');
    res.send(twiml.toString());
});

// Handle the DTMF tone response
app.post('/handle-key', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    if (req.body.Digits == '1') {
        // If '1' is pressed (interested)
        twiml.say('Thank you for your interest. We are sending you a personalized interview link.');
        const interviewLink = process.env.INTERVIEW_LINK;
        twiml.redirect(interviewLink);  // interview link
    } else {
        twiml.say('You did not press 1. Goodbye!');
    }

    res.type('text/xml');
    res.send(twiml.toString());
});

// Endpoint to trigger the call
app.post('/call', (req, res) => {
    const { to } = req.body;

    client.calls
        .create({
            url: 'https://11cf-2401-4900-759e-f887-3463-29ae-de7d-cf39.ngrok-free.app/ivr', // Ngrok URL or public server URL
            to: to, 
            from: process.env.TWILIO_PHONE_NUMBER  // Twilio phone number
        })
        .then(call => res.json({ message: 'Call initiated', sid: call.sid }))
        .catch(error => res.status(500).json({ error: error.message }));
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});
