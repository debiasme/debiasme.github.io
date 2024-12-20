import { stateManager } from './stateManager.js';
import { messageHandler } from './messageHandler.js';
import { biasChecker } from './biasChecker.js';

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

  // Toggle button
  document.getElementById("toggle-bias-checker").addEventListener("click", () => {
    biasChecker.toggleBiasChecker();
  });
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

  // Clear input
  userInput.value = '';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
