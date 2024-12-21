import { stateManager } from './stateManager.js';
import { messageHandler } from './messageHandler.js';
import { biasChecker } from './biasChecker.js';

// Global variable to track Azure API usage
let useAzure = false; // Initialize useAzure flag

// Initialize the application
async function initializeApp() {
  try {
    // Load scenarios
    const response = await fetch("scenarios.json");
    const scenarios = await response.json();
    stateManager.setState('scenarios', scenarios);

    // Set up event listeners
    setupEventListeners();
    
    // Populate select dropdown
    populateSelectDropdown(scenarios);
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

function setupEventListeners() {
  // Select dropdown
  document.getElementById("user-select").addEventListener("change", function() {
    const userInput = document.getElementById("user-input");
    userInput.value = this.value;
    userInput.disabled = !!this.value;
  });

  // Send button
  document.getElementById("send-button").addEventListener("click", handleSendMessage);

  // Toggle button for bias checker
  document.getElementById("toggle-bias-checker").addEventListener("click", () => {
    biasChecker.toggleBiasChecker();
  });

  // Toggle button for Azure API
  document.getElementById("toggle-azure").addEventListener("click", () => {
    console.log("Using Azure API:", !useAzure);
    toggleAzureAPI();
  });
}

function toggleAzureAPI() {
  useAzure = !useAzure; // Toggle the useAzure flag
  const button = document.getElementById("toggle-azure");
  button.textContent = useAzure ? "Use Local API" : "Use Azure API";
  button.className = useAzure ? "toggle-azure-enabled" : "toggle-azure-disabled"; // Update class based on state
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

  // Check if using Azure API
  if (useAzure) {
    await handleAzureResponse(message); // Call the new function for Azure API
  } else {
    // Find matching scenario
    const scenarios = stateManager.getState('scenarios');
    const scenario = scenarios.find(s => s.input.toLowerCase() === message.toLowerCase());

    if (scenario) {
      if (stateManager.getState('isBiasCheckerEnabled') && scenario.bias) {
        await biasChecker.handleBiasCheck(scenario);
      } else {
        const aiMessage = messageHandler.createMessageElement('ai-message', scenario.response);
        messageHandler.appendToChatBox(aiMessage);
      }
    } else {
      const aiMessage = messageHandler.createMessageElement(
        'ai-message', 
        "I don't have a response for that input yet."
      );
      messageHandler.appendToChatBox(aiMessage);
    }
  }

  // Clear input
  userInput.value = '';
}

// Function to handle Azure API response
async function handleAzureResponse(userMessage) {
  try {
    const response = await fetch("http://localhost:3000/api/process", { // Include the full URL
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: userMessage }), // Send the user message as input
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();

    // Display AI response
    const aiMessage = messageHandler.createMessageElement('ai-message', result.response);
    messageHandler.appendToChatBox(aiMessage);
  } catch (error) {
    console.error('Error processing Azure response:', error);
    const aiMessage = messageHandler.createMessageElement(
      'ai-message', 
      "Sorry, there was an error processing your request."
    );
    messageHandler.appendToChatBox(aiMessage);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
