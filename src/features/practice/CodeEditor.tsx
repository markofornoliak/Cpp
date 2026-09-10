import { useEffect, useRef } from 'react';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
} from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { bracketMatching, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#7043ab' },
  { tag: [tags.typeName, tags.className], color: '#075985' },
  { tag: [tags.number, tags.bool, tags.atom], color: '#934000' },
  { tag: [tags.string, tags.character], color: '#14613a' },
  { tag: tags.comment, color: '#626b79' },
  { tag: [tags.meta, tags.processingInstruction], color: '#944020' },
]);
export default function CodeEditor({
  value,
  onChange,
  fontSize,
  wrap,
}: {
  value: string;
  onChange: (value: string) => void;
  fontSize: number;
  wrap: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    editor = useRef<EditorView | null>(null);
  const callback = useRef(onChange),
    document = useRef(value);
  useEffect(() => {
    document.current = value;
  }, [value]);
  useEffect(() => {
    callback.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: document.current,
        extensions: [
          lineNumbers(),
          history(),
          drawSelection(),
          highlightActiveLine(),
          bracketMatching(),
          cpp(),
          syntaxHighlighting(highlightStyle),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorState.transactionFilter.of((transaction) =>
            transaction.newDoc.length > 30000 ? [] : transaction,
          ),
          EditorView.contentAttributes.of({
            'aria-label': 'C++ source code',
            'aria-describedby': 'editor-help',
            tabindex: '0',
            spellcheck: 'false',
            autocorrect: 'off',
            autocapitalize: 'off',
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callback.current(update.state.doc.toString());
          }),
          EditorView.theme({
            '&': { fontSize: `${fontSize}px` },
            '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.8', overflow: 'auto' },
            '.cm-content': { padding: '20px 0', minHeight: '340px' },
            '.cm-line': { padding: '0 20px 0 12px' },
            '.cm-gutters': {
              background: '#fafbfc',
              border: 'none',
              color: '#777f8d',
              padding: '0 4px 0 12px',
            },
            '&.cm-focused': { outline: '2px solid #175cd3', outlineOffset: '-2px' },
            '.cm-activeLine': { background: '#edf3ff80' },
            '.cm-cursor': { borderLeftColor: '#175cd3' },
          }),
          ...(wrap ? [EditorView.lineWrapping] : []),
        ],
      }),
    });
    view.scrollDOM.tabIndex = 0;
    view.scrollDOM.setAttribute('aria-label', 'Scrollable C++ editor');
    editor.current = view;
    return () => {
      view.destroy();
      editor.current = null;
    };
  }, [fontSize, wrap]);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== value)
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);
  return <div className="editor-host" ref={host} />;
}
