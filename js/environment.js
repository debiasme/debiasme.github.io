export const environment = {
  isDevelopment: window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1',
  apiUrl: window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000' 
            : 'https://ayeeye.onrender.com'
};