import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Maximize2, Minimize2,
  Edit3, Eye, Loader2, Info, Type, X, HelpCircle, Sparkles
} from 'lucide-react';

import '@mdxeditor/editor/style.css';
import MarkdownRenderer from './MarkdownRenderer';

const VisualEditor = dynamic(async () => {
  const { 
    MDXEditor, 
    headingsPlugin, 
    listsPlugin, 
    quotePlugin, 
    thematicBreakPlugin, 
    markdownShortcutPlugin,
    toolbarPlugin,
    UndoRedo,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    ListsToggle,
    CreateLink,
    InsertImage,
    InsertTable,
    InsertThematicBreak,
    ConditionalContents,
    InsertCodeBlock,
    codeBlockPlugin,
    tablePlugin,
    linkPlugin,
    imagePlugin,
    linkDialogPlugin,
    diffSourcePlugin
  } = await import('@mdxeditor/editor');

  return ({ value, onChange }: { value: string, onChange: (val: string) => void }) => (
    <div className="mdx-visual-wrapper h-full">
      <MDXEditor
        markdown={value}
        onChange={onChange}
        contentEditableClassName="prose prose-slate dark:prose-invert max-w-3xl mx-auto min-h-[600px] focus:outline-none"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          tablePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({
            imageUploadHandler: async (image: File) => {
              const reader = new FileReader();
              return new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(image);
              });
            }
          }),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'javascript' }),
          markdownShortcutPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text' }),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
                <BlockTypeSelect />
                <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
                <BoldItalicUnderlineToggles />
                <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
                <ListsToggle />
                <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
                <CreateLink />
                <InsertImage />
                <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
                <InsertTable />
                <InsertCodeBlock />
                <InsertThematicBreak />
              </>
            )
          })
        ]}
      />
    </div>
  );
}, { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50 bg-background rounded-2xl border border-border">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm text-foreground mix-blend-opacity-70">Loading Editor...</p>
    </div>
  )
});

interface SplitMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerateAI?: () => void;
}

type TabType = 'write' | 'preview';

export default function SplitMarkdownEditor({ value, onChange, onGenerateAI }: SplitMarkdownEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('write');
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const metrics = useMemo(() => {
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const readingTime = Math.ceil(words / 200); 
    return { words, readingTime };
  }, [value]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`flex flex-col bg-card border border-border shadow-sm overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] m-4 rounded-xl' : 'min-h-[700px] flex-grow rounded-2xl'}`}>
      
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in flex items-center justify-center">
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6 relative">
            <button type="button" onClick={() => setShowHelp(false)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full">
              <X className="h-5 w-5" />
            </button>
            <div>
              <h3 className="text-xl font-bold">Markdown Shortcuts</h3>
              <p className="text-sm text-muted-foreground mt-1">Use these to write faster without leaving the keyboard.</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center"><span className="text-sm">Bold</span><kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">**text**</kbd></div>
              <div className="flex justify-between items-center"><span className="text-sm">Italic</span><kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">_text_</kbd></div>
              <div className="flex justify-between items-center"><span className="text-sm">Heading 2</span><kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">## Heading</kbd></div>
              <div className="flex justify-between items-center"><span className="text-sm">Quote</span><kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{'>'} quote</kbd></div>
              <div className="flex justify-between items-center"><span className="text-sm">Code Block</span><kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">```js</kbd></div>
            </div>
            <button type="button" onClick={() => setShowHelp(false)} className="w-full py-2 bg-foreground text-background rounded-xl font-medium">Got it</button>
          </div>
        </div>
      )}

      {/* Modern, Clean Header Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2">
        <div className="flex bg-muted/50 rounded-xl p-1 gap-1">
          <button type="button" onClick={() => setActiveTab('write')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'write' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Edit3 className="h-4 w-4" /> Editor
          </button>
          <button type="button" onClick={() => setActiveTab('preview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Eye className="h-4 w-4" /> Reading View
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {onGenerateAI && (
            <button type="button" onClick={onGenerateAI} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-colors text-sm font-medium">
              <Sparkles className="h-4 w-4" /> AI AI Hook
            </button>
          )}
          <button type="button" onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex-grow bg-background overflow-y-auto w-full relative">
        {activeTab === 'write' ? (
          <VisualEditor value={value} onChange={onChange} />
        ) : (
          <div className="max-w-3xl mx-auto py-16 px-8 prose prose-slate dark:prose-invert">
             <MarkdownRenderer content={value} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-2 border-t border-border bg-muted/5 text-xs text-muted-foreground">
        <div className="flex gap-4">
          <button type="button" onClick={() => setShowHelp(true)} className="hover:text-foreground flex items-center gap-1.5 transition-colors">
            <HelpCircle className="h-3.5 w-3.5" /> Markdown Help
          </button>
          <span>{metrics.words} words</span>
          <span>{metrics.readingTime} min read</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Safe Mode
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mdx-visual-wrapper .mdxeditor-toolbar {
          background-color: transparent !important;
          border-bottom: 1px solid rgba(var(--border), 0.5) !important;
          padding: 8px 16px !important;
          gap: 4px !important;
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
        }

        .mdx-visual-wrapper .mdxeditor-toolbar button {
          border-radius: 6px !important;
          color: rgba(var(--foreground), 0.6) !important;
          padding: 6px !important;
          margin: 0 2px !important;
          min-width: 32px !important;
          height: 32px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.2s !important;
        }

        .mdx-visual-wrapper .mdxeditor-toolbar button[data-active="true"] {
          background-color: rgba(var(--muted), 0.8) !important;
          color: rgba(var(--foreground), 1) !important;
        }

        .mdx-visual-wrapper .mdxeditor-toolbar button:hover {
          background-color: rgba(var(--muted), 0.5) !important;
          color: rgba(var(--foreground), 1) !important;
        }

        .mdx-visual-wrapper .mdxeditor-content-editable {
          padding: 32px 24px !important;
          font-size: 1rem !important;
          line-height: 1.7 !important;
        }

        @media (min-width: 768px) {
          .mdx-visual-wrapper .mdxeditor-content-editable {
            padding: 48px 32px !important;
          }
        }

        .mdxeditor-code-block-editor {
          border-radius: 8px !important;
          margin: 1rem 0 !important;
        }
      `}} />
    </div>
  );
}
