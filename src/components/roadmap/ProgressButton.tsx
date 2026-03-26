'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { unlockAchievement } from '@/components/dashboard/AchievementToast';

interface ProgressButtonProps {
  articleId: string;
  roadmapId?: string | null;
  initialCompleted?: boolean;
}

export default function ProgressButton({ articleId, roadmapId, initialCompleted = false }: ProgressButtonProps) {
  const { data: session, status } = useSession();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  // For guests: hydrate completion state from localStorage after mount
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
        unlockAchievement('first-lesson', 'Early Bird', 'You completed your first lesson! 🐣');
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
      let newProgress;
      if (completed) {
        newProgress = guestProgress.filter((id: string) => id !== articleId);
      } else {
        newProgress = [...guestProgress, articleId];
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
          unlockAchievement('first-lesson', 'Early Bird', 'You completed your first lesson! 🐣');
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
          Lesson Completed!
        </>
      ) : (
        <>
          <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
          Mark as Completed
        </>
      )}
    </button>
  );
}
