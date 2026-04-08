import dbConnect from '@/lib/db';
export const dynamic = 'force-dynamic';
import Article from '@/models/Article';
import { notFound } from 'next/navigation';
import { Calendar, Tag, ChevronLeft, Layers, Signal } from 'lucide-react';
import { Link } from '@/navigation';
import ProgressButton from '@/components/roadmap/ProgressButton';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import UserProgress from '@/models/UserProgress';
import mongoose from 'mongoose';
import type { Metadata } from 'next';
import { getLocalizedField } from '@/lib/i18n-db';

import Roadmap from '@/models/Roadmap';
import LessonNavigation from '@/components/roadmap/LessonNavigation';
import FocusToggle from '@/components/FocusToggle';
import ArticleContentWrapper from '@/components/ArticleContentWrapper';
import InteractiveMarkdown from '@/components/InteractiveMarkdown';
import TaskSidebar from '@/components/TaskSidebar';
import { triggerLessonAutoComplete } from '@/components/LessonAutoComplete';
import ArticleAudioPlayer from '@/components/ArticleAudioPlayer';
import ReadingProgress from '@/components/ReadingProgress';

export async function generateMetadata({ params }: { params: Promise<{ slug: string, locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  await dbConnect();
  const article = await Article.findOne({ slug }).select('title excerpt category').lean();
  const t = await getTranslations({ locale, namespace: 'Article' });
  
  if (!article) {
    return { title: t('not_found') || 'Article Not Found' };
  }

  const title = getLocalizedField(article, 'title', locale);
  const excerpt = getLocalizedField(article, 'excerpt', locale);

  return {
    title: `${title} | EnglishHub`,
    description: excerpt || `Learn English: ${title}`,
    openGraph: {
      title: title,
      description: excerpt || `Learn English: ${title}`,
      type: 'article',
    },
  };
}

 export default async function ArticleDetail({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string, locale: string }>,
  searchParams: Promise<{ roadmap?: string }>
}) {
  const { slug, locale } = await params;
  const { roadmap: roadmapSlug } = await searchParams;
  const t = await getTranslations('Article');
  const session = await auth();
  
  await dbConnect();
  const article = await Article.findOne({ slug }).lean();

  if (!article) {
    notFound();
  }

  // Fetch progress and roadmap context
  let roadmapId: string | null = null;
  let isCompleted = false;
  let initialCompletedTasks: number[] = [];
  let userStats = { xp: 0, streak: 0 };
  let prevLesson = null;
  let nextLesson = null;

  if (roadmapSlug) {
    const roadmap = await Roadmap.findOne({ slug: roadmapSlug }).lean();
    if (roadmap) {
      roadmapId = roadmap._id.toString();
      const items = roadmap.phases?.flatMap(phase => phase.items) || [];
      const currentIndex = items.findIndex(item => {
        const itemId = (item.articleId as any)?._id || item.articleId;
        return itemId.toString() === article._id.toString();
      });
      
      if (currentIndex > 0) {
        const prevId = items[currentIndex - 1].articleId?._id || items[currentIndex - 1].articleId;
        const prevArt = await Article.findById(prevId).select('title slug').lean();
        if (prevArt) prevLesson = { title: prevArt.title, slug: prevArt.slug };
      }
      
      if (currentIndex !== -1 && currentIndex < items.length - 1) {
        const nextId = items[currentIndex + 1].articleId?._id || items[currentIndex + 1].articleId;
        const nextArt = await Article.findById(nextId).select('title slug').lean();
        if (nextArt) nextLesson = { title: nextArt.title, slug: nextArt.slug };
      }
    }
  }

  if (session?.user) {
    const userId = (session.user as any).id;
    const providerId = (session.user as any).providerId;
    const email = session.user.email;
    
    // STRICT Query: must match roadmapId if provided
    const progress = await UserProgress.findOne({
      $or: [
        { userId: { $in: [userId, providerId].filter(Boolean) } },
        { email: email }
      ],
      roadmapId: roadmapId ? new mongoose.Types.ObjectId(roadmapId) : new mongoose.Types.ObjectId("000000000000000000000000")
    }).lean();

    if (progress) {
      isCompleted = (progress.completedArticles || []).some(
        (id: any) => id.toString() === article._id.toString()
      );

      const articleTaskRecord = (progress.articleTasks || []).find(
        (at: any) => at.articleId.toString() === article._id.toString()
      );
      if (articleTaskRecord) {
        initialCompletedTasks = articleTaskRecord.taskIndices;
      }

      userStats = {
        xp: progress.xp || 0,
        streak: progress.streak || 0
      };
    }
  }

  const localizedTitle = getLocalizedField(article, 'title', locale);
  const localizedContent = getLocalizedField(article, 'content', locale);
  const localizedExcerpt = getLocalizedField(article, 'excerpt', locale);

  const taskRegex = /[*-] \[[ xX]\] (.*)/g;
  const tasks = [...localizedContent.matchAll(taskRegex)].map((match, index) => ({
    index,
    label: match[1].trim()
  }));

  const seriesArticles = article.series 
    ? await Article.find({ 
        series: article.series, 
        isPublished: true,
        _id: { $ne: article._id } 
      })
      .select('title slug difficulty')
      .limit(5)
      .lean()
    : [];

  const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-500 bg-green-500/10 ring-green-500/20';
      case 'Intermediate': return 'text-yellow-500 bg-yellow-500/10 ring-yellow-500/20';
      case 'Advanced': return 'text-red-500 bg-red-500/10 ring-red-500/20';
      default: return 'text-blue-500 bg-blue-500/10 ring-blue-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReadingProgress articleSlug={article.slug} />
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
         <Link
           href={roadmapSlug ? `/roadmaps/${roadmapSlug}` : "/"}
           className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
         >
           <ChevronLeft className="h-4 w-4" />
           {roadmapSlug ? t('back_roadmap') : t('back_articles')}
         </Link>

        <FocusToggle />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <ArticleContentWrapper articleId={article._id.toString()}>
              <article>
              <header className="mb-12">
                <div className="mb-6 flex flex-wrap items-center gap-4">
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20">
                    {article.category}
                  </span>
                  
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getDifficultyColor(article.difficulty || 'Intermediate')}`}>
                    <Signal className="h-3 w-3" />
                    {article.difficulty || 'Intermediate'}
                  </span>

                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formattedDate}
                  </div>
                </div>
                
                 {article.series && (
                  <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-500">
                    <Layers className="h-4 w-4" />
                    {t('part_of')} {article.series}
                  </div>
                )}

                <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                  {localizedTitle}
                </h1>
                
                <p className="text-xl leading-8 text-muted-foreground mb-8">
                  {localizedExcerpt}
                </p>

                <ArticleAudioPlayer content={localizedContent} title={localizedTitle} />
              </header>

              <div className="border-t border-border pt-12">
                <InteractiveMarkdown 
                  content={localizedContent}  
                  articleId={article._id.toString()}
                  roadmapId={roadmapId}
                  initialCompletedTasks={initialCompletedTasks}
                  onAllTasksComplete={triggerLessonAutoComplete}
                />
              </div>

              {roadmapSlug && (
                <LessonNavigation 
                  prevLesson={prevLesson} 
                  nextLesson={nextLesson} 
                  isCompleted={isCompleted} 
                  roadmapId={roadmapSlug}
                />
              )}

               <div className="mt-16 border-t border-border pt-12 bg-muted/20 rounded-3xl p-8 flex flex-col items-center text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-4">{t('finished_title')}</h3>
                  <p className="text-muted-foreground mb-8 max-w-md">{t('finished_desc')}</p>
                 <ProgressButton 
                    articleId={article._id.toString()} 
                    roadmapId={roadmapId}
                    initialCompleted={isCompleted} 
                    totalTasks={tasks.length}
                    initialCompletedTaskCount={initialCompletedTasks.length}
                 />
              </div>

              <footer className="mt-16 border-t border-border pt-8 flex flex-wrap gap-2">
                  {article.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
              </footer>
            </article>
            </ArticleContentWrapper>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {tasks.length > 0 && (
                <TaskSidebar 
                  tasks={tasks} 
                  initialCompletedIndices={initialCompletedTasks} 
                  initialStats={userStats}
                  roadmapId={roadmapId}
                  articleId={article._id.toString()}
                />
              )}
              
              {seriesArticles.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                 <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                    <Layers className="h-4 w-4 text-blue-500" />
                    {t('series_progress')}
                  </h3>
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{article.series}</p>
                    <div className="space-y-3">
                      {seriesArticles.map((sa: any) => (
                        <Link 
                          key={sa.slug} 
                          href={`/articles/${sa.slug}`}
                          className="group block"
                        >
                          <p className="text-sm font-medium text-foreground group-hover:text-blue-500 transition-colors line-clamp-2">
                            {sa.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground">{sa.difficulty}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
