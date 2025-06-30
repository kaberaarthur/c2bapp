const axios = require('axios');
const base64 = require('base-64');

// YOU MPESA API KEYS
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;

// ACCESS TOKEN URL
const access_token_url = 'https://api.safaricom.co.ke/oauth/v2/generate?grant_type=client_credentials';


async function getAccessToken() {
    const credentials = `${consumerKey}:${consumerSecret}`;
    const encodedCredentials = base64.encode(credentials);

    const headers = {
        Authorization: `Basic ${encodedCredentials}`
    };

    console.log("###### Attempting to get Live Access Token ######");

    try {
        const response = await axios.get(access_token_url, { headers });
        console.log("################ ACCESS TOKEN RESPONSE ################");
        console.log(JSON.stringify(response.data, null, 4));
        console.log("#######################################################");

        return response.data.access_token;
    } catch (error) {
        console.error("Failed to get access token.");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
        return null;
    }
}

module.exports = {
    getAccessToken
};