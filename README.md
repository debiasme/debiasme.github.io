# AyeEye

An interactive web application that helps users identify and understand bias in their language through real-time analysis and visual feedback.

## Features

- 🔍 Real-time bias detection with AI-powered analysis
- 🗺️ Interactive bias visualization maps
- 💬 Dynamic chat interface with contextual feedback
- 🎨 Particle-based ambient background
- 📱 Fully responsive design for all devices
- ✨ Smooth animations and transitions

## Getting Started

### Prerequisites

- Modern web browser
- Local development server (e.g., Live Server for VS Code)
- Node.js and npm (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cmlmanni/AyeEye.git
cd AyeEye
```

2. Start a local development server:
   - If using VS Code with Live Server extension, right-click `index.html` and select "Open with Live Server"
   - Or use any other local server of your choice

### Usage

1. Open the application in your browser
2. Type a message or select a pre-defined prompt
3. Click "Detect Bias" to analyze your text
4. If bias is detected:
   - View highlighted bias phrases
   - See suggested alternatives
   - Explore the interactive bias map
   - Accept or modify suggestions
5. Send your message to get AI-powered responses

## Technical Details

### Architecture

- Pure JavaScript with ES6 modules
- D3.js for interactive bias visualization
- P5.js for particle animation
- Custom state management with pub/sub pattern
- Azure OpenAI integration for bias analysis

### Key Components

- `BiasChecker`: Handles bias detection and analysis
- `BiasVisualizer`: Creates interactive bias highlights
- `BiasMap`: Generates D3-powered visualization maps
- `MessageHandler`: Manages chat interface and responses
- `StateManager`: Handles application state
- `Environment`: Manages deployment configurations

### File Structure

```
ayeeye/
├── css/
│   ├── styles.css
│   └── guide.css
├── js/
│   ├── biasChecker.js
│   ├── biasVisualizer.js
│   ├── biasMap.js
│   ├── environment.js
│   ├── eventHandlers.js
│   ├── messageHandler.js
│   ├── prompts.js
│   ├── script.js
│   ├── sketch.js
│   ├── stateManager.js
│   └── userGuide.js
├── scenarios.json
└── index.html
```

## Development

### Environment Setup

The application supports both development and production environments:
- Development: Uses localhost API endpoint
- Production: Uses deployed API endpoint

### Adding New Features

1. Bias Detection:
   - Extend `BiasChecker` for new bias types
   - Update `prompts.js` with new analysis patterns

2. Visualization:
   - Modify `BiasMap` for new visualization features
   - Update `BiasVisualizer` for new highlight styles

3. UI Components:
   - Add styles to `styles.css`
   - Implement new handlers in `eventHandlers.js`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [D3.js](https://d3js.org/) for interactive visualizations
- [P5.js](https://p5js.org/) for particle effects
- [Inter Font](https://fonts.google.com/specimen/Inter) for typography
- [Azure OpenAI](https://azure.microsoft.com/en-us/services/cognitive-services/openai/) for AI capabilities