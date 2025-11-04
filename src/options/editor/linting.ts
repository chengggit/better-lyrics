import { linter, type Diagnostic } from "@codemirror/lint";
import { stylelintConfig } from "./config";

const stylelint = window.stylelint;

export const cssLinter = linter(async view => {
  const diagnostics: Diagnostic[] = [];
  const code = view.state.doc.toString();

  const getPosition = (line: number, column: number) => {
    const lines = code.split("\n");
    let offset = 0;
    for (let i = 0; i < line - 1; i++) {
      offset += lines[i].length + 1;
    }
    return offset + column - 1;
  };

  try {
    const result = await stylelint.lint({
      code,
      config: stylelintConfig,
    });

    if (result.results && result.results.length > 0) {
      const warnings = result.results[0].warnings;

      warnings.forEach((warning: any) => {
        const from = getPosition(warning.line, warning.column);
        const to = warning.endLine && warning.endColumn ? getPosition(warning.endLine, warning.endColumn) : from + 1;

        const cleanMessage = warning.text.replace(/\s*\([^)]+\)\s*$/, "").trim();

        diagnostics.push({
          from: Math.max(0, from),
          to: Math.max(from + 1, to),
          severity: warning.severity as "error" | "warning",
          message: cleanMessage,
        });
      });
    }
  } catch (error) {
    console.error("[BetterLyrics] Stylelint error:", error);
  }

  return diagnostics;
});
