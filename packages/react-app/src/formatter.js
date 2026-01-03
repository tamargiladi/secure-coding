/**
 * Lightweight code formatter for the editor.
 * Indents based on curly braces only to avoid heavy dependencies.
 */
export function formatCode(source) {
  if (typeof source !== 'string' || source.length === 0) {
    return '';
  }

  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const indentUnit = '  ';
  let indentLevel = 0;
  const formatted = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trimEnd();
    const content = trimmed.trimStart();

    if (content.length === 0) {
      formatted.push('');
      continue;
    }

    // Decrease indent before writing the line if it starts with a closing brace
    const startsWithCloser = /^[}\]]/.test(content);
    const effectiveIndent = Math.max(0, indentLevel - (startsWithCloser ? 1 : 0));
    formatted.push(`${indentUnit.repeat(effectiveIndent)}${content}`);

    // Adjust indent for subsequent lines using curly braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    indentLevel = Math.max(0, indentLevel + openBraces - closeBraces);
  }

  return formatted.join('\n');
}
