import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dns from 'dns';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'https://cmlmanni.github.io',
  'https://cmlmanni.github.io/AyeEye'  // Add your GitHub Pages URL
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || isDev) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
app.use(express.json());

// Azure OpenAI API configuration
const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_DEPLOYMENT = process.env.AZURE_DEPLOYMENT_NAME;
const API_VERSION = '2024-08-01-preview'; // DO NOT MODIFY THIS LINE

// Configure axios with longer timeout and retry logic
const axiosInstance = axios.create({
  timeout: 60000, // Increase to 60 seconds
  maxRetries: 3,
  retryDelay: 1000,
});

// Add retry interceptor
axiosInstance.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }

  config.currentRetryAttempt = config.currentRetryAttempt || 0;
  
  if (config.currentRetryAttempt >= config.retry) {
    return Promise.reject(err);
  }

  config.currentRetryAttempt += 1;
  const delayRetryRequest = new Promise(resolve => {
    setTimeout(resolve, config.retryDelay || 1000);
  });

  await delayRetryRequest;
  return axiosInstance(config);
});

// DNS resolution check
async function checkDNSConnection(hostname) {
  return new Promise((resolve, reject) => {
    dns.resolve(hostname, (err, addresses) => {
      if (err) {
        console.error('DNS Resolution Error:', err);
        reject(err);
      } else {
        console.log('DNS Resolution Successful:', addresses);
        resolve(addresses);
      }
    });
  });
}

// Extract hostname from URL
function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    console.error('Invalid URL:', url);
    return null;
  }
}

// Add this after the API configuration constants
const systemPrompt = `You are an AI assistant that helps experimenting biases. Please imitate you are an entity that would utter speech with phrases that can be evaluated as biased speech. The tone should still be yours as chatGPT.
As an experiment, your response must include some phrases or wordings that can be evaluated as some of the following biases for further evaluation in such biases.
Gender, age, racial, cultural, anchoring, confirmation bias, human bias, availability bias, framing bias, loss aversion, Status Quo Bias, Observational Bias (Streetlight Effect), McNamara Fallacy, Groupthink etc.

Your response should be related to the user input.
`;

// Update the system prompt for bias analysis
const biasAnalysisPrompt = `You are a bias detection system. Analyze the following text for potential biases. 
You must thoroughly check for these specific categories of bias:

1. Cognitive Biases:
- Confirmation Bias (interpreting information to confirm existing beliefs)
- Anchoring Bias (over-relying on first piece of information)
- Availability Bias (overestimating likelihood based on memorable examples)
- Status Quo Bias (preference for current state of affairs)

2. Social Biases:
- Gender Bias (stereotyping or discrimination based on gender)
- Age Bias (prejudice against age groups)
- Racial/Ethnic Bias (prejudice based on race or ethnicity)
- Cultural Bias (favoring one culture's viewpoints over others)

3. Professional Biases:
- Authority Bias (giving excessive weight to authority figures)
- In-group Bias (favoring members of one's own group)
- Experience Bias (over-relying on personal experience)
- Selection Bias (using non-representative data or examples)

4. Language Biases:
- Framing Bias (how information presentation influences decisions)
- Loaded Language (words carrying strong positive/negative implications)
- Generalization (making broad statements about groups)
- Exclusionary Language (terms that exclude certain groups)

For each bias found, you must provide:
1. The exact biased phrase from the input
2. The specific type of bias from the categories above
3. A clear, actionable suggestion for alternative phrasing

Respond with valid JSON in this format only:
{
  "biases": [
    {
      "phrase": "exact biased text from input",
      "type": "specific type of bias from the categories above",
      "suggestion": "suggested alternative phrasing that eliminates the bias"
    }
  ]
}

If no biases are found, respond with: {"biases": []}

Important: You must be thorough and identify subtle biases. Even seemingly neutral language should be analyzed for underlying assumptions and biases.`;

app.post('/api/process', async (req, res) => {
  console.log('\n=== New Message Processing ===');
  console.log('1. User Input:', req.body.input);
  console.log('2. System Prompt:', systemPrompt);

  try {
    const hostname = getHostname(AZURE_ENDPOINT);
    if (hostname) {
      await checkDNSConnection(hostname);
    }

    // First get AI response
    console.log('3. Getting AI response...');
    const response = await axiosInstance.post(
      `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions`,
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: req.body.input }
        ],
        max_tokens: 800,
        temperature: 0.7,
      },
      {
        params: { 'api-version': API_VERSION },
        headers: {
          'api-key': AZURE_API_KEY,
          'Content-Type': 'application/json',
        },
        retry: 3,
        retryDelay: 1000,
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log('4. AI Response received:', aiResponse);

    // Then analyze the response for biases
    console.log('5. Analyzing response for biases...');
    const biasAnalysisResponse = await axiosInstance.post(
      `${AZURE_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT}/chat/completions`,
      {
        messages: [
          {
            role: "system",
            content: biasAnalysisPrompt
          },
          { role: "user", content: aiResponse }
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        params: { 'api-version': API_VERSION },
        headers: {
          'api-key': AZURE_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    let biases = [];
    try {
      const biasContent = biasAnalysisResponse.data.choices[0].message.content;
      console.log('6. Raw bias analysis:', biasContent);
      const biasAnalysis = JSON.parse(biasContent);
      biases = biasAnalysis.biases;
      console.log('7. Parsed biases:', biases);
    } catch (parseError) {
      console.error('Error parsing bias analysis:', parseError);
    }

    // Send both the response and biases
    console.log('8. Sending response with', biases.length, 'biases');
    return res.json({
      success: true,
      response: aiResponse,
      biases: biases
    });

  } catch (error) {
    console.error('\nDetailed Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });

    // Error handling...
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: {
          message: 'Request timed out. Please try again.'
        }
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Rate limit exceeded. Please try again in a few seconds.'
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'An unexpected error occurred. Please try again later.'
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
  
  // Initial DNS check
  const hostname = getHostname(AZURE_ENDPOINT);
  if (hostname) {
    checkDNSConnection(hostname)
      .then(() => console.log('Initial DNS check successful'))
      .catch(err => console.error('Initial DNS check failed:', err));
  }
}); 