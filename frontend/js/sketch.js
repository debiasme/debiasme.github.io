import { stateManager } from './stateManager.js';

let particles = [];
const NUM_PARTICLES = 50;

// Reference to state manager for particle color changes
let isBiasCheckerEnabled = true;

window.setup = function() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('p5-container');
  
  // Initialize particles
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(new Particle());
  }
  
  // Set initial background
  background(31, 41, 55);

  // Subscribe to bias checker state changes
  stateManager.subscribe('isBiasCheckerEnabled', (newValue) => {
    isBiasCheckerEnabled = newValue;
  });
}

window.draw = function() {
  // Semi-transparent background for trail effect
  background(31, 41, 55, 25);
  
  // Update and display particles
  for (let particle of particles) {
    particle.update();
    particle.display();
  }
}

class Particle {
  constructor() {
    this.reset();
    // Start particles at random positions
    this.x = random(width);
    this.y = random(height);
  }
  
  reset() {
    this.x = random(width);
    this.y = height + 10;
    this.speedX = random(-1, 1);
    this.speedY = random(-1.5, -0.5);
    this.size = random(3, 8);
    this.alpha = random(100, 200);
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= 0.5;
    
    if (this.alpha < 0 || this.y < -10) {
      this.reset();
    }
  }
  
  display() {
    noStroke();
    if (isBiasCheckerEnabled) {
      // Purple particles when bias checker is on
      fill(139, 92, 246, this.alpha); // matches bg-purple-500
    } else {
      // Pink particles when bias checker is off
      fill(236, 72, 153, this.alpha); // matches bg-pink-500
    }
    circle(this.x, this.y, this.size);
  }
}

window.windowResized = function() {
  resizeCanvas(windowWidth, windowHeight);
} 