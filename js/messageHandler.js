import { stateManager } from './stateManager.js';

/**
 * Message handling utilities
 */
class MessageHandler {
  /**
   * Create a new message element
   * @param {string} className - CSS class for the message
   * @param {string} content - Message content
   * @returns {HTMLElement} Created message element
   */
  createMessageElement(className, content) {
    try {
      const element = document.createElement("div");
      element.className = className;
      element.innerHTML = `
        <div class="message-content animate-fade-in">
          ${this.sanitizeContent(content)}
        </div>`;

      if (className === 'ai-message' || className === 'user-message') {
        const row = document.createElement('div');
        row.className = 'message-row';
        row.appendChild(element);
        return row;
      }
      return element;
    } catch (error) {
      console.error('Error creating message element:', error);
      stateManager.setState('error', 'Failed to create message');
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

export const messageHandler = new MessageHandler(); 