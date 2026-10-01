const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill fetch for Node.js test environment
if (!global.fetch) {
  global.fetch = jest.fn();
  global.Request = jest.fn();
  global.Response = jest.fn();
  global.Headers = class Headers extends Map {};
}

// React Aria uses this browser API for collection item selectors; jsdom lacks it.
global.CSS = global.CSS || {};
global.CSS.escape = global.CSS.escape || require("css.escape");
