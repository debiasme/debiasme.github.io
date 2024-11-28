const BACKEND_URL = "http://localhost:3000/api/analyse-bias";

let isBiasCheckerEnabled = true;
let usePredefinedScenarios = true; // Toggle this to switch between backend and predefined scenarios
let scenarios = []; // Predefined scenarios

async function loadScenarios() {
  const response = await fetch("scenarios.json");
  scenarios = await response.json();
}

loadScenarios();

function toggleBiasChecker() {
  isBiasCheckerEnabled = !isBiasCheckerEnabled;
  const toggleButton = document.getElementById("toggle-bias-checker");
  toggleButton.textContent = isBiasCheckerEnabled
    ? "Disable Bias Checker"
    : "Enable Bias Checker";
  toggleButton.className = isBiasCheckerEnabled
    ? "bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
    : "bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700";
}

async function sendMessage() {
  const userInputElement = document.getElementById("user-input");
  const userMessage = userInputElement.value.trim();
  const chatBox = document.getElementById("chat-box");

  if (userMessage === "") {
    alert("Please type a message.");
    return;
  }

  // Display user's message
  const userMessageDiv = document.createElement("div");
  userMessageDiv.className = "text-right";
  userMessageDiv.innerHTML = `
        <div class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
            ${userMessage}
        </div>`;
  chatBox.appendChild(userMessageDiv);

  if (usePredefinedScenarios) {
    // Logic for predefined scenarios
    const scenario = scenarios.find(
      (s) => s.input.toLowerCase() === userMessage.toLowerCase()
    );

    if (scenario) {
      const feedbackMessage = scenario.bias
        ? `<div class="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md">
              Bias Detected (${scenario.bias}): ${scenario.feedback}
           </div>`
        : `<div class="inline-block bg-green-500 text-white px-4 py-2 rounded-lg shadow-md">
              No bias detected.
           </div>`;

      const feedbackDiv = document.createElement("div");
      feedbackDiv.className = "text-left";
      feedbackDiv.innerHTML = feedbackMessage;
      chatBox.appendChild(feedbackDiv);
    } else {
      const noResponseDiv = document.createElement("div");
      noResponseDiv.className = "text-left";
      noResponseDiv.innerHTML = `
            <div class="inline-block bg-gray-500 text-gray-200 px-4 py-2 rounded-lg shadow-md">
                Sorry, I don't have a response for this input.
            </div>`;
      chatBox.appendChild(noResponseDiv);
    }
  } else {
    // Logic for backend communication
    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: userMessage }),
      });

      const result = await response.json();
      if (result.error) {
        displayTips(result.error);
      } else {
        const biasMessageDiv = document.createElement("div");
        biasMessageDiv.className = "text-left";
        biasMessageDiv.innerHTML = `
              <div class="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md">
                  ${result.biasAnalysis}
              </div>`;
        chatBox.appendChild(biasMessageDiv);
      }
    } catch (error) {
      displayTips(
        "Error connecting to the backend. Ensure it's running locally."
      );
    }
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

function displayTips(feedback) {
  const chatBox = document.getElementById("chat-box");
  const tipsMessage = document.createElement("div");
  tipsMessage.className = "text-left mt-4";
  tipsMessage.innerHTML = `
        <div class="inline-block bg-gray-500 text-gray-200 px-4 py-2 rounded-lg shadow-md">
            Tips: ${feedback}.
        </div>`;
  chatBox.appendChild(tipsMessage);

  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
}
