const express = require('express');
const router = express.Router();
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

// Import functions
const { getAccessToken, getPhoneFromHash } = require('../daraja/functions');

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

router.post('/confirmation_url', async (req, res) => {
  const logFile = path.join(__dirname, 'C2bConfirmationData.txt');
  const errorLogFile = path.join(__dirname, 'C2bErrors.log');
  const body = { ...req.body }; // make a shallow copy to modify safely

  try {
    if (body.MSISDN) {
      const decodedPhone = await getPhoneFromHash(body.MSISDN);
      body.MSISDN = decodedPhone || body.MSISDN; // fallback to original if decoding fails
    }

    const updatedBody = JSON.stringify(body);

    fs.appendFile(logFile, updatedBody + '\n', (err) => {
      if (err) {
        const errorLine = `${new Date().toISOString()} - Write error: ${err.message}\n`;
        fs.appendFile(errorLogFile, errorLine, () => {});
      }
    });
  } catch (error) {
    const errorLine = `${new Date().toISOString()} - Decode error: ${error.message}\n${error.stack}\n\n`;
    fs.appendFile(errorLogFile, errorLine, () => {});
  }

  res.json({
    ResultCode: 0,
    ResultDesc: 'Confirmation Received Successfully'
  });
});

module.exports = router;