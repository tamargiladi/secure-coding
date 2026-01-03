/**
 * Custom JavaScript Syntax Highlighter
 * Tokenizes and highlights JavaScript code
 */

// JavaScript keywords
const KEYWORDS = [
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
  'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
  'let', 'static', 'enum', 'implements', 'interface', 'package', 'private',
  'protected', 'public', 'abstract', 'boolean', 'byte', 'char', 'double',
  'final', 'float', 'goto', 'int', 'long', 'native', 'short', 'synchronized',
  'throws', 'transient', 'volatile', 'null', 'true', 'false', 'undefined',
  'async', 'await', 'from', 'as', 'of'
];

// Built-in objects and functions
const BUILTINS = [
  'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON',
  'RegExp', 'Error', 'TypeError', 'ReferenceError', 'SyntaxError', 'Promise',
  'Set', 'Map', 'WeakSet', 'WeakMap', 'Symbol', 'Proxy', 'Reflect',
  'console', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURI',
  'decodeURI', 'encodeURIComponent', 'decodeURIComponent', 'eval', 'Function'
];

// Token types
const TOKEN_TYPES = {
  KEYWORD: 'keyword',
  BUILTIN: 'builtin',
  STRING: 'string',
  NUMBER: 'number',
  COMMENT: 'comment',
  OPERATOR: 'operator',
  PUNCTUATION: 'punctuation',
  FUNCTION: 'function',
  VARIABLE: 'variable',
  REGEX: 'regex'
};

/**
 * Tokenizes JavaScript code
 */
export function tokenize(code) {
  const tokens = [];
  let i = 0;
  const len = code.length;

  while (i < len) {
    // Skip whitespace
    if (/\s/.test(code[i])) {
      let whitespace = '';
      while (i < len && /\s/.test(code[i])) {
        whitespace += code[i];
        i++;
      }
      tokens.push({ type: 'whitespace', value: whitespace });
      continue;
    }

    // Comments - single line
    if (code[i] === '/' && code[i + 1] === '/') {
      let comment = '';
      while (i < len && code[i] !== '\n') {
        comment += code[i];
        i++;
      }
      tokens.push({ type: TOKEN_TYPES.COMMENT, value: comment });
      continue;
    }

    // Comments - multi-line
    if (code[i] === '/' && code[i + 1] === '*') {
      let comment = '';
      while (i < len - 1 && !(code[i] === '*' && code[i + 1] === '/')) {
        comment += code[i];
        i++;
      }
      if (i < len - 1) {
        comment += '*/';
        i += 2;
      }
      tokens.push({ type: TOKEN_TYPES.COMMENT, value: comment });
      continue;
    }

    // Strings - single quotes
    if (code[i] === "'") {
      let str = "'";
      i++;
      let escaped = false;
      while (i < len) {
        if (escaped) {
          str += code[i];
          escaped = false;
          i++;
        } else if (code[i] === '\\') {
          str += code[i];
          escaped = true;
          i++;
        } else if (code[i] === "'") {
          str += code[i];
          i++;
          break;
        } else {
          str += code[i];
          i++;
        }
      }
      tokens.push({ type: TOKEN_TYPES.STRING, value: str });
      continue;
    }

    // Strings - double quotes
    if (code[i] === '"') {
      let str = '"';
      i++;
      let escaped = false;
      while (i < len) {
        if (escaped) {
          str += code[i];
          escaped = false;
          i++;
        } else if (code[i] === '\\') {
          str += code[i];
          escaped = true;
          i++;
        } else if (code[i] === '"') {
          str += code[i];
          i++;
          break;
        } else {
          str += code[i];
          i++;
        }
      }
      tokens.push({ type: TOKEN_TYPES.STRING, value: str });
      continue;
    }

    // Template literals
    if (code[i] === '`') {
      let str = '`';
      i++;
      let escaped = false;
      while (i < len) {
        if (escaped) {
          str += code[i];
          escaped = false;
          i++;
        } else if (code[i] === '\\') {
          str += code[i];
          escaped = true;
          i++;
        } else if (code[i] === '`') {
          str += code[i];
          i++;
          break;
        } else {
          str += code[i];
          i++;
        }
      }
      tokens.push({ type: TOKEN_TYPES.STRING, value: str });
      continue;
    }

    // Regular expressions - simplified detection
    // Only treat as regex if it's after certain characters or at start of line
    if (code[i] === '/' && i > 0) {
      const prevChar = code[i - 1];
      // Check if previous char suggests this is a regex (not division)
      if (/[=,;:([{+\-*%&|<>!?~^}\s]/.test(prevChar)) {
        let regex = '/';
        i++;
        let escaped = false;
        let found = false;
        while (i < len) {
          if (escaped) {
            regex += code[i];
            escaped = false;
            i++;
          } else if (code[i] === '\\') {
            regex += code[i];
            escaped = true;
            i++;
          } else if (code[i] === '/') {
            regex += code[i];
            i++;
            found = true;
            // Check for regex flags
            while (i < len && /[gimsuvy]/.test(code[i])) {
              regex += code[i];
              i++;
            }
            break;
          } else {
            regex += code[i];
            i++;
          }
        }
        if (found) {
          tokens.push({ type: TOKEN_TYPES.REGEX, value: regex });
          continue;
        } else {
          // Not a valid regex, treat as division operator
          tokens.push({ type: TOKEN_TYPES.OPERATOR, value: '/' });
          continue;
        }
      }
    }

    // Numbers
    if (/\d/.test(code[i])) {
      let num = '';
      while (i < len && (/[\d.eE+-]/.test(code[i]) || (code[i] === 'x' && num === '0'))) {
        num += code[i];
        i++;
      }
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: num });
      continue;
    }

    // Operators and punctuation
    const operators = [
      '===', '!==', '==', '!=', '<=', '>=', '=>', '++', '--', '&&', '||',
      '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=',
      '<<', '>>', '>>>', '**', '??', '?.'
    ];

    let matched = false;
    for (const op of operators) {
      if (code.substring(i, i + op.length) === op) {
        tokens.push({ type: TOKEN_TYPES.OPERATOR, value: op });
        i += op.length;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // Single character operators and punctuation
    if (/[+\-*/%=&|^<>!?:;,.()[\]{}]/.test(code[i])) {
      tokens.push({ type: TOKEN_TYPES.PUNCTUATION, value: code[i] });
      i++;
      continue;
    }

    // Identifiers, keywords, builtins
    if (/[a-zA-Z_$]/.test(code[i])) {
      let ident = '';
      while (i < len && /[a-zA-Z0-9_$]/.test(code[i])) {
        ident += code[i];
        i++;
      }

      const lowerIdent = ident.toLowerCase();
      if (KEYWORDS.includes(lowerIdent)) {
        tokens.push({ type: TOKEN_TYPES.KEYWORD, value: ident });
      } else if (BUILTINS.includes(ident)) {
        tokens.push({ type: TOKEN_TYPES.BUILTIN, value: ident });
      } else {
        // Check if it's a function call (next token is '(')
        let j = i;
        while (j < len && /\s/.test(code[j])) j++;
        if (j < len && code[j] === '(') {
          tokens.push({ type: TOKEN_TYPES.FUNCTION, value: ident });
        } else {
          tokens.push({ type: TOKEN_TYPES.VARIABLE, value: ident });
        }
      }
      continue;
    }

    // Unknown character
    tokens.push({ type: 'unknown', value: code[i] });
    i++;
  }

  return tokens;
}

/**
 * Highlights code by wrapping tokens in spans with CSS classes
 */
export function highlight(code) {
  const tokens = tokenize(code);
  const highlighted = tokens.map(token => {
    if (token.type === 'whitespace') {
      // Preserve whitespace exactly, including newlines
      return escapeHtml(token.value);
    }
    return `<span class="token-${token.type}">${escapeHtml(token.value)}</span>`;
  }).join('');

  return highlighted;
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

