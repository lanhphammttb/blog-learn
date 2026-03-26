import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import Article from '@/models/Article';
import Roadmap from '@/models/Roadmap';
import { 
  Trophy, BookOpen, Layers, Flame, TrendingUp, 
  ChevronRight, Play, Star, Sparkles, Clock, Target, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

function getSkillLevel(total: number) {
  if (total >= 20) return 'Advanced';
  if (total >= 10) return 'Intermediate';
  if (total >= 3) return 'Elementary';
  return 'Beginner';
}

function calculateStreak(progressRecords: any[]): number {
  // Collect all lastActive/lastUpdated dates
  const dates = progressRecords
    .map(p => p.lastUpdated || p.lastActive)
    .filter(Boolean)
    .map(d => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    });

  if (dates.length === 0) return 0;

  const uniqueDays = [...new Set(dates)].sort((a, b) => b - a);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const oneDay = 86400000;

  // Check if last activity was today or yesterday
  if (uniqueDays[0] < todayMs - oneDay) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (uniqueDays[i - 1] - uniqueDays[i] === oneDay) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default async function LearnerDashboard() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  await dbConnect();
  const userId = (session.user as any).id;

  // Fetch all user progress
  const allProgress = await UserProgress.find({ userId }).populate('roadmapId').lean();
  
  // Total lessons completed
  const totalCompleted = allProgress.reduce((acc, curr) => acc + curr.completedArticles.length, 0);
  
  // Active Roadmaps (started but not finished)
  const activePaths = allProgress.filter(p => p.roadmapId && p.completedArticles.length > 0);
  
  // Calculate real streak
  const streak = calculateStreak(allProgress);

  // Calculate skill level based on real data
  const skillLevel = getSkillLevel(totalCompleted);

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

  const getBadges = (total: number) => {
    const badges = [];
    if (total >= 1) badges.push({ name: 'Early Bird', icon: '🐣', color: 'bg-green-500/10 text-green-500', desc: 'Finished your first lesson' });
    if (total >= 5) badges.push({ name: 'Fast Learner', icon: '⚡', color: 'bg-blue-500/10 text-blue-500', desc: '5 Lessons completed' });
    if (total >= 10) badges.push({ name: 'Grammar Guru', icon: '🧠', color: 'bg-purple-500/10 text-purple-500', desc: '10 Lessons completed' });
    return badges;
  };

  const userBadges = getBadges(totalCompleted);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-2">
             <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Student Dashboard</span>
             <div className="h-px flex-grow bg-blue-600/10" />
          </div>
          <h1 className="text-4xl font-black text-foreground sm:text-5xl flex items-center gap-4">
             Welcome back, {session.user.name?.split(' ')[0]}!
             <span className="inline-block animate-bounce">👋</span>
          </h1>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl hover:shadow-2xl transition-all">
             <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
               </div>
               <span className="text-xs font-bold text-muted-foreground uppercase">Lessons Done</span>
             </div>
             <p className="text-4xl font-black text-foreground">{totalCompleted}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
             <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                  <Flame className="h-6 w-6" />
               </div>
               <span className="text-xs font-bold text-muted-foreground uppercase">Current Streak</span>
             </div>
             <p className="text-4xl font-black text-foreground">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
             <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Layers className="h-6 w-6" />
               </div>
               <span className="text-xs font-bold text-muted-foreground uppercase">Active Paths</span>
             </div>
             <p className="text-4xl font-black text-foreground">{activePaths.length}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-8 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700">
             <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                  <Star className="h-6 w-6" />
               </div>
               <span className="text-xs font-bold text-blue-100 uppercase">Skill Level</span>
             </div>
             <p className="text-2xl font-black text-white uppercase italic">{skillLevel}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Active Learning */}
           <div className="lg:col-span-2 space-y-8">
              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Active Learning Paths</h2>
                    <Link href="/roadmaps" className="text-sm font-bold text-blue-500 flex items-center gap-1 hover:underline">
                       Explore More <ChevronRight className="h-4 w-4" />
                    </Link>
                 </div>
                 
                 {activePaths.length > 0 ? (
                    <div className="space-y-4">
                       {activePaths.map((p: any) => (
                          <Link 
                            key={p._id} 
                            href={`/roadmaps/${(p.roadmapId as any).slug}`}
                            className="flex items-center gap-6 p-6 rounded-3xl border border-border bg-card hover:border-blue-500/50 hover:shadow-lg transition-all"
                          >
                             <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-muted flex items-center justify-center">
                                <Target className="h-8 w-8 text-blue-500" />
                             </div>
                             <div className="flex-grow">
                                <h3 className="font-bold text-lg text-foreground mb-2">{(p.roadmapId as any).title}</h3>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                   <div 
                                     className="h-full bg-blue-600 transition-all duration-1000" 
                                     style={{ width: `${Math.round((p.completedArticles.length / (p.roadmapId as any).items.length) * 100)}%` }}
                                   />
                                </div>
                             </div>
                             <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-black text-foreground">{Math.round((p.completedArticles.length / (p.roadmapId as any).items.length) * 100)}%</span>
                                <span className="text-[10px] text-muted-foreground uppercase">Complete</span>
                             </div>
                          </Link>
                       ))}
                    </div>
                 ) : (
                    <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center">
                       <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                       <h3 className="text-lg font-bold text-foreground mb-2">Start your first roadmap</h3>
                       <p className="text-muted-foreground mb-6">Roadmaps help you stay focused and learn faster.</p>
                       <Link href="/roadmaps" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg">
                          Discover Paths
                       </Link>
                    </div>
                 )}
              </section>

              <section>
                 <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Recent Activity</h2>
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
                                   Completed &quot;{activity.title}&quot;
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
                           No activity yet. Start learning to see your progress here!
                         </div>
                       )}
                    </div>
                 </div>
              </section>
           </div>

           {/* Achievements Sidebar */}
           <div className="lg:col-span-1 space-y-8">
              <div className="rounded-3xl border border-border bg-card p-8 shadow-xl h-full">
                 <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-8">My Badges</h2>
                 
                 <div className="grid grid-cols-1 gap-4">
                    {userBadges.map((badge) => (
                       <div key={badge.name} className={`flex items-start gap-4 p-5 rounded-2xl ${badge.color} border border-current/10`}>
                          <span className="text-3xl">{badge.icon}</span>
                          <div>
                             <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                             <p className="text-[10px] leading-tight opacity-80">{badge.desc}</p>
                          </div>
                       </div>
                    ))}
                    
                    {userBadges.length === 0 && (
                       <p className="text-center py-8 text-sm text-muted-foreground italic">Complete lessons to earn badges!</p>
                    ) }

                    {/* Locked Badges */}
                    <div className="pt-8 opacity-40">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-muted-foreground">Locked Badges</p>
                       <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-4 p-5 rounded-2xl bg-muted grayscale">
                             <span className="text-3xl">🌋</span>
                             <div className="h-2 w-16 bg-muted-foreground/20 rounded" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
