import dbConnect from '@/lib/db';
export const dynamic = 'force-dynamic';
import Roadmap from '@/models/Roadmap';
import Article from '@/models/Article';
import { notFound } from 'next/navigation';
import { Target, ChevronLeft, Rocket, Flag, Layout, ArrowRight, Trophy } from 'lucide-react';
import { Link } from '@/navigation';
import RoadmapCanvas from '@/components/roadmap/RoadmapCanvas';
import ProgressCircle from '@/components/roadmap/ProgressCircle';
import { auth } from '@/auth';
import UserProgress from '@/models/UserProgress';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  await dbConnect();
  const roadmap = await Roadmap.findOne({ slug, isPublished: true }).select('title description').lean();
  
  if (!roadmap) {
    return { title: 'Roadmap Not Found' };
  }

  return {
    title: `${roadmap.title} | EnglishHub`,
    description: roadmap.description || `Learn English with the ${roadmap.title} roadmap`,
  };
}

export default async function RoadmapDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const t = await getTranslations({ locale, namespace: 'Roadmap' });
  
  await dbConnect();
  const roadmapData = await Roadmap.findOne({ slug, isPublished: true }).lean();

  if (!roadmapData) {
    notFound();
  }

  // Extract all items from all phases
  const allPhaseItems = roadmapData.phases?.flatMap((p: any) => p.items) || [];
  
  // Fetch article details for the roadmap items
  const articleIds = allPhaseItems.map((item: any) => item.articleId);
  const articles = await Article.find({ _id: { $in: articleIds } }).select('slug difficulty').lean();
  
  // Create a map for quick lookup
  const articleMap = new Map(articles.map(a => [a._id.toString(), a]));

  const roadmap = {
    ...roadmapData,
    _id: roadmapData._id.toString(),
    slug: roadmapData.slug,
    phases: roadmapData.phases?.map((phase: any) => ({
       ...phase,
       items: phase.items.map((item: any) => ({
         ...item,
         articleId: item.articleId.toString(),
         slug: articleMap.get(item.articleId.toString())?.slug || '',
         difficulty: articleMap.get(item.articleId.toString())?.difficulty || 'Intermediate'
       }))
    })) || []
  };

  // Fetch progress ONLY for this specific roadmap
  let completedArticleIds: string[] = [];
  let completedProjects: string[] = [];
  let projectSubmissions: any[] = [];
  if (session?.user) {
    const userId = (session.user as any).id;
    const providerId = (session.user as any).providerId;
    const email = session.user.email;
    
    // Query ONLY the progress record for THIS specific roadmap
    const progress = await UserProgress.findOne({
      $or: [
        { userId: { $in: [userId, providerId].filter(Boolean) } },
        ...(email ? [{ email }] : [])
      ],
      roadmapId: roadmapData._id
    }).lean();
    
    if (progress) {
      completedArticleIds = (progress.completedArticles || []).map((id: any) => id.toString());
      completedProjects = progress.completedProjects || [];
      projectSubmissions = (progress as any).projectSubmissions || [];
    }
  }

    // Flat list of items for progress calculation
    const flatRoadmapItems = roadmap.phases.flatMap((p: any) => p.items);
    
    const roadmapArticleIds = new Set(flatRoadmapItems.map((item: any) => item.articleId));
    const completedInThisRoadmap = completedArticleIds.filter(id => roadmapArticleIds.has(id));
    
    const completedCount = completedInThisRoadmap.length;
    const totalItems = flatRoadmapItems.length;
    const progressPercent = totalItems === 0 ? 0 : Math.round((completedCount / totalItems) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-blue-600/10 pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 relative z-10">
          <Link
            href="/roadmaps"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:opacity-80 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('details.back')}
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                    <Target className="h-6 w-6" />
                 </div>
                 <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${roadmap.difficulty === 'Beginner' ? 'text-green-500 bg-green-500/10 ring-green-500/20' : roadmap.difficulty === 'Advanced' ? 'text-red-500 bg-red-500/10 ring-red-500/20' : 'text-yellow-500 bg-yellow-500/10 ring-yellow-500/20'}`}>
                    {roadmap.difficulty}
                 </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl mb-4">
                {roadmap.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {roadmap.description}
              </p>

              {roadmap.target_outcome && (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-500/20">
                  <Trophy className="h-4 w-4" />
                  <span>{t('details.target')}: {roadmap.target_outcome}</span>
                </div>
              )}
            </div>
            
            <ProgressCircle 
              serverPercent={progressPercent}
              roadmapArticleIds={flatRoadmapItems.map((item: any) => item.articleId)}
              isLoggedIn={!!session?.user}
            />
          </div>
        </div>
        
        {/* Animated background Shapes */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        
        {roadmap.roadmap_image_url && (
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <img 
              src={roadmap.roadmap_image_url} 
              alt="" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-background to-background" />
          </div>
        )}
      </div>

      {/* Roadmap Visualization */}
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <div className="mb-12 flex items-center justify-between border-b border-border pb-6">
           <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-bold text-foreground">{t('details.learning_path')}</h2>
           </div>
           <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
             <span className="flex items-center gap-1.5"><Rocket className="h-4 w-4" /> {t('details.start')}</span>
             <div className="h-px w-8 bg-border" />
             <span className="flex items-center gap-1.5"><Flag className="h-4 w-4" /> {t('details.goal')}</span>
           </div>
        </div>

        <RoadmapCanvas 
          roadmap={JSON.parse(JSON.stringify(roadmap))} 
          completedArticleIds={completedArticleIds} 
          completedProjects={completedProjects}
          projectSubmissions={JSON.parse(JSON.stringify(projectSubmissions))}
          isLoggedIn={!!session}
        />
      </div>
    </div>
  );
}

