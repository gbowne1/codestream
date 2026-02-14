module.exports = {
  // Enforce semicolons at the end of statements (Requested in ProgrammerNotes: "semi: true")
  semi: true,

  // Use trailing commas where valid in ES5 (objects, arrays, etc.) to minimize git diffs when adding new items
  trailingComma: 'es5',

  // Use single quotes instead of double quotes (Requested in Issue #80: "single and double quote are consistent")
  singleQuote: true,

  // Wrap lines at 80 characters to ensure readability on split screens and standard terminals
  printWidth: 80,

  // Set indentation to 2 spaces (Standard for modern JS/TS projects and requested in ProgrammerNotes)
  tabWidth: 2,

  // Maintain consistent line endings regardless of OS (Windows/Linux) to prevent git warnings
  endOfLine: 'auto',

  // Always include parentheses around arrow function parameters, e.g., `(x) => x` instead of `x => x`
  // (Makes it easier to add types or extra arguments later)
  arrowParens: 'always',

  // Put the `>` of a multi-line JSX element on a new line (improves readability for React components)
  bracketSameLine: false,
};
