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

    // Create nodes in a V shape
    const angleStep = Math.PI / (biases.length + 1);
    const radius = 100;
    
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

    this.renderMap();
  }

  renderMap() {
    // Update links
    const links = this.svg.selectAll(".link")
      .data(this.edges)
      .join("line")
      .attr("class", "bias-map-link");

    // Update nodes
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
      .attr("class", d => `bias-map-circle ${d.type}`);

    // Add labels to nodes
    nodes.append("text")
      .text(d => d.label)
      .attr("class", "bias-map-label")
      .attr("dy", ".35em");

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
                        <button class="edit-button" onclick="this.closest('.bias-map-tooltip').dataset.editing='true'">Edit</button>
                        <button class="tips-button">Tips</button>
                    </div>
                    <div class="edit-suggestion">
                        Suggestion: ${d.suggestion}
                    </div>
                </div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");

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
            if (this.activeNode === d) {
                this.hideTooltip();
                this.activeNode = null;
            } else {
                this.activeNode = d;
            }
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
} 