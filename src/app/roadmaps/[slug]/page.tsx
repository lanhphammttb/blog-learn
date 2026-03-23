import dbConnect from '@/lib/db';
export const dynamic = 'force-dynamic';
import Roadmap from '@/models/Roadmap';
import Article from '@/models/Article';
import { notFound } from 'next/navigation';
import { Target, ChevronLeft, Rocket, Flag, Layout, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import RoadmapCanvas from '@/components/roadmap/RoadmapCanvas';
import { auth } from '@/auth';
import UserProgress from '@/models/UserProgress';

export default async function RoadmapDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  
  await dbConnect();
  const roadmapData = await Roadmap.findOne({ slug, isPublished: true }).lean();

  if (!roadmapData) {
    notFound();
  }

  // Fetch article details for the roadmap items
  const articleIds = roadmapData.items.map(item => item.articleId);
  const articles = await Article.find({ _id: { $in: articleIds } }).select('slug difficulty').lean();
  
  // Create a map for quick lookup
  const articleMap = new Map(articles.map(a => [a._id.toString(), a]));

  const roadmap = {
    ...roadmapData,
    _id: roadmapData._id.toString(),
    slug: roadmapData.slug,
    items: roadmapData.items.map(item => ({
      ...item,
      articleId: item.articleId.toString(),
      slug: articleMap.get(item.articleId.toString())?.slug || '',
      difficulty: articleMap.get(item.articleId.toString())?.difficulty || 'Intermediate'
    }))
  };

  // Fetch all progress for the user to count any completed articles globally
  let completedArticleIds: string[] = [];
  if (session?.user) {
    const userId = (session.user as any).id;
    const providerId = (session.user as any).providerId;
    const email = session.user.email;
    console.log(`[DEBUG] RoadmapDetailPage: Fetching progress for user: ${userId}, email: ${email}`);
    
    const allProgress = await UserProgress.find({
      $or: [
        { userId: { $in: [userId, providerId].filter(Boolean) } },
        { email: email }
      ]
    }).lean();
    
    console.log(`[DEBUG] RoadmapDetailPage: Found ${allProgress.length} progress records for user ${userId}`);
    
    // Flatten all completedArticles from all roadmap progress records
    const allCompletedSets = allProgress.map(p => p.completedArticles.map(id => id.toString()));
    completedArticleIds = Array.from(new Set(allCompletedSets.flat()));
    console.log(`[DEBUG] RoadmapDetailPage: Total unique completed articles: ${completedArticleIds.length}`);
  } else {
    console.log(`[DEBUG] RoadmapDetailPage: No session found, using empty progress.`);
  }

    // Filter global completed articles to only those that exist in this specific roadmap
    const roadmapArticleIds = new Set(roadmap.items.map(item => item.articleId));
    const completedInThisRoadmap = completedArticleIds.filter(id => roadmapArticleIds.has(id));
    
    const completedCount = completedInThisRoadmap.length;
    const totalItems = roadmap.items.length;
    const progressPercent = Math.round((completedCount / totalItems) * 100) || 0;

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
            Back to Roadmaps
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
              <p className="text-lg text-muted-foreground leading-relaxed">
                {roadmap.description}
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
               <div className="relative h-24 w-24">
                  <svg className="h-full w-full" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted/20" strokeWidth="3" />
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-600 transition-all duration-1000" strokeWidth="3" 
                            strokeDasharray={`${progressPercent}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black text-foreground">{progressPercent}%</span>
                  </div>
               </div>
               <p className="mt-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Progress</p>
            </div>
          </div>
        </div>
        
        {/* Animated background Shapes */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Roadmap Visualization */}
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        <div className="mb-12 flex items-center justify-between border-b border-border pb-6">
           <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-bold text-foreground">Learning Path</h2>
           </div>
           <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
             <span className="flex items-center gap-1.5"><Rocket className="h-4 w-4" /> Start</span>
             <div className="h-px w-8 bg-border" />
             <span className="flex items-center gap-1.5"><Flag className="h-4 w-4" /> Goal</span>
           </div>
        </div>

        <RoadmapCanvas 
          roadmap={JSON.parse(JSON.stringify(roadmap))} 
          completedArticleIds={completedArticleIds} 
          isLoggedIn={!!session}
        />
        
        {progressPercent === 100 && (
           <div className="mt-20 rounded-3xl bg-blue-600 p-12 text-center text-white shadow-[0_20px_50px_rgba(37,99,235,0.4)]">
              <Trophy className="mx-auto h-20 w-20 mb-6 text-yellow-300" />
              <h2 className="text-4xl font-black mb-4 uppercase italic">Path Mastered!</h2>
              <p className="text-xl text-blue-100 mb-8">You've completed every lesson in this roadmap. Ready for the next challenge?</p>
              <Link href="/roadmaps" className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-blue-600 font-bold transition-transform hover:scale-105">
                 Explore More Roadmaps
                 <ArrowRight className="h-5 w-5" />
              </Link>
           </div>
        )}
      </div>
    </div>
  );
}

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
