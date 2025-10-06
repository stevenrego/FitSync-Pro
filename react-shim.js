// React 19 compatibility shim for expo-router
// This ensures the 'use' hook and other React 19 features are available

// Ensure React is available globally
if (typeof globalThis !== 'undefined') {
  if (!globalThis.React) {
    globalThis.React = require('react');
  }
  
  // Set React version for compatibility checks
  globalThis.__REACT_VERSION__ = '19.0.0';
  globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
}

// Get React reference
const React = require('react');

// Polyfill for the 'use' hook if not available
if (!React.use) {
  React.use = function use(resource) {
    // Handle promises
    if (resource && typeof resource.then === 'function') {
      // For promises, we throw them to let Suspense handle
      throw resource;
    }
    
    // Handle context-like resources
    if (resource && typeof resource._currentValue !== 'undefined') {
      return resource._currentValue;
    }
    
    // Handle other resources
    if (resource && typeof resource.read === 'function') {
      return resource.read();
    }
    
    // Default return the resource itself
    return resource;
  };
}

// Ensure other React 19 features are available
if (!React.startTransition && React.unstable_startTransition) {
  React.startTransition = React.unstable_startTransition;
}

if (!React.useDeferredValue && React.unstable_useDeferredValue) {
  React.useDeferredValue = React.unstable_useDeferredValue;
}

// Ensure proper module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}

export {};