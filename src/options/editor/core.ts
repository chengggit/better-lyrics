import {
  acceptCompletion,
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, indentUnit } from "@codemirror/language";
import { lintGutter, lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import {
  crosshairCursor,
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  tooltips,
} from "@codemirror/view";
import { materialDark } from "@fsegurai/codemirror-theme-material-dark";
import { cssLinter } from "./linting";
import { rainbowBrackets } from "./rainbow-brackets";
import { onChange } from "./themes";

export function createEditorState(initialContents: string) {
  let extensions = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    indentUnit.of("  "),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      { key: "Tab", run: acceptCompletion },
      indentWithTab,
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
    css(),
    lintGutter(),
    cssLinter,
    tooltips(),
    materialDark,
    rainbowBrackets(),
    EditorView.updateListener.of(update => {
      let text = update.state.doc.toString();
      if (update.docChanged && !text.startsWith("Loading")) {
        onChange(text);
      }
    }),
  ];

  return EditorState.create({
    doc: initialContents,
    extensions,
  });
}

export function createEditorView(state: EditorState, parent: Element) {
  return new EditorView({ state, parent });
}
