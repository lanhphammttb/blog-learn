'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronRight, Play, Trophy, BookOpen, Hash } from 'lucide-react';
import Link from 'next/link';

interface RoadmapItem {
  articleId: string;
  slug: string;
  title: string;
  difficulty: string;
  type: 'Grammar' | 'Vocabulary' | 'Practice';
}

interface RoadmapCanvasProps {
  roadmap: {
    _id: string;
    slug: string;
    title: string;
    description: string;
    items: RoadmapItem[];
  };
  completedArticleIds: string[];
  isLoggedIn?: boolean;
}

export default function RoadmapCanvas({ roadmap, completedArticleIds: initialCompletedIds, isLoggedIn }: RoadmapCanvasProps) {
  const [completedArticleIds, setCompletedArticleIds] = useState<string[]>(initialCompletedIds);
  
  useEffect(() => {
    // ONLY use guest progress if NOT logged in
    if (!isLoggedIn) {
      const guestProgress = JSON.parse(localStorage.getItem('guest_progress') || '[]');
      if (guestProgress.length > 0) {
        setCompletedArticleIds(guestProgress);
      }
    }

    // Listen for progress updates from buttons
    const handleUpdate = () => {
      if (!isLoggedIn) {
        const updatedGuestProgress = JSON.parse(localStorage.getItem('guest_progress') || '[]');
        setCompletedArticleIds(updatedGuestProgress);
      }
    };

    window.addEventListener('progressUpdated', handleUpdate);
    return () => window.removeEventListener('progressUpdated', handleUpdate);
  }, []);

  const totalItems = roadmap.items.length;
  const completedCount = completedArticleIds.length;
  const progressPercent = Math.round((completedCount / totalItems) * 100) || 0;

  return (
    <div className="relative py-12">
      {/* Background path line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-muted/30 hidden md:block" />
      
      {/* Active progress line */}
      <div 
        className="absolute left-1/2 top-0 w-1 -translate-x-1/2 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)] hidden md:block transition-all duration-[2000ms] ease-in-out" 
        style={{ 
          height: completedCount > 0 
            ? `${((completedCount - 0.5) / totalItems) * 100}%` 
            : '0%' 
        }}
      />
      
      <div className="space-y-16">
        {roadmap.items.map((item, index) => {
          const isCompleted = completedArticleIds.includes(item.articleId);
          const isNext = index === completedCount; // Current suggested lesson
          const isLeft = index % 2 === 0;

          return (
            <div key={item.articleId} className={`relative flex items-center justify-center md:justify-between w-full ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              {/* Central Node */}
              <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden md:block">
                <div className={`h-12 w-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 shadow-lg ${
                  isCompleted 
                    ? 'bg-green-500 border-green-200 text-white scale-110 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                    : isNext 
                    ? 'bg-blue-600 border-blue-200 text-white scale-125 shadow-[0_0_25px_rgba(37,99,235,0.4)]' 
                    : 'bg-card border-border text-muted-foreground opacity-50'
                }`}>
                  {isCompleted ? <Trophy className="h-5 w-5" /> : (
                    <div className="relative flex flex-col items-center">
                      {isNext && <div className="absolute inset-0 h-full w-full rounded-full bg-blue-400 animate-ping opacity-25" />}
                      {item.type === 'Grammar' && <Hash className="h-5 w-5" />}
                      {item.type === 'Vocabulary' && <BookOpen className="h-5 w-5" />}
                      {item.type === 'Practice' && <Play className="h-5 w-5 ml-0.5" />}
                      {!item.type && <span className="text-sm font-bold">{index + 1}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Card - Side-aligned on desktop */}
              <div className={`w-full max-w-sm md:w-[42%] translate-z-0 transition-transform hover:scale-105`}>
                <Link 
                  href={`/articles/${item.slug}?roadmap=${roadmap.slug}`}
                  className={`block p-6 rounded-3xl border transition-all shadow-xl hover:shadow-2xl ${isCompleted ? 'bg-green-500/5 border-green-500/20' : isNext ? 'bg-blue-600/5 border-blue-500/40 ring-1 ring-blue-500/20' : 'bg-card border-border'}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lesson {index + 1}</span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                        <CheckCircle2 className="h-3 w-3" />
                        COMPLETED
                      </span>
                    ) : isNext ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                        <Play className="h-3 w-3 fill-current" />
                        UP NEXT
                      </span>
                    ) : null}
                  </div>
                  
                  <h4 className="text-lg font-bold text-foreground mb-4 line-clamp-2">
                    {item.title}
                  </h4>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${item.difficulty === 'Beginner' ? 'text-green-500 bg-green-500/10' : item.difficulty === 'Advanced' ? 'text-red-500 bg-red-500/10' : 'text-yellow-500 bg-yellow-500/10'}`}>
                      {item.difficulty}
                    </span>
                    <ChevronRight className={`h-4 w-4 ${isNext ? 'text-blue-500' : 'text-muted-foreground'}`} />
                  </div>
                </Link>
              </div>

              {/* Spacer for desktop layout */}
              <div className="hidden md:block w-[42%]" />
            </div>
          );
        })}
      </div>

      {/* Completion Trophy at the bottom */}
      {progressPercent === 100 && (
         <div className="mt-24 text-center animate-bounce">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.5)]">
               <Trophy className="h-10 w-10 text-white" />
            </div>
            <h3 className="mt-4 text-2xl font-black text-foreground uppercase tracking-widest">Roadmap Complete!</h3>
         </div>
      )}
    </div>
  );
}
