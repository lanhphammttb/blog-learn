import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import Article from '@/models/Article';
import Roadmap from '@/models/Roadmap';
import { 
  Trophy, BookOpen, Layers, Flame, TrendingUp, 
  ChevronRight, Play, Star, Sparkles, Clock, Target, CheckCircle2, Bookmark
} from 'lucide-react';
import { Link } from '@/navigation';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { calculateStreak, getUserBadges } from '@/lib/gamification';
import Vocabulary from '@/models/Vocabulary';
import ProgressChart from '@/components/dashboard/ProgressChart';

function getSkillLevel(total: number) {
  if (total >= 20) return 'Advanced';
  if (total >= 10) return 'Intermediate';
  if (total >= 3) return 'Elementary';
  return 'Beginner';
}

export default async function LearnerDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  await dbConnect();
  // Force Mongoose to register the model in Turbopack environments
  if (!Roadmap) console.warn('Roadmap model init failed');
  const userId = session.user.id;

  // Fetch all user progress
  const allProgress = await UserProgress.find({ userId }).populate('roadmapId').lean();
  
  // Total lessons completed
  const totalCompleted = allProgress.reduce((acc, curr) => acc + curr.completedArticles.length, 0);
  
  // Active Roadmaps (started but not finished)
  const activePaths = allProgress.filter(p => p.roadmapId && p.completedArticles.length > 0);
  
  // Calculate real streak
  const streak = calculateStreak(allProgress);

  // Aggregated XP History
  const xpHistoryMap: Record<string, number> = {};
  allProgress.forEach(p => {
    (p.xpHistory ?? []).forEach((h) => {
      xpHistoryMap[h.date] = (xpHistoryMap[h.date] || 0) + h.xp;
    });
  });
  const xpHistoryLists = Object.entries(xpHistoryMap).map(([date, xp]) => ({ date, xp }));

  // Calculate skill level based on real data
  const skillLevel = getSkillLevel(totalCompleted);

  // Fetch Vocabulary count for Badges
  const vocabCount = await Vocabulary.countDocuments({ userId });

  // Recent completed articles (real data)
  const recentArticleIds = allProgress
    .flatMap(p => p.completedArticles.map(a => ({ id: a, date: p.lastUpdated || p.lastActive })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(a => a.id);

  const recentArticles = recentArticleIds.length > 0
    ? await Article.find({ _id: { $in: recentArticleIds } }).select('title slug').lean()
    : [];

  const recentActivity = recentArticleIds.map((id, i) => {
    const article = recentArticles.find((a: any) => a._id.toString() === id.toString());
    const progress = allProgress.find(p => p.completedArticles.some(a => a.toString() === id.toString()));
    const date = progress?.lastUpdated || progress?.lastActive;
    return {
      title: article?.title || 'Unknown Lesson',
      slug: article?.slug,
      date: date ? new Date(date) : new Date(),
    };
  });

  const badges = getUserBadges(totalCompleted, streak, vocabCount);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return t('recent_activity.today');
    if (diffDays === 1) return t('recent_activity.yesterday');
    return t('recent_activity.days_ago', { count: diffDays });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pt-24 pb-12 px-6 lg:px-8">
      {/* Background Ambient Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none opacity-50 dark:opacity-20 animate-pulse" />
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none opacity-50 dark:opacity-20 inline-block" />

      <div className="mx-auto max-w-7xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
             <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{t('title')}</span>
             <div className="h-px flex-grow bg-blue-600/10" />
          </div>
          <h1 className="text-4xl font-black text-foreground sm:text-5xl flex items-center gap-4">
             {t('welcome', { name: session.user.name?.split(' ')[0] || '' })}
             <span className="inline-block animate-bounce origin-bottom">👋</span>
          </h1>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-8 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300">
             <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="h-6 w-6" />
               </div>
               <span className="text-xs font-bold text-muted-foreground uppercase">{t('stats.lessons')}</span>
             </div>
             <p className="text-5xl font-black text-foreground group-hover:text-blue-500 transition-colors">{totalCompleted}</p>
          </div>
          <div className="group rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-8 shadow-xl hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-500/30 hover:-translate-y-1 transition-all duration-300">
             <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Flame className="h-6 w-6" />
               </div>
               <span className="text-xs font-bold text-muted-foreground uppercase">{t('stats.streak')}</span>
             </div>
             <p className="text-5xl font-black text-foreground group-hover:text-orange-500 transition-colors">{streak} <span className="text-xl text-muted-foreground">{streak === 1 ? t('stats.day') : t('stats.days')}</span></p>
          </div>
          <div className="group rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-8 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300">
             <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="h-6 w-6" />
               </div>
               <span className="text-xs font-bold text-muted-foreground uppercase">{t('stats.paths')}</span>
             </div>
             <p className="text-5xl font-black text-foreground group-hover:text-indigo-500 transition-colors">{activePaths.length}</p>
          </div>
          <div className="group rounded-3xl border border-blue-500/30 bg-linear-to-br from-blue-600 to-indigo-700 p-8 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.7)] hover:-translate-y-1 transition-all duration-300 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
             <div className="flex items-center gap-4 mb-4 relative z-10">
               <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star className="h-6 w-6" />
               </div>
               <span className="text-xs font-bold text-blue-100 uppercase">{t('stats.skill')}</span>
             </div>
             <p className="text-3xl font-black uppercase italic relative z-10 break-words">{t(`levels.${skillLevel}`)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Active Learning */}
           <div className="lg:col-span-2 space-y-8">
              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">{t('active_paths.title')}</h2>
                    <Link href="/roadmaps" className="text-sm font-bold text-blue-500 flex items-center gap-1 hover:underline">
                       {t('active_paths.explore')} <ChevronRight className="h-4 w-4" />
                    </Link>
                 </div>
                 
                 {activePaths.length > 0 ? (
                    <div className="space-y-4">
                       {activePaths.map((p) => {
                          const rm = p.roadmapId as unknown as { slug: string; title: string; phases: Array<{ items: unknown[] }> };
                          const totalItems = rm.phases?.reduce((acc, ph) => acc + (ph.items?.length ?? 0), 0) ?? 0;
                          const pct = Math.round((p.completedArticles.length / Math.max(1, totalItems)) * 100);
                          return (
                          <Link
                            key={p._id?.toString()}
                            href={`/roadmaps/${rm.slug}`}
                            className="flex items-center gap-6 p-6 rounded-3xl border border-border bg-card hover:border-blue-500/50 hover:shadow-lg transition-all"
                          >
                             <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-muted flex items-center justify-center">
                                <Target className="h-8 w-8 text-blue-500" />
                             </div>
                             <div className="flex-grow">
                                <h3 className="font-bold text-lg text-foreground mb-2">{rm.title}</h3>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                   <div
                                      className="h-full bg-blue-600 transition-all duration-1000"
                                      style={{ width: `${pct}%` }}
                                   />
                                </div>
                             </div>
                             <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-black text-foreground">{pct}%</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{t('active_paths.complete')}</span>
                             </div>
                          </Link>
                          );
                       })}
                    </div>
                 ) : (
                    <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center">
                       <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                       <h3 className="text-lg font-bold text-foreground mb-2">{t('active_paths.empty.title')}</h3>
                       <p className="text-muted-foreground mb-6">{t('active_paths.empty.desc')}</p>
                       <Link href="/roadmaps" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg">
                          {t('active_paths.empty.btn')}
                       </Link>
                    </div>
                 )}
              </section>

              {/* Progress Analytics */}
              <section className="mb-12">
                 <ProgressChart data={xpHistoryLists} />
              </section>

              <section>
                 <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">{t('recent_activity.title')}</h2>
                 </div>
                 
                 <div className="rounded-3xl border border-border bg-card p-2">
                    <div className="space-y-1">
                       {recentActivity.length > 0 ? (
                         recentActivity.map((activity, i) => (
                           <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/30 transition-colors">
                              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                                 <Clock className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-grow">
                                 <p className="text-sm font-bold text-foreground">
                                   {t('recent_activity.completed', { title: activity.title })}
                                 </p>
                                 <p className="text-[10px] text-muted-foreground uppercase">{formatTimeAgo(activity.date)}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full border border-green-500/20 text-green-500 flex items-center justify-center">
                                 <CheckCircle2 className="h-4 w-4" />
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="py-8 text-center text-sm text-muted-foreground">
                           {t('recent_activity.empty')}
                         </div>
                       )}
                    </div>
                 </div>
              </section>
           </div>

           {/* Sidebar: Resources & Achievements */}
           <div className="lg:col-span-1 flex flex-col gap-8">
              {/* Resources */}
              <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
                 <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-6">{t('tools.title')}</h2>
                 <div className="flex flex-col gap-3">
                    <Link href="/dashboard/vocabulary" className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors border border-border group">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                             <Bookmark className="h-5 w-5" fill="currentColor" />
                          </div>
                          <div>
                             <p className="font-bold text-sm">{t('tools.vocab.title')}</p>
                             <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t('tools.vocab.desc')}</p>
                          </div>
                       </div>
                       <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link href="/dashboard/notebook" className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors border border-border group">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                             <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="font-bold text-sm">{t('tools.notebook.title')}</p>
                             <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{t('tools.notebook.desc')}</p>
                          </div>
                       </div>
                       <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </Link>
                 </div>
              </div>

              {/* Achievements */}
              <div className="rounded-3xl border border-border bg-card p-8 shadow-xl flex-grow">
                 <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-8">{t('badges.title')}</h2>
                 
                 <div className="grid grid-cols-1 gap-4">
                    {badges.unlocked.map((badge) => (
                       <div key={badge.name} className={`flex items-start gap-4 p-5 rounded-2xl ${badge.color} border border-current/10`}>
                          <span className="text-3xl">{badge.icon}</span>
                          <div>
                             <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                             <p className="text-[10px] leading-tight opacity-80">{badge.desc}</p>
                          </div>
                       </div>
                    ))}
                    
                    {badges.unlocked.length === 0 && (
                       <p className="text-center py-8 text-sm text-muted-foreground italic">{t('badges.empty')}</p>
                    ) }

                    {/* Locked Badges */}
                    {badges.locked.length > 0 && (
                       <div className="pt-8 opacity-40">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-muted-foreground">{t('badges.locked')}</p>
                          <div className="flex flex-col gap-4">
                             {badges.locked.map(badge => (
                               <div key={badge.name} className="flex items-center gap-4 p-5 rounded-2xl bg-muted grayscale">
                                  <span className="text-3xl">{badge.icon}</span>
                                  <div>
                                     <h4 className="font-bold text-sm mb-1 text-foreground">{badge.name}</h4>
                                     <p className="text-[10px] leading-tight text-muted-foreground">{badge.desc}</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
