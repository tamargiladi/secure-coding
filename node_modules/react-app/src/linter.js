/**
 * Custom JavaScript Linter
 * Detects errors, warnings, and code quality issues
 */

// Linter error types
export const LINT_TYPES = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Lints JavaScript code and returns issues
 */
export function lint(code) {
  const issues = [];
  
  if (!code || code.trim().length === 0) {
    return issues;
  }

  const lines = code.split('\n');
  
  // Check for syntax errors
  const syntaxErrors = checkSyntax(code, lines);
  issues.push(...syntaxErrors);
  
  // Check for common issues
  const commonIssues = checkCommonIssues(code, lines);
  issues.push(...commonIssues);
  
  // Check for code quality issues
  const qualityIssues = checkCodeQuality(code, lines);
  issues.push(...qualityIssues);
  
  // Check for security issues (basic)
  const securityIssues = checkSecurityIssues(code, lines);
  issues.push(...securityIssues);
  
  // Sort by line number
  issues.sort((a, b) => a.line - b.line);
  
  return issues;
}

/**
 * Checks for syntax errors
 */
function checkSyntax(code, lines) {
  const issues = [];
  
  try {
    // Try to parse the code
    new Function(code);
  } catch (error) {
    // Extract line number from error message if possible
    const lineMatch = error.message.match(/line (\d+)/i) || 
                     error.message.match(/\((\d+):/);
    
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1], 10);
      issues.push({
        type: LINT_TYPES.ERROR,
        line: lineNum,
        column: 1,
        message: `Syntax Error: ${error.message}`,
        code: 'SYNTAX_ERROR'
      });
    } else {
      // If we can't determine the line, check common issues
      issues.push({
        type: LINT_TYPES.ERROR,
        line: 1,
        column: 1,
        message: `Syntax Error: ${error.message}`,
        code: 'SYNTAX_ERROR'
      });
    }
  }
  
  // Check for unclosed brackets, braces, parentheses
  const bracketIssues = checkBrackets(code, lines);
  issues.push(...bracketIssues);
  
  // Check for unclosed strings
  const stringIssues = checkStrings(code, lines);
  issues.push(...stringIssues);
  
  return issues;
}

/**
 * Checks for unclosed brackets, braces, parentheses
 */
function checkBrackets(code, lines) {
  const issues = [];
  const stack = [];
  const brackets = {
    '(': ')',
    '[': ']',
    '{': '}'
  };
  
  let inString = false;
  let stringChar = null;
  let escaped = false;
  let inComment = false;
  let commentType = null; // 'single' or 'multi'
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1];
    const lineNum = code.substring(0, i).split('\n').length;
    
    // Handle comments
    if (!inString && !escaped) {
      if (char === '/' && nextChar === '/') {
        inComment = true;
        commentType = 'single';
        i++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inComment = true;
        commentType = 'multi';
        i++;
        continue;
      }
      if (inComment && commentType === 'single' && char === '\n') {
        inComment = false;
        commentType = null;
      }
      if (inComment && commentType === 'multi' && char === '*' && nextChar === '/') {
        inComment = false;
        commentType = null;
        i++;
        continue;
      }
      if (inComment) continue;
    }
    
    // Handle strings
    if (!inComment) {
      if (!escaped && (char === '"' || char === "'" || char === '`')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
      }
      
      if (char === '\\' && inString) {
        escaped = !escaped;
      } else {
        escaped = false;
      }
    }
    
    if (inString || inComment) continue;
    
    // Check brackets
    if (brackets[char]) {
      stack.push({ char, line: lineNum, index: i });
    } else if (Object.values(brackets).includes(char)) {
      if (stack.length === 0) {
        issues.push({
          type: LINT_TYPES.ERROR,
          line: lineNum,
          column: i - code.lastIndexOf('\n', i),
          message: `Unexpected closing bracket: ${char}`,
          code: 'UNEXPECTED_BRACKET'
        });
      } else {
        const last = stack.pop();
        if (brackets[last.char] !== char) {
          issues.push({
            type: LINT_TYPES.ERROR,
            line: last.line,
            column: last.index - code.lastIndexOf('\n', last.index),
            message: `Mismatched brackets: expected ${brackets[last.char]}, found ${char}`,
            code: 'MISMATCHED_BRACKET'
          });
        }
      }
    }
  }
  
  // Check for unclosed brackets
  if (stack.length > 0) {
    stack.forEach(({ char, line, index }) => {
      issues.push({
        type: LINT_TYPES.ERROR,
        line: line,
        column: index - code.lastIndexOf('\n', index),
        message: `Unclosed bracket: ${char}`,
        code: 'UNCLOSED_BRACKET'
      });
    });
  }
  
  return issues;
}

/**
 * Checks for unclosed strings
 */
function checkStrings(code, lines) {
  const issues = [];
  let inString = false;
  let stringChar = null;
  let escaped = false;
  let stringStartLine = 1;
  let stringStartCol = 1;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const lineNum = code.substring(0, i).split('\n').length;
    const colNum = i - code.lastIndexOf('\n', i);
    
    if (!escaped && (char === '"' || char === "'" || char === '`')) {
      if (!inString) {
        inString = true;
        stringChar = char;
        stringStartLine = lineNum;
        stringStartCol = colNum;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }
    
    if (char === '\\' && inString) {
      escaped = !escaped;
    } else {
      escaped = false;
    }
    
    // Check for unclosed string at end of code
    if (i === code.length - 1 && inString) {
      issues.push({
        type: LINT_TYPES.ERROR,
        line: stringStartLine,
        column: stringStartCol,
        message: `Unclosed string (started with ${stringChar})`,
        code: 'UNCLOSED_STRING'
      });
    }
  }
  
  return issues;
}

/**
 * Checks for common JavaScript issues
 */
function checkCommonIssues(code, lines) {
  const issues = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Check for == instead of ===
    if (trimmed.includes(' == ') && !trimmed.includes(' === ')) {
      issues.push({
        type: LINT_TYPES.WARNING,
        line: lineNum,
        column: line.indexOf(' == ') + 1,
        message: "Use === instead of == for strict equality comparison",
        code: 'USE_STRICT_EQUALITY'
      });
    }
    
    // Check for != instead of !==
    if (trimmed.includes(' != ') && !trimmed.includes(' !== ')) {
      issues.push({
        type: LINT_TYPES.WARNING,
        line: lineNum,
        column: line.indexOf(' != ') + 1,
        message: "Use !== instead of != for strict inequality comparison",
        code: 'USE_STRICT_INEQUALITY'
      });
    }
    
    // Check for var instead of let/const
    if (/\bvar\s+\w+/.test(trimmed) && !trimmed.startsWith('//')) {
      issues.push({
        type: LINT_TYPES.WARNING,
        line: lineNum,
        column: line.indexOf('var') + 1,
        message: "Prefer 'let' or 'const' over 'var'",
        code: 'USE_LET_OR_CONST'
      });
    }
    
    // Check for console.log in production code (optional warning)
    if (trimmed.includes('console.log') && !trimmed.startsWith('//')) {
      issues.push({
        type: LINT_TYPES.INFO,
        line: lineNum,
        column: line.indexOf('console.log') + 1,
        message: "Consider removing console.log in production code",
        code: 'CONSOLE_LOG'
      });
    }
    
    // Check for missing semicolons (optional)
    if (trimmed.length > 0 && 
        !trimmed.endsWith(';') && 
        !trimmed.endsWith('{') && 
        !trimmed.endsWith('}') &&
        !trimmed.endsWith(',') &&
        !trimmed.startsWith('//') &&
        !trimmed.startsWith('/*') &&
        !trimmed.endsWith('*/') &&
        !trimmed.includes('function') &&
        !trimmed.includes('=>') &&
        !trimmed.includes('if') &&
        !trimmed.includes('for') &&
        !trimmed.includes('while') &&
        !trimmed.includes('return') &&
        !trimmed.includes('break') &&
        !trimmed.includes('continue')) {
      // This is a very basic check, can be improved
    }
    
    // Check for undefined variables (basic check)
    if (/\bundefined\b/.test(trimmed) && !trimmed.includes('!== undefined') && !trimmed.includes('=== undefined')) {
      issues.push({
        type: LINT_TYPES.WARNING,
        line: lineNum,
        column: line.indexOf('undefined') + 1,
        message: "Consider using null or a proper check instead of undefined",
        code: 'AVOID_UNDEFINED'
      });
    }
  });
  
  return issues;
}

/**
 * Checks for code quality issues
 */
function checkCodeQuality(code, lines) {
  const issues = [];
  
  // Check for long lines
  lines.forEach((line, index) => {
    if (line.length > 120) {
      issues.push({
        type: LINT_TYPES.WARNING,
        line: index + 1,
        column: 120,
        message: `Line is too long (${line.length} characters). Consider breaking it into multiple lines.`,
        code: 'LONG_LINE'
      });
    }
  });
  
  // Check for deep nesting
  let maxDepth = 0;
  let currentDepth = 0;
  let depthLine = 1;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const lineNum = code.substring(0, i).split('\n').length;
    
    if (char === '{') {
      currentDepth++;
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
        depthLine = lineNum;
      }
    } else if (char === '}') {
      currentDepth--;
    }
  }
  
  if (maxDepth > 5) {
    issues.push({
      type: LINT_TYPES.WARNING,
      line: depthLine,
      column: 1,
      message: `Code nesting is too deep (${maxDepth} levels). Consider refactoring.`,
      code: 'DEEP_NESTING'
    });
  }
  
  // Check for empty blocks
  const emptyBlockRegex = /\{\s*\}/g;
  let match;
  while ((match = emptyBlockRegex.exec(code)) !== null) {
    const lineNum = code.substring(0, match.index).split('\n').length;
    issues.push({
      type: LINT_TYPES.WARNING,
      line: lineNum,
      column: match.index - code.lastIndexOf('\n', match.index),
      message: "Empty block. Consider adding a comment or removing it.",
      code: 'EMPTY_BLOCK'
    });
  }
  
  // Check for duplicate variable names in same scope (basic)
  const varRegex = /\b(let|const|var)\s+(\w+)/g;
  const variables = new Map();
  let match2;
  
  while ((match2 = varRegex.exec(code)) !== null) {
    const varName = match2[2];
    const lineNum = code.substring(0, match2.index).split('\n').length;
    
    if (variables.has(varName)) {
      issues.push({
        type: LINT_TYPES.WARNING,
        line: lineNum,
        column: match2.index - code.lastIndexOf('\n', match2.index),
        message: `Variable '${varName}' is already declared on line ${variables.get(varName)}`,
        code: 'DUPLICATE_VARIABLE'
      });
    } else {
      variables.set(varName, lineNum);
    }
  }
  
  return issues;
}

/**
 * Checks for security issues using comprehensive security patterns
 */
function checkSecurityIssues(code, lines) {
  const issues = [];
  
  // Comprehensive dangerous patterns from security module
  const DANGEROUS_PATTERNS = [
    // Direct eval and function constructor
    { pattern: /\beval\s*\(/gi, message: "SECURITY ERROR: eval() allows arbitrary code execution", severity: LINT_TYPES.ERROR, code: 'SECURITY_EVAL' },
    { pattern: /\bFunction\s*\(/gi, message: "SECURITY ERROR: Function() constructor allows code injection", severity: LINT_TYPES.ERROR, code: 'SECURITY_FUNCTION' },
    { pattern: /\bnew\s+Function\s*\(/gi, message: "SECURITY ERROR: new Function() allows code injection", severity: LINT_TYPES.ERROR, code: 'SECURITY_NEW_FUNCTION' },
    
    // Dangerous global access
    { pattern: /\bwindow\b/gi, message: "SECURITY ERROR: window access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_WINDOW' },
    { pattern: /\bdocument\b/gi, message: "SECURITY ERROR: document access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_DOCUMENT' },
    { pattern: /\bglobalThis\b/gi, message: "SECURITY ERROR: globalThis access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_GLOBALTHIS' },
    { pattern: /\bself\b/gi, message: "SECURITY ERROR: self access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_SELF' },
    { pattern: /\btop\b/gi, message: "SECURITY ERROR: top access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_TOP' },
    { pattern: /\bparent\b/gi, message: "SECURITY ERROR: parent access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_PARENT' },
    
    // Network requests
    { pattern: /\bfetch\s*\(/gi, message: "SECURITY ERROR: fetch() can be used for data exfiltration", severity: LINT_TYPES.ERROR, code: 'SECURITY_FETCH' },
    { pattern: /\bXMLHttpRequest\b/gi, message: "SECURITY ERROR: XMLHttpRequest can be used for data exfiltration", severity: LINT_TYPES.ERROR, code: 'SECURITY_XHR' },
    { pattern: /\bWebSocket\b/gi, message: "SECURITY ERROR: WebSocket can be used for unauthorized communication", severity: LINT_TYPES.ERROR, code: 'SECURITY_WEBSOCKET' },
    { pattern: /\bEventSource\b/gi, message: "SECURITY ERROR: EventSource can be used for unauthorized communication", severity: LINT_TYPES.ERROR, code: 'SECURITY_EVENTSOURCE' },
    
    // File system access
    { pattern: /\brequire\s*\(/gi, message: "SECURITY ERROR: require() can load arbitrary modules", severity: LINT_TYPES.ERROR, code: 'SECURITY_REQUIRE' },
    { pattern: /\bimport\s+/gi, message: "SECURITY ERROR: import statements are not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_IMPORT' },
    { pattern: /\bimport\s*\(/gi, message: "SECURITY ERROR: dynamic import() is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_DYNAMIC_IMPORT' },
    
    // Storage access
    { pattern: /\blocalStorage\b/gi, message: "SECURITY ERROR: localStorage access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_LOCALSTORAGE' },
    { pattern: /\bsessionStorage\b/gi, message: "SECURITY ERROR: sessionStorage access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_SESSIONSTORAGE' },
    { pattern: /\bindexedDB\b/gi, message: "SECURITY ERROR: indexedDB access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_INDEXEDDB' },
    { pattern: /\bdocument\.cookie\b/gi, message: "SECURITY ERROR: Cookie access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_COOKIE' },
    
    // Dangerous timers with string arguments
    { pattern: /\bsetTimeout\s*\(\s*["'`]/gi, message: "SECURITY ERROR: setTimeout with string argument allows code injection", severity: LINT_TYPES.ERROR, code: 'SECURITY_SETTIMEOUT' },
    { pattern: /\bsetInterval\s*\(\s*["'`]/gi, message: "SECURITY ERROR: setInterval with string argument allows code injection", severity: LINT_TYPES.ERROR, code: 'SECURITY_SETINTERVAL' },
    
    // Prototype manipulation
    { pattern: /\.__proto__\s*=/gi, message: "SECURITY ERROR: Prototype pollution via __proto__", severity: LINT_TYPES.ERROR, code: 'SECURITY_PROTO_POLLUTION' },
    { pattern: /\.constructor\s*=/gi, message: "SECURITY ERROR: Constructor manipulation can lead to prototype pollution", severity: LINT_TYPES.ERROR, code: 'SECURITY_CONSTRUCTOR' },
    { pattern: /\bObject\.prototype\b/gi, message: "SECURITY ERROR: Object.prototype manipulation can lead to prototype pollution", severity: LINT_TYPES.ERROR, code: 'SECURITY_OBJECT_PROTOTYPE' },
    { pattern: /\bArray\.prototype\b/gi, message: "SECURITY ERROR: Array.prototype manipulation can lead to prototype pollution", severity: LINT_TYPES.ERROR, code: 'SECURITY_ARRAY_PROTOTYPE' },
    
    // Dangerous reflection
    { pattern: /\bReflect\s*\./gi, message: "SECURITY ERROR: Reflect API can be used for unauthorized access", severity: LINT_TYPES.ERROR, code: 'SECURITY_REFLECT' },
    { pattern: /\bProxy\s*\(/gi, message: "SECURITY ERROR: Proxy can be used to intercept and modify operations", severity: LINT_TYPES.ERROR, code: 'SECURITY_PROXY' },
    
    // XSS vectors
    { pattern: /\binnerHTML\s*=/gi, message: "SECURITY ERROR: innerHTML can lead to XSS attacks", severity: LINT_TYPES.ERROR, code: 'SECURITY_INNERHTML' },
    { pattern: /\bouterHTML\s*=/gi, message: "SECURITY ERROR: outerHTML can lead to XSS attacks", severity: LINT_TYPES.ERROR, code: 'SECURITY_OUTERHTML' },
    { pattern: /\binsertAdjacentHTML\s*\(/gi, message: "SECURITY ERROR: insertAdjacentHTML can lead to XSS attacks", severity: LINT_TYPES.ERROR, code: 'SECURITY_INSERTADJACENTHTML' },
    { pattern: /\bdocument\.write\s*\(/gi, message: "SECURITY ERROR: document.write() can lead to XSS attacks", severity: LINT_TYPES.ERROR, code: 'SECURITY_DOCUMENT_WRITE' },
    
    // Navigation
    { pattern: /\blocation\s*=/gi, message: "SECURITY ERROR: location manipulation can redirect users", severity: LINT_TYPES.ERROR, code: 'SECURITY_LOCATION' },
    { pattern: /\bwindow\.location\b/gi, message: "SECURITY ERROR: window.location access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_WINDOW_LOCATION' },
    { pattern: /\bhistory\s*\./gi, message: "SECURITY ERROR: history manipulation is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_HISTORY' },
    
    // Clipboard access
    { pattern: /\bnavigator\.clipboard\b/gi, message: "SECURITY ERROR: Clipboard access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_CLIPBOARD' },
    
    // Geolocation
    { pattern: /\bnavigator\.geolocation\b/gi, message: "SECURITY ERROR: Geolocation access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_GEOLOCATION' },
    
    // Camera/Microphone
    { pattern: /\bgetUserMedia\s*\(/gi, message: "SECURITY ERROR: getUserMedia() can access camera/microphone", severity: LINT_TYPES.ERROR, code: 'SECURITY_GETUSERMEDIA' },
    
    // Service Workers
    { pattern: /\bnavigator\.serviceWorker\b/gi, message: "SECURITY ERROR: Service Worker registration is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_SERVICEWORKER' },
    
    // WebRTC
    { pattern: /\bRTCPeerConnection\b/gi, message: "SECURITY ERROR: WebRTC access is not allowed", severity: LINT_TYPES.ERROR, code: 'SECURITY_WEBRTC' },
    
    // Data exfiltration
    { pattern: /\bpostMessage\s*\(/gi, message: "SECURITY ERROR: postMessage() can be used for data exfiltration", severity: LINT_TYPES.ERROR, code: 'SECURITY_POSTMESSAGE' },
    
    // DOM manipulation
    { pattern: /\bcreateElement\s*\(/gi, message: "SECURITY ERROR: createElement() can be used for DOM manipulation", severity: LINT_TYPES.ERROR, code: 'SECURITY_CREATEELEMENT' },
    
    // Base64 encoding (obfuscation)
    { pattern: /\batob\s*\(/gi, message: "SECURITY WARNING: atob() is often used for code obfuscation", severity: LINT_TYPES.WARNING, code: 'SECURITY_ATOB' },
    { pattern: /\bbtoa\s*\(/gi, message: "SECURITY WARNING: btoa() is often used for code obfuscation", severity: LINT_TYPES.WARNING, code: 'SECURITY_BTOA' },
    
    // Dangerous operators
    { pattern: /\bwith\s*\(/gi, message: "SECURITY ERROR: with statement can lead to scope pollution", severity: LINT_TYPES.ERROR, code: 'SECURITY_WITH' },
  ];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    DANGEROUS_PATTERNS.forEach(({ pattern, message, severity, code: errorCode }) => {
      // Reset regex lastIndex to ensure fresh matching
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        // Skip if it's in a comment
        const beforeMatch = line.substring(0, match.index);
        const commentIndex = Math.max(
          beforeMatch.lastIndexOf('//'),
          beforeMatch.lastIndexOf('/*')
        );
        
        if (commentIndex === -1 || commentIndex < match.index) {
          issues.push({
            type: severity,
            line: lineNum,
            column: match.index + 1,
            message: message,
            code: errorCode,
            isSecurity: true
          });
        }
      }
    });
  });
  
  return issues;
}

/**
 * Gets the character position for a line and column
 */
export function getCharPosition(code, line, column) {
  const lines = code.split('\n');
  let position = 0;
  
  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    position += lines[i].length + 1; // +1 for newline
  }
  
  return position + column - 1;
}

