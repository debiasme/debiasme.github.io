const config = {
  development: {
    apiUrl: "http://localhost:3000",
    allowedOrigins: [
      "http://localhost:3000",
      "http://localhost:5501",
      "http://127.0.0.1:5501",
    ],
  },
  production: {
    apiUrl: "https://ayeeye.onrender.com",
    allowedOrigins: [
      "https://cmlmanni.github.io/AyeEye",
      "https://debiasme.github.io",
    ],
  },
};

export const getConfig = () => {
  const isDevelopment =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  return config[isDevelopment ? "development" : "production"];
};
