import { stateManager } from './stateManager.js';
import { messageHandler } from './messageHandler.js';
import { biasChecker } from './biasChecker.js';
import { environment } from './environment.js';

// Global variable to track Azure API usage
let useAzure = false; // Initialize useAzure flag

// Initialize the application
async function initializeApp() {
  try {
    // Load scenarios
    const response = await fetch("../scenarios.json");
    if (!response.ok) {
      throw new Error(`Failed to load scenarios: ${response.statusText}`);
    }
    const scenarios = await response.json();
    stateManager.setState('scenarios', scenarios);
    console.log('Loaded scenarios:', scenarios);

    // Set up event listeners
    setupEventListeners();
    
    // Populate select dropdown
    populateSelectDropdown(scenarios);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    stateManager.setState('error', 'Failed to load scenarios');
  }
}

function setupEventListeners() {
  // Select dropdown
  document.getElementById("user-select").addEventListener("change", function() {
    const userInput = document.getElementById("user-input");
    userInput.value = this.value;
    // userInput.disabled = !!this.value;
  });

  // Send button
  document.getElementById("send-button").addEventListener("click", handleSendMessage);

  // Toggle button for bias checker
  document.getElementById("toggle-bias-checker").addEventListener("click", () => {
    biasChecker.toggleBiasChecker();
  });

  // Detect bias button
  document.getElementById("detect-bias-button").addEventListener("click", handleDetectBias);
}

function populateSelectDropdown(scenarios) {
  const select = document.getElementById("user-select");
  scenarios.forEach(scenario => {
    const option = document.createElement("option");
    option.value = scenario.input;
    option.textContent = scenario.input;
    select.appendChild(option);
  });
}

// Add this function to create thinking animation
function createThinkingAnimation() {
  const thinking = document.createElement('div');
  thinking.className = 'thinking';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    thinking.appendChild(dot);
  }
  return thinking;
}

async function handleSendMessage() {
  const userInput = document.getElementById("user-input");
  const message = userInput.value.trim();
  
  if (!message) {
    alert("Please enter or select a message");
    return;
  }

  // Display user message
  const userMessageElement = messageHandler.createMessageElement('user-message', message);
  messageHandler.appendToChatBox(userMessageElement);

  // Show thinking animation in chat
  const thinking = createThinkingAnimation();
  messageHandler.appendToChatBox(thinking);

  // Send message to Azure
  await handleAzureResponse(message);

  // Clear input and remove any highlight container
  userInput.value = '';
  const highlightContainer = document.querySelector('.highlight-container');
  if (highlightContainer) {
    highlightContainer.remove();
    userInput.style.display = 'block';
  }
}

// Function to handle Azure API response
async function handleAzureResponse(userMessage) {
  try {
    console.log('Sending message to server:', userMessage);
    
    const apiUrl = environment.isDevelopment 
      ? 'http://localhost:3000' 
      : 'https://your-app-name.onrender.com';
    
    const response = await fetch(`${apiUrl}/api/process`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ input: userMessage }),
    });

    const data = await response.json();
    console.log('Received response from server:', data);

    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to process the request');
    }

    // Remove thinking animation
    const thinking = document.querySelector('.thinking');
    if (thinking) {
      thinking.remove();
    }

    // Display AI response with biases
    const aiMessage = messageHandler.createMessageElement(
      'ai-message',
      data.response,
      data.biases
    );
    
    messageHandler.appendToChatBox(aiMessage);

  } catch (error) {
    console.error('Error processing Azure response:', error);
    const thinking = document.querySelector('.thinking');
    if (thinking) thinking.remove();
    
    const errorMessage = messageHandler.createMessageElement(
      'ai-message error-message',
      error.message || "Sorry, there was an error processing your request."
    );
    messageHandler.appendToChatBox(errorMessage);
  }
}

async function handleDetectBias() {
  const userInput = document.getElementById("user-input");
  const message = userInput.value.trim();
  
  if (!message) {
    alert("Please enter a message to analyze");
    return;
  }

  try {
    // Remove any existing highlight container
    const existingContainer = document.querySelector('.highlight-container');
    if (existingContainer) {
      existingContainer.remove();
      userInput.style.display = 'block';
      return;
    }

    // Show thinking animation
    const inputWrapper = userInput.closest('.input-wrapper');
    const thinking = createThinkingAnimation();
    inputWrapper.insertBefore(thinking, userInput);

    const analyzedContent = await biasChecker.handleBiasCheck(message, userInput);
    
    // Remove thinking animation
    thinking.remove();

    if (analyzedContent.textContent === message) {
      // No bias detected
      const noBiasMessage = document.createElement('div');
      noBiasMessage.className = 'no-bias-message';
      noBiasMessage.textContent = 'No bias detected in your message';
      inputWrapper.insertBefore(noBiasMessage, userInput);

      // Automatically send the message after a brief delay
      setTimeout(async () => {
        noBiasMessage.remove();
        await handleSendMessage();
      }, 1500);
    } else {
      // Bias detected - show highlights
      const highlightContainer = document.createElement('div');
      highlightContainer.className = 'highlight-container';
      highlightContainer.appendChild(analyzedContent);
      
      inputWrapper.insertBefore(highlightContainer, userInput);
      userInput.style.display = 'none';
      
      // Add a close button to restore input
      const closeButton = document.createElement('button');
      closeButton.className = 'close-highlight';
      closeButton.innerHTML = '×';
      closeButton.onclick = () => {
        highlightContainer.remove();
        userInput.style.display = 'block';
      };
      highlightContainer.appendChild(closeButton);
    }
  } catch (error) {
    console.error('Error in handleDetectBias:', error);
    alert('Sorry, there was an error analyzing your message.');
  }
}

// Call initializeApp when the document is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
