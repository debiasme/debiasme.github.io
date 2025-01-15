import { stateManager } from './stateManager.js';
import { BiasMap } from './biasMap.js';
import { BiasChecker } from './biasChecker.js';

/**
 * Message handling utilities
 */
class MessageHandler {
  /**
   * Create a new message element
   * @param {string} className - CSS class for the message
   * @param {string} content - Message content
   * @param {Array} biases - Array of biases
   * @returns {HTMLElement} Created message element
   */
  createMessageElement(className, content, biases = null) {
    try {
      console.log('Creating message element:', {
        className,
        contentLength: content.length,
        hasBiases: biases && biases.length > 0,
        numberOfBiases: biases?.length
      });

      const element = document.createElement("div");
      element.className = className;
      
      const messageContent = document.createElement("div");
      messageContent.className = "message-content animate-fade-in";
      messageContent.innerHTML = this.sanitizeContent(content);
      element.appendChild(messageContent);

      if (biases && biases.length > 0) {
        const mapContainer = document.createElement("div");
        mapContainer.className = "bias-map-container";
        element.appendChild(mapContainer);

        const biasMap = new BiasMap(mapContainer);
        biasMap.updateMap(biases);
        
        // Connect the message content with the bias map
        biasMap.setMessageContent(messageContent);

        // Add all bias phrases as highlights (initially inactive)
        biases.forEach(bias => {
          const phrase = bias.phrase;
          const regex = new RegExp(phrase, 'g');
          messageContent.innerHTML = messageContent.innerHTML.replace(
            regex,
            `<span class="bias-highlight" data-bias-type="${bias.type}">${phrase}</span>`
          );
        });
      }

      if (className === 'ai-message' || className === 'user-message') {
        const row = document.createElement('div');
        row.className = 'message-row';
        row.appendChild(element);
        return row;
      }
      return element;
    } catch (error) {
      console.error('Error creating message element:', error);
      return null;
    }
  }

  /**
   * Sanitize message content
   * @param {string} content - Raw content
   * @returns {string} Sanitized content
   */
  sanitizeContent(content) {
    // Basic XSS prevention
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Append message to chat box
   * @param {HTMLElement} element - Message element to append
   */
  appendToChatBox(element) {
    try {
      const chatBox = document.getElementById("chat-box");
      if (!chatBox) throw new Error('Chat box not found');

      chatBox.appendChild(element);
      chatBox.scrollTop = chatBox.scrollHeight;

      // Update state
      const messages = stateManager.getState('messages');
      stateManager.setState('messages', [...messages, element.textContent]);
    } catch (error) {
      console.error('Error appending message:', error);
      stateManager.setState('error', 'Failed to send message');
    }
  }
}

// Use the same system prompt for chat messages
const systemPrompt = BiasChecker.systemPrompt;

export const messageHandler = new MessageHandler(); 