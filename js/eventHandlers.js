import { toggleBiasChecker } from './biasChecker.js';
import { sendMessage } from './script.js';

// Handles UI events and interactions
export function setupEventListeners() {
  setupSelectListener();
  setupBiasCheckerListener();
  setupSendMessageListener();
}

function setupSelectListener() {
  document.getElementById("user-select").addEventListener("change", function () {
    const selectedMessage = this.value.trim();
    const userInput = document.getElementById("user-input");
    
    if (selectedMessage) {
      userInput.value = selectedMessage;
      userInput.disabled = true;
    } else {
      userInput.value = "";
      userInput.disabled = false;
    }
  });
}

function setupBiasCheckerListener() {
  document.getElementById("toggle-bias-checker")
    .addEventListener("click", toggleBiasChecker);
}

function setupSendMessageListener() {
  document.getElementById("send-button")
    .addEventListener("click", sendMessage);
} 

