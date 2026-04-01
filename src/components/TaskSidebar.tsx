'use client';

import React from 'react';
import { CheckCircle2, Circle, ListTodo, Trophy, Signal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface Task {
  index: number;
  label: string;
}

interface TaskSidebarProps {
  tasks: Task[];
  initialCompletedIndices: number[];
  initialStats: { xp: number; streak: number };
}

export default function TaskSidebar({ tasks, initialCompletedIndices, initialStats, roadmapId, articleId }: TaskSidebarProps & { roadmapId?: string | null, articleId?: string }) {
  const [completedIndices, setCompletedIndices] = React.useState<number[]>(initialCompletedIndices);
  const [stats, setStats] = React.useState(initialStats);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const t = useTranslations('Lesson');

  React.useEffect(() => {
    const guestTasks = JSON.parse(localStorage.getItem(`guest_tasks_${articleId}`) || '[]');
    if (guestTasks.length > 0 && initialCompletedIndices.length === 0) {
      setCompletedIndices(guestTasks);
    }
  }, [articleId, initialCompletedIndices.length]);

  // We need to listen for task updates from InteractiveMarkdown
  React.useEffect(() => {
    const handleTaskUpdate = (event: CustomEvent<{ taskIndices: number[] }>) => {
      setCompletedIndices(event.detail.taskIndices);
    };

    const handleStatsUpdate = (event: CustomEvent<{ xp: number; streak: number }>) => {
      setStats({ xp: event.detail.xp, streak: event.detail.streak });
    };

    window.addEventListener('article-tasks-updated' as any, handleTaskUpdate as any);
    window.addEventListener('article-xp-updated' as any, handleStatsUpdate as any);
    return () => {
      window.removeEventListener('article-tasks-updated' as any, handleTaskUpdate as any);
      window.removeEventListener('article-xp-updated' as any, handleStatsUpdate as any);
    };
  }, []);

  const toggleTask = async (index: number) => {
    if (isSyncing) return;

    let previousIndices = [...completedIndices];
    const isDone = completedIndices.includes(index);
    const newIndices = isDone ? completedIndices.filter((i: number) => i !== index) : [...completedIndices, index];
    
    setCompletedIndices(newIndices);

    try {
      setIsSyncing(true);
      const res = await fetch('/api/user/progress/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          roadmapId,
          taskIndex: index,
          completed: !isDone
        })
      });

      if (res.status === 401) {
        const guestTasks = JSON.parse(localStorage.getItem(`guest_tasks_${articleId}`) || '[]');
        const newTasks = guestTasks.includes(index) ? guestTasks.filter((i: number) => i !== index) : [...guestTasks, index];
        localStorage.setItem(`guest_tasks_${articleId}`, JSON.stringify(newTasks));
        
        setCompletedIndices(newTasks);
        window.dispatchEvent(new CustomEvent('article-tasks-updated', { detail: { taskIndices: newTasks } }));
        setIsSyncing(false);
        return;
      }

      const data = await res.json();
      if (data.success && data.completedTasks) {
        setCompletedIndices(data.completedTasks);
        // Sync back to main content
        window.dispatchEvent(new CustomEvent('article-tasks-updated', { 
          detail: { taskIndices: data.completedTasks } 
        }));
        if (data.xp !== undefined) {
          window.dispatchEvent(new CustomEvent('article-xp-updated', { 
            detail: { xp: data.xp, streak: data.streak } 
          }));
        }
      } else {
        setCompletedIndices(previousIndices);
      }
    } catch (err) {
      setCompletedIndices(previousIndices);
    } finally {
      setTimeout(() => setIsSyncing(false), 300);
    }
  };

  const progress = Math.round((completedIndices.length / tasks.length) * 100);

  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTask = (index: number) => {
    // Use class-based selection for maximum robustness (ignores ID mismatches)
    const checkpoints = document.querySelectorAll('.task-checkpoint');
    const target = checkpoints[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      target.classList.add('ring-2', 'ring-blue-500', 'rounded-md');
      setTimeout(() => target.classList.remove('ring-2', 'ring-blue-500'), 1000);
    } else {
      // Fallback to ID if class selection fails
      const element = document.getElementById(`task-index-${index}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="space-y-4">
        {/* User Stats Card */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-4 shadow-sm border-blue-500/20">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border border-border">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-bold text-foreground">{stats.xp} XP</span>
              <span className="text-[8px] uppercase tracking-tighter text-muted-foreground font-bold">{t('xp_earned')}</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card border border-border">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Signal className="h-4 w-4 text-orange-500 fill-orange-500" />
              </motion.div>
              <span className="text-xs font-bold text-foreground">{stats.streak} {t('days')}</span>
              <span className="text-[8px] uppercase tracking-tighter text-muted-foreground font-bold">{t('streak')}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center justify-between mb-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <ListTodo className="h-4 w-4 text-blue-500" />
            {t('tasks')}
          </h3>
          <span className="text-xs font-bold text-muted-foreground">{completedIndices.length}/{tasks.length}</span>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 space-y-2">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{t('progress')}</span>
            <span className="text-[10px] font-bold text-blue-500">{progress}%</span>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {tasks.map((task) => {
            const isDone = completedIndices.includes(task.index);
            return (
              <motion.div 
                key={task.index}
                className={`w-full flex items-start gap-3 p-2 rounded-xl transition-all duration-300 border border-transparent text-left group cursor-pointer ${
                  isDone ? 'bg-green-500/5 text-green-700 dark:text-green-400' : 'hover:bg-muted text-muted-foreground'
                }`}
                onClick={() => scrollToTask(task.index)}
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(task.index);
                    }}
                    className={`h-4 w-4 rounded-md flex items-center justify-center transition-all shrink-0 ${
                      isDone ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'border border-muted-foreground/30 hover:border-blue-500'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="h-3 w-3" />}
                  </button>
                  <span 
                    className={`text-xs font-medium leading-tight text-left transition-colors ${isDone ? 'line-through opacity-70' : 'group-hover:text-blue-500'}`}
                  >
                    {task.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {progress === 100 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400"
          >
            <Trophy className="h-4 w-4" />
            <span className="text-xs font-bold">{t('excellent')}</span>
          </motion.div>
        )}

        {/* Background Decor */}
        <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>
    </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors z-50 lg:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
