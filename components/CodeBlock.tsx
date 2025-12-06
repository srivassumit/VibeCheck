import React from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'typescript', title }) => {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117] my-4 shadow-lg">
      {title && (
        <div className="bg-slate-800 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center">
          <span>{title}</span>
          <span className="uppercase">{language}</span>
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm leading-relaxed text-slate-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};