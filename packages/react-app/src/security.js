/**
 * Comprehensive Security Module for Code Execution
 * Prevents malicious code injection and dangerous operations
 */

// List of dangerous JavaScript keywords and patterns
const DANGEROUS_PATTERNS = [
  // Direct eval and function constructor
  /\beval\s*\(/gi,
  /\bFunction\s*\(/gi,
  /\bnew\s+Function\s*\(/gi,
  
  // Dangerous global access
  /\bwindow\b/gi,
  /\bdocument\b/gi,
  /\bglobalThis\b/gi,
  /\bglobal\b/gi,
  /\bself\b/gi,
  /\btop\b/gi,
  /\bparent\b/gi,
  /\bframes\b/gi,
  
  // Network requests
  /\bfetch\s*\(/gi,
  /\bXMLHttpRequest\b/gi,
  /\bWebSocket\b/gi,
  /\bEventSource\b/gi,
  
  // File system access (if available)
  /\brequire\s*\(/gi,
  /\bimport\s+/gi,
  /\bimport\s*\(/gi,
  /\bexport\s+/gi,
  
  // Storage access
  /\blocalStorage\b/gi,
  /\bsessionStorage\b/gi,
  /\bindexedDB\b/gi,
  /\bcookie\b/gi,
  /\bdocument\.cookie\b/gi,
  
  // Dangerous timers with string arguments
  /\bsetTimeout\s*\(\s*["'`]/gi,
  /\bsetInterval\s*\(\s*["'`]/gi,
  /\bsetImmediate\s*\(\s*["'`]/gi,
  
  // Prototype manipulation
  /\.__proto__\s*=/gi,
  /\.constructor\s*=/gi,
  /\bObject\.prototype\b/gi,
  /\bArray\.prototype\b/gi,
  /\bString\.prototype\b/gi,
  
  // Dangerous reflection
  /\bReflect\s*\./gi,
  /\bProxy\s*\(/gi,
  
  // Process and system access
  /\bprocess\b/gi,
  /\bchild_process\b/gi,
  /\bos\b/gi,
  
  // Crypto mining (common attack vector)
  /\bWebAssembly\b/gi,
  /\bSharedArrayBuffer\b/gi,
  
  // XSS vectors
  /\binnerHTML\s*=/gi,
  /\bouterHTML\s*=/gi,
  /\binsertAdjacentHTML\s*\(/gi,
  /\bdocument\.write\s*\(/gi,
  /\bdocument\.writeln\s*\(/gi,
  
  // Event manipulation
  /\baddEventListener\s*\(/gi,
  /\battachEvent\s*\(/gi,
  
  // Navigation
  /\blocation\s*=/gi,
  /\bwindow\.location\b/gi,
  /\bhistory\s*\./gi,
  
  // Clipboard access
  /\bclipboard\b/gi,
  /\bnavigator\.clipboard\b/gi,
  
  // Geolocation
  /\bnavigator\.geolocation\b/gi,
  
  // Camera/Microphone
  /\bgetUserMedia\s*\(/gi,
  /\bMediaDevices\b/gi,
  
  // Service Workers
  /\bserviceWorker\b/gi,
  /\bnavigator\.serviceWorker\b/gi,
  
  // WebRTC
  /\bRTCPeerConnection\b/gi,
  
  // Dangerous operators
  /\bwith\s*\(/gi,
  /\bdebugger\b/gi,
  
  // Data exfiltration
  /\bpostMessage\s*\(/gi,
  /\bMessageChannel\b/gi,
  /\bBroadcastChannel\b/gi,
  
  // DOM manipulation
  /\bcreateElement\s*\(/gi,
  /\bappendChild\s*\(/gi,
  /\bremoveChild\s*\(/gi,
  /\bcreateTextNode\s*\(/gi,
  
  // Style manipulation (potential XSS)
  /\bstyle\s*=/gi,
  /\bsetAttribute\s*\(/gi,
  
  // Script injection
  /\bcreateScript\b/gi,
  /\bscript\s*=/gi,
  
  // Iframe manipulation
  /\bcreateElement\s*\(\s*["']iframe/gi,
  /\biframe\b/gi,
  
  // Base64 encoding (often used for obfuscation)
  /\batob\s*\(/gi,
  /\bbtoa\s*\(/gi,
  
  // Unicode escapes (obfuscation)
  /\\u[0-9a-f]{4}/gi,
  /\\x[0-9a-f]{2}/gi,
  
];

// Additional dangerous function names
const DANGEROUS_FUNCTIONS = [
  'eval',
  'Function',
  'setTimeout',
  'setInterval',
  'setImmediate',
  'clearTimeout',
  'clearInterval',
  'clearImmediate',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'require',
  'import',
  'export',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'document',
  'window',
  'globalThis',
  'global',
  'self',
  'top',
  'parent',
  'frames',
  'process',
  'Reflect',
  'Proxy',
  'WebAssembly',
  'SharedArrayBuffer',
  'postMessage',
  'MessageChannel',
  'BroadcastChannel',
  'navigator',
  'location',
  'history',
  'atob',
  'btoa',
];

/**
 * Sanitizes code by normalizing and removing null bytes only.
 * Does not mutate user intent; validation handles blocking unsafe patterns.
 */
export function sanitizeCode(code) {
  if (!code || typeof code !== 'string') {
    return '';
  }

  // Remove null bytes but leave the original content intact
  return code.replace(/\0/g, '');
}

/**
 * Validates code for dangerous patterns
 */
export function validateCode(code) {
  const errors = [];
  const warnings = [];
  
  if (!code || typeof code !== 'string') {
    return { valid: false, errors: ['Code must be a non-empty string'], warnings: [] };
  }
  
  // Check for dangerous patterns
  DANGEROUS_PATTERNS.forEach((pattern) => {
    pattern.lastIndex = 0; // Reset global regex state between runs
    if (pattern.test(code)) {
      errors.push(`Dangerous pattern detected: ${pattern.toString()}`);
    }
  });
  
  // Check for dangerous function calls
  DANGEROUS_FUNCTIONS.forEach(func => {
    const regex = new RegExp(`\\b${func}\\s*\\(`, 'gi');
    if (regex.test(code)) {
      errors.push(`Dangerous function call detected: ${func}()`);
    }
  });
  
  // Check for prototype pollution attempts
  if (/\.__proto__|\.constructor\[|Object\.prototype|Array\.prototype/.test(code)) {
    errors.push('Prototype pollution attempt detected');
  }
  
  // Check for code length (prevent DoS)
  if (code.length > 10000) {
    warnings.push('Code is very long and may cause performance issues');
  }
  
  // Check for deeply nested structures (prevent stack overflow)
  const maxDepth = (code.match(/\{/g) || []).length;
  if (maxDepth > 50) {
    warnings.push('Code has very deep nesting which may cause stack overflow');
  }
  
  // Check for infinite loop patterns
  if (/while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)|for\s*\(\s*;\s*true\s*;/.test(code)) {
    warnings.push('Potential infinite loop detected');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Creates a secure execution context
 */
export function createSecureContext() {
  // Create a minimal safe context
  const safeContext = {
    // Safe console methods
    console: {
      log: (...args) => {
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return '[Object]';
            }
          }
          return String(arg);
        }).join(' ');
        return message;
      },
      error: (...args) => {
        const message = args.map(arg => String(arg)).join(' ');
        return `ERROR: ${message}`;
      },
      warn: (...args) => {
        const message = args.map(arg => String(arg)).join(' ');
        return `WARN: ${message}`;
      }
    },
    
    // Safe Math operations
    Math: Math,
    
    // Safe Number operations
    Number: Number,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    
    // Safe String operations
    String: String,
    
    // Safe Array operations
    Array: Array,
    
    // Safe Object operations (limited)
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
    
    // Safe Date operations
    Date: Date,
    
    // Safe JSON operations
    JSON: JSON,
    
    // Safe RegExp
    RegExp: RegExp,
    
    // Safe Error
    Error: Error,
    TypeError: TypeError,
    ReferenceError: ReferenceError,
    SyntaxError: SyntaxError,
    
    // Safe Boolean
    Boolean: Boolean,
    
    Infinity: Infinity,
    NaN: NaN,
  };
  
  return safeContext;
}

/**
 * Executes code using the dedicated worker to keep the main thread safe.
 */
export function executeSecureCode(code, timeout = 5000) {
  const validation = validateCode(code);
  if (!validation.valid) {
    return Promise.reject(new Error(`Code validation failed: ${validation.errors.join(', ')}`));
  }

  const resolvedTimeout = Math.max(0, timeout);

  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(new URL('./codeWorker.js', import.meta.url), { type: 'module' });
    } catch (error) {
      reject(new Error(`Secure worker not available: ${error.message}`));
      return;
    }

    let settled = false;
    const cleanup = () => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    const timerId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Code execution timeout exceeded'));
    }, resolvedTimeout + 250); // small buffer for termination

    worker.onmessage = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timerId);

      const { result, output, error } = e.data || {};
      cleanup();

      if (error) {
        reject(new Error(error));
        return;
      }

      resolve({
        result,
        output,
        warnings: validation.warnings
      });
    };

    worker.onerror = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timerId);
      cleanup();
      reject(new Error(`Worker Error: ${err.message}`));
    };

    try {
      worker.postMessage({
        code,
        timeout: resolvedTimeout
      });
    } catch (error) {
      if (settled) return;
      settled = true;
      clearTimeout(timerId);
      cleanup();
      reject(new Error(`Failed to start worker: ${error.message}`));
    }
  });
}

/**
 * Escapes HTML to prevent XSS
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Sanitizes output to prevent XSS
 */
export function sanitizeOutput(output) {
  if (typeof output === 'string') {
    return escapeHtml(output);
  }
  if (typeof output === 'object') {
    try {
      return escapeHtml(JSON.stringify(output, null, 2));
    } catch {
      return '[Object]';
    }
  }
  return String(output);
}

