import dbConnect from "@/lib/db";
import UserProgress from "@/models/UserProgress";
import Article from "@/models/Article";
import Roadmap from "@/models/Roadmap";
import { notFound } from "next/navigation";
import { 
  Trophy, BookOpen, Layers, Flame, 
  ChevronLeft, Award, Calendar, ExternalLink,
  Target, Sparkles
} from "lucide-react";
import Link from "next/link";
import mongoose from "mongoose";

export default async function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await dbConnect();

  // Find user info from 'users' collection
  const db = mongoose.connection.db;
  const usersCollection = db?.collection('users');
  
  let user = null;
  try {
    if (usersCollection) {
      const query: any = mongoose.Types.ObjectId.isValid(id) 
        ? { _id: new mongoose.Types.ObjectId(id) }
        : { _id: id };
        
      user = await usersCollection.findOne(query);
    }
  } catch (e) {}

  if (!user) {
    notFound();
  }

  // Fetch their progress
  const progressRecords = await UserProgress.find({ userId: id }).lean();
  
  // Aggregate stats
  const totalLessons = progressRecords.reduce((sum, rec) => sum + (rec.completedArticles?.length || 0), 0);
  const activeRoadmaps = await Roadmap.find({ 
    _id: { $in: progressRecords.map(r => r.roadmapId) } 
  }).select('title description slug difficulty').lean();

  const getBadges = (total: number) => {
    const badges = [];
    if (total >= 1) badges.push({ name: 'Early Bird', icon: '🐣', color: 'bg-green-500/10 text-green-500', desc: 'Finished first lesson' });
    if (total >= 5) badges.push({ name: 'Fast Learner', icon: '⚡', color: 'bg-blue-500/10 text-blue-500', desc: '5 Lessons completed' });
    if (total >= 10) badges.push({ name: 'Grammar Guru', icon: '🧠', color: 'bg-purple-500/10 text-purple-500', desc: '10 Lessons completed' });
    return badges;
  };

  const badges = getBadges(totalLessons);

  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <Link 
          href="/community"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-12 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Community
        </Link>

        {/* Profile Header */}
        <div className="relative rounded-[40px] bg-card border border-border p-8 md:p-12 shadow-2xl overflow-hidden mb-12">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Trophy className="h-40 w-40 text-blue-600" />
           </div>
           
           <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="h-32 w-32 rounded-[32px] bg-blue-600/10 flex items-center justify-center text-5xl font-black text-blue-600 shadow-inner">
                {user.image ? <img src={user.image} className="h-full w-full rounded-[32px] object-cover border-4 border-card" /> : user.name[0]}
              </div>
              <div className="text-center md:text-left">
                 <h1 className="text-4xl font-black mb-2">{user.name}</h1>
                 <p className="text-muted-foreground font-medium mb-4">Joined in {new Date(user.createdAt || Date.now()).getFullYear()}</p>
                 <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-600 ring-1 ring-blue-500/20">
                      <Flame className="h-3.5 w-3.5" />
                      {totalLessons} Lessons Finished
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-600 ring-1 ring-purple-500/20">
                      <Award className="h-3.5 w-3.5" />
                      {badges.length} Achievements
                    </span>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main: Active Roadmaps */}
          <div className="lg:col-span-2 space-y-8">
             <h2 className="text-2xl font-black flex items-center gap-3">
               <Layers className="h-6 w-6 text-blue-600" />
               Current Learning Paths
             </h2>
             
             {activeRoadmaps.length > 0 ? (
               <div className="grid grid-cols-1 gap-6">
                 {activeRoadmaps.map((roadmap: any) => {
                   const progress = progressRecords.find(r => r.roadmapId.toString() === roadmap._id.toString());
                   const totalRoadmapLessons = roadmap.items?.length || 1;
                   const completedRoadmapLessons = progress?.completedArticles?.length || 0;
                   const percentage = Math.min(100, (completedRoadmapLessons / totalRoadmapLessons) * 100);

                   return (
                    <div key={roadmap._id.toString()} className="group rounded-3xl bg-card border border-border p-6 shadow-xl transition-all hover:border-blue-500/50">
                       <div className="flex items-start justify-between mb-6">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{roadmap.difficulty}</span>
                            <h3 className="text-xl font-black mt-1">{roadmap.title}</h3>
                          </div>
                          <Link href={`/roadmaps/${roadmap.slug}`} className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-blue-600 transition-all">
                             <ExternalLink className="h-5 w-5" />
                          </Link>
                       </div>
                       
                       <div className="space-y-2">
                          <div className="flex justify-between text-sm font-bold">
                             <span className="text-muted-foreground">Path Progress</span>
                             <span className="text-blue-600">{Math.round(percentage)}%</span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                             <div 
                               className="h-full bg-blue-600 transition-all duration-1000" 
                               style={{ width: `${percentage}%` }}
                             />
                          </div>
                       </div>
                    </div>
                   );
                 })}
               </div>
             ) : (
               <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground bg-muted/5 font-medium">
                 This user hasn't started any structured roadmaps yet.
               </div>
             )}
          </div>

          {/* Sidebar: Achievements */}
          <div className="space-y-8">
             <h2 className="text-2xl font-black flex items-center gap-3">
               <Target className="h-6 w-6 text-blue-600" />
               Unlocked Badges
             </h2>
             
             <div className="grid grid-cols-2 gap-4">
               {badges.map((badge) => (
                 <div key={badge.name} className="relative aspect-square rounded-[32px] bg-card border border-border flex flex-col items-center justify-center text-center p-4 shadow-xl group transition-all hover:scale-105 hover:shadow-2xl">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
                    <span className="text-4xl mb-3 z-10">{badge.icon}</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground z-10">{badge.name}</p>
                 </div>
               ))}
               {badges.length === 0 && (
                 <div className="col-span-2 py-12 text-center text-muted-foreground text-sm font-medium">
                   Keep leaning to earn badges!
                 </div>
               )}
             </div>

             {/* Activity Summary */}
             <div className="rounded-3xl bg-zinc-900 p-8 text-white shadow-2xl relative overflow-hidden">
                <Sparkles className="absolute top-4 right-4 h-6 w-6 text-yellow-400 opacity-20" />
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Activity Impact
                </h3>
                <div className="space-y-6">
                   <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <span className="text-zinc-400 text-sm font-medium">Persistence</span>
                      <span className="font-black text-blue-400">High</span>
                   </div>
                   <div className="flex items-center justify-between pt-4">
                      <span className="text-zinc-400 text-sm font-medium">Learning Focus</span>
                      <span className="font-black text-purple-400">Structural</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
