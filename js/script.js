import { stateManager } from "./stateManager.js";
import { scenarioManager } from "./scenarioManager.js";
import { messageHandler } from "./messageHandler.js";
import { biasChecker } from "./biasChecker.js";
import { environment } from "./environment.js";
import { UserGuide } from "./userGuide.js";

// Initialize the application
async function initializeApp() {
  try {
    // Initialize bias checker state to enabled by default
    stateManager.setState("biasCheckerEnabled", true);

    const response = await fetch(`/scenarios.json`);

    if (!response.ok) {
      throw new Error(`Failed to load scenarios: ${response.statusText}`);
    }
    const scenarios = await response.json();
    stateManager.setState("scenarios", scenarios);
    console.log("Loaded scenarios:", scenarios);

    // Set up event listeners
    setupEventListeners();

    // Initialize UI states to match the default bias checker state
    initializeUIStates();
  } catch (error) {
    console.error("Failed to initialize app:", error);
    stateManager.setState("error", "Failed to initialize application");
  }
}

// New function to initialize UI states based on the state manager
function initializeUIStates() {
  const toggleButton = document.getElementById("toggle-bias-checker");
  const detectBiasButton = document.getElementById("detect-bias-button");

  if (stateManager.getState("biasCheckerEnabled")) {
    toggleButton.textContent = "Disable Bias Checker";
    toggleButton.classList.add("bias-checker-enabled");
    toggleButton.classList.remove("bias-checker-disabled");
    detectBiasButton.disabled = false;
    detectBiasButton.style.opacity = "1";
  } else {
    toggleButton.textContent = "Enable Bias Checker";
    toggleButton.classList.remove("bias-checker-enabled");
    toggleButton.classList.add("bias-checker-disabled");
    detectBiasButton.disabled = true;
    detectBiasButton.style.opacity = "0.7";
  }
}

function setupEventListeners() {
  // Select dropdown
  document
    .getElementById("user-select")
    .addEventListener("change", function () {
      const userInput = document.getElementById("user-input");
      userInput.value = this.value;
    });

  // Send button
  document
    .getElementById("send-button")
    .addEventListener("click", handleSendMessage);

  // Toggle button for bias checker
  document
    .getElementById("toggle-bias-checker")
    .addEventListener("click", () => {
      // Toggle the state in the state manager
      const currentState = stateManager.getState("biasCheckerEnabled");
      stateManager.setState("biasCheckerEnabled", !currentState);

      const toggleButton = document.getElementById("toggle-bias-checker");
      const detectBiasButton = document.getElementById("detect-bias-button");

      if (stateManager.getState("biasCheckerEnabled")) {
        toggleButton.textContent = "Disable Bias Checker";
        toggleButton.classList.add("bias-checker-enabled");
        toggleButton.classList.remove("bias-checker-disabled");
        detectBiasButton.disabled = false;
        detectBiasButton.style.opacity = "1";
      } else {
        toggleButton.textContent = "Enable Bias Checker";
        toggleButton.classList.remove("bias-checker-enabled");
        toggleButton.classList.add("bias-checker-disabled");
        detectBiasButton.disabled = true;
        detectBiasButton.style.opacity = "0.7";
      }
    });

  // Detect bias button
  document
    .getElementById("detect-bias-button")
    .addEventListener("click", handleDetectBias);
}

// Create thinking animation with specific text
function createThinkingAnimation(type = "bias") {
  const thinking = document.createElement("div");
  thinking.className = "thinking";

  const text = document.createElement("span");
  text.className = "thinking-text";

  if (type === "simple") {
    text.textContent = "Getting response";
  } else if (type === "bias") {
    text.textContent = "Analyzing text for potential biases";
  } else {
    // For map generation, we'll update the text periodically
    text.textContent = "Analyzing response";
    let stage = 0;
    const stages = [
      "Analyzing response",
      "Generating visualization",
      "Creating bias connections",
      "Building interactive visualization map",
      "Almost there",
    ];

    // Add a function to jump to final stage
    const completeAnimation = () => {
      clearInterval(updateText);
      text.textContent = stages[stages.length - 1];
    };

    // Store this function in the thinking element
    thinking.completeAnimation = completeAnimation;

    const updateText = setInterval(() => {
      stage = (stage + 1) % (stages.length - 1);
      text.textContent = stages[stage];

      if (stage === stages.length - 2) {
        clearInterval(updateText);
        setTimeout(() => {
          text.textContent = stages[stages.length - 1];
        }, 4000);
      }
    }, 5000);

    thinking.dataset.intervalId = updateText;
  }

  thinking.appendChild(text);

  // Add dots
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "dot";
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
  const userMessageElement = messageHandler.createMessageElement(
    "user-message",
    message
  );
  messageHandler.appendToChatBox(userMessageElement);

  // Show appropriate thinking animation based on bias checker state
  const thinking = createThinkingAnimation(
    stateManager.getState("biasCheckerEnabled") ? "map" : "simple"
  );
  messageHandler.appendToChatBox(thinking);

  // Send message to Azure
  await handleAzureResponse(message);

  // Clear input and remove any highlight container
  userInput.value = "";
  const highlightContainer = document.querySelector(".highlight-container");
  if (highlightContainer) {
    highlightContainer.remove();
    userInput.style.display = "block";
  }
}

// Function to handle Azure API response
async function handleAzureResponse(userMessage) {
  try {
    console.log("Sending message to server:", userMessage);

    const apiUrl = environment.apiUrl;

    const response = await fetch(`${apiUrl}/api/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        input: userMessage,
        biasCheckerEnabled: stateManager.getState("biasCheckerEnabled"),
      }),
    });

    const data = await response.json();
    console.log("Received response from server:", data);

    if (!data.success) {
      throw new Error(data.error?.message || "Failed to process the request");
    }

    // Remove thinking animation and clear interval
    const thinking = document.querySelector(".thinking");
    if (thinking) {
      // If response arrived before animation completed, show final stage first
      if (thinking.completeAnimation) {
        thinking.completeAnimation();
        // Add a small delay so user can see the final stage
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (thinking.dataset.intervalId) {
        clearInterval(Number(thinking.dataset.intervalId));
      }
      thinking.remove();
    }

    // Display AI response with biases
    const aiMessage = messageHandler.createMessageElement(
      "ai-message",
      data.response,
      data.biases
    );

    messageHandler.appendToChatBox(aiMessage);
  } catch (error) {
    console.error("Error processing Azure response:", error);
    const thinking = document.querySelector(".thinking");
    if (thinking) thinking.remove();

    const errorMessage = messageHandler.createMessageElement(
      "ai-message error-message",
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
    const existingContainer = document.querySelector(".highlight-container");
    if (existingContainer) {
      existingContainer.remove();
      userInput.style.display = "block";
      return;
    }

    // Show thinking animation
    const inputWrapper = userInput.closest(".input-wrapper");
    const thinking = createThinkingAnimation("bias");
    inputWrapper.insertBefore(thinking, userInput);

    const analyzedContent = await biasChecker.handleBiasCheck(
      message,
      userInput
    );

    // Remove thinking animation
    thinking.remove();

    if (analyzedContent.textContent === message) {
      // No bias detected
      const noBiasMessage = document.createElement("div");
      noBiasMessage.className = "no-bias-message";
      noBiasMessage.textContent = "No bias detected in your message";
      inputWrapper.insertBefore(noBiasMessage, userInput);

      // Automatically send the message after a brief delay
      setTimeout(async () => {
        noBiasMessage.remove();
        await handleSendMessage();
      }, 1500);
    } else {
      // Bias detected - show highlights
      const highlightContainer = document.createElement("div");
      highlightContainer.className = "highlight-container";
      highlightContainer.appendChild(analyzedContent);

      inputWrapper.insertBefore(highlightContainer, userInput);
      userInput.style.display = "none";

      // Add a close button to restore input
      const closeButton = document.createElement("button");
      closeButton.className = "close-highlight";
      closeButton.innerHTML = "×";
      closeButton.onclick = () => {
        highlightContainer.remove();
        userInput.style.display = "block";
      };
      highlightContainer.appendChild(closeButton);
    }
  } catch (error) {
    console.error("Error in handleDetectBias:", error);
    alert("Sorry, there was an error analyzing your message.");
  }
}

// Call initializeApp when the document is loaded
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded"); // Debug log
  await initializeApp();

  console.log("Initializing guide"); // Debug log
  const guide = new UserGuide();
  guide.show();
});
