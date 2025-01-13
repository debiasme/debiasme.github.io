export class BiasVisualizer {
  constructor() {
    this.tooltipTimeout = null;
  }

  highlightBiases(text, biases, inputElement) {
    const container = document.createElement('div');
    container.className = 'bias-text-container';
    
    let lastIndex = 0;
    let htmlContent = '';

    biases.sort((a, b) => text.indexOf(a.phrase) - text.indexOf(b.phrase));

    biases.forEach(bias => {
      const index = text.indexOf(bias.phrase, lastIndex);
      if (index === -1) return;

      htmlContent += this.escapeHtml(text.substring(lastIndex, index));

      htmlContent += `<span 
        class="bias-highlight" 
        data-bias-type="${bias.type}"
        data-suggestion="${bias.suggestion}"
        data-original="${bias.phrase}"
      >
        ${this.escapeHtml(bias.phrase)}
        <div class="bias-tooltip">
          <strong>${bias.type} Bias</strong><br>
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

    htmlContent += this.escapeHtml(text.substring(lastIndex));
    container.innerHTML = htmlContent;
    
    // Store the original text in the input
    if (inputElement) {
      inputElement.value = text;
    }
    
    // Add event listeners for the new buttons
    this.addTooltipEventListeners(container, inputElement);
    
    return container;
  }

  addTooltipEventListeners(container, inputElement) {
    container.querySelectorAll('.bias-highlight').forEach(highlight => {
      const tooltip = highlight.querySelector('.bias-tooltip');
      const editButton = tooltip.querySelector('.edit-button');
      const tipsButton = tooltip.querySelector('.tips-button');
      const editSuggestion = tooltip.querySelector('.edit-suggestion');
      const confirmEdit = tooltip.querySelector('.confirm-edit');

      let isTooltipVisible = false;

      // Show tooltip on hover
      highlight.addEventListener('mouseenter', () => {
        isTooltipVisible = true;
        highlight.classList.add('active');
      });

      // Add event listeners to the tooltip itself
      tooltip.addEventListener('mouseenter', () => {
        isTooltipVisible = true;
        highlight.classList.add('active');
      });

      // Only hide when mouse leaves both highlight and tooltip
      highlight.addEventListener('mouseleave', (e) => {
        // Check if we're moving to the tooltip
        if (e.relatedTarget === tooltip || tooltip.contains(e.relatedTarget)) {
          return;
        }
        
        // Small delay to check if mouse moved to tooltip
        setTimeout(() => {
          if (!isTooltipVisible) {
            highlight.classList.remove('active');
          }
        }, 100);
      });

      tooltip.addEventListener('mouseleave', (e) => {
        // Check if we're moving back to the highlight
        if (e.relatedTarget === highlight || highlight.contains(e.relatedTarget)) {
          return;
        }
        
        isTooltipVisible = false;
        // Small delay to check if mouse moved back to highlight
        setTimeout(() => {
          if (!isTooltipVisible) {
            highlight.classList.remove('active');
          }
        }, 100);
      });

      editButton.addEventListener('click', (e) => {
        e.stopPropagation();
        editSuggestion.style.display = 'block';
      });

      confirmEdit.addEventListener('click', (e) => {
        e.stopPropagation();
        const originalText = highlight.dataset.original;
        const suggestionText = highlight.dataset.suggestion;
        const currentValue = inputElement.value;
        
        inputElement.value = currentValue.replace(originalText, suggestionText);
        
        // Update the highlighted text and hide tooltip
        highlight.innerHTML = this.escapeHtml(suggestionText);
        highlight.dataset.original = suggestionText;
        highlight.classList.remove('active');
        isTooltipVisible = false;
      });

      tipsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        alert(`Tips for avoiding ${highlight.dataset.biasType} bias:\n${highlight.dataset.suggestion}`);
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
} 