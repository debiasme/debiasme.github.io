// Handles scenario loading and management
let scenarios = [];

export async function loadScenarios() {
  const response = await fetch("scenarios.json");
  scenarios = await response.json();
  setupUserSelect();
}

export function findScenario(userMessage) {
  return scenarios.find(s => s.input.toLowerCase() === userMessage.toLowerCase());
}

function setupUserSelect() {
  const userSelect = document.getElementById("user-select");
  scenarios.forEach((scenario) => {
    const option = document.createElement("option");
    option.value = scenario.input;
    option.textContent = scenario.input;
    userSelect.appendChild(option);
  });
} 