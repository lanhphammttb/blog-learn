'use client';

import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

interface LessonNavigationProps {
  prevLesson?: { title: string; slug: string } | null;
  nextLesson?: { title: string; slug: string } | null;
  isCompleted?: boolean;
  roadmapId?: string | null;
}

 export default function LessonNavigation({ prevLesson, nextLesson, isCompleted, roadmapId }: LessonNavigationProps) {
  const t = useTranslations('Article');
  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-12">
      {prevLesson ? (
        <Link
          href={`/articles/${prevLesson.slug}${roadmapId ? `?roadmap=${roadmapId}` : ''}`}
          className="group flex flex-col items-start gap-2 rounded-3xl border border-border bg-card p-6 transition-all hover:border-blue-500/50 hover:shadow-lg"
        >
           <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-blue-500">
            <ChevronLeft className="h-4 w-4" />
            {t('prev_lesson')}
          </span>
          <span className="text-lg font-black text-foreground line-clamp-1">
            {prevLesson.title}
          </span>
        </Link>
      ) : <div />}

      {nextLesson ? (
        <Link
          href={`/articles/${nextLesson.slug}${roadmapId ? `?roadmap=${roadmapId}` : ''}`}
          className="group flex flex-col items-end gap-2 rounded-3xl border border-blue-600/20 bg-blue-600/5 p-6 text-right transition-all hover:border-blue-600/50 hover:shadow-lg"
        >
           <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-600 group-hover:text-blue-500">
            {t('next_lesson')}
            <ChevronRight className="h-4 w-4" />
          </span>
          <span className="text-lg font-black text-foreground line-clamp-1">
            {nextLesson.title}
          </span>
        </Link>
      ) : (
        <div className="flex flex-col items-end gap-2 rounded-3xl border border-green-500/20 bg-green-500/5 p-6 text-right">
           <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-600">
            {t('milestone')}
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <span className="text-lg font-black text-foreground">
            {t('end_msg')}
          </span>
        </div>
      )}
    </div>
  );
}
