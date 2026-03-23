'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { unlockAchievement } from '@/components/dashboard/AchievementToast';

interface ProgressButtonProps {
  articleId: string;
  roadmapId?: string;
  initialCompleted?: boolean;
}

export default function ProgressButton({ articleId, roadmapId, initialCompleted = false }: ProgressButtonProps) {
  const { data: session } = useSession();
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);

  const toggleProgress = async () => {
    if (!session) {
      // For guests, use local storage
      const guestProgress = JSON.parse(localStorage.getItem('guest_progress') || '[]');
      let newProgress;
      if (completed) {
        newProgress = guestProgress.filter((id: string) => id !== articleId);
      } else {
        newProgress = [...guestProgress, articleId];
      }
      localStorage.setItem('guest_progress', JSON.stringify(newProgress));
      setCompleted(!completed);

      // Trigger a custom event for other components to listen
      window.dispatchEvent(new Event('progressUpdated'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, roadmapId, completed: !completed }),
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
