'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Loader2, Lock } from 'lucide-react';
import { unlockAchievement } from '@/components/dashboard/AchievementToast';
import { useTranslations } from 'next-intl';

interface ProgressButtonProps {
  articleId: string;
  roadmapId?: string | null;
  initialCompleted?: boolean;
  totalTasks?: number;
  initialCompletedTaskCount?: number;
}

export default function ProgressButton({ articleId, roadmapId, initialCompleted = false, totalTasks, initialCompletedTaskCount }: ProgressButtonProps) {
  const { data: session, status } = useSession();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);
  const [completedTaskCount, setCompletedTaskCount] = useState(initialCompletedTaskCount || 0);
  const t = useTranslations('Roadmap');
  const commonT = useTranslations('Common');

  // Sync tasks from local storage strictly for guests on mount
  useEffect(() => {
    if (status === 'unauthenticated' && totalTasks && totalTasks > 0) {
      const guestTasks = JSON.parse(localStorage.getItem(`guest_tasks_${articleId}`) || '[]');
      setCompletedTaskCount(guestTasks.length);
    }
  }, [status, articleId, totalTasks]);

  // Listen for tasks update from InteractiveMarkdown/TaskSidebar
  useEffect(() => {
    const handleTaskUpdate = (event: any) => {
      setCompletedTaskCount(event.detail.taskIndices.length);
    };
    window.addEventListener('article-tasks-updated', handleTaskUpdate);
    return () => window.removeEventListener('article-tasks-updated', handleTaskUpdate);
  }, []);
  useEffect(() => {
    if (status === 'unauthenticated') {
      const guestProgress: string[] = JSON.parse(localStorage.getItem('guest_progress') || '[]');
      if (guestProgress.includes(articleId)) {
        setCompleted(true);
      }
    }
  }, [status, articleId]);

  // Also sync from server-side initial state when session changes
  useEffect(() => {
    if (status === 'authenticated') {
      setCompleted(initialCompleted);
    }
  }, [status, initialCompleted]);

  const markAsCompleted = useCallback(async () => {
    if (completed || loading) return;

    if (status === 'unauthenticated') {
      const guestProgress: string[] = JSON.parse(localStorage.getItem('guest_progress') || '[]');
      if (!guestProgress.includes(articleId)) {
        guestProgress.push(articleId);
        localStorage.setItem('guest_progress', JSON.stringify(guestProgress));
      }
      setCompleted(true);
      window.dispatchEvent(new Event('progressUpdated'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, roadmapId: roadmapId || undefined, completed: true }),
      });
        if (res.ok) {
          unlockAchievement('first-lesson', commonT('achievements.first_lesson_title'), commonT('achievements.first_lesson_desc'));
          setCompleted(true);
        }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [completed, loading, status, articleId, roadmapId]);

  const toggleProgress = async () => {
    if (status === 'unauthenticated') {
      const guestProgress: string[] = JSON.parse(localStorage.getItem('guest_progress') || '[]');
      let newProgress: string[];
      if (completed) {
        newProgress = guestProgress.filter((id: string) => id !== articleId);
      } else {
        // Prevent duplicates
        newProgress = guestProgress.includes(articleId) ? guestProgress : [...guestProgress, articleId];
      }
      localStorage.setItem('guest_progress', JSON.stringify(newProgress));
      setCompleted(!completed);
      window.dispatchEvent(new Event('progressUpdated'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, roadmapId: roadmapId || undefined, completed: !completed }),
      });
      if (res.ok) {
        if (!completed) {
          unlockAchievement('first-lesson', commonT('achievements.first_lesson_title'), commonT('achievements.first_lesson_desc'));
        }
        setCompleted(!completed);
      }
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for auto-complete event from InteractiveMarkdown (all tasks done)
  useEffect(() => {
    const handleAutoComplete = () => {
      markAsCompleted();
    };
    window.addEventListener('lesson-auto-complete', handleAutoComplete);
    return () => window.removeEventListener('lesson-auto-complete', handleAutoComplete);
  }, [markAsCompleted]);

  const isLocked = !completed && totalTasks !== undefined && totalTasks > 0 && completedTaskCount < totalTasks;

  if (isLocked) {
     return (
       <button
         disabled
         className="group flex flex-col items-center gap-1 rounded-2xl px-8 py-3 text-sm font-bold bg-muted text-muted-foreground border-2 border-border cursor-not-allowed shadow-none"
       >
         <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> {t('progress_button.locked')}</span>
         <span className="text-[10px] uppercase tracking-widest font-bold">{t('progress_button.tasks_required', { current: completedTaskCount, total: totalTasks })}</span>
       </button>
     );
  }

  return (
    <button
      onClick={toggleProgress}
      disabled={loading}
      className={`group flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-bold transition-all shadow-lg active:scale-95 ${completed ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-blue-600 text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-105'}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : completed ? (
        <>
          <CheckCircle2 className="h-5 w-5" />
          {t('progress_button.completed')}
        </>
      ) : (
        <>
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          {t('progress_button.mark_completed')}
        </>
      )}
    </button>
  );
}
