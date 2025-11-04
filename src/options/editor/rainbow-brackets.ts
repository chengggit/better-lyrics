// https://github.com/eriknewland/rainbowbrackets/blob/main/rainbowBrackets.js
// We have modified it to fit our use case

import { Decoration, EditorView, ViewPlugin } from "@codemirror/view";
import type { BracketStackItem } from "./types";
import { BRACKET_NESTING_LEVELS } from "./config";

const bracketColors = ["#7186f0", "#56c8d8", "#cf6edf", "#6abf69", "#ffad42", "#ff6e40", "#ff5f52"];

const rainbowBracketsPlugin = ViewPlugin.fromClass(
  class {
    decorations;

    constructor(view: EditorView) {
      this.decorations = this.getBracketDecorations(view);
    }

    update(update: any) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = this.getBracketDecorations(update.view);
      }
    }

    getBracketDecorations(view: EditorView) {
      const { doc } = view.state;
      const decorations = [];
      const stack: BracketStackItem[] = [];

      for (let pos = 0; pos < doc.length; pos += 1) {
        const char = doc.sliceString(pos, pos + 1);
        if (char === "(" || char === "[" || char === "{") {
          stack.push({ type: char, from: pos });
        } else if (char === ")" || char === "]" || char === "}") {
          const open = stack.pop();
          if (open && open.type === this.getMatchingBracket(char)) {
            const level = stack.length % BRACKET_NESTING_LEVELS;
            decorations.push(
              Decoration.mark({ class: `rainbow-bracket-level-${level}` }).range(open.from, open.from + 1),
              Decoration.mark({ class: `rainbow-bracket-level-${level}` }).range(pos, pos + 1)
            );
          }
        }
      }

      decorations.sort((a, b) => a.from - b.from);

      return Decoration.set(decorations);
    }

    getMatchingBracket(closingBracket: ")" | "]" | "}"): string | null {
      switch (closingBracket) {
        case ")":
          return "(";
        case "]":
          return "[";
        case "}":
          return "{";
        default:
          return null;
      }
    }
  },
  {
    decorations: v => v.decorations,
  }
);

export function rainbowBrackets() {
  const themeStyles: Record<string, { color: string }> = {};

  for (let level = 0; level < BRACKET_NESTING_LEVELS; level++) {
    const color = bracketColors[level % bracketColors.length];
    themeStyles[`.rainbow-bracket-level-${level}`] = { color };
    themeStyles[`.rainbow-bracket-level-${level} > span`] = { color };
  }

  return [rainbowBracketsPlugin, EditorView.baseTheme(themeStyles)];
}
