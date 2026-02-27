// Custom test setup - use CommonJS for jest.setup.js
require('@testing-library/jest-dom');

// Mock window.matchMedia for Tailwind's responsive utilities
if (!window.matchMedia) {
  window.matchMedia = function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {}
    };
  };
}

// Mock Intl API if not available
if (!global.Intl) {
  global.Intl = {
    DateTimeFormat: function () {
      return {
        format: function (date) { return date.toLocaleString(); }
      };
    }
  };
}
