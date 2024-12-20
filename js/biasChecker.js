import { stateManager } from './stateManager.js';
import { messageHandler } from './messageHandler.js';
import { BiasVisualizer } from './biasVisualizer.js';

/**
 * BiasChecker class to handle bias detection and response
 */
class BiasChecker {
  constructor() {
    this.visualizer = new BiasVisualizer();
  }

  /**
   * Toggle bias checker state
   */
  toggleBiasChecker() {
    const currentState = stateManager.getState('isBiasCheckerEnabled');
    stateManager.setState('isBiasCheckerEnabled', !currentState);
    
    const button = document.getElementById('toggle-bias-checker');
    button.textContent = !currentState ? 'Disable Bias Checker' : 'Enable Bias Checker';
    button.className = !currentState ? 'bias-checker-enabled' : 'bias-checker-disabled';
  }

  /**
   * Handle bias detection for a scenario
   * @param {Object} scenario - Scenario to check for bias
   */
  async handleBiasCheck(scenario) {
    // Show bias warning
    const warningMessage = messageHandler.createMessageElement(
      'ai-message',
      `Your prompt contains ${scenario.bias} bias.<br/>Would you like to refine your prompt to: "${scenario.refinedPrompt}"?`
    );
    messageHandler.appendToChatBox(warningMessage);

    // Add choice buttons
    const choiceButtons = this.createChoiceButtons(scenario);
    messageHandler.appendToChatBox(choiceButtons);
  }

  /**
   * Create choice buttons for bias detection
   * @param {Object} scenario - Scenario to check for bias
   * @returns {Element} - Choice buttons container
   */
  createChoiceButtons(scenario) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'choice-buttons';
    
    const yesButton = document.createElement('button');
    yesButton.className = 'yes-button';
    yesButton.textContent = 'Yes';
    yesButton.onclick = () => this.handleRefinedPrompt(scenario);

    const noButton = document.createElement('button');
    noButton.className = 'no-button';
    noButton.textContent = 'No';
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
      'user-message',
      scenario.refinedPrompt
    );
    messageHandler.appendToChatBox(refinedMessage);

    // Show refined response
    const responseMessage = messageHandler.createMessageElement(
      'ai-message',
      scenario.refinedResponse
    );
    messageHandler.appendToChatBox(responseMessage);
  }

  /**
   * Handle unrefined prompt
   * @param {Object} scenario - Scenario to check for bias
   */
  handleUnrefinedPrompt(scenario) {
    const messageRow = document.createElement('div');
    messageRow.className = 'message-row';

    // Show response
    const responseMessage = messageHandler.createMessageElement(
      'ai-message',
      scenario.response
    );
    messageRow.appendChild(responseMessage);

    // Show visualization
    const visualization = this.visualizer.visualizeBias(scenario.input, scenario.bias);
    messageRow.appendChild(visualization);

    messageHandler.appendToChatBox(messageRow);
  }
}

export const biasChecker = new BiasChecker(); 