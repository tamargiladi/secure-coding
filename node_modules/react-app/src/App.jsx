import { useState, useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor';
import SecurityTestPanel from './SecurityTestPanel';
import './App.css';
import { useCallback } from 'react';
import { validateCode, sanitizeCode, sanitizeOutput, executeSecureCode } from './security';
import rateLimiter from './rateLimiter';

function App() {
  const [code, setCode] = useState(`// Welcome to the Online Code Editor
console.log('Hello, World!');

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('User'));`);
  const [output, setOutput] = useState('');
  const [result, setResult] = useState('');
  const [securityWarnings, setSecurityWarnings] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const workerRef = useRef(null);
  const executionTimeoutRef = useRef(null);

  const clearExecutionTimeout = () => {
    if (executionTimeoutRef.current) {
      clearTimeout(executionTimeoutRef.current);
      executionTimeoutRef.current = null;
    }
  };

  const initializeWorker = useCallback(() => {
    try {
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      const worker = new Worker(
        new URL('./codeWorker.js', import.meta.url),
        { type: 'module' }
      );
      
      worker.onmessage = (e) => {
        const { result: workerResult, output: workerOutput, error } = e.data;
        setIsExecuting(false);
        clearExecutionTimeout();
        
        if (error) {
          setOutput(sanitizeOutput(`Error: ${error}\n${workerOutput || ''}`));
          setResult('');
        } else {
          setResult(workerResult ? sanitizeOutput(workerResult) : '');
          setOutput(workerOutput ? sanitizeOutput(workerOutput) : '(No output)');
        }
      };
      
      worker.onerror = (error) => {
        setIsExecuting(false);
        clearExecutionTimeout();
        setOutput(sanitizeOutput(`Worker Error: ${error.message}`));
        setResult('');
      };

      workerRef.current = worker;
    } catch (error) {
      console.warn('Web Worker not available, falling back to secure execution:', error);
      workerRef.current = null;
    }
  }, []);

  // Initialize Web Worker for secure execution
  useEffect(() => {
    initializeWorker();
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      clearExecutionTimeout();
    };
  }, [initializeWorker]);

  const runCode = async () => {
    if (isExecuting) return;
    setOutput('');
    setResult('');
    setSecurityWarnings([]);
    setIsExecuting(true);
    clearExecutionTimeout();
    
    try {
      // Step 0: Rate limiting check
      const userIdentifier = 'user'; // In production, use actual user ID or IP
      if (!rateLimiter.isAllowed(userIdentifier)) {
        const remaining = rateLimiter.getRemaining(userIdentifier);
        setOutput(sanitizeOutput(`Rate limit exceeded. Please wait before running code again. Remaining requests: ${remaining}`));
        setResult('');
        setIsExecuting(false);
        clearExecutionTimeout();
        return;
      }
      
      // Step 1: Validate code for dangerous patterns
      const validation = validateCode(code);
      
      if (!validation.valid) {
        setOutput(sanitizeOutput(`Security Error: Code validation failed.\n${validation.errors.join('\n')}`));
        setResult('');
        setIsExecuting(false);
        clearExecutionTimeout();
        return;
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        setSecurityWarnings(validation.warnings);
      }
      
      // Step 2: Sanitize code
      const sanitizedCode = sanitizeCode(code);

      // Helper: fallback secure execution if worker hangs
      const fallbackExecute = async () => {
        try {
          const executionResult = await executeSecureCode(sanitizedCode, 5000);
          setResult(executionResult.result ? sanitizeOutput(String(executionResult.result)) : '');
          setOutput('(No output)');
          if (executionResult.warnings && executionResult.warnings.length > 0) {
            setSecurityWarnings(prev => [...prev, ...executionResult.warnings]);
          }
        } catch (error) {
          setOutput(sanitizeOutput(`Error: ${error.message}`));
          setResult('');
        } finally {
          clearExecutionTimeout();
          setIsExecuting(false);
        }
      };

      // Fail-safe timeout in case worker hangs
      executionTimeoutRef.current = setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        setOutput(sanitizeOutput('Execution timed out in worker. Running fallback...'));
        fallbackExecute();
      }, 6500);
      
      // Step 3: Execute code securely
      // Try Web Worker first (more secure), fallback to secure execution
      if (!workerRef.current) {
        initializeWorker();
      }

      if (workerRef.current) {
        try {
          workerRef.current.postMessage({
            code: sanitizedCode,
            timeout: 5000
          });
        } catch (error) {
          clearExecutionTimeout();
          setIsExecuting(false);
          setOutput(sanitizeOutput(`Worker failed: ${error.message}`));
          setResult('');
          workerRef.current = null;
        }
      } else {
        // Fallback to secure execution without worker
        await fallbackExecute();
      }
    } catch (error) {
      setIsExecuting(false);
      clearExecutionTimeout();
      setOutput(sanitizeOutput(`Error: ${error.message}`));
      setResult('');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Online Code Editor</h1>
        <p className="security-badge">🔒 Secure Execution Environment</p>
      </header>
      <div className="button-group">
        <button 
          onClick={runCode} 
          className="run-button"
          disabled={isExecuting}
        >
          {isExecuting ? 'Executing...' : 'Run Code (Ctrl/Cmd + Enter)'}
        </button>
        <button 
          onClick={() => setShowTestPanel(!showTestPanel)}
          className="test-panel-toggle"
        >
          {showTestPanel ? 'Hide' : 'Show'} Test Examples
        </button>
      </div>
      {showTestPanel && (
        <div className="panel-animate">
          <SecurityTestPanel onLoadCode={setCode} />
        </div>
      )}
      {securityWarnings.length > 0 && (
        <div className="security-warnings pop-card">
          <h4>⚠️ Security Warnings:</h4>
          <ul>
            {securityWarnings.map((warning, index) => (
              <li key={index}>{sanitizeOutput(warning)}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="editor-wrapper floating-panel">
        <CodeEditor
          value={code}
          onChange={setCode}
          onRun={runCode}
        />
      </div>
      {result && (
        <div className="result-container pop-card">
          <h3>Result:</h3>
          <pre>{result}</pre>
        </div>
      )}
      <div className="output-container pop-card">
        <h3>Output:</h3>
        <pre>{output || '(No output)'}</pre>
      </div>
    </div>
  );
}

export default App;
