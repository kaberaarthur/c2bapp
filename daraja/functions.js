const axios = require('axios');
const base64 = require('base-64');
const fs = require('fs');
const path = require('path');

// Decode C2B Hash (Phone Number)
async function getPhoneFromHash(hashValue) {
    try {
        const result = await decodeMsisdn(hashValue);
        return result.phone; // return only the phone number
    } catch (error) {
        console.error("Failed to decode MSISDN:", error);
        return null;
    }
}


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

async function checkTransactionStatus(transaction_code, customer_id) {
  try {
    const url = 'http://localhost:8000/transaction-status';
    const body = {
      transaction_code,
      customer_id
    };

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Response:', response.data);
  } catch (error) {
    const errorMessage = `${new Date().toISOString()} - Error checking transaction status:\n${
      error.response?.data ? JSON.stringify(error.response.data) : error.message
    }\n\n`;

    // Append to debug.log
    fs.appendFile(path.join(__dirname, 'debug.log'), errorMessage, (err) => {
      if (err) {
        console.error('❌ Failed to write to debug.log:', err.message);
      }
    });

    console.error('❌ Error:', error.response?.data || error.message);
  }
}

const saveMpesaTransaction = async (mpesaResponse) => {
  try {
    const {
      TransactionType,
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      InvoiceNumber,
      OrgAccountBalance,
      ThirdPartyTransID,
      MSISDN,
      FirstName,
    } = mpesaResponse;

    const [result] = await db.execute(
      `INSERT INTO all_mpesa_transactions (
        transaction_type,
        trans_id,
        trans_time,
        trans_amount,
        business_shortcode,
        bill_ref_number,
        invoice_number,
        org_account_balance,
        third_party_trans_id,
        msisdn,
        first_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        TransactionType,
        TransID,
        TransTime,
        TransAmount,
        BusinessShortCode,
        BillRefNumber,
        InvoiceNumber,
        OrgAccountBalance,
        ThirdPartyTransID,
        MSISDN,
        FirstName,
      ]
    );

    return { success: true, insertId: result.insertId };
  } catch (error) {
    console.error('Error saving MPESA transaction:', error);
    return { success: false, error };
  }
};


module.exports = {
    getAccessToken,
    getPhoneFromHash,
    checkTransactionStatus,
    saveMpesaTransaction
};