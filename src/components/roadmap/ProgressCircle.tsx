'use client';

import { useState, useEffect } from 'react';

interface ProgressCircleProps {
  serverPercent: number;
  roadmapArticleIds: string[];
  isLoggedIn: boolean;
}

export default function ProgressCircle({ serverPercent, roadmapArticleIds, isLoggedIn }: ProgressCircleProps) {
  const [percent, setPercent] = useState(serverPercent);

  useEffect(() => {
    if (!isLoggedIn) {
      // Guest: check localStorage (deduplicate using Set)
      const guestProgress: string[] = [...new Set<string>(JSON.parse(localStorage.getItem('guest_progress') || '[]') as string[])];
      const roadmapSet = new Set(roadmapArticleIds);
      const completedInRoadmap = guestProgress.filter(id => roadmapSet.has(id)).length;
      const total = roadmapArticleIds.length;
      setPercent(Math.min(Math.round((completedInRoadmap / total) * 100) || 0, 100));
    }

    const handleUpdate = () => {
      if (!isLoggedIn) {
        const guestProgress: string[] = [...new Set<string>(JSON.parse(localStorage.getItem('guest_progress') || '[]') as string[])];
        const roadmapSet = new Set(roadmapArticleIds);
        const completedInRoadmap = guestProgress.filter(id => roadmapSet.has(id)).length;
        const total = roadmapArticleIds.length;
        setPercent(Math.min(Math.round((completedInRoadmap / total) * 100) || 0, 100));
      }
    };

    window.addEventListener('progressUpdated', handleUpdate);
    return () => window.removeEventListener('progressUpdated', handleUpdate);
  }, [isLoggedIn, roadmapArticleIds]);

  return (
    <div className="flex flex-col items-center md:items-end">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted/20" strokeWidth="3" />
          <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-600 transition-all duration-1000" strokeWidth="3" 
                  strokeDasharray={`${percent}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-foreground">{percent}%</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Progress</p>
    </div>
  );
}
