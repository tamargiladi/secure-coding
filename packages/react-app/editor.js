// Code Editor Entry Point
import SecurityTestPanel from './src/SecurityTestPanel.jsx';
import CodeEditor from './src/CodeEditor.jsx';
import './src/index.css';

// Initialize the editor
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.querySelector('.App');
  
  if (appContainer) {
    // Initialize CodeEditor and SecurityTestPanel
    console.log('Editor initialized');
  }
});

export { SecurityTestPanel, CodeEditor };
