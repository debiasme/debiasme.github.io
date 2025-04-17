export class BiasVisualizer {
  constructor() {
    this.tooltipTimeout = null;
    this.activeHierarchyMap = new Map(); // To track active hierarchies
  }

  highlightBiases(text, biases, inputElement) {
    const container = document.createElement("div");
    container.className = "bias-text-container";

    let lastIndex = 0;
    let htmlContent = "";

    // Sort biases by their position in text to handle overlapping highlights
    biases.sort((a, b) => text.indexOf(a.phrase) - text.indexOf(b.phrase));

    // Highlight all biases immediately
    biases.forEach((bias) => {
      const index = text.indexOf(bias.phrase, lastIndex);
      if (index === -1) return;

      // Add text before the bias
      htmlContent += this.escapeHtml(text.substring(lastIndex, index));

      // Extract hierarchy from bias data
      let hierarchy = bias.hierarchy || {};
      let hierarchyDisplay = "";

      if (hierarchy.category && hierarchy.subcategory && hierarchy.type) {
        hierarchyDisplay = `${hierarchy.category}: ${hierarchy.subcategory}: ${hierarchy.type}`;

        // Add to the active hierarchy map for visualization coordination
        const hierarchyKey =
          `${hierarchy.category}-${hierarchy.subcategory}-${hierarchy.type}`
            .toLowerCase()
            .replace(/\s+/g, "-");
        this.activeHierarchyMap.set(hierarchyKey, bias);
      } else if (bias.type) {
        hierarchyDisplay = bias.type;
      }

      // Add highlighted bias with active class by default
      htmlContent += `<span 
        class="bias-highlight active" 
        data-bias-type="${hierarchyDisplay}"
        data-category="${hierarchy.category || ""}"
        data-subcategory="${hierarchy.subcategory || ""}"
        data-bias-type-specific="${hierarchy.type || ""}"
        data-suggestion="${bias.suggestion}"
        data-original="${bias.phrase}"
        data-hierarchy-key="${this.createHierarchyKey(hierarchy)}"
      >
        ${this.escapeHtml(bias.phrase)}
        <div class="bias-tooltip">
          <strong>${hierarchyDisplay}</strong><br>
          <div class="bias-tooltip-buttons">
            <button class="edit-button">Edit</button>
            <button class="tips-button">Tips</button>
          </div>
          <div class="edit-suggestion" style="display: none;">
            Suggestion: ${bias.suggestion}
            <button class="confirm-edit">Confirm Edit</button>
          </div>
        </div>
      </span>`;

      lastIndex = index + bias.phrase.length;
    });

    // Add remaining text
    htmlContent += this.escapeHtml(text.substring(lastIndex));
    container.innerHTML = htmlContent;

    if (inputElement) {
      inputElement.value = text;
    }

    // Add event listeners for tooltips and buttons
    this.addTooltipEventListeners(container, inputElement);

    return container;
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

  addTooltipEventListeners(container, inputElement) {
    container.querySelectorAll(".bias-highlight").forEach((highlight) => {
      const tooltip = highlight.querySelector(".bias-tooltip");
      const editButton = tooltip.querySelector(".edit-button");
      const tipsButton = tooltip.querySelector(".tips-button");
      const editSuggestion = tooltip.querySelector(".edit-suggestion");
      const confirmEdit = tooltip.querySelector(".confirm-edit");

      // Show tooltip on hover
      highlight.addEventListener("mouseenter", () => {
        tooltip.style.display = "block";

        // Highlight corresponding node in the bias map
        const hierarchyKey = highlight.dataset.hierarchyKey;
        if (hierarchyKey) {
          this.highlightMapNode(hierarchyKey);
        }
      });

      highlight.addEventListener("mouseleave", (e) => {
        if (!e.relatedTarget || !tooltip.contains(e.relatedTarget)) {
          tooltip.style.display = "none";
          this.resetMapHighlighting();
        }
      });

      tooltip.addEventListener("mouseenter", () => {
        tooltip.style.display = "block";
      });

      tooltip.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
        this.resetMapHighlighting();
      });

      // Button handlers
      editButton.addEventListener("click", (e) => {
        e.stopPropagation();
        editSuggestion.style.display = "block";
      });

      confirmEdit.addEventListener("click", (e) => {
        e.stopPropagation();
        const originalText = highlight.dataset.original;
        const suggestionText = highlight.dataset.suggestion;

        if (inputElement) {
          // Preserve the surrounding text structure
          const fullText = inputElement.value;
          const beforePhrase = fullText.substring(
            0,
            fullText.indexOf(originalText)
          );
          const afterPhrase = fullText.substring(
            fullText.indexOf(originalText) + originalText.length
          );

          // Replace only the biased phrase while maintaining surrounding text
          inputElement.value = beforePhrase + suggestionText + afterPhrase;
        }

        highlight.textContent = suggestionText;
        highlight.dataset.original = suggestionText;
        tooltip.style.display = "none";
      });

      tipsButton.addEventListener("click", (e) => {
        e.stopPropagation();

        // Get hierarchy data from dataset
        const category = highlight.dataset.category || "";
        const subcategory = highlight.dataset.subcategory || "";
        const type = highlight.dataset.biasTypeSpecific || "";

        let title = "Bias Detected";
        if (category && subcategory && type) {
          title = `${category}: ${subcategory}: ${type} Bias`;
        } else {
          title = `${highlight.dataset.biasType} Bias Detected`;
        }

        this.showDialog(
          title,
          `<p>This phrase shows bias:</p>
           <p class="bias-phrase">"${highlight.dataset.original}"</p>
           <p>Suggestion to improve:</p>
           <p>${highlight.dataset.suggestion}</p>
           <p><strong>Bias Type:</strong> ${highlight.dataset.biasType}</p>`,
          [{ text: "Got it", type: "primary" }]
        );
      });
    });
  }

  // Method to highlight the corresponding node in the bias map
  highlightMapNode(hierarchyKey) {
    // Dispatch a custom event that the BiasMap component can listen for
    const event = new CustomEvent("highlight-bias-node", {
      detail: { hierarchyKey: hierarchyKey },
    });
    document.dispatchEvent(event);
  }

  // Method to reset map highlighting
  resetMapHighlighting() {
    const event = new CustomEvent("reset-bias-map-highlights");
    document.dispatchEvent(event);
  }

  showDialog(title, content, buttons) {
    const overlay = document.createElement("div");
    overlay.className = "bias-dialog-overlay";

    const dialog = document.createElement("div");
    dialog.className = "bias-dialog";
    dialog.innerHTML = `
      <div class="bias-dialog-header">${title}</div>
      <div class="bias-dialog-content">${content}</div>
      <div class="bias-dialog-buttons"></div>
    `;

    const buttonContainer = dialog.querySelector(".bias-dialog-buttons");
    buttons.forEach((button) => {
      const btn = document.createElement("button");
      btn.className = `bias-dialog-button ${button.type || "secondary"}`;
      btn.textContent = button.text;
      btn.onclick = () => {
        overlay.remove();
        dialog.remove();
        button.onClick?.();
      };
      buttonContainer.appendChild(btn);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  validateReplacement(original, suggestion, context) {
    // Basic validation rules
    const preservesCapitalization =
      (original[0] === original[0].toUpperCase()) ===
      (suggestion[0] === suggestion[0].toUpperCase());

    const preservesEndPunctuation =
      original.slice(-1).match(/[.!?]/) === suggestion.slice(-1).match(/[.!?]/);

    // Count words to ensure similar structure
    const originalWords = original.trim().split(/\s+/).length;
    const suggestionWords = suggestion.trim().split(/\s+/).length;
    const similarLength = Math.abs(originalWords - suggestionWords) <= 1;

    return preservesCapitalization && preservesEndPunctuation && similarLength;
  }
}
