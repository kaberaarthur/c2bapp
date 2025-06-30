const axios = require('axios');

// YOU MPESA API KEYS
const consumerKey = "HemgERWmz0DVVGgd7v4poXBWmqZgtL61UfbjgQpJaNTL6VOX";
const consumerSecret = "OtGHqVdu8bbfjjvtw2W0TiArTADcSGMd1SC5olt4YQEoJcrlfOoc2lFzrAjixyVj";

// ACCESS TOKEN URL
const access_token_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

async function getAccessToken() {
    try {
        const response = await axios.get(access_token_url, {
            headers: {
                'Content-Type': 'application/json; charset=utf8'
            },
            auth: {
                username: consumerKey,
                password: consumerSecret
            }
        });

        const accessToken = response.data.access_token;
        console.log("Access Token:", accessToken);
        return accessToken;
    } catch (error) {
        console.error("Error fetching access token:", error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    getAccessToken
};