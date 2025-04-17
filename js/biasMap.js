export class BiasMap {
  constructor(container) {
    this.container = container;
    this.nodes = [];
    this.edges = [];
    this.simulation = null;
    this.svg = null;
    this.tooltipDiv = null;
    this.activeNode = null;
    this.messageContent = null;
    this.initializeMap();
  }

  initializeMap() {
    this.svg = d3.create("svg")
        .attr("class", "bias-map")
        .attr("viewBox", [-20, -20, 540, 340]);

    // Create tooltip with pointer events enabled
    this.tooltipDiv = d3.select("body").append("div")
        .attr("class", "bias-map-tooltip")
        .style("opacity", 0)
        .style("pointer-events", "auto");  // Enable interaction with tooltip

    this.container.appendChild(this.svg.node());

    // Initialize force simulation
    this.simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-50))
        .force("center", d3.forceCenter(250, 100))
        .on("tick", () => this.ticked());
  }

  updateMap(biases) {
    this.nodes = [];
    this.edges = [];

    // Create central node
    const centralNode = { 
        id: "message", 
        type: "center", 
        label: "Biases",
        fx: 250,
        fy: 100
    };
    this.nodes.push(centralNode);

    // Adjust spacing based on screen size
    const isMobile = window.innerWidth <= 768;
    const radius = isMobile ? 70 : 100;
    const angleStep = Math.PI / (biases.length + 1);
    
    biases.forEach((bias, index) => {
        const angle = Math.PI / 2 + angleStep * (index + 1);
        const x = 250 + radius * Math.cos(angle);
        const y = 100 + radius * Math.sin(angle);
        
        const biasNode = {
            id: `bias-${index}`,
            type: "bias",
            label: bias.type,
            phrase: bias.phrase,
            suggestion: bias.suggestion,
            fx: isMobile ? x : undefined,
            fy: isMobile ? y : undefined,
            x: x,
            y: y
        };
        this.nodes.push(biasNode);
        this.edges.push({
            source: "message",
            target: biasNode.id,
            value: 1
        });
    });

    // Adjust simulation forces for mobile
    if (isMobile) {
        this.simulation
            .force("charge", d3.forceManyBody().strength(-30))
            .force("link", d3.forceLink().id(d => d.id).distance(50));
    }

    this.renderMap();
  }

  renderMap() {
    // Update links
    const links = this.svg.selectAll(".link")
      .data(this.edges)
      .join("line")
      .attr("class", "bias-map-link");

    // Update nodes with p5.js style
    const nodes = this.svg.selectAll(".node")
      .data(this.nodes)
      .join("g")
      .attr("class", "bias-map-node")
      .call(d3.drag()
        .on("start", this.dragstarted.bind(this))
        .on("drag", this.dragged.bind(this))
        .on("end", this.dragended.bind(this)));

    // Clear existing circles and labels
    nodes.selectAll("*").remove();

    // Add circles to nodes
    nodes.append("circle")
      .attr("class", d => `bias-map-circle ${d.type}`)
      .attr("r", d => d.type === "center" ? 12 : 10)
      .style("fill", d => d.type === "center" ? "#6366f1" : "#ef4444");

    // Add labels to nodes
    nodes.append("text")
      .text(d => d.label)
      .attr("class", "bias-map-label")
      .attr("dy", ".35em");

    // Add glow effect
    nodes.append("circle")
      .attr("class", "glow")
      .attr("r", d => d.type === "center" ? 14 : 12)
      .style("fill", "none")
      .style("stroke", d => d.type === "center" ? "#6366f1" : "#ef4444")
      .style("stroke-width", "2px")
      .style("stroke-opacity", "0.3")
      .style("filter", "blur(4px)");

    // Update hover interactions
    nodes.on("mouseover", (event, d) => {
        if (d.type === "bias") {
            // Remove previous highlights
            if (this.messageContent) {
                this.messageContent.querySelectorAll('.bias-highlight').forEach(el => {
                    el.classList.remove('active');
                });
            }

            // Position and show tooltip
            const tooltipX = event.pageX + 10;
            const tooltipY = event.pageY - 10;
            
            this.tooltipDiv
                .style("left", tooltipX + "px")
                .style("top", tooltipY + "px")
                .style("opacity", 1)
                .html(`
                    <div class="bias-map-tooltip-content">
                        <h3>${d.label}</h3>
                        <p class="bias-phrase">"${d.phrase}"</p>
                        <div class="bias-tooltip-buttons">
                            <button class="tips-button" onclick="event.stopPropagation()">Explore More</button>
                        </div>
                    </div>
                `);

            // Update click handler with detailed explanations
            this.tooltipDiv.select(".tips-button")
                .on("click", () => {
                    event.stopPropagation();
                    const explanation = this.getBiasExplanation(d.label);
                    this.showDialog(
                        `Understanding ${d.label}`,
                        `
                        <div class="bias-explanation">
                            <p><strong>Identified phrase:</strong></p>
                            <p class="bias-phrase">"${d.phrase}"</p>
                            
                            <p><strong>What is this bias?</strong></p>
                            ${explanation.what}
                            
                            <p><strong>Why is it problematic?</strong></p>
                            ${explanation.why}
                        </div>
                        `,
                        [{ text: "Got it", type: "primary" }]
                    );
                });

            // Highlight corresponding text
            if (this.messageContent) {
                const highlightElements = this.messageContent.querySelectorAll('.bias-highlight');
                highlightElements.forEach(el => {
                    if (el.textContent === d.phrase) {
                        el.classList.add('active');
                    }
                });
            }

            this.activeNode = d;
        }
    });

    // Remove mouseout handler to keep tooltip visible
    nodes.on("mouseout", null);

    // Handle clicks for persistent tooltips
    nodes.on("click", (event, d) => {
        if (d.type === "bias") {
            event.stopPropagation();
            const tooltipContent = this.tooltipDiv.select(".bias-map-tooltip-content");
            
            // Handle Edit button click
            tooltipContent.select(".edit-button").on("click", () => {
                this.showDialog(
                    "Edit Suggestion",
                    `<p>Original: "${d.phrase}"</p>
                     <p>Suggested: "${d.suggestion}"</p>`,
                    [
                        {
                            text: "Apply Change",
                            type: "primary",
                            onClick: () => this.applyEdit(d)
                        },
                        {
                            text: "Cancel",
                            type: "secondary"
                        }
                    ]
                );
            });

            // Handle Tips button click
            tooltipContent.select(".tips-button").on("click", () => {
                this.showDialog(
                    `${d.label} Bias Detected`,
                    `<p>This phrase shows ${d.label.toLowerCase()} bias:</p>
                     <p class="bias-phrase">"${d.phrase}"</p>
                     <p>Suggestion to improve:</p>
                     <p>${d.suggestion}</p>`,
                    [
                        {
                            text: "Got it",
                            type: "primary"
                        }
                    ]
                );
            });
        }
    });

    // Add document click handler to close tooltip
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.bias-map-tooltip') && 
            !event.target.closest('.bias-map-node')) {
            this.hideTooltip();
            this.activeNode = null;
        }
    });

    // Update simulation
    this.simulation
      .nodes(this.nodes)
      .force("link").links(this.edges);

    this.simulation.alpha(1).restart();
  }

  // D3 force simulation handlers
  dragstarted(event) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  dragended(event) {
    if (!event.active) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  ticked() {
    this.svg.selectAll(".bias-map-link")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    this.svg.selectAll(".bias-map-node")
      .attr("transform", d => `translate(${d.x},${d.y})`);
  }

  hideTooltip() {
    this.tooltipDiv.transition()
        .duration(500)
        .style("opacity", 0);
    
    // Remove highlights
    if (this.messageContent) {
        this.messageContent.querySelectorAll('.bias-highlight').forEach(el => {
            el.classList.remove('active');
        });
    }
  }

  setMessageContent(element) {
    this.messageContent = element;
  }

  showDialog(title, content, buttons) {
    // Remove any existing dialog
    this.hideDialog();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'bias-dialog-overlay';
    document.body.appendChild(overlay);

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'bias-dialog';
    dialog.innerHTML = `
        <div class="bias-dialog-header">${title}</div>
        <div class="bias-dialog-content">${content}</div>
        <div class="bias-dialog-buttons"></div>
    `;

    // Add buttons
    const buttonContainer = dialog.querySelector('.bias-dialog-buttons');
    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.className = `bias-dialog-button ${button.type || 'secondary'}`;
        btn.textContent = button.text;
        btn.onclick = () => {
            this.hideDialog();
            button.onClick?.();
        };
        buttonContainer.appendChild(btn);
    });

    document.body.appendChild(dialog);
  }

  hideDialog() {
    const overlay = document.querySelector('.bias-dialog-overlay');
    const dialog = document.querySelector('.bias-dialog');
    if (overlay) overlay.remove();
    if (dialog) dialog.remove();
  }

  applyEdit(node) {
    if (this.messageContent) {
        const highlightElements = this.messageContent.querySelectorAll('.bias-highlight');
        highlightElements.forEach(el => {
            if (el.textContent === node.phrase) {
                el.textContent = node.suggestion;
                el.classList.remove('active');
            }
        });
    }
    this.hideTooltip();
  }

  // Add method to get detailed bias explanations
  getBiasExplanation(biasType) {
    const explanations = {
        'Bias: Gender': {
            what: `
                <p>Gender bias occurs when assumptions, prejudices, or stereotypes are applied 
                based on gender. This includes generalizing capabilities, traits, or roles 
                based on someone's gender identity.</p>
            `,
            why: `
                <p>This type of bias can:</p>
                <ul>
                    <li>Perpetuate harmful stereotypes</li>
                    <li>Limit opportunities based on gender</li>
                    <li>Create unfair expectations and standards</li>
                    <li>Ignore individual capabilities and qualities</li>
                </ul>
            `
        },
        'Bias: Age': {
            what: `
                <p>Age bias involves making assumptions about people's abilities, behaviors, 
                or characteristics based solely on their age. This can affect both younger 
                and older individuals.</p>
            `,
            why: `
                <p>This type of bias can:</p>
                <ul>
                    <li>Lead to discrimination in various settings</li>
                    <li>Overlook valuable experience or fresh perspectives</li>
                    <li>Create artificial barriers to participation</li>
                    <li>Disregard individual capabilities and potential</li>
                </ul>
            `
        },
        'Bias: Generalization': {
            what: `
                <p>Generalization bias occurs when broad, sweeping statements are made about 
                entire groups of people, situations, or phenomena without accounting for 
                individual differences or specific contexts.</p>
            `,
            why: `
                <p>This type of bias can:</p>
                <ul>
                    <li>Oversimplify complex realities</li>
                    <li>Lead to stereotyping and prejudice</li>
                    <li>Ignore important individual differences</li>
                    <li>Result in unfair treatment or judgment</li>
                </ul>
            `
        },
        'Bias: Cultural': {
            what: `
                <p>Cultural bias involves judging other cultures based on the standards 
                and values of one's own culture, or making assumptions about other cultures 
                based on limited understanding.</p>
            `,
            why: `
                <p>This type of bias can:</p>
                <ul>
                    <li>Lead to misunderstandings and conflicts</li>
                    <li>Promote ethnocentric viewpoints</li>
                    <li>Disregard cultural diversity and values</li>
                    <li>Create barriers to inclusive communication</li>
                </ul>
            `
        }
        // Add more bias types as needed
    };

    // Extract the bias type from the format "Bias: Type"
    const type = biasType.split(': ')[1];
    
    return explanations[biasType] || {
        what: `
            <p>This type of bias involves making assumptions or judgments that may 
            unfairly influence perceptions or decisions based on ${type.toLowerCase()}.</p>
        `,
        why: `
            <p>This can be problematic because it:</p>
            <ul>
                <li>May lead to unfair treatment or judgment</li>
                <li>Can perpetuate stereotypes and prejudices</li>
                <li>Often overlooks individual circumstances</li>
                <li>May result in missed opportunities or misunderstandings</li>
            </ul>
        `
    };
  }
} 