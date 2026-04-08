import { Calendar, Tag, ChevronRight, Signal } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedField } from '@/lib/i18n-db';

interface ArticleCardProps {
  article: {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    difficulty?: string;
    series?: string;
    createdAt: Date;
  };
}

 const ArticleCard = ({ article }: ArticleCardProps) => {
  const t = useTranslations('ArticleCard');
  const locale = useLocale();

  const formattedDate = new Date(article.createdAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-500 bg-green-500/10 ring-green-500/20';
      case 'Intermediate': return 'text-yellow-500 bg-yellow-500/10 ring-yellow-500/20';
      case 'Advanced': return 'text-red-500 bg-red-500/10 ring-red-500/20';
      default: return 'text-blue-500 bg-blue-500/10 ring-blue-500/20';
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-1 transition-all hover:border-blue-500/50 hover:shadow-xl">
      <div className="relative z-10 flex flex-col h-full rounded-xl bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20">
              {article.category}
            </span>
            {article.difficulty && (
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold ring-1 ring-inset ${getDifficultyColor(article.difficulty)}`}>
                {article.difficulty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </div>
        </div>

        {article.series && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-500 opacity-80">
            {article.series}
          </p>
        )}

        <Link href={`/articles/${article.slug}`} className="hover:text-blue-600 dark:hover:text-blue-400">
          <h3 className="mb-3 text-xl font-semibold leading-tight text-foreground transition-colors group-hover:text-blue-500">
            {getLocalizedField(article, 'title', locale)}
          </h3>
        </Link>

        <p className="mb-6 flex-grow text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {getLocalizedField(article, 'excerpt', locale)}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
           <Link
            href={`/articles/${article.slug}`}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('start')}
            <ChevronRight className="h-4 w-4" />
          </Link>
          
          <div className="flex gap-1.5">
            <Signal className={`h-3 w-3 ${getDifficultyColor(article.difficulty).split(' ')[0]}`} />
          </div>
        </div>
      </div>
      
      {/* Decorative gradient background on hover */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5 opacity-0 transition-opacity group-hover:opacity-100 dark:from-blue-600/10 dark:to-indigo-600/10" />
    </div>
  );
};

export default ArticleCard;
