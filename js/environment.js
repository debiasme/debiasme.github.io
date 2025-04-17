export const environment = {
  isDevelopment:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1",
  apiUrl:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:3000"
      : window.location.hostname === "cmlmanni.github.io"
      ? "https://ayeeye.onrender.com"
      : "https://ayeeye.onrender.com",
  // Add explicit headers to ensure Origin is sent
  headers: {
    "Content-Type": "application/json",
  },
};
