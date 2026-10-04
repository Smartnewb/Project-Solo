'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

// Keep the longform body readable even when Tailwind resets native HTML styles.
const components: Components = {
  p: ({ children }) => <p style={{ fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 12px' }}>{children}</p>,
  h1: ({ children }) => <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '24px 0 8px' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '24px 0 8px' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '16px 0 8px' }}>{children}</h3>,
  ul: ({ children }) => <ul style={{ listStyleType: 'disc', paddingLeft: 24, margin: '0 0 12px' }}>{children}</ul>,
  ol: ({ children, start }) => <ol start={start} style={{ listStyleType: 'decimal', paddingLeft: 24, margin: '0 0 12px' }}>{children}</ol>,
  li: ({ children }) => <li style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{children}</li>,
  blockquote: ({ children }) => <blockquote style={{ borderLeft: '4px solid #ddd', paddingLeft: 16, color: '#6b7280', margin: '16px 0' }}>{children}</blockquote>,
  code: ({ children, className }) => <code className={className} style={{ backgroundColor: '#f4f4f4', padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem' }}>{children}</code>,
  pre: ({ children }) => <pre style={{ overflowX: 'auto', margin: '16px 0' }}>{children}</pre>,
  // Markdown images keep their author-supplied URL without requiring an optimizer allowlist.
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ src, alt, title }) => <img src={src} alt={alt} title={title} style={{ maxWidth: '100%', borderRadius: 8, margin: '16px 0' }} />,
  a: ({ children, href, title }) => <a href={href} title={title} style={{ color: '#1976d2', textDecoration: 'underline' }}>{children}</a>,
};

export default function LongformMarkdown({ body }: { body: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>{body}</ReactMarkdown>;
}
