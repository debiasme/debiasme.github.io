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

    // Create tooltip
    this.tooltipDiv = d3.select("body").append("div")
        .attr("class", "bias-map-tooltip")
        .style("opacity", 0)
        .style("pointer-events", "none");

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

    // Add hover interactions
    nodes.on("mouseover", (event, d) => {
        if (d.type === "bias") {
            // Remove previous highlights
            if (this.messageContent) {
                this.messageContent.querySelectorAll('.bias-highlight').forEach(el => {
                    el.classList.remove('active');
                });
            }

            // Show tooltip
            this.tooltipDiv
                .transition()
                .duration(200)
                .style("opacity", 1);
            
            this.tooltipDiv.html(`
                <div class="bias-map-tooltip-content">
                    <h3>${d.label}</h3>
                    <p class="bias-phrase">"${d.phrase}"</p>
                    <div class="bias-tooltip-buttons">
                        <button class="edit-button" onclick="event.stopPropagation()">Edit</button>
                        <button class="tips-button" onclick="event.stopPropagation()">Tips</button>
                    </div>
                    <div class="edit-suggestion">
                        Suggestion: ${d.suggestion}
                    </div>
                </div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");

            // Add click handlers directly to the buttons
            this.tooltipDiv.select(".edit-button")
                .on("click", () => {
                    event.stopPropagation();
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

            this.tooltipDiv.select(".tips-button")
                .on("click", () => {
                    event.stopPropagation();
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
} 