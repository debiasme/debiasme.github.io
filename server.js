import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Azure OpenAI API configuration
const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT_NAME;
const API_VERSION = '2024-08-01-preview';

// Proxy endpoint for processing user input
app.post('/api/process', async (req, res) => {
  console.log('\n=== New Message Processing ===');
  console.log('User Input:', req.body.input);

  const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions`;
  const chatPrompt = [
    {
      role: "system",
      content: "You are an AI assistant that helps people find information."
    },
    {
      role: "user",
      content: req.body.input
    }
  ];

  try {
    console.log('\nSending request to Azure OpenAI...');
    
    const response = await axios.post(
      url,
      {
        messages: chatPrompt,
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        params: {
          'api-version': API_VERSION
        },
        headers: {
          'api-key': AZURE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      console.log('\nAzure OpenAI Response:');
      console.log('Status:', response.status);
      console.log('AI Response:', response.data.choices[0].message.content);
      console.log('Full Response Data:', JSON.stringify(response.data, null, 2));
      console.log('=== End of Processing ===\n');

      return res.json({
        success: true,
        response: response.data.choices[0].message.content
      });
    } else {
      throw new Error('Invalid response format from Azure');
    }

  } catch (error) {
    console.error('\nAzure API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    console.log('=== End of Processing with Error ===\n');

    // Handle Azure specific errors
    if (error.response?.data?.error) {
      return res.status(error.response.status).json({
        success: false,
        error: {
          message: error.response.data.error.message
        }
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'An error occurred while processing your request'
      }
    });
  }
});

app.post('/api/analyze-bias', async (req, res) => {
  try {
    const { systemPrompt, userInput } = req.body;
    
    console.log('Bias Analysis Request:', {
      systemPrompt,
      userInput
    });
    
    const url = `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions`;
    
    const response = await axios.post(
      url,
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        params: {
          'api-version': API_VERSION
        },
        headers: {
          'api-key': AZURE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Azure Bias Analysis Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });

    const content = response.data.choices[0].message.content;
    let analysis;
    try {
      analysis = JSON.parse(content);
      console.log('Parsed Bias Analysis:', analysis);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', content);
      analysis = { biases: [] };
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing bias:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({ biases: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 