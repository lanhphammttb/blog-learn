'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface InteractiveMarkdownProps {
  content: string;
  articleId: string;
  roadmapId?: string | null;
  initialCompletedTasks: number[];
  onAllTasksComplete?: () => void;
}

const InteractiveMarkdown = ({ 
  content, 
  articleId, 
  roadmapId,
  initialCompletedTasks,
  onAllTasksComplete 
}: InteractiveMarkdownProps) => {
  const [completedTasks, setCompletedTasks] = useState<number[]>(initialCompletedTasks);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const t = useTranslations('Lesson');

  useEffect(() => {
    const guestTasks = JSON.parse(localStorage.getItem(`guest_tasks_${articleId}`) || '[]');
    if (guestTasks.length > 0 && initialCompletedTasks.length === 0) {
      setCompletedTasks(guestTasks);
      // Wait for a short tick so React state commits before dispatching
      setTimeout(() => {
         window.dispatchEvent(new CustomEvent('article-tasks-updated', { detail: { taskIndices: guestTasks } }));
      }, 0);
    }
    setIsMounted(true);
  }, [articleId, initialCompletedTasks.length]);

  // Fetch highlights
  const fetchHighlights = async () => {
    try {
      const res = await fetch(`/api/user/highlights?articleId=${articleId}`);
      if (res.ok) setHighlights(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHighlights();
    const handleAdd = () => fetchHighlights();
    window.addEventListener('article-highlight-added', handleAdd);
    return () => window.removeEventListener('article-highlight-added', handleAdd);
  }, [articleId]);

  // Apply highlights when content renders
  useEffect(() => {
    if (!isMounted || highlights.length === 0) return;
    const container = document.getElementById('interactive-markdown-container');
    if (!container) return;

    // We do a simple tree walker to find exact text nodes matching the snippet
    // This is an MVP approach. If snippet crosses nodes, it won't highlight perfectly.
    highlights.forEach(h => {
       const snippet = h.textSnippet;
       if (!snippet || snippet.length < 2) return;

       const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
       let node = walker.nextNode();
       while (node) {
         const text = node.nodeValue || '';
         const idx = text.indexOf(snippet);
         
         if (idx !== -1 && node.parentElement?.tagName !== 'MARK') {
             // Split the text node
             const textNode = node as Text;
             const middle = textNode.splitText(idx);
             middle.splitText(snippet.length);
             
             // Wrap with <mark>
             const mark = document.createElement('mark');
             mark.className = 'bg-yellow-400/40 dark:bg-yellow-500/30 text-inherit rounded-sm cursor-help relative group transition-colors hover:bg-yellow-400/60';
             if (h.note) {
                mark.title = h.note;
                // Add a small indicator icon using a pseudo-element style or just append inside
             }
             mark.appendChild(middle.cloneNode(true));
             middle.parentNode?.replaceChild(mark, middle);
             break; // only highlight first occurrence per snippet to prevent marking everything
         }
         node = walker.nextNode();
       }
    });

  }, [highlights, isMounted, content]);

  // 1. Normalize line endings to avoid character-offset shifts on Windows (\r\n vs \n)
  const normalizedContent = useMemo(() => content.replace(/\r\n/g, '\n'), [content]);

  // 2. Count total tasks in the normalized content
  const totalTasks = useMemo(() => (normalizedContent.match(/\[[ xX]\]/g) || []).length, [normalizedContent]);

  // 3. Pre-calculate task positions for stable mapping
  const taskMap = useMemo(() => {
    const map = new Map<number, number>();
    const regex = /[*-] \[[ xX]\]/g;
    let match;
    let index = 0;
    while ((match = regex.exec(normalizedContent)) !== null) {
      map.set(match.index, index++);
    }
    return map;
  }, [normalizedContent]);

  useEffect(() => {
    const handleRemoteTaskUpdate = (event: CustomEvent<{ taskIndices: number[] }>) => {
      setCompletedTasks(event.detail.taskIndices);
    };
    window.addEventListener('article-tasks-updated' as any, handleRemoteTaskUpdate as any);
    return () => window.removeEventListener('article-tasks-updated' as any, handleRemoteTaskUpdate as any);
  }, []);

  const toggleTask = async (index: number) => {
    let previousState: number[] = [];
    setCompletedTasks(prev => {
      previousState = prev;
      return prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index];
    });

    try {
      setIsSyncing(true);
      const res = await fetch('/api/user/progress/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          roadmapId,
          taskIndex: index,
          completed: !previousState.includes(index)
        })
      });

      if (res.status === 401) {
        const guestTasks = JSON.parse(localStorage.getItem(`guest_tasks_${articleId}`) || '[]');
        const newTasks = guestTasks.includes(index) ? guestTasks.filter((i: number) => i !== index) : [...guestTasks, index];
        localStorage.setItem(`guest_tasks_${articleId}`, JSON.stringify(newTasks));
        
        setCompletedTasks(newTasks);
        window.dispatchEvent(new CustomEvent('article-tasks-updated', { detail: { taskIndices: newTasks } }));
        if (newTasks.length === totalTasks && onAllTasksComplete) {
            onAllTasksComplete();
        }
        setIsSyncing(false);
        return;
      }

      if (!res.ok) throw new Error('Failed to sync task');
      const data = await res.json();
      
      if (data.success && data.completedTasks) {
        setCompletedTasks(data.completedTasks);

        window.dispatchEvent(new CustomEvent('article-tasks-updated', { 
          detail: { taskIndices: data.completedTasks } 
        }));

        if (data.xp !== undefined) {
          window.dispatchEvent(new CustomEvent('article-xp-updated', { 
            detail: { xp: data.xp, streak: data.streak } 
          }));
        }

        if (data.completedTasks.length === totalTasks && onAllTasksComplete) {
          onAllTasksComplete();
        }
      } else {
        setCompletedTasks(previousState);
      }
    } catch (err) {
      console.error(err);
      setCompletedTasks(previousState);
    } finally {
      setIsSyncing(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div id="interactive-markdown-container" className="prose max-w-none prose-headings:font-bold prose-headings:text-foreground prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-code:text-blue-500 transition-colors 
      prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-3 prose-th:bg-muted/50 prose-td:border prose-td:border-border prose-td:p-3">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          td: ({ children, ...props }: any) => {
            const text = children?.toString() || '';
            const isEnglishContent = /^[a-zA-Z\s,.'?!-]+$/.test(text) && text.length > 0 && text.length < 50;
            
            return (
              <td {...props}>
                <div className="flex items-center justify-between gap-2">
                  <span>{children}</span>
                  {isEnglishContent && (
                    <button 
                      onClick={() => speak(text)}
                      className="p-1.5 rounded-full hover:bg-blue-500/10 text-blue-500 transition-colors shrink-0"
                      title={t('listen')}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            );
          },
          input: ({ node, ...props }: any) => {
            if (props.type === 'checkbox') {
              const startOffset = node?.position?.start?.offset;
              let index = -1;
              if (startOffset !== undefined) {
                index = taskMap.get(startOffset) ?? -1;
                if (index === -1) {
                  const offsets = Array.from(taskMap.keys()).sort((a: number, b: number) => b - a);
                  const closest = offsets.find((o: number) => o <= startOffset && startOffset - o < 5);
                  if (closest !== undefined) index = taskMap.get(closest)!;
                }
              }

              if (index === -1) {
                return <input {...props} className="task-checkpoint opacity-0 h-0 w-0" />;
              }

              const isDone = completedTasks.includes(index);
              
              if (!isMounted) return (
                <span id={`task-index-${index}`} className="task-checkpoint inline-flex items-center mr-2 translate-y-1 scroll-mt-40 opacity-50">
                  <div className="h-5 w-5 rounded-md border-2 border-muted-foreground/30" />
                </span>
              );

              return (
                <span id={`task-index-${index}`} className="task-checkpoint inline-flex items-center mr-2 translate-y-1 scroll-mt-40">
                  <button
                    onClick={() => toggleTask(index)}
                    className={`h-5 w-5 rounded-md flex items-center justify-center transition-all ${isDone ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'border-2 border-muted-foreground/30 hover:border-blue-500'}`}
                  >
                    {isDone && (
                      <motion.svg 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="h-3.5 w-3.5" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </motion.svg>
                    )}
                  </button>
                </span>
              );
            }
            return <input {...props} />;
          }
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default InteractiveMarkdown;
