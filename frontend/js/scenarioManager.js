import { stateManager } from "./stateManager.js";

const scenarioManager = {
  findScenario(userMessage) {
    const scenarios = stateManager.getState("scenarios") || [];
    return scenarios.find(
      (s) => s.input.toLowerCase() === userMessage.toLowerCase()
    );
  },
  populateDropdown() {
    const scenarios = stateManager.getState("scenarios") || [];
    const select = document.getElementById("user-select");
    if (!select) return;
    select.innerHTML =
      '<option value="">-- Select a predefined prompt --</option>';
    scenarios.forEach((scenario) => {
      const option = document.createElement("option");
      option.value = scenario.input;
      option.textContent = scenario.input;
      select.appendChild(option);
    });
  },
};

// Subscribe to scenarios state and update dropdown when loaded
stateManager.subscribe("scenarios", () => {
  scenarioManager.populateDropdown();
});

export { scenarioManager };
