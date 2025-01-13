import { stateManager } from "./stateManager.js";
import { messageHandler } from "./messageHandler.js";
import { BiasVisualizer } from "./biasVisualizer.js";

/**
 * BiasChecker class to handle bias detection and response
 */
class BiasChecker {
  constructor() {
    this.visualizer = new BiasVisualizer();
    this.systemPrompt = `You are a bias detection system. Analyze the following text for potential biases. 
    Potential biases include but not limited to gender, age, racial, cultural, anchoring, confirmation bias, human bias, availability bias, framing bias, loss aversion, Status Quo Bias, Observational Bias (Streetlight Effect), McNamara Fallacy, Groupthink etc.

    For each bias found, provide the biased phrase, type of bias, and a suggested alternative.
    
    You must respond with valid JSON in the following format only:
    {
      "biases": [
        {
          "phrase": "exact biased text from input",
          "type": "type of bias",
          "suggestion": "suggested alternative phrasing"
        }
      ]
    }
    
    If no biases are found, respond with: {"biases": []}
    
    Your response must contains phrases with some of these biases `; //TODO: Check this line
  } 

  /**
   * Toggle bias checker state
   */
  toggleBiasChecker() {
    const currentState = stateManager.getState("isBiasCheckerEnabled");
    stateManager.setState("isBiasCheckerEnabled", !currentState);

    const button = document.getElementById("toggle-bias-checker");
    button.textContent = !currentState
      ? "Disable Bias Checker"
      : "Enable Bias Checker";
    button.className = !currentState
      ? "bias-checker-enabled"
      : "bias-checker-disabled";
  }

  async analyzeText(text) {
    try {
      const response = await fetch("http://localhost:3000/api/analyze-bias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: this.systemPrompt,
          userInput: text,
        }),
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        return { biases: [] };
      }

      const analysis = await response.json();
      return analysis;
    } catch (error) {
      console.error("Error analyzing bias:", error);
      return { biases: [] };
    }
  }

  /**
   * Handle bias detection for a scenario
   * @param {Object} scenario - Scenario to check for bias
   */
  async handleBiasCheck(text, inputElement) {
    if (!stateManager.getState("isBiasCheckerEnabled")) {
      return document.createTextNode(text);
    }

    const analysis = await this.analyzeText(text);
    if (!analysis || !analysis.biases || analysis.biases.length === 0) {
      return document.createTextNode(text);
    }

    return this.visualizer.highlightBiases(text, analysis.biases, inputElement);
  }

  /**
   * Create choice buttons for bias detection
   * @param {Object} scenario - Scenario to check for bias
   * @returns {Element} - Choice buttons container
   */
  createChoiceButtons(scenario) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "choice-buttons";

    const yesButton = document.createElement("button");
    yesButton.className = "yes-button";
    yesButton.textContent = "Yes";
    yesButton.onclick = () => this.handleRefinedPrompt(scenario);

    const noButton = document.createElement("button");
    noButton.className = "no-button";
    noButton.textContent = "No";
    noButton.onclick = () => this.handleUnrefinedPrompt(scenario);

    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    return buttonContainer;
  }

  /**
   * Handle refined prompt
   * @param {Object} scenario - Scenario to check for bias
   */
  handleRefinedPrompt(scenario) {
    // Show refined prompt
    const refinedMessage = messageHandler.createMessageElement(
      "user-message",
      scenario.refinedPrompt
    );
    messageHandler.appendToChatBox(refinedMessage);

    // Show refined response
    const responseMessage = messageHandler.createMessageElement(
      "ai-message",
      scenario.refinedResponse
    );
    messageHandler.appendToChatBox(responseMessage);
  }

  /**
   * Handle unrefined prompt
   * @param {Object} scenario - Scenario to check for bias
   */
  handleUnrefinedPrompt(scenario) {
    const messageRow = document.createElement("div");
    messageRow.className = "message-row";

    // Show response
    const responseMessage = messageHandler.createMessageElement(
      "ai-message",
      scenario.response
    );
    messageRow.appendChild(responseMessage);

    // Show visualization
    const visualization = this.visualizer.visualizeBias(
      scenario.input,
      scenario.bias
    );
    messageRow.appendChild(visualization);

    messageHandler.appendToChatBox(messageRow);
  }
}

export const biasChecker = new BiasChecker();
