export let useAzure = false; // Initialize useAzure flag

export function toggleAzureAPI() {
  useAzure = !useAzure; // Toggle the useAzure flag
  const button = document.getElementById("toggle-azure");
  button.textContent = useAzure ? "Use Local API" : "Use Azure API";
  button.className = useAzure ? "toggle-azure-enabled" : "toggle-azure-disabled"; // Update class based on state
} 