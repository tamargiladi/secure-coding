import { useState, useEffect, useRef, useCallback } from 'react';
import CodeEditor from './CodeEditor';
import SecurityTestPanel from './SecurityTestPanel';
import './App.css';
import { validateCode, sanitizeCode, sanitizeOutput, executeSecureCode } from './security';
import { formatCode } from './formatter';
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
  const userIdentifierRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `user-${crypto.randomUUID()}`
      : `user-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  const clearExecutionTimeout = useCallback(() => {
    if (executionTimeoutRef.current) {
      clearTimeout(executionTimeoutRef.current);
      executionTimeoutRef.current = null;
    }
  }, []);

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
  }, [clearExecutionTimeout]);

  useEffect(() => {
    initializeWorker();
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      clearExecutionTimeout();
    };
  }, [initializeWorker, clearExecutionTimeout]);

  const runCode = useCallback(async () => {
    if (isExecuting) return;
    setOutput('');
    setResult('');
    setSecurityWarnings([]);
    setIsExecuting(true);
    clearExecutionTimeout();
    
    try {
      const userIdentifier = userIdentifierRef.current;
      if (!rateLimiter.isAllowed(userIdentifier)) {
        const remaining = rateLimiter.getRemaining(userIdentifier);
        setOutput(sanitizeOutput(`Rate limit exceeded. Please wait before running code again. Remaining requests: ${remaining}`));
        setResult('');
        setIsExecuting(false);
        clearExecutionTimeout();
        return;
      }
      
      const validation = validateCode(code);
      
      if (!validation.valid) {
        setOutput(sanitizeOutput(`Security Error: Code validation failed.\n${validation.errors.join('\n')}`));
        setResult('');
        setIsExecuting(false);
        clearExecutionTimeout();
        return;
      }
      
      if (validation.warnings.length > 0) {
        setSecurityWarnings(validation.warnings);
      }
      
      const sanitizedCode = sanitizeCode(code);

      const fallbackExecute = async () => {
        try {
          const executionResult = await executeSecureCode(sanitizedCode, 5000);
          setResult(executionResult.result ? sanitizeOutput(String(executionResult.result)) : '');
          setOutput(
            executionResult.output
              ? sanitizeOutput(String(executionResult.output))
              : '(No output)'
          );
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

      executionTimeoutRef.current = setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        setOutput(sanitizeOutput('Execution timed out in worker. Running fallback...'));
        fallbackExecute();
      }, 6500);
      
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
        await fallbackExecute();
      }
    } catch (error) {
      setIsExecuting(false);
      clearExecutionTimeout();
      setOutput(sanitizeOutput(`Error: ${error.message}`));
      setResult('');
    }
  }, [code, initializeWorker, isExecuting, clearExecutionTimeout]);

  const handlePrettify = useCallback(() => {
    try {
      const formatted = formatCode(code);
      setCode(formatted);
      setOutput(sanitizeOutput('(Formatted code)'));
    } catch (error) {
      setOutput(sanitizeOutput(`Format error: ${error.message}`));
    }
  }, [code]);

  const handleToggleTestPanel = useCallback(() => {
    setShowTestPanel(prev => !prev);
  }, []);

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
          onClick={handlePrettify}
          className="prettify-button"
          disabled={isExecuting}
        >
          Prettify
        </button>
        <button 
          onClick={handleToggleTestPanel}
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
              <li key={`${index}-${warning}`}>{sanitizeOutput(warning)}</li>
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
