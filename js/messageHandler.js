import { stateManager } from "./stateManager.js";
import { BiasMap } from "./biasMap.js";
import { BiasChecker } from "./biasChecker.js";

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
      console.log("Creating message element:", {
        className,
        contentLength: content.length,
        hasBiases: biases && biases.length > 0,
        numberOfBiases: biases?.length,
        biasData: biases, // Add this for debugging
      });

      const element = document.createElement("div");
      element.className = className;

      const messageContent = document.createElement("div");
      messageContent.className = "message-content animate-fade-in";
      messageContent.innerHTML = this.sanitizeContent(content);
      element.appendChild(messageContent);

      if (biases && biases.length > 0) {
        console.log("Creating bias map with biases:", biases);

        const cleanedBiases = biases.map((bias) => ({
          ...bias,
          type: this.cleanBiasType(bias.type),
        }));

        const biasMap = this.createBiasMap(cleanedBiases);

        // Connect the message content with the bias map
        biasMap.setMessageContent(messageContent);

        // Add all bias phrases as highlights with more data attributes
        cleanedBiases.forEach((bias) => {
          const phrase = bias.phrase;
          const hierarchyKey = this.createHierarchyKey(bias.hierarchy || {});

          // Use a safer regex replacement approach
          const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(escapedPhrase, "g");

          messageContent.innerHTML = messageContent.innerHTML.replace(
            regex,
            `<span class="bias-highlight" 
              data-bias-type="${bias.type}"
              data-original="${phrase}"
              data-hierarchy-key="${hierarchyKey}">
                ${phrase}
            </span>`
          );
        });

        // Add event listeners to the message content to handle text-to-graph highlighting
        messageContent.addEventListener("mouseenter", (e) => {
          const biasHighlight = e.target.closest(".bias-highlight");
          if (biasHighlight) {
            biasHighlight.classList.add("active");
            const hierarchyKey = biasHighlight.dataset.hierarchyKey;
            if (hierarchyKey) {
              // Dispatch event to highlight corresponding node
              document.dispatchEvent(
                new CustomEvent("highlight-bias-node", {
                  detail: { hierarchyKey },
                })
              );
            }
          }
        });

        messageContent.addEventListener("mouseleave", (e) => {
          const biasHighlight = e.target.closest(".bias-highlight");
          if (biasHighlight && !e.relatedTarget?.closest(".bias-tooltip")) {
            biasHighlight.classList.remove("active");
            // Reset graph highlighting
            document.dispatchEvent(
              new CustomEvent("reset-bias-map-highlights")
            );
          }
        });
      }

      if (className === "ai-message" || className === "user-message") {
        const row = document.createElement("div");
        row.className = "message-row";
        row.appendChild(element);
        return row;
      }
      return element;
    } catch (error) {
      console.error("Error creating message element:", error);
      return null;
    }
  }

  /**
   * Create and display the bias map
   * @param {Array} biases - Array of biases
   * @returns {BiasMap} Created bias map instance
   */
  createBiasMap(biases) {
    console.log("Creating bias map with:", biases);

    // Check if container exists
    const mapContainer = document.querySelector(".bias-map-container");
    if (!mapContainer) {
      console.error("Bias map container is missing!");
      // Create container if missing
      const newContainer = document.createElement("div");
      newContainer.className = "bias-map-container";
      document.querySelector(".message-row").appendChild(newContainer);
    }

    // Check container dimensions
    const container = document.querySelector(".bias-map-container");
    console.log(
      "Map container dimensions:",
      container.clientWidth,
      "x",
      container.clientHeight
    );

    // Create map instance
    const biasMap = new BiasMap(container);
    biasMap.updateMap(biases);

    return biasMap;
  }

  /**
   * Sanitize message content
   * @param {string} content - Raw content
   * @returns {string} Sanitized content
   */
  sanitizeContent(content) {
    // Basic XSS prevention
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Append message to chat box
   * @param {HTMLElement} element - Message element to append
   */
  appendToChatBox(element) {
    try {
      const chatBox = document.getElementById("chat-box");
      if (!chatBox) throw new Error("Chat box not found");

      chatBox.appendChild(element);
      chatBox.scrollTop = chatBox.scrollHeight;

      // Update state
      const messages = stateManager.getState("messages");
      stateManager.setState("messages", [...messages, element.textContent]);
    } catch (error) {
      console.error("Error appending message:", error);
      stateManager.setState("error", "Failed to send message");
    }
  }

  cleanBiasType(type) {
    return type
      .replace(/\s*Bias\s*Bias$/i, " Bias")
      .replace(/^Bias\s*Bias\s*/i, "Bias ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Helper method to create a consistent hierarchy key
  createHierarchyKey(hierarchy) {
    if (!hierarchy || !hierarchy.category) return "";
    return `${hierarchy.category}-${hierarchy.subcategory || "general"}-${
      hierarchy.type || "general"
    }`
      .toLowerCase()
      .replace(/\s+/g, "-");
  }
}

// This import isn't being used in the actual API calls
const systemPrompt = BiasChecker.systemPrompt;

export const messageHandler = new MessageHandler();
