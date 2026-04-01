import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import UserProgress from '@/models/UserProgress';
import { notFound } from 'next/navigation';
import { Link } from '@/navigation';
import { Trophy, Award, Download, Share2, ChevronLeft, Map } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface Props {
  params: { slug: string; locale: string };
}

export default async function CertificatePage({ params }: Props) {
  const { slug, locale } = params;
  const t = await getTranslations('Certificate');
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Trophy className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
        <h1 className="text-2xl font-black mb-4">{t('login_title')}</h1>
        <p className="text-muted-foreground mb-8">{t('login_desc')}</p>
        <Link href="/login" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-xl">{t('login_btn')}</Link>
      </div>
    );
  }

  await dbConnect();
  const roadmap = await Roadmap.findOne({ slug }).lean();
  if (!roadmap) return notFound();

  const progress = await UserProgress.findOne({ 
    userId: (session.user as any).id, 
    roadmapId: roadmap._id 
  }).lean();

  const totalArticles = roadmap.phases.reduce((acc: number, p: any) => acc + (p.items?.length || 0), 0);
  const completedArticles = progress?.completedArticles?.length || 0;
  const completedBosses = progress?.completedProjects?.length || 0;
  const totalBosses = roadmap.phases.filter((p: any) => p.project?.title).length;

  const isCompleted = completedArticles >= totalArticles && completedBosses >= totalBosses;

  if (!isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-muted/30">
        <div className="p-8 bg-card border border-border rounded-[40px] shadow-2xl max-w-md">
           <Award className="h-20 w-20 text-blue-500/20 mx-auto mb-6" />
           <h1 className="text-3xl font-black mb-4 uppercase tracking-tight">{t('not_eligible_title')}</h1>
           <p className="text-muted-foreground font-medium mb-8">
             {t('not_eligible_desc')}
           </p>
           <div className="space-y-3 mb-8">
              <div className="flex justify-between text-sm font-bold">
                 <span>{t('lessons')}</span>
                 <span className="text-blue-600">{completedArticles}/{totalArticles}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                 <span>{t('boss')}</span>
                 <span className="text-red-600">{completedBosses}/{totalBosses}</span>
              </div>
           </div>
           <Link href={`/roadmaps/${slug}`} className="block w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
             {t('continue_learning')}
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 py-12 px-4 flex flex-col items-center">
       {/* Actions Bar */}
       <div className="w-full max-w-4xl flex justify-between items-center mb-12">
          <Link href={`/roadmaps/${slug}`} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group">
             <div className="h-8 w-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:bg-muted">
                <ChevronLeft className="h-4 w-4" />
             </div>
             {t('back_roadmap')}
          </Link>
          <div className="flex gap-4">
             <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-card border border-border text-sm font-bold hover:bg-muted transition-all shadow-sm">
                <Share2 className="h-4 w-4" /> {t('share')}
             </button>
             <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                <Download className="h-4 w-4" /> {t('download')}
             </button>
          </div>
       </div>

       {/* THE CERTIFICATE */}
       <div className="relative w-full max-w-5xl aspect-[1.414/1] bg-white dark:bg-zinc-900 border-[16px] border-[#e2e8f0] dark:border-zinc-800 p-1 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)]">
          <div className="h-full w-full border-[2px] border-amber-500/30 p-8 sm:p-20 flex flex-col items-center text-center relative overflow-hidden">
             
             {/* Decorative Elements */}
             <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-amber-500/20 -translate-x-1 -translate-y-1" />
             <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-amber-500/20 translate-x-1 -translate-y-1" />
             <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-amber-500/20 -translate-x-1 translate-y-1" />
             <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-amber-500/20 translate-x-1 translate-y-1" />

             {/* Content */}
             <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="h-1 bg-amber-500 w-12" />
                <Award className="h-10 w-10 text-amber-500" />
                <div className="h-1 bg-amber-500 w-12" />
             </div>

             <h2 className="text-amber-600 dark:text-amber-400 font-bold tracking-[0.3em] uppercase text-sm sm:text-xl mb-6">{t('title_badge')}</h2>
             
             <h1 className="text-4xl sm:text-7xl font-black text-foreground mb-4 uppercase tracking-tighter italic">{t('main_title')}</h1>
             <p className="text-lg sm:text-2xl text-muted-foreground font-medium mb-12 italic">{t('sub_title')}</p>

             <div className="w-full max-w-lg h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-12" />

             <p className="text-md sm:text-xl text-muted-foreground mb-4">{t('recognize')}</p>
             <h3 className="text-3xl sm:text-6xl font-black text-foreground mb-8 uppercase tracking-widest text-blue-600 drop-shadow-sm">
                {session.user.name}
             </h3>

             <p className="max-w-2xl text-sm sm:text-lg text-muted-foreground leading-relaxed mb-16">
                {t('description')} <br/>
                <strong className="text-foreground text-xl sm:text-2xl">"{roadmap.title}"</strong> <br/>
                {t('at_platform')}
             </p>

             <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-auto gap-8 sm:gap-0">
                <div className="flex flex-col items-center">
                   <div className="h-px w-48 bg-border mb-3" />
                   <div className="flex items-center gap-2 text-amber-600 font-black italic">
                      <Map className="h-4 w-4" /> EnglishHub
                   </div>
                   <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('platform_label')}</p>
                </div>

                {/* THE SEAL */}
                <div className="relative group">
                   <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                   <div className="relative h-28 w-28 rounded-full border-8 border-amber-500/20 flex items-center justify-center bg-white dark:bg-zinc-800 shadow-xl rotate-[15deg]">
                      <div className="text-center">
                         <div className="text-amber-600 font-black text-xl italic block">PASSED</div>
                         <div className="text-[8px] font-bold text-muted-foreground uppercase">EnglishHub Seal</div>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col items-center">
                   <div className="h-px w-48 bg-border mb-3" />
                   <p className="font-bold text-foreground italic">{new Date(progress?.lastUpdated || Date.now()).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}</p>
                   <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('issue_date')}</p>
                </div>
             </div>
          </div>
       </div>

       {/* Footer Message */}
       <div className="mt-12 text-center text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <p className="text-sm font-medium mb-4">{t('cert_code')} <span className="font-mono text-xs">{progress?._id?.toString().slice(-12).toUpperCase()}</span></p>
          <p className="max-w-xl mx-auto italic text-xs">
            {t('footer_quote')} <br/>
            {t('footer_regards')}
          </p>
       </div>
    </div>
  );
}
