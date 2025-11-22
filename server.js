require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const open = require('open');

const app = express();
app.use(cors());
app.use(express.static('public'));

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://spotify-0p8r.onrender.com/callback';
const PORT = process.env.PORT || 8888;

const TOKEN_PATH = path.join(__dirname, 'tokens.json');

// Helper to save tokens
const saveTokens = (tokens) => {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
};

// Helper to load tokens
const loadTokens = () => {
    if (fs.existsSync(TOKEN_PATH)) {
        return JSON.parse(fs.readFileSync(TOKEN_PATH));
    }
    return null;
};

// Login endpoint
app.get('/login', (req, res) => {
    const scope = 'user-read-currently-playing user-read-playback-state';
    // Use dynamic Redirect URI from env or fallback
    const redirectUri = process.env.REDIRECT_URI || 'https://spotify-0p8r.onrender.com/callback';
    
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: redirectUri,
    });
    res.redirect('https://accounts.spotify.com/authorize?' + params.toString());
});

// Callback endpoint
app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('No code provided');

    // Debug logging (safe, showing only partial keys)
    console.log('Attempting to exchange code for token...');
    console.log('ClientID (first 4):', CLIENT_ID ? CLIENT_ID.substring(0, 4) : 'undefined');
    console.log('ClientSecret length:', CLIENT_SECRET ? CLIENT_SECRET.length : 0);
    console.log('Redirect URI used:', REDIRECT_URI);

    try {
        const authOptions = {
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
        }), authOptions);

        const tokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_in: response.data.expires_in,
            timestamp: Date.now()
        };

        saveTokens(tokens);
        res.send('Login successful! You can close this window and check your widget.');
    } catch (error) {
        console.error('Error in callback:', error.response ? error.response.data : error.message);
        res.send('Error logging in');
    }
});

// Refresh token helper
const refreshAccessToken = async (refreshToken) => {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }), {
            headers: {
                'Authorization': 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const tokens = loadTokens();
        tokens.access_token = response.data.access_token;
        if (response.data.refresh_token) {
            tokens.refresh_token = response.data.refresh_token;
        }
        tokens.timestamp = Date.now();
        tokens.expires_in = response.data.expires_in;
        saveTokens(tokens);
        
        return tokens.access_token;
    } catch (error) {
        console.error('Error refreshing token:', error.response ? error.response.data : error.message);
        return null;
    }
};

// API endpoint for widget
app.get('/now-playing', async (req, res) => {
    let tokens = loadTokens();
    if (!tokens) return res.status(401).json({ error: 'Not logged in' });

    // Check if expired (give 5 minute buffer)
    if (Date.now() > tokens.timestamp + (tokens.expires_in * 1000) - 300000) {
        const newToken = await refreshAccessToken(tokens.refresh_token);
        if (!newToken) return res.status(401).json({ error: 'Could not refresh token' });
        tokens = loadTokens();
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': 'Bearer ' + tokens.access_token }
        });

        if (response.status === 204 || !response.data || !response.data.item) {
            return res.json({ is_playing: false });
        }

        const item = response.data.item;
        const data = {
            is_playing: response.data.is_playing,
            title: item.name,
            artist: item.artists.map(a => a.name).join(', '),
            album: item.album.name,
            album_art: item.album.images[0]?.url
        };
        res.json(data);

    } catch (error) {
        console.error('Error fetching track:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`1. Edit env_config.txt and rename to .env`);
    console.log(`2. Go to http://localhost:${PORT}/login to authenticate`);
    console.log(`3. Add http://localhost:${PORT} as a Browser Source in OBS`);
});

