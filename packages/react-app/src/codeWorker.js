/**
 * Web Worker for secure code execution
 * Provides additional isolation from the main thread
 */

// List of allowed safe operations
const ALLOWED_OPERATIONS = [
  'console.log',
  'console.error',
  'console.warn',
  'Math',
  'Number',
  'String',
  'Array',
  'Object',
  'Date',
  'JSON',
  'RegExp',
  'Boolean',
  'Error',
  'TypeError',
  'ReferenceError',
  'SyntaxError',
];

// Dangerous patterns that should be blocked
const BLOCKED_PATTERNS = [
  /\beval\s*\(/gi,
  /\bFunction\s*\(/gi,
  /\bwindow\b/gi,
  /\bdocument\b/gi,
  /\bfetch\s*\(/gi,
  /\bXMLHttpRequest\b/gi,
  /\brequire\s*\(/gi,
  /\bimport\s+/gi,
  /\bpostMessage\s*\(/gi,
  /\bclose\s*\(/gi,
  /\bimportScripts\s*\(/gi,
];

self.onmessage = function(e) {
  const { code, timeout } = e.data;
  
  // Validate code
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      self.postMessage({
        error: 'Dangerous code pattern detected',
        output: ''
      });
      return;
    }
  }
  
  // Set up timeout
  const timeoutId = setTimeout(() => {
    self.postMessage({
      error: 'Execution timeout exceeded',
      output: ''
    });
  }, timeout || 5000);
  
  // Capture console output
  const logs = [];
  const errors = [];
  
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.log = (...args) => {
    logs.push(args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return '[Object]';
        }
      }
      return String(arg);
    }).join(' '));
    originalLog(...args);
  };
  
  console.error = (...args) => {
    errors.push(args.map(arg => String(arg)).join(' '));
    originalError(...args);
  };
  
  console.warn = (...args) => {
    errors.push('WARN: ' + args.map(arg => String(arg)).join(' '));
    originalWarn(...args);
  };
  
  try {
    // Create isolated execution context
    const context = {
      console,
      Math,
      Number,
      String,
      Array,
      Object: {
        keys: Object.keys,
        values: Object.values,
        entries: Object.entries,
        assign: Object.assign,
        create: Object.create,
        freeze: Object.freeze,
        seal: Object.seal,
        is: Object.is,
        hasOwn: Object.hasOwn || ((obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop))
      },
      Date,
      JSON,
      RegExp,
      Boolean,
      Error,
      TypeError,
      ReferenceError,
      SyntaxError,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      Infinity,
      NaN,
      undefined,
      null: null,
    };
    
    // Wrap code in strict mode IIFE
    const wrappedCode = `
      "use strict";
      (function() {
        ${code}
      })();
    `;
    
    // Execute with limited context using a single sandbox argument to avoid reserved identifiers
    const runner = new Function('sandbox', `
      "use strict";
      const console = sandbox.console;
      const Math = sandbox.Math;
      const Number = sandbox.Number;
      const String = sandbox.String;
      const Array = sandbox.Array;
      const Object = sandbox.Object;
      const Date = sandbox.Date;
      const JSON = sandbox.JSON;
      const RegExp = sandbox.RegExp;
      const Boolean = sandbox.Boolean;
      const Error = sandbox.Error;
      const TypeError = sandbox.TypeError;
      const ReferenceError = sandbox.ReferenceError;
      const SyntaxError = sandbox.SyntaxError;
      const parseInt = sandbox.parseInt;
      const parseFloat = sandbox.parseFloat;
      const isNaN = sandbox.isNaN;
      const isFinite = sandbox.isFinite;
      const Infinity = sandbox.Infinity;
      const NaN = sandbox.NaN;
      
      return (function() {
        ${code}
      })();
    `);
    
    const result = runner(context);
    
    clearTimeout(timeoutId);
    
    // Restore console
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    
    // Send result back
    self.postMessage({
      result: result !== undefined ? String(result) : '',
      output: [...logs, ...errors.map(e => 'ERROR: ' + e)].join('\n'),
      error: null
    });
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Restore console
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    
    self.postMessage({
      error: error.message,
      output: errors.length > 0 ? errors.map(e => 'ERROR: ' + e).join('\n') : '',
      result: ''
    });
  }
};

