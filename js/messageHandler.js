import { stateManager } from "./stateManager.js";
import { BiasMap } from "./biasMap.js";
import { BiasChecker } from "./biasChecker.js";

/**
 * Message handling utilities
 */
class MessageHandler {
  constructor() {
    // Existing code...
    this.biasMaps = []; // Array to track all created maps
  }

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
        biasData: biases,
      });

      // Create the message row with a 2-column layout
      const row = document.createElement("div");
      row.className = "message-row";

      // Create left and right columns
      const leftColumn = document.createElement("div");
      leftColumn.className = "message-left-column";

      const rightColumn = document.createElement("div");
      rightColumn.className = "message-right-column";

      // Add both columns to the row
      row.appendChild(leftColumn);
      row.appendChild(rightColumn);

      // Create the actual message bubble
      const element = document.createElement("div");
      element.className = className;

      const messageContent = document.createElement("div");
      messageContent.className = "message-content animate-fade-in";
      messageContent.innerHTML = this.sanitizeContent(content);
      element.appendChild(messageContent);

      // Place the message in the appropriate column based on type
      if (className === "user-message") {
        rightColumn.appendChild(element);
      } else {
        leftColumn.appendChild(element);
      }

      // Store message type as a data attribute for later reference
      row.dataset.messageType = className;

      if (biases && biases.length > 0) {
        console.log("Creating bias map with biases:", biases);

        const cleanedBiases = biases.map((bias) => ({
          ...bias,
          type: this.cleanBiasType(bias.type),
        }));

        // Create the bias map - this will be positioned by createBiasMap
        const biasMap = this.createBiasMap(cleanedBiases, row);

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

      return row;
    } catch (error) {
      console.error("Error creating message element:", error);
      return null;
    }
  }

  /**
   * Create and display the bias map
   * @param {Array} biases - Array of biases
   * @param {HTMLElement} row - Message row element
   * @returns {BiasMap} Created bias map instance
   */
  createBiasMap(biases, row) {
    console.log("Creating bias map with:", biases);

    // Create a new unique container for each map
    const newContainer = document.createElement("div");
    newContainer.className = "bias-map-container";
    newContainer.id = `bias-map-${Date.now()}`; // Add unique ID using timestamp

    // Append to the provided message row
    if (row) {
      row.appendChild(newContainer);
    } else {
      console.error("Message row is missing!");
      document.querySelector(".message-container").appendChild(newContainer); // Fallback
    }

    // Add title AFTER container is in the DOM
    const mapTitle = document.createElement("div");
    mapTitle.className = "bias-map-title";
    mapTitle.textContent = `Bias Map - ${new Date().toLocaleTimeString()}`;
    newContainer.prepend(mapTitle);

    // Check container dimensions
    console.log(
      "Map container dimensions:",
      newContainer.clientWidth,
      "x",
      newContainer.clientHeight
    );

    // Create map instance with the new container
    const biasMap = new BiasMap(newContainer);
    biasMap.updateMap(biases);

    this.biasMaps.push(biasMap);

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
