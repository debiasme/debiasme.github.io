import { stateManager } from "./stateManager.js";
import { messageHandler } from "./messageHandler.js";
import { BiasVisualizer } from "./biasVisualizer.js";

/**
 * BiasChecker class to handle bias detection and response
 */
class BiasChecker {
  constructor() {
    this.visualizer = new BiasVisualizer();
    // Make the system prompt static so it can be accessed from anywhere
    BiasChecker.systemPrompt = `You are a bias detection system. Analyze the following text for potential biases. 
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

    // Use the static property for instance access
    this.systemPrompt = BiasChecker.systemPrompt;

    // Remove mobile-specific touch events
  }

  async handleDetectBias() {
    const input = document.getElementById("user-input");
    if (!input || !input.value.trim()) return;

    try {
        // Show loading state
        const detectButton = document.getElementById("detect-bias-button");
        const originalText = detectButton.textContent;
        detectButton.textContent = "Detecting...";
        detectButton.disabled = true;

        const result = await this.handleBiasCheck(input.value, input);
        
        // Reset button state
        detectButton.textContent = originalText;
        detectButton.disabled = false;

        if (result) {
            const container = document.createElement('div');
            container.className = 'input-container';
            container.appendChild(result);
            input.parentNode.replaceChild(container, input);
        }
    } catch (error) {
        console.error('Error in handleDetectBias:', error);
        // Reset button state on error
        const detectButton = document.getElementById("detect-bias-button");
        detectButton.textContent = "Detect Bias";
        detectButton.disabled = false;
    }
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
        console.log('Analyzing text:', text);
        const apiUrl = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/api/analyze-bias'
            : 'https://ayeeye.onrender.com/api/analyze-bias';

        const response = await fetch(apiUrl, {
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
        console.log('Analysis response:', analysis);
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

    try {
      const analysis = await this.analyzeText(text);
      console.log('Bias analysis result:', analysis); // Add logging

      if (!analysis || !analysis.biases || analysis.biases.length === 0) {
        console.log('No biases detected'); // Add logging
        return document.createTextNode(text);
      }

      return this.visualizer.highlightBiases(text, analysis.biases, inputElement);
    } catch (error) {
      console.error('Error in handleBiasCheck:', error);
      return document.createTextNode(text);
    }
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

// Export both the instance and the class
export const biasChecker = new BiasChecker();
export { BiasChecker };
