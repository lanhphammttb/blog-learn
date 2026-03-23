import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  return (
    <div className="prose max-w-none prose-headings:font-bold prose-headings:text-foreground prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-code:text-blue-500 transition-colors 
      prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-3 prose-th:bg-muted/50 prose-td:border prose-td:border-border prose-td:p-3">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
