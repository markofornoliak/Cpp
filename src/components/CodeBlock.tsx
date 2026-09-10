import { useMemo } from 'react';
import { cppLanguage } from '@codemirror/lang-cpp';
import { highlightTree, classHighlighter } from '@lezer/highlight';
export default function CodeBlock({ code }: { code: string }) {
  const tokens = useMemo(() => {
    const pieces: { text: string; className?: string }[] = [];
    let position = 0;
    highlightTree(cppLanguage.parser.parse(code), classHighlighter, (from, to, className) => {
      if (from > position) pieces.push({ text: code.slice(position, from) });
      pieces.push({ text: code.slice(from, to), className });
      position = to;
    });
    if (position < code.length) pieces.push({ text: code.slice(position) });
    return pieces;
  }, [code]);
  return (
    <div className="code-example">
      <div className="code-caption">
        <span>main.cpp</span>
        <span>C++17</span>
      </div>
      <pre tabIndex={0} aria-label="C++ code example">
        <code>
          {tokens.map((token, i) => (
            <span key={i} className={token.className}>
              {token.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
