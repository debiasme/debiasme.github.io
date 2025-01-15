export class UserGuide {
    constructor() {
        localStorage.removeItem('hasSeenGuide');
        this.hasSeenGuide = localStorage.getItem('hasSeenGuide');
        this.isSkipped = false;
        this.steps = [
            {
                target: '#user-select',
                content: 'You can select a predefined example or type your own prompt in the input box below',
                position: 'bottom',
                action: 'any-input',
                skipable: true
            },
            {
                target: '#detect-bias-button',
                content: 'Click "Detect Bias" to analyze your message',
                position: 'top',
                action: 'click',
                skipable: true
            },
            {
                target: '.highlight-container',
                content: 'Hover over any highlighted phrase to see the tooltip. Then click "Tips" to learn about the bias type, or "Edit" to see suggested improvements',
                position: 'bottom',
                action: 'hover-and-click',
                skipable: true
            },
            {
                target: '#send-button',
                content: 'Click Send to get your response with bias analysis. You may also just click "Send" to get a bias visualisation map of the response without detecting bias in prompt.',
                position: 'top',
                action: 'click',
                skipable: true
            }
        ];
        this.currentStep = 0;
    }

    show() {
        console.log('show() called');  // Debug log
        if (this.hasSeenGuide) {
            console.log('Guide already seen, returning');  // Debug log
            return;
        }
        this.showWelcomeModal();
    }

    showWelcomeModal() {
        console.log('showWelcomeModal() called');
        const modal = document.createElement('div');
        modal.className = 'guide-modal';
        modal.innerHTML = `
            <div class="guide-content">
                <div class="guide-header">
                    <h2>Welcome to Aye-Eye! 👋</h2>
                    <a href="#" class="guide-skip-link">
                        <span>Skip tutorial</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                </div>
                <div class="guide-steps">
                    ${this.steps.map((step, index) => `
                        <div class="guide-step">
                            <span class="step-number">${index + 1}</span>
                            <p>${step.content}</p>
                        </div>
                    `).join('')}
                </div>
                <button class="guide-start-button">Start Tour</button>
            </div>
        `;

        document.body.appendChild(modal);

        const startButton = modal.querySelector('.guide-start-button');
        const skipLink = modal.querySelector('.guide-skip-link');

        startButton.addEventListener('click', () => {
            modal.classList.add('fade-out');
            setTimeout(() => {
                modal.remove();
                this.startTour();
            }, 300);
        });

        skipLink.addEventListener('click', () => {
            modal.classList.add('fade-out');
            this.isSkipped = true;
            setTimeout(() => {
                modal.remove();
                localStorage.setItem('hasSeenGuide', 'true');
            }, 300);
        });
    }

    startTour() {
        this.showNextStep();
    }

    showNextStep() {
        if (this.isSkipped || this.currentStep >= this.steps.length) {
            localStorage.setItem('hasSeenGuide', 'true');
            return;
        }

        const step = this.steps[this.currentStep];
        const target = document.querySelector(step.target);
        
        if (!target) {
            this.currentStep++;
            this.showNextStep();
            return;
        }

        const tooltip = this.createTooltip(step, target);
        document.body.appendChild(tooltip);
        this.positionTooltip(tooltip, target, step.position);
        this.setupStepAction(step, target, tooltip);
    }

    createTooltip(step, target) {
        const tooltip = document.createElement('div');
        tooltip.className = 'guide-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <div class="tooltip-header">
                    <p>${step.content}</p>
                    <a href="#" class="tooltip-skip-link">
                        <span>Skip tutorial</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                </div>
                <div class="tooltip-footer">
                    <div class="tooltip-progress">
                        Step ${this.currentStep + 1} of ${this.steps.length}
                    </div>
                </div>
            </div>
        `;

        const skipLink = tooltip.querySelector('.tooltip-skip-link');
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.isSkipped = true;
            tooltip.remove();
            localStorage.setItem('hasSeenGuide', 'true');
        });

        return tooltip;
    }

    positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let top, left;

        switch (position) {
            case 'top':
                top = Math.max(10, targetRect.top - tooltipRect.height - 10);
                left = Math.min(
                    viewportWidth - tooltipRect.width - 10,
                    Math.max(10, targetRect.left + (targetRect.width - tooltipRect.width) / 2)
                );
                break;
            case 'bottom':
                top = Math.min(
                    viewportHeight - tooltipRect.height - 10,
                    targetRect.bottom + 10
                );
                left = Math.min(
                    viewportWidth - tooltipRect.width - 10,
                    Math.max(10, targetRect.left + (targetRect.width - tooltipRect.width) / 2)
                );
                break;
            case 'right':
                top = Math.min(
                    viewportHeight - tooltipRect.height - 10,
                    Math.max(10, targetRect.top + (targetRect.height - tooltipRect.height) / 2)
                );
                left = Math.min(
                    viewportWidth - tooltipRect.width - 10,
                    targetRect.right + 10
                );
                break;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    setupStepAction(step, target, tooltip) {
        switch (step.action) {
            case 'any-input':
                const select = document.querySelector('#user-select');
                const input = document.querySelector('#user-input');
                
                const handleInput = () => {
                    if (select.value || input.value.trim()) {
                        this.handleStepComplete(tooltip);
                    }
                };

                select.addEventListener('change', handleInput);
                input.addEventListener('input', handleInput);
                break;

            case 'click':
                if (target.id === 'detect-bias-button') {
                    target.addEventListener('click', () => {
                        tooltip.remove();
                        
                        const checkHighlights = setInterval(() => {
                            const highlightContainer = document.querySelector('.highlight-container');
                            if (highlightContainer) {
                                clearInterval(checkHighlights);
                                this.currentStep++;
                                this.showNextStep();
                            }
                        }, 100);
                    }, { once: true });
                } else {
                    target.addEventListener('click', () => this.handleStepComplete(tooltip), { once: true });
                }
                break;

            case 'hover-and-click':
                // Create observer to watch for tooltip
                const observer = new MutationObserver((mutations, obs) => {
                    const biasTooltip = document.querySelector('.bias-tooltip');
                    if (biasTooltip) {
                        obs.disconnect();
                        
                        // Add click listeners to buttons
                        const tipsButton = document.querySelector('.tips-button');
                        const editButton = document.querySelector('.edit-button');
                        
                        const handleButtonClick = () => {
                            observer.disconnect();
                            this.handleStepComplete(tooltip);
                        };
                        
                        if (tipsButton) {
                            tipsButton.addEventListener('click', handleButtonClick, { once: true });
                        }
                        if (editButton) {
                            editButton.addEventListener('click', handleButtonClick, { once: true });
                        }
                    }
                });

                // Start observing when user hovers over highlight
                target.addEventListener('mouseover', () => {
                    observer.observe(document.body, { 
                        childList: true, 
                        subtree: true 
                    });
                }, { once: true });
                break;
        }
    }

    handleStepComplete(tooltip) {
        tooltip.remove();
        this.currentStep++;

        // If next step is step 3 (hover-and-click), wait for highlight container
        if (this.steps[this.currentStep]?.action === 'hover-and-click') {
            const checkHighlights = setInterval(() => {
                const highlightContainer = document.querySelector('.highlight-container');
                if (highlightContainer) {
                    clearInterval(checkHighlights);
                    this.showNextStep();
                }
            }, 100);
        } else {
            setTimeout(() => this.showNextStep(), 500);
        }
    }
} 