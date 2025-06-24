import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isMarkdown } from '../../utils/markdownHelpers';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className = '' }) => {
  // Si no es Markdown, mostrar como texto plano con formato preservado
  if (!isMarkdown(content)) {
    return (
      <pre className={`whitespace-pre-wrap text-sm ${className}`}>
        {content}
      </pre>
    );
  }

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Personalizar componentes para mejor integración con Tailwind
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mb-2 text-gray-800">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-bold mb-1 text-gray-800">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mb-1 text-gray-700">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-xs font-semibold mb-1 text-gray-700">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-medium mb-1 text-gray-600">{children}</h6>
          ),
          p: ({ children }) => (
            <p className="mb-2 text-sm text-gray-700 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800">{children}</em>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-gray-100 text-gray-800 p-2 rounded text-xs font-mono overflow-x-auto">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc ml-4 mb-2 text-sm space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-4 mb-2 text-sm space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600 mb-2">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded border mb-2"
            />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-gray-300 text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-200">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-900">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-2 py-1 text-gray-700">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="border-t border-gray-300 my-3" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;