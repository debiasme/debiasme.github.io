import { stateManager } from './stateManager';

class MessageHandler {
  createMessageElement(className: string, content: string): HTMLElement | null {
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

  private sanitizeContent(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  appendToChatBox(element: HTMLElement): void {
    try {
      const chatBox = document.getElementById("chat-box");
      if (!chatBox) throw new Error('Chat box not found');

      chatBox.appendChild(element);
      chatBox.scrollTop = chatBox.scrollHeight;

      const messages = stateManager.getState('messages');
      stateManager.setState('messages', [...messages, element.textContent || '']);
    } catch (error) {
      console.error('Error appending message:', error);
      stateManager.setState('error', 'Failed to send message');
    }
  }
}

export const messageHandler = new MessageHandler(); 