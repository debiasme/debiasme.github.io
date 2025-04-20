document.addEventListener("DOMContentLoaded", () => {
  const navToggleBtn = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");

  // Check if we're on the demo page (index.html)
  // This check is optional if the script is only loaded on index.html

  if (navToggleBtn && mainNav) {
    // Set initial state from localStorage if available
    const navCollapsed = localStorage.getItem("navCollapsed") === "true";
    if (navCollapsed) {
      mainNav.classList.add("collapsed");
      navToggleBtn.querySelector(".toggle-icon").textContent = "▼";
      navToggleBtn.setAttribute("title", "Show Navigation");
    }

    // Add click event listener
    navToggleBtn.addEventListener("click", () => {
      // Toggle collapsed class
      mainNav.classList.toggle("collapsed");
      const isCollapsed = mainNav.classList.contains("collapsed");

      // Update the toggle button icon and title
      navToggleBtn.querySelector(".toggle-icon").textContent = isCollapsed
        ? "▼"
        : "▲";
      navToggleBtn.setAttribute(
        "title",
        isCollapsed ? "Show Navigation" : "Hide Navigation"
      );

      // Store state in localStorage to persist across page reloads
      localStorage.setItem("navCollapsed", isCollapsed);
    });
  }
});
