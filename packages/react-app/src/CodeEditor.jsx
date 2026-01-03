import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './CodeEditor.css';
import { highlight } from './syntaxHighlighter';
import { lint, LINT_TYPES } from './linter';

function CodeEditor({ value, onChange, onRun }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const [filters, setFilters] = useState({
    errors: true,
    warnings: true,
    info: true,
    security: true
  });

  const lines = useMemo(() => value.split('\n'), [value]);

  // Generate highlighted HTML
  const highlightedCode = useMemo(() => {
    return highlight(value);
  }, [value]);

  // Lint the code
  const lintIssues = useMemo(() => {
    return lint(value);
  }, [value]);

  // Filter issues based on active filters
  const filteredIssues = useMemo(() => {
    return lintIssues.filter(issue => {
      if (issue.isSecurity && !filters.security) return false;
      if (issue.type === LINT_TYPES.ERROR && !filters.errors) return false;
      if (issue.type === LINT_TYPES.WARNING && !filters.warnings) return false;
      if (issue.type === LINT_TYPES.INFO && !filters.info) return false;
      return true;
    });
  }, [lintIssues, filters]);

  const lineNumbers = useMemo(() => lines.map((_, index) => (index + 1).toString()), [lines]);

  // Sync scroll between textarea and highlight overlay
  useEffect(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    const lineNumbers = lineNumbersRef.current;

    const syncScroll = () => {
      if (highlight) {
        highlight.scrollTop = textarea.scrollTop;
        highlight.scrollLeft = textarea.scrollLeft;
      }
      if (lineNumbers) {
        lineNumbers.scrollTop = textarea.scrollTop;
      }
    };

    textarea.addEventListener('scroll', syncScroll);
    return () => textarea.removeEventListener('scroll', syncScroll);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
    
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
    }
  }, [onChange, onRun, value]);

  const handleScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const highlight = highlightRef.current;
    const lineNumbers = lineNumbersRef.current;
    
    if (highlight) {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    }
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  }, []);

  // Get issues for a specific line (using filtered issues for display)
  const getLineIssues = (lineNum) => {
    return filteredIssues.filter(issue => issue.line === lineNum);
  };

  // Get all issues for a specific line (for determining line number color)
  const getAllLineIssues = (lineNum) => {
    return lintIssues.filter(issue => issue.line === lineNum);
  };

  // Get the most severe issue for a line (using all issues for line number coloring)
  const getLineIssueType = (lineNum) => {
    const issues = getAllLineIssues(lineNum);
    if (issues.some(i => i.type === LINT_TYPES.ERROR)) return 'error';
    if (issues.some(i => i.type === LINT_TYPES.WARNING)) return 'warning';
    if (issues.some(i => i.type === LINT_TYPES.INFO)) return 'info';
    return null;
  };

  // Check if line has security errors (using all issues)
  const hasSecurityError = (lineNum) => {
    const issues = getAllLineIssues(lineNum);
    return issues.some(i => i.isSecurity && i.type === LINT_TYPES.ERROR);
  };

  // Toggle filter
  const toggleFilter = useCallback((filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  }, []);

  const handleToggleErrors = useCallback(() => toggleFilter('errors'), [toggleFilter]);
  const handleToggleWarnings = useCallback(() => toggleFilter('warnings'), [toggleFilter]);
  const handleToggleInfo = useCallback(() => toggleFilter('info'), [toggleFilter]);
  const handleToggleSecurity = useCallback(() => toggleFilter('security'), [toggleFilter]);

  const handleChange = useCallback(
    (e) => onChange(e.target.value),
    [onChange]
  );

  const handleIssueClick = useCallback(
    (issue) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const lineStart = lines.slice(0, issue.line - 1).join('\n').length + (issue.line > 1 ? 1 : 0);
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart);
      const lineHeight = 20;
      const containerHeight = textarea.clientHeight;
      const scrollTop = Math.max(0, (issue.line - 1) * lineHeight - containerHeight / 2);
      textarea.scrollTop = scrollTop;
    },
    [lines]
  );

  const lintMarkerPositions = useMemo(() => {
    const charWidth = 8.4;
    return filteredIssues.map((issue) => {
      const issueLine = lines[issue.line - 1] || '';
      const beforeIssue = issueLine.substring(0, Math.min(issue.column - 1, issueLine.length));
      return {
        issue,
        key: `${issue.line}-${issue.column}-${issue.code || issue.message}`,
        style: {
          '--marker-top': `${(issue.line - 1) * 20 + 10}px`,
          '--marker-left': `${10 + (beforeIssue.length * charWidth)}px`,
          '--marker-width': `${Math.max(4 * charWidth, 20)}px`
        }
      };
    });
  }, [filteredIssues, lines]);

  return (
    <div className="code-editor-container">
      <div className="code-editor-main">
        <div ref={lineNumbersRef} className="line-numbers">
          {lineNumbers.map((num) => {
            const lineNum = Number(num);
            const issueType = getLineIssueType(lineNum);
            const issues = getLineIssues(lineNum);
            const issueTitle = issues.length > 0 
              ? issues.map(i => i.message).join('; ')
              : '';
            
            const isSecurity = hasSecurityError(lineNum);
            return (
              <div 
                key={`line-${lineNum}`} 
                className={`line-number ${issueType ? `line-${issueType}` : ''} ${isSecurity ? 'security-error' : ''}`}
                title={issueTitle}
              >
                {num}
              </div>
            );
          })}
        </div>
        <div className="editor-wrapper">
        <pre
          ref={highlightRef}
          className="code-highlight"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
        <textarea
          ref={textareaRef}
          className="code-editor"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          placeholder="// Write your JavaScript code here..."
        />
        {/* Linting error markers */}
        <div className="lint-markers">
          {lintMarkerPositions.map(({ issue, key, style }) => (
            <div
              key={key}
              className={`lint-marker lint-${issue.type} ${issue.isSecurity ? 'security-error' : ''}`}
              style={style}
              title={issue.message}
            />
          ))}
        </div>
      </div>
      </div>
      {/* Linting issues panel */}
      {lintIssues.length > 0 && (
        <div className="lint-panel">
          <div className="lint-panel-header">
            <div className="lint-header-top">
              <span className="lint-count">
                {lintIssues.filter(i => i.isSecurity && i.type === LINT_TYPES.ERROR).length > 0 && (
                  <span className="security-error-count">
                    🔒 {lintIssues.filter(i => i.isSecurity && i.type === LINT_TYPES.ERROR).length} SECURITY ERROR(S) -{' '}
                  </span>
                )}
                {lintIssues.filter(i => i.type === LINT_TYPES.ERROR).length} error(s),{' '}
                {lintIssues.filter(i => i.type === LINT_TYPES.WARNING).length} warning(s)
                {filteredIssues.length !== lintIssues.length && (
                  <span className="filtered-count">
                    {' '}(showing {filteredIssues.length} of {lintIssues.length})
                  </span>
                )}
              </span>
            </div>
            <div className="lint-filters">
              <button
                className={`lint-filter-btn ${filters.errors ? 'active' : ''} filter-error`}
                onClick={handleToggleErrors}
                title="Toggle error display"
              >
                <span className="filter-icon">●</span> Errors ({lintIssues.filter(i => i.type === LINT_TYPES.ERROR).length})
              </button>
              <button
                className={`lint-filter-btn ${filters.warnings ? 'active' : ''} filter-warning`}
                onClick={handleToggleWarnings}
                title="Toggle warning display"
              >
                <span className="filter-icon">●</span> Warnings ({lintIssues.filter(i => i.type === LINT_TYPES.WARNING).length})
              </button>
              <button
                className={`lint-filter-btn ${filters.info ? 'active' : ''} filter-info`}
                onClick={handleToggleInfo}
                title="Toggle info display"
              >
                <span className="filter-icon">●</span> Info ({lintIssues.filter(i => i.type === LINT_TYPES.INFO).length})
              </button>
              <button
                className={`lint-filter-btn ${filters.security ? 'active' : ''} filter-security`}
                onClick={handleToggleSecurity}
                title="Toggle security errors display"
              >
                <span className="filter-icon">🔒</span> Security ({lintIssues.filter(i => i.isSecurity).length})
              </button>
            </div>
          </div>
          <div className="lint-issues-list">
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
              <button
                key={`${issue.line}-${issue.column}-${issue.code || issue.message}`}
                type="button"
                className={`lint-issue lint-issue-${issue.type} ${issue.isSecurity ? 'security-error' : ''}`}
                onClick={() => handleIssueClick(issue)}
              >
                <span className="lint-issue-line">{issue.line}:{issue.column}</span>
                <span className="lint-issue-message">{issue.message}</span>
                <span className="lint-issue-code">{issue.code}</span>
              </button>
              ))
            ) : (
              <div className="lint-no-results">
                No issues match the current filters
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(CodeEditor);

