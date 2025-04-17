export class BiasMap {
  constructor(container) {
    if (!container) {
      console.error("BiasMap: Container element is missing!");
      return;
    }

    // Store container reference
    this.container = container;

    // Check container dimensions
    this.width = container.clientWidth || 500; // Default width if container has no width
    this.height = container.clientHeight || 300; // Default height if container has no height

    console.log("BiasMap container dimensions:", this.width, "x", this.height);

    this.nodes = [];
    this.edges = [];

    // Check if D3 is available
    if (!window.d3) {
      console.error("D3.js is not loaded! Bias map will not work.");
      const errorMessage = document.createElement("div");
      errorMessage.textContent = "Visualization library not loaded.";
      errorMessage.style.color = "red";
      container.appendChild(errorMessage);
      return;
    }

    // Clear any existing content
    container.innerHTML = "";

    // Create SVG element with explicit dimensions
    this.svg = d3
      .select(container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("class", "bias-map")
      .style("display", "block") // Ensure it's visible
      .style("overflow", "visible");

    console.log(
      "BiasMap SVG created with dimensions:",
      this.width,
      "x",
      this.height
    );

    // Create a tooltip div
    this.tooltipDiv = d3
      .select("body")
      .append("div")
      .attr("class", "bias-map-tooltip")
      .style("opacity", 0);

    // Initialize forces for the simulation
    this.simulation = d3
      .forceSimulation()
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .on("tick", this.ticked.bind(this));

    // Listen for custom events from BiasVisualizer
    document.addEventListener(
      "highlight-bias-node",
      this.handleHighlightNode.bind(this)
    );
    document.addEventListener(
      "reset-bias-map-highlights",
      this.resetHighlights.bind(this)
    );

    // Store reference to message content for text highlighting
    this.messageContent = null;
  }

  // Set reference to message content for bidirectional highlighting
  setMessageContent(element) {
    this.messageContent = element;
  }

  // Update the bias map with new data
  updateMap(biases) {
    console.log("BiasMap.updateMap called with biases:", biases);

    // Validation checks
    if (!this.svg || !d3) {
      console.error("BiasMap: SVG or D3 not available!");
      return;
    }

    // Clear any existing content from the container
    this.container.innerHTML = "";

    // Re-create the SVG since it was removed
    this.svg = d3
      .select(this.container)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("class", "bias-map")
      .style("display", "block")
      .style("overflow", "visible");

    if (!biases || biases.length === 0) {
      console.log("No biases to display in map");
      const noDataMsg = document.createElement("div");
      noDataMsg.className = "no-bias-data";
      noDataMsg.textContent = "No bias data to visualize";
      this.container.appendChild(noDataMsg);
      return;
    }

    this.nodes = [];
    this.edges = [];
    const categories = new Map();
    const subcategories = new Map();
    const types = new Map();

    // Create central node
    const centralNode = {
      id: "biases",
      label: "Biases",
      level: 0,
      // Don't fix position - let the force layout handle it
    };
    this.nodes.push(centralNode);

    // Process biases to create hierarchy
    biases.forEach((bias, index) => {
      // Get hierarchy from bias data
      const hierarchy = bias.hierarchy || {};
      if (!hierarchy.category) {
        console.warn("Bias missing hierarchy category:", bias);
        return;
      }

      // Log processed nodes
      console.log(
        `Processing bias ${index}: ${hierarchy.category} > ${hierarchy.subcategory} > ${hierarchy.type}`
      );

      const categoryId = this.sanitizeId(hierarchy.category);
      const subcategoryId = this.sanitizeId(
        `${hierarchy.category}-${hierarchy.subcategory}`
      );
      const typeId = this.sanitizeId(
        `${hierarchy.category}-${hierarchy.subcategory}-${hierarchy.type}`
      );

      // Add category if not exists
      if (!categories.has(categoryId)) {
        const categoryNode = {
          id: categoryId,
          label: hierarchy.category,
          level: 1,
          count: 0,
        };
        categories.set(categoryId, categoryNode);
        this.nodes.push(categoryNode);
        this.edges.push({
          source: "biases",
          target: categoryId,
        });
      }
      categories.get(categoryId).count++;

      // Add subcategory if not exists
      if (!subcategories.has(subcategoryId)) {
        const subcategoryNode = {
          id: subcategoryId,
          label: hierarchy.subcategory,
          parentId: categoryId,
          level: 2,
          count: 0,
        };
        subcategories.set(subcategoryId, subcategoryNode);
        this.nodes.push(subcategoryNode);
        this.edges.push({
          source: categoryId,
          target: subcategoryId,
        });
      }
      subcategories.get(subcategoryId).count++;

      // Add type if not exists
      if (!types.has(typeId)) {
        const typeNode = {
          id: typeId,
          label: hierarchy.type,
          parentId: subcategoryId,
          level: 3,
          phrases: [],
          suggestions: [],
        };
        types.set(typeId, typeNode);
        this.nodes.push(typeNode);
        this.edges.push({
          source: subcategoryId,
          target: typeId,
        });
      }

      // Add bias details to the type node
      const typeNode = types.get(typeId);
      typeNode.phrases = typeNode.phrases || [];
      typeNode.phrases.push(bias.phrase);
      if (bias.suggestion) {
        typeNode.suggestions = typeNode.suggestions || [];
        typeNode.suggestions.push(bias.suggestion);
      }
    });

    // Improved force layout settings
    this.simulation = d3
      .forceSimulation(this.nodes)
      .force("charge", d3.forceManyBody().strength(-400)) // Stronger repulsion for more space
      .force(
        "link",
        d3
          .forceLink(this.edges)
          .id((d) => d.id)
          .distance((d) => {
            // More dynamic distance based on level relationships
            // This will create a more graph-like structure rather than a strict hierarchy
            if (d.source.level === 0 && d.target.level === 1) return 120; // Central to categories
            if (d.source.level === 1 && d.target.level === 2) return 100; // Categories to subcategories
            return 80; // Other connections
          })
      )
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("x", d3.forceX().strength(0.08)) // Reduce the horizontal constraint
      .force("y", d3.forceY().strength(0.08)) // Reduce the vertical constraint
      // Remove the level-based Y positioning to allow more natural graph layout
      .force(
        "collision",
        d3.forceCollide().radius((d) => {
          if (d.level === 0) return 50; // Central node
          if (d.level === 1) return 40; // Category nodes
          if (d.level === 2) return 30; // Subcategory nodes
          return 25; // Type nodes
        })
      )
      .on("tick", this.ticked.bind(this));

    // Create the visualization
    this.renderMap();

    // Add a title and legend to the visualization
    const title = document.createElement("div");
    title.className = "bias-map-title";
    title.textContent = "Bias Hierarchy Map";
    this.container.prepend(title);

    // Add the legend
    this.addLegend();
  }

  // Clean string for use as ID
  sanitizeId(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  // Update the renderMap method to ensure nodes are always on top
  renderMap() {
    // Clear previous elements
    this.svg.selectAll("*").remove();

    // Create a dedicated group for links that will stay behind nodes
    const linksGroup = this.svg.append("g").attr("class", "links-group");

    // Create links with arrowheads for directional clarity
    const links = linksGroup
      .selectAll(".bias-map-link")
      .data(this.edges)
      .join("line")
      .attr("class", "bias-map-link")
      .attr("stroke-width", (d) => {
        const sourceLevel = typeof d.source === "object" ? d.source.level : 0;
        return 3 - sourceLevel * 0.5;
      });

    // Create a dedicated group for nodes that will always be on top of links
    const nodesGroup = this.svg.append("g").attr("class", "nodes-group");

    // Create node groups with better styling
    const nodes = nodesGroup
      .selectAll(".bias-map-node")
      .data(this.nodes)
      .join("g")
      .attr("class", (d) => `bias-map-node level-${d.level}`)
      .attr("data-id", (d) => d.id);

    // Clear existing elements in nodes
    nodes.selectAll("*").remove();

    // Add circles with different styling based on level
    nodes
      .append("circle")
      .attr("class", (d) => `bias-map-circle level-${d.level}`)
      .attr("r", (d) => {
        if (d.level === 0) return 30; // Central node
        if (d.level === 1) return 20; // Categories
        if (d.level === 2) return 15; // Subcategories
        return 10; // Types
      });

    // Add count badges to nodes that have children
    nodes
      .filter((d) => d.count)
      .append("circle")
      .attr("class", "node-count-badge")
      .attr("cx", (d) => (d.level === 0 ? 15 : 10))
      .attr("cy", -10)
      .attr("r", 10)
      .attr("fill", "#ef4444");

    nodes
      .filter((d) => d.count)
      .append("text")
      .attr("class", "node-count-text")
      .attr("x", (d) => (d.level === 0 ? 15 : 10))
      .attr("y", -7)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "9px")
      .style("font-weight", "bold")
      .text((d) => d.count);

    // Add labels with better positioning
    nodes
      .append("text")
      .attr("class", "bias-map-label")
      .attr("dy", (d) => (d.level === 0 ? 45 : 25))
      .attr("text-anchor", "middle")
      .text((d) => {
        // Truncate long labels
        let label = d.label;
        if (label.length > 15) {
          label = label.substring(0, 12) + "...";
        }
        return label;
      });

    // Set up event handlers for node interaction
    nodes
      .on("mouseover", (event, d) => this.showTooltip(event, d))
      .on("mouseout", () => this.hideTooltip())
      .on("click", (event, d) => this.handleNodeClick(event, d));

    // IMPORTANT: Apply drag behavior with improved configuration
    nodes.call(
      d3
        .drag()
        .filter((event) => {
          // Override default filter to allow any mouse button
          return !event.ctrlKey && !event.button;
        })
        .subject((event, d) => {
          // This ensures the drag uses the node's current position
          return d;
        })
        .on("start", (event, d) => {
          // Explicitly tell D3 this is an active drag
          if (!event.active) this.simulation.alphaTarget(0.3).restart();

          // Fix the node position during drag
          d.fx = d.x;
          d.fy = d.y;

          // Add visual feedback
          d3.select(event.sourceEvent.currentTarget)
            .classed("dragging", true)
            .raise(); // Bring to front when dragging
        })
        .on("drag", (event, d) => {
          // Update the fixed position as the node is dragged
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0);
          d3.select(event.sourceEvent.currentTarget).classed("dragging", false);

          // For regular nodes, allow them to float back
          if (d.level !== 0) {
            // Keep central node fixed
            d.fx = null;
            d.fy = null;
          }
        })
    );
  }

  // Tooltip handling
  showTooltip(event, d) {
    // Store the currently active node for reference
    this.activeNode = d;

    // Clear any existing hide timeouts immediately
    if (this.tooltipHideTimeout) {
      clearTimeout(this.tooltipHideTimeout);
      this.tooltipHideTimeout = null;
    }

    // Create tooltip content
    let content = `<div class="bias-map-tooltip-content">
      <h3>${d.label}</h3>`;

    // Different content based on node type
    if (d.level === 3) {
      // Bias type node
      if (d.phrases && d.phrases.length > 0) {
        content += `<p>Found in:</p>
        <div class="bias-phrase">"${d.phrases[0]}"</div>`;

        if (d.suggestions && d.suggestions[0]) {
          content += `<p>Suggested alternative:</p>
          <div class="bias-suggestion">${d.suggestions[0]}</div>`;
        }

        content += `<div class="bias-tooltip-buttons">
          <button class="bias-detail-button">View All Details</button>
        </div>`;
      }
    } else if (d.level === 0) {
      // Central node
      content += `<p>Detected bias categories: ${
        this.nodes.filter((n) => n.level === 1).length
      }</p>
      <p>Total bias instances: ${
        this.nodes.filter((n) => n.level === 3).length
      }</p>`;
    } else {
      // Category or subcategory
      const childCount = this.nodes.filter(
        (n) =>
          n.parentId === d.id ||
          (d.level === 1 &&
            n.level === 3 &&
            this.nodes.find(
              (sc) => sc.id === n.parentId && sc.parentId === d.id
            ))
      ).length;

      content += `<p>Contains ${childCount} ${
        d.level === 1 ? "subcategories/types" : "bias types"
      }</p>`;

      if (d.count) {
        content += `<p><strong>${d.count}</strong> instances of bias found</p>`;
      }
    }

    content += `</div>`;

    // Update tooltip content
    this.tooltipDiv.html(content);

    // Position tooltip - first make it visible but with opacity 0
    this.tooltipDiv.style("display", "block").style("opacity", "0");

    // Get dimensions after content is set but before showing
    const tooltipNode = this.tooltipDiv.node();
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;

    // Calculate position ensuring it stays within viewport
    const mouseX = event.pageX;
    const mouseY = event.pageY;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Base position
    let left = mouseX + 15;
    let top = mouseY - 28;

    // Adjust if would go off right edge
    if (left + tooltipWidth > viewportWidth - 20) {
      left = Math.max(10, mouseX - tooltipWidth - 15);
    }

    // Adjust if would go off top edge
    if (top < 20) {
      top = Math.min(viewportHeight - tooltipHeight - 20, mouseY + 15);
    }

    // Adjust if would go off bottom edge
    if (top + tooltipHeight > viewportHeight - 20) {
      top = Math.max(10, viewportHeight - tooltipHeight - 20);
    }

    // Apply position and fade in tooltip
    this.tooltipDiv
      .style("left", left + "px")
      .style("top", top + "px")
      .transition()
      .duration(200)
      .style("opacity", "1")
      .style("pointer-events", "auto"); // Enable pointer events

    // Add explicit button click handlers
    this.tooltipDiv.select(".bias-detail-button").on("click", () => {
      if (d.level === 3) {
        this.showBiasDetailDialog(d);
      }
    });

    // Ensure the tooltip stays visible when mouse moves over it
    this.tooltipDiv.on("mouseenter", () => {
      if (this.tooltipHideTimeout) {
        clearTimeout(this.tooltipHideTimeout);
        this.tooltipHideTimeout = null;
      }
    });

    this.tooltipDiv.on("mouseleave", (e) => {
      // Check if moving back to the node
      const nodeElement = this.svg
        .selectAll(`.bias-map-node[data-id="${d.id}"]`)
        .node();
      if (
        e.relatedTarget &&
        nodeElement &&
        nodeElement.contains(e.relatedTarget)
      ) {
        return; // Moving back to the node, don't hide
      }
      this.startTooltipHideTimer();
    });

    // Highlight the node
    this.highlightNode(d.id);

    // Highlight corresponding text if applicable
    if (d.level === 3 && this.messageContent && d.phrases) {
      this.highlightTextPhrases(d.phrases);
    }
  }

  // Improved hideTooltip method
  hideTooltip(immediate = false) {
    if (immediate) {
      this.tooltipDiv
        .style("opacity", "0")
        .style("pointer-events", "none")
        .style("display", "none");
      this.resetHighlights();
      this.unhighlightText();
      this.activeNode = null;
      return;
    }

    // Use timeout to prevent flicker
    this.startTooltipHideTimer();
  }

  // Manage the tooltip hiding with timeout
  startTooltipHideTimer() {
    if (this.tooltipHideTimeout) {
      clearTimeout(this.tooltipHideTimeout);
    }

    this.tooltipHideTimeout = setTimeout(() => {
      // Doublecheck if cursor is over tooltip or node before hiding
      if (!this.isPointerOverTooltipOrNode()) {
        this.tooltipDiv
          .transition()
          .duration(200)
          .style("opacity", "0")
          .style("pointer-events", "none")
          .on("end", () => {
            this.tooltipDiv.style("display", "none");
          });

        // Reset highlighting
        this.resetHighlights();
        this.unhighlightText();
        this.activeNode = null;
      }
    }, 300);
  }

  // Check if pointer is over tooltip or active node
  isPointerOverTooltipOrNode() {
    // Get current mouse position - unfortunately we can't get this directly
    // without an event, so we'll rely on the delay and explicit mouseenter/leave events
    return false;
  }

  // Find node level helper
  findNodeLevel(nodeId) {
    const node =
      typeof nodeId === "object"
        ? nodeId
        : this.nodes.find((n) => n.id === nodeId);
    return node ? node.level : 3;
  }

  // Update the ticked method to ensure proper depth ordering
  ticked() {
    // Update link positions
    this.svg
      .selectAll(".bias-map-link")
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    // Update node positions - keep nodes above links
    this.svg
      .selectAll(".bias-map-node")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .each(function () {
        // Re-append nodes to ensure they stay on top
        this.parentNode.appendChild(this);
      });
  }

  // Handle custom event to highlight node
  handleHighlightNode(event) {
    const { hierarchyKey } = event.detail;
    this.highlightNode(hierarchyKey);
  }

  // Highlight a specific node and its path
  highlightNode(nodeId) {
    // Reset opacity for all nodes and links
    this.svg.selectAll(".bias-map-node").style("opacity", 0.3);
    this.svg.selectAll(".bias-map-link").style("opacity", 0.2);

    // Find the node
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Highlight the node
    this.svg
      .selectAll(`.bias-map-node[data-id="${nodeId}"]`)
      .style("opacity", 1)
      .select("circle")
      .style("stroke", "#4a9eff")
      .style("stroke-width", "3px");

    // Highlight path to root
    this.highlightPathToRoot(node);
  }

  // Highlight the path from a node to the root
  highlightPathToRoot(node) {
    if (!node) return;

    // For level 3 nodes (bias types)
    if (node.level === 3 && node.parentId) {
      // Highlight parent subcategory
      const subcategory = this.nodes.find((n) => n.id === node.parentId);
      this.svg
        .selectAll(`.bias-map-node[data-id="${node.parentId}"]`)
        .style("opacity", 1);

      // Highlight link between type and subcategory
      this.svg
        .selectAll(".bias-map-link")
        .filter(
          (link) =>
            (link.source.id === node.parentId && link.target.id === node.id) ||
            (link.source.id === node.id && link.target.id === node.parentId)
        )
        .style("opacity", 1);

      // Continue up the tree
      this.highlightPathToRoot(subcategory);
    }
    // For level 2 nodes (subcategories)
    else if (node.level === 2 && node.parentId) {
      // Highlight parent category
      const category = this.nodes.find((n) => n.id === node.parentId);
      this.svg
        .selectAll(`.bias-map-node[data-id="${node.parentId}"]`)
        .style("opacity", 1);

      // Highlight link between subcategory and category
      this.svg
        .selectAll(".bias-map-link")
        .filter(
          (link) =>
            (link.source.id === node.parentId && link.target.id === node.id) ||
            (link.source.id === node.id && link.target.id === node.parentId)
        )
        .style("opacity", 1);

      // Continue up the tree
      this.highlightPathToRoot(category);
    }
    // For level 1 nodes (categories)
    else if (node.level === 1) {
      // Highlight central node
      this.svg
        .selectAll(`.bias-map-node[data-id="biases"]`)
        .style("opacity", 1);

      // Highlight link between category and central node
      this.svg
        .selectAll(".bias-map-link")
        .filter(
          (link) =>
            (link.source.id === "biases" && link.target.id === node.id) ||
            (link.source.id === node.id && link.target.id === "biases")
        )
        .style("opacity", 1);
    }
  }

  // Reset highlighting
  resetHighlights() {
    this.svg
      .selectAll(".bias-map-node")
      .style("opacity", 1)
      .select("circle")
      .style("stroke", "rgba(255, 255, 255, 0.2)")
      .style("stroke-width", "2px");

    this.svg.selectAll(".bias-map-link").style("opacity", 0.6);
  }

  // Highlight text phrases in the message content
  highlightTextPhrases(phrases) {
    if (!this.messageContent) return;

    // First reset all highlights
    this.messageContent.querySelectorAll(".bias-highlight").forEach((el) => {
      el.classList.remove("active");
    });

    // Then highlight matching phrases
    const textNodes = Array.from(
      this.messageContent.querySelectorAll(".bias-highlight")
    );
    phrases.forEach((phrase) => {
      const matchingNodes = textNodes.filter(
        (node) =>
          node.textContent.includes(phrase) || node.dataset.original === phrase
      );

      matchingNodes.forEach((node) => {
        node.classList.add("active");

        // Scroll to the first highlighted element if not in view
        if (matchingNodes.length > 0 && !this.isInViewport(matchingNodes[0])) {
          matchingNodes[0].scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      });
    });
  }

  // Helper method to check if an element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Reverse highlight - from text to graph
  handleTextHighlight(event) {
    const biasHighlight = event.target.closest(".bias-highlight");
    if (!biasHighlight) return;

    const hierarchyKey = biasHighlight.dataset.hierarchyKey;
    if (hierarchyKey) {
      this.highlightNode(hierarchyKey);
    }
  }

  // Unhighlight all text
  unhighlightText() {
    if (!this.messageContent) return;
    this.messageContent.querySelectorAll(".bias-highlight").forEach((el) => {
      el.classList.remove("active");
    });
  }

  // Handle node click
  handleNodeClick(event, d) {
    // For level 3 nodes (bias types), show detailed info
    if (d.level === 3) {
      this.showBiasDetailDialog(d);
    }
    // For other nodes, expand/collapse children
    else {
      // Implementation for expanding/collapsing could go here
    }
  }

  // Show detailed bias information
  showBiasDetailDialog(node) {
    if (!node.phrases || node.phrases.length === 0) return;

    let content = `<h3>${node.label}</h3>`;
    content += `<p>This bias appears in the following phrases:</p>`;

    node.phrases.forEach((phrase, i) => {
      content += `<div class="bias-detail-item">
        <p class="bias-phrase">"${phrase}"</p>`;

      if (node.suggestions && node.suggestions[i]) {
        content += `<p class="bias-suggestion">Suggestion: ${node.suggestions[i]}</p>`;
      }
      content += `</div>`;
    });

    // Find a hierarchy path for this node
    let pathText = "";
    const subcategory = this.nodes.find((n) => n.id === node.parentId);
    if (subcategory) {
      const category = this.nodes.find((n) => n.id === subcategory.parentId);
      if (category) {
        pathText = `${category.label} → ${subcategory.label} → ${node.label}`;
      }
    }

    if (pathText) {
      content += `<p class="bias-hierarchy-path">${pathText}</p>`;
    }

    // Create and show the dialog
    const overlay = document.createElement("div");
    overlay.className = "bias-dialog-overlay";

    const dialog = document.createElement("div");
    dialog.className = "bias-dialog";
    dialog.innerHTML = `
      <div class="bias-dialog-header">Bias Details</div>
      <div class="bias-dialog-content">${content}</div>
      <div class="bias-dialog-buttons">
        <button class="bias-dialog-button primary">Got it</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    dialog.querySelector("button").addEventListener("click", () => {
      overlay.remove();
      dialog.remove();
    });
  }

  // Drag event handlers
  dragStarted(event, d) {
    // Prevent default behavior
    if (event.sourceEvent) event.sourceEvent.stopPropagation();

    // When drag starts, activate the simulation
    if (!event.active) this.simulation.alphaTarget(0.3).restart();

    // Fix the node position during drag
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(event, d) {
    // Update the fixed position as the node is dragged
    d.fx = event.x;
    d.fy = event.y;
  }

  dragEnded(event, d) {
    // When drag ends, cool down the simulation
    if (!event.active) this.simulation.alphaTarget(0);

    // For regular nodes, allow them to float back
    if (d.level !== 0) {
      // Keep central node fixed
      d.fx = null;
      d.fy = null;
    }
  }

  // Resize handler
  resize() {
    this.width = this.container.clientWidth;
    this.height = Math.max(300, this.container.clientHeight);

    this.svg.attr("width", this.width).attr("height", this.height);

    // Update forces
    this.simulation
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("x", d3.forceX(this.width / 2).strength(0.1));

    this.simulation.alpha(0.3).restart();
  }

  // Update the addLegend method to use the Tol palette colors
  addLegend() {
    const legend = document.createElement("div");
    legend.className = "bias-map-legend";

    const legendItems = [
      { label: "Main Category", color: "#4477AA", level: 0 } /* Tol blue */,
      { label: "Category", color: "#66CCEE", level: 1 } /* Tol cyan */,
      { label: "Subcategory", color: "#CCBB44", level: 2 } /* Tol yellow */,
      { label: "Bias Type", color: "#EE6677", level: 3 } /* Tol red */,
    ];

    legendItems.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "legend-item";

      const colorBox = document.createElement("div");
      colorBox.className = "legend-color";
      colorBox.style.backgroundColor = item.color;

      const label = document.createElement("span");
      label.textContent = item.label;

      itemDiv.appendChild(colorBox);
      itemDiv.appendChild(label);
      legend.appendChild(itemDiv);
    });

    this.container.appendChild(legend);
  }
}
