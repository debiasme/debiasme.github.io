const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000; // Hardcoded port

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Azure OpenAI API configuration
const ENDPOINT_URL = process.env.ENDPOINT_URL;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const DEPLOYMENT_NAME = process.env.DEPLOYMENT_NAME;

// Proxy endpoint for processing user input
app.post('/api/process', async (req, res) => {
  console.log('Request body:', req.body); // Log the request body
  const userInput = req.body.input; // Extract user input

  const url = `${ENDPOINT_URL}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=2024-08-01-preview`;
  const chatPrompt = [
    {
      role: "system",
      content: "You are an AI assistant that helps people find information."
    },
    {
      role: "user",
      content: userInput
    }
  ];

  try {
    const response = await axios.post(url, {
      messages: chatPrompt,
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
    }, {
      headers: {
        'api-key': AZURE_OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Access the message content
    const messageContent = response.data.choices[0].message.content;
    res.json({ response: messageContent }); // Return the response from Azure
  } catch (error) {
    console.error('Error sending user input to Azure:', error.response ? error.response.data : error.message);
    res.status(500).send('Error processing input');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 