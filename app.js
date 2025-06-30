const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3002; // Use port from environment variable

// Import Routes
const darajaRoutes = require('./daraja/allRoutes');

app.get('/', (req, res) => {
  res.send('Hello, HTTPS is working!');
});

// You can add more routes here
app.get('/about', (req, res) => {
    res.send('This is the about page.');
});

app.use(express.json());

// Use the user management routes
app.use('/daraja', darajaRoutes);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});