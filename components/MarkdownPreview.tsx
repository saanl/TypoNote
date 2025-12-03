import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { MarkdownThemeName } from '../types';

interface Props {
  content: string;
  className?: string;
  centered?: boolean;
  theme?: MarkdownThemeName;
  enableHtml?: boolean;
  customCss?: string;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onMouseEnter?: () => void;
}

// Definition of styles for different elements per theme
const THEME_STYLES: Record<MarkdownThemeName, any> = {
  default: {
    wrapper: "prose max-w-none text-[var(--text-primary)]",
    h1: "text-4xl font-bold mb-6 mt-8 pb-2 border-b border-[var(--border)]",
    h2: "text-3xl font-semibold mb-5 mt-8",
    h3: "text-2xl font-semibold mb-4 mt-6",
    link: "text-[var(--accent)] hover:underline cursor-pointer",
    codeInline: "bg-[var(--bg-secondary)] rounded px-1.5 py-0.5 text-sm font-mono text-[var(--accent)]",
    codeBlock: "bg-[var(--bg-secondary)] rounded-lg p-4 overflow-x-auto mb-4 border border-[var(--border)]",
    blockquote: "border-l-4 border-[var(--accent)] pl-4 italic my-4 text-[var(--text-secondary)]",
    table: "min-w-full divide-y divide-[var(--border)]",
    th: "px-3 py-2 bg-[var(--bg-secondary)] text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider",
    td: "px-3 py-2 whitespace-nowrap border-t border-[var(--border)]",
    hr: "my-8 border-[var(--border)]",
  },
  github: {
    wrapper: "prose max-w-none font-sans text-gray-900 dark:text-gray-100",
    h1: "text-3xl font-semibold pb-2 mb-6 mt-8 border-b border-gray-200 dark:border-gray-700",
    h2: "text-2xl font-semibold pb-1 mb-5 mt-8 border-b border-gray-200 dark:border-gray-700",
    h3: "text-xl font-semibold mb-4 mt-6",
    link: "text-blue-600 dark:text-blue-400 hover:underline cursor-pointer",
    codeInline: "bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono text-gray-800 dark:text-gray-200",
    codeBlock: "bg-gray-100 dark:bg-gray-800 rounded-md p-4 overflow-x-auto mb-4",
    blockquote: "border-l-4 border-gray-300 dark:border-gray-600 pl-4 text-gray-600 dark:text-gray-400 my-4",
    table: "min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700",
    th: "px-3 py-2 bg-gray-50 dark:bg-gray-800 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700",
    td: "px-3 py-2 border border-gray-300 dark:border-gray-700",
    hr: "my-8 border-gray-300 dark:border-gray-700 h-[2px] bg-gray-100",
  },
  vercel: {
    wrapper: "prose max-w-none font-sans tracking-tight text-black dark:text-white antialiased",
    h1: "text-4xl font-extrabold mb-6 mt-10 tracking-tighter",
    h2: "text-2xl font-bold mb-4 mt-8 tracking-tight",
    h3: "text-xl font-bold mb-3 mt-6",
    link: "text-black dark:text-white underline decoration-gray-400 underline-offset-4 hover:decoration-black dark:hover:decoration-white transition-all cursor-pointer",
    codeInline: "text-pink-500 font-mono text-sm bg-gray-100 dark:bg-[#111] px-1 py-0.5 rounded border border-gray-200 dark:border-gray-800",
    codeBlock: "bg-gray-50 dark:bg-[#111] rounded-lg p-4 overflow-x-auto mb-6 border border-gray-200 dark:border-gray-800",
    blockquote: "border-l-[3px] border-black dark:border-white pl-6 italic my-6 text-gray-600 dark:text-gray-400",
    table: "min-w-full text-sm",
    th: "text-left py-2 font-medium text-gray-500 border-b border-gray-200 dark:border-gray-800",
    td: "py-2 border-b border-gray-100 dark:border-gray-900",
    hr: "my-12 border-gray-200 dark:border-gray-800",
  },
  latex: {
    wrapper: "prose max-w-none font-serif text-justify leading-relaxed text-gray-900 dark:text-gray-100",
    h1: "text-3xl font-bold text-center uppercase tracking-wide mb-8 mt-12",
    h2: "text-xl font-bold mb-4 mt-8 uppercase tracking-wide border-b-2 border-black dark:border-white pb-1 inline-block",
    h3: "text-lg font-bold italic mb-3 mt-6",
    link: "text-black dark:text-white hover:underline cursor-pointer",
    codeInline: "font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1",
    codeBlock: "bg-gray-50 dark:bg-gray-900 p-4 mb-4 border-l-2 border-black dark:border-white font-mono text-sm",
    blockquote: "pl-4 ml-4 font-normal text-gray-600 dark:text-gray-400 my-4 border-l border-gray-400",
    table: "min-w-full border-collapse border-t-2 border-b-2 border-black dark:border-white my-6",
    th: "px-4 py-2 text-center font-bold uppercase text-xs border-b border-black dark:border-white",
    td: "px-4 py-2 text-center border-b border-gray-200 dark:border-gray-800 last:border-0",
    hr: "my-8 border-black dark:border-white border-t w-1/3 mx-auto",
  },
  vscode: {
    wrapper: "prose max-w-none font-sans text-[15px] leading-7 text-[#24292e] dark:text-[#d4d4d4]",
    h1: "text-2xl font-bold mb-4 mt-6 pb-2 border-b border-[#e1e4e8] dark:border-[#444]",
    h2: "text-xl font-bold mb-4 mt-6 pb-1 border-b border-[#e1e4e8] dark:border-[#444]",
    h3: "text-lg font-bold mb-3 mt-5",
    link: "text-[#0366d6] dark:text-[#3794ff] hover:underline cursor-pointer",
    codeInline: "font-mono text-sm bg-[rgba(27,31,35,0.05)] dark:bg-[rgba(255,255,255,0.1)] px-1 rounded-sm text-[#d7ba7d]",
    codeBlock: "bg-[#f6f8fa] dark:bg-[#1e1e1e] rounded p-4 mb-4 overflow-x-auto border border-[#e1e4e8] dark:border-none",
    blockquote: "border-l-4 border-[#dfe2e5] dark:border-[#474747] pl-4 text-[#6a737d] dark:text-[#808080] my-4",
    table: "min-w-full",
    th: "px-3 py-2 bg-transparent font-bold border border-[#dfe2e5] dark:border-[#474747]",
    td: "px-3 py-2 border border-[#dfe2e5] dark:border-[#474747]",
    hr: "my-6 h-[1px] bg-[#e1e4e8] dark:bg-[#474747] border-0",
  }
};

const MarkdownPreview: React.FC<Props> = ({ 
  content, 
  className, 
  centered, 
  theme = 'default',
  enableHtml = false,
  customCss = '',
  scrollRef,
  onScroll,
  onMouseEnter
}) => {
  const s = THEME_STYLES[theme] || THEME_STYLES.default;
  const plugins = [remarkGfm];
  // rehypeRaw allows rendering raw HTML in markdown
  const rehypePlugins = enableHtml ? [rehypeRaw] : [];

  return (
    <div 
      ref={scrollRef}
      onScroll={onScroll}
      onMouseEnter={onMouseEnter}
      className={`markdown-preview ${s.wrapper} ${centered ? 'max-w-4xl mx-auto' : ''} p-8 overflow-y-auto transition-[max-width,margin] duration-500 ${className}`}
    >
      {enableHtml && customCss && (
          <style>{customCss}</style>
      )}
      <ReactMarkdown 
        remarkPlugins={plugins}
        rehypePlugins={rehypePlugins}
        components={{
          h1: ({node, ...props}) => <h1 className={s.h1} {...props} />,
          h2: ({node, ...props}) => <h2 className={s.h2} {...props} />,
          h3: ({node, ...props}) => <h3 className={s.h3} {...props} />,
          h4: ({node, ...props}) => <h4 className="text-lg font-semibold mb-3 mt-4" {...props} />,
          p: ({node, ...props}) => <p className="mb-4" {...props} />,
          a: ({node, ...props}) => <a className={s.link} {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
          code: ({node, className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !String(children).includes('\n');
            return isInline ? (
              <code className={s.codeInline} {...props}>
                {children}
              </code>
            ) : (
               <pre className={s.codeBlock}>
                <code className={`font-mono text-sm ${className}`} {...props}>
                  {children}
                </code>
              </pre>
            )
          },
          blockquote: ({node, ...props}) => <blockquote className={s.blockquote} {...props} />,
          table: ({node, ...props}) => <div className="overflow-x-auto mb-6"><table className={s.table} {...props} /></div>,
          th: ({node, ...props}) => <th className={s.th} {...props} />,
          td: ({node, ...props}) => <td className={s.td} {...props} />,
          img: ({node, ...props}) => <img className="max-w-full h-auto rounded-lg shadow-md my-4" {...props} />,
          hr: ({node, ...props}) => <hr className={s.hr} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;