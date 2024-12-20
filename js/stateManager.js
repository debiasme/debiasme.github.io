/**
 * StateManager class to handle application state
 * Implements a simple pub/sub pattern for state changes
 */
class StateManager {
  constructor() {
    this.state = {
      isBiasCheckerEnabled: true,
      scenarios: [],
      currentScenario: null,
      messages: []
    };
    this.listeners = new Map();
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Function to call on state change
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    return () => this.listeners.get(key).delete(callback);
  }

  /**
   * Update state and notify subscribers
   * @param {string} key - State key to update
   * @param {any} value - New value
   */
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => callback(value, oldValue));
    }
  }

  /**
   * Get current state value
   * @param {string} key - State key
   * @returns {any} Current value
   */
  getState(key) {
    return this.state[key];
  }
}

export const stateManager = new StateManager(); 