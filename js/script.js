let scenarios = [];
let isBiasCheckerEnabled = true;

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

async function loadScenarios() {
  const response = await fetch("scenarios.json");
  scenarios = await response.json();

  const userSelect = document.getElementById("user-select");
  scenarios.forEach((scenario) => {
    const option = document.createElement("option");
    option.value = scenario.input;
    option.textContent = scenario.input;
    userSelect.appendChild(option);
  });
}

loadScenarios();

document.getElementById("user-select").addEventListener("change", function () {
  const selectedMessage = this.value.trim();
  const userInput = document.getElementById("user-input");

  if (selectedMessage) {
    userInput.value = selectedMessage;
    userInput.disabled = true;
  } else {
    userInput.value = "";
    userInput.disabled = false;
  }
});

async function sendMessage() {
  const userInputElement = document.getElementById("user-input");
  const userMessage = userInputElement.value.trim();
  const chatBox = document.getElementById("chat-box");

  if (userMessage === "") {
    alert("Please select or type a message.");
    return;
  }

  const userMessageDiv = document.createElement("div");
  userMessageDiv.className = "text-right";
  userMessageDiv.innerHTML = `
        <div class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
            ${userMessage}
        </div>`;
  chatBox.appendChild(userMessageDiv);

  if (isBiasCheckerEnabled) {
    const scenario = scenarios.find(
      (s) => s.input.toLowerCase() === userMessage.toLowerCase()
    );

    if (scenario) {
      if (scenario.bias) {
        const feedbackMessage = document.createElement("div");
        feedbackMessage.className = "text-left";
        feedbackMessage.innerHTML = `
                    <div class="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md">
                        Bias Detected (${scenario.bias}): ${scenario.feedback}. Do you want to see the answer?
                    </div>`;
        chatBox.appendChild(feedbackMessage);

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "text-left flex space-x-4 mt-2";

        const yesButton = document.createElement("button");
        yesButton.textContent = "Yes";
        yesButton.className =
          "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700";
        yesButton.onclick = () => {
          buttonContainer.remove();
          displayTypingAnimation(scenario.response);
        };

        const noButton = document.createElement("button");
        noButton.textContent = "No";
        noButton.className =
          "bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700";
        noButton.onclick = () => {
          buttonContainer.remove();
          showRefinedPrompt(scenario);
        };

        buttonContainer.appendChild(yesButton);
        buttonContainer.appendChild(noButton);
        chatBox.appendChild(buttonContainer);
      } else {
        const noBiasMessage = document.createElement("div");
        noBiasMessage.className = "text-left";
        noBiasMessage.innerHTML = `
                    <div class="inline-block bg-green-500 text-white px-4 py-2 rounded-lg shadow-md">
                        No bias detected.
                    </div>`;
        chatBox.appendChild(noBiasMessage);

        displayTypingAnimation(scenario.response);
      }
    } else {
      displayTypingAnimation(
        "Sorry, I am still learning and don't have a response for this input yet."
      );
    }
  } else {
    const scenario = scenarios.find(
      (s) => s.input.toLowerCase() === userMessage.toLowerCase()
    );

    if (scenario && scenario.response) {
      displayTypingAnimation(scenario.response);
    } else {
      displayTypingAnimation(
        "Sorry, I am still learning and don't have a response for this input yet."
      );
    }
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

function showRefinedPrompt(scenario) {
  const chatBox = document.getElementById("chat-box");

  // Display notification for refined prompt
  const refinedPromptNotification = document.createElement("div");
  refinedPromptNotification.className = "text-left mt-4";
  refinedPromptNotification.innerHTML = `
        <div class="inline-block bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg shadow-md">
            Refining prompt to: "${scenario.refinedPrompt}"
        </div>`;
  chatBox.appendChild(refinedPromptNotification);

  // Create action buttons
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "text-left flex space-x-4 mt-2";

  const yesButton = document.createElement("button");
  yesButton.textContent = "Yes";
  yesButton.className =
    "bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700";
  yesButton.onclick = () => {
    buttonContainer.remove(); // Remove buttons after selection
    displayTypingAnimation(scenario.refinedResponse); // Show refined response
  };

  const noButton = document.createElement("button");
  noButton.textContent = "No";
  noButton.className =
    "bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700";
  noButton.onclick = () => {
    buttonContainer.remove(); // Remove buttons after selection
    refinedPromptNotification.remove(); // Remove the refined prompt message
    displayTips(scenario.feedback); // Show caution tips
  };

  buttonContainer.appendChild(yesButton);
  buttonContainer.appendChild(noButton);
  chatBox.appendChild(buttonContainer);

  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
}

function displayTypingAnimation(response) {
  const chatBox = document.getElementById("chat-box");
  const aiMessage = document.createElement("div");
  aiMessage.className = "text-left mt-4";
  const aiMessageContent = document.createElement("div");
  aiMessageContent.className =
    "inline-block bg-green-600 text-white px-4 py-2 rounded-lg shadow-md";
  aiMessage.appendChild(aiMessageContent);
  chatBox.appendChild(aiMessage);

  let i = 0;
  const typingEffect = setInterval(() => {
    if (i < response.length) {
      aiMessageContent.textContent += response.charAt(i);
      i++;
      chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
    } else {
      clearInterval(typingEffect);
    }
  }, 50); // Typing speed
}

function displayTips(feedback) {
  const chatBox = document.getElementById("chat-box");
  const tipsMessage = document.createElement("div");
  tipsMessage.className = "text-left mt-4";
  tipsMessage.innerHTML = `
        <div class="inline-block bg-gray-500 text-gray-200 px-4 py-2 rounded-lg shadow-md">
            Tips: ${feedback}. Consider rephrasing your input to eliminate bias.
        </div>`;
  chatBox.appendChild(tipsMessage);

  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
}
