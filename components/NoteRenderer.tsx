import type { ReactNode } from 'react';

type Mark = { type: string };
type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: Mark[];
  text?: string;
};

function applyMarks(text: string, marks: Mark[]): ReactNode {
  let node: ReactNode = text;
  for (const mark of marks) {
    if (mark.type === 'bold') node = <strong>{node}</strong>;
    else if (mark.type === 'italic') node = <em>{node}</em>;
    else if (mark.type === 'code')
      node = (
        <code className='rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200'>
          {node}
        </code>
      );
  }
  return node;
}

function renderInline(nodes: TipTapNode[] = []): ReactNode[] {
  return nodes.map((node, i) => {
    if (node.type === 'text')
      return <span key={i}>{applyMarks(node.text ?? '', node.marks ?? [])}</span>;
    return null;
  });
}

function renderNode(node: TipTapNode, key: number): ReactNode {
  switch (node.type) {
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1;
      const cls: Record<number, string> = {
        1: 'mt-8 mb-3 text-3xl font-bold text-gray-900 dark:text-white',
        2: 'mt-6 mb-2 text-2xl font-semibold text-gray-900 dark:text-white',
        3: 'mt-5 mb-2 text-xl font-semibold text-gray-900 dark:text-white',
      };
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
      return (
        <Tag key={key} className={cls[level]}>
          {renderInline(node.content)}
        </Tag>
      );
    }

    case 'paragraph':
      return (
        <p key={key} className='mb-4 leading-relaxed text-gray-700 dark:text-gray-300'>
          {node.content?.length ? renderInline(node.content) : <br />}
        </p>
      );

    case 'bulletList':
      return (
        <ul key={key} className='mb-4 list-disc space-y-1 pl-6 text-gray-700 dark:text-gray-300'>
          {node.content?.map((n, i) => renderNode(n, i))}
        </ul>
      );

    case 'listItem':
      return (
        <li key={key}>
          {node.content?.map((n, i) =>
            n.type === 'paragraph' ? renderInline(n.content) : renderNode(n, i),
          )}
        </li>
      );

    case 'codeBlock':
      return (
        <pre
          key={key}
          className='mb-4 overflow-x-auto rounded-lg bg-gray-100 p-4 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        >
          <code>{node.content?.map((n) => n.text).join('')}</code>
        </pre>
      );

    case 'horizontalRule':
      return <hr key={key} className='my-6 border-gray-200 dark:border-gray-700' />;

    default:
      return null;
  }
}

export function NoteRenderer({ contentJson }: { contentJson: string }) {
  let doc: TipTapNode;
  try {
    doc = JSON.parse(contentJson);
  } catch {
    return <p className='text-sm text-gray-400'>Content unavailable.</p>;
  }

  const nodes = doc.content ?? [];
  if (nodes.length === 0) return <p className='text-sm text-gray-400'>No content yet.</p>;

  return <div>{nodes.map((node, i) => renderNode(node, i))}</div>;
}
