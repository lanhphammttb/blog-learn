import dbConnect from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import { Layers, Rocket, Target, ArrowRight, Signal } from 'lucide-react';
import { Link } from '@/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

 export default async function RoadmapsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await dbConnect();
  const roadmaps = await Roadmap.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
  const t = await getTranslations({ locale, namespace: 'Roadmap' });

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20">
            <Target className="h-4 w-4" />
            <span>{t('list_badge')}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl mb-6">
            {t('list_title_start')} <span className="gradient-text">{t('list_title_highlight')}</span> {t('list_title_end')}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t('description')}
          </p>
        </header>

        {roadmaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roadmaps.map((roadmap: any) => {
              const totalLessons = roadmap.phases?.reduce((acc: number, phase: any) => acc + (phase.items?.length || 0), 0) || 0;
              return (
              <Link 
                key={roadmap._id} 
                href={`/roadmaps/${roadmap.slug}`}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-1 transition-all hover:border-blue-500/50 hover:shadow-[0_20px_50px_rgba(37,99,235,0.1)]"
              >
                <div className="relative z-10 flex h-full flex-col rounded-2xl bg-card p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${roadmap.difficulty === 'Beginner' ? 'text-green-500 bg-green-500/10 ring-green-500/20' : roadmap.difficulty === 'Advanced' ? 'text-red-500 bg-red-500/10 ring-red-500/20' : 'text-yellow-500 bg-yellow-500/10 ring-yellow-500/20'}`}>
                      {roadmap.difficulty}
                    </span>
                     <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Layers className="h-4 w-4" />
                        {totalLessons} {t('lessons_count')}
                     </div>
                  </div>

                  <h3 className="mb-4 text-2xl font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    {roadmap.title}
                  </h3>
                  
                  <p className="mb-8 flex-grow text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {roadmap.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{totalLessons} {t('lessons_count')}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{t('structured_path')}</span>
                    </div>
                    
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white transition-all group-hover:scale-110">
                       <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              );
            })}
          </div>
        ) : (
           <div className="py-24 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/30">
              <Rocket className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">{t('empty_state.title')}</h2>
            <p className="text-muted-foreground mb-8">{t('empty_state.desc')}</p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-500 hover:underline"
            >
              {t('empty_state.back')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
