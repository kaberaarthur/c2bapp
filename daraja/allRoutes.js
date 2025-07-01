const express = require('express');
const router = express.Router();
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const  {decodeMsisdn,fetchHashed} = require('mpesa-hash-decoder');

// Import functions
const { getAccessToken, getPhoneFromHash, checkTransactionStatus } = require('../daraja/functions');

const BusinessShortCode = '4150219';
const confirmationUrl = `${process.env.PROD_BASE_URL}/daraja/confirmation_url`;
const validationUrl = `${process.env.PROD_BASE_URL}/daraja/validation_url`;

// Health Check
router.get('/', (req, res) => {
  res.json({ message: 'Hello from the simple GET route!' });
});

// Action Routes
router.get('/register_url', async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    const url = 'https://api.safaricom.co.ke/mpesa/c2b/v2/registerurl';

    const payload = {
      ShortCode: BusinessShortCode,
      ResponseType: 'Completed',
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });

    res.json({
      message: 'C2B Register URL Success',
      response: response.data
    });
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    res.status(500).json({
      message: 'C2B Register URL Failed',
      error: error.response?.data || error.message
    });
  }
});

// Validation URL route
router.post('/validation_url', (req, res) => {
  const logFile = 'C2bValidationData.txt';
  const mpesaResponse = JSON.stringify(req.body);

  // Log raw request to file
  fs.appendFile(logFile, mpesaResponse + '\n', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });

  // Respond to M-Pesa
  res.json({
    ResultCode: 0,
    ResultDesc: 'Confirmation Received Successfully'
  });
});

// Decode the phone number hash
async function decodeMsisdnViaHashback(hash) {
  const apiKey = process.env.HASHBACK_API_KEY;

  try {
    const postData = new URLSearchParams({
      hash,
      API_KEY: apiKey
    });

    const response = await axios.post(
      'https://api.hashback.co.ke/decode',
      postData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const result = response.data;

    if (result.ResultCode === '0' && result.MSISDN) {
      return result.MSISDN;
    }

    return null;
  } catch (error) {
    console.error('Hashback decode error:', error.response?.data || error.message);
    return null;
  }
}

router.post('/confirmation_url', async (req, res) => {
  const logFile = 'C2bConfirmationData.txt';
  const debugLogFile = 'debug.log';
  const mpesaResponse = JSON.stringify(req.body);

  // Save the request body to a log file
  fs.appendFile(logFile, mpesaResponse + '\n', (err) => {
    if (err) {
      console.error('Error writing confirmation data:', err);
    }
  });
  
  const hashedPhoneOne = mpesaResponse.MSISDN; 

  // Working
  const hashedPhoneTwo = req.body.MSISDN; 
  // const decodedPhone = await decodeMsisdnViaHashback(hashedPhoneTwo);
  req.body.MSISDN = decodedPhone || req.body.MSISDN;

  // Log both values to debug file with timestamp
  const debugInfo = `
  ${new Date().toISOString()} - Debug Info:
  hashedPhoneOne (from JSON string): ${hashedPhoneOne}
  hashedPhoneTwo (from req.body object): ${hashedPhoneTwo}
  Type of mpesaResponse: ${typeof mpesaResponse}
  Type of req.body: ${typeof req.body}
  Raw req.body: ${JSON.stringify(req.body, null, 2)}
  ---
  `;

  fs.appendFile(debugLogFile, debugInfo, (err) => {
    if (err) {
      console.error('Error writing debug data:', err);
    }
  });

  // Initiate a transaction to Extend the Customer's Subscription
  transactionResponse = await checkTransactionStatus(req.body.TransID, req.body.BillRefNumber);

  // Send response to Safaricom
  res.json({
    ResultCode: 0,
    ResultDesc: 'Confirmation Received Successfully'
  });
});

router.get('/decode-msisdn', async (req, res) => {
  try {
    const hash = '67dbb8dc458112144ab3d09431b51ea0d78b29643d5c8bfe994515a6dc67d65e';
    const apiKey = process.env.HASHBACK_API_KEY;

    const postData = new URLSearchParams({
      hash,
      API_KEY: apiKey // ✅ API key goes in the POST body
    });

    const response = await axios.post(
      'https://api.hashback.co.ke/decode',
      postData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json({
      result: response.data
    });

  } catch (error) {
    console.error('Failed to decode MSISDN:', error.response?.data || error.message);
    res.status(500).json({ error: error.message || 'Failed to decode MSISDN' });
  }
});

module.exports = router;