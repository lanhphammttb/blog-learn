'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Play, Trophy, Hash, BookOpen, Lock, ChevronRight, Flag, Loader2, Star } from 'lucide-react';
import { Link } from '@/navigation';
import { useToast } from '@/components/ui/Toast';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedField } from '@/lib/i18n-db';

interface RoadmapItem {
  articleId: string;
  slug: string;
  title: string;
  difficulty: string;
  type: 'Grammar' | 'Vocabulary' | 'Practice';
  is_core?: boolean;
}

interface RoadmapPhase {
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  order: number;
  items: RoadmapItem[];
  project?: {
    title: string;
    title_en?: string;
    requirements: string;
    requirements_en?: string;
    passing_score: number;
  };
}

interface RoadmapCanvasProps {
  roadmap: {
    _id: string;
    slug: string;
    title: string;
    description: string;
    phases: RoadmapPhase[];
  };
  completedArticleIds: string[];
  completedProjects?: string[];
  projectSubmissions?: Array<{
    bossId: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
    feedback?: string;
  }>;
  isLoggedIn?: boolean;
}

export default function RoadmapCanvas({ 
  roadmap, 
  completedArticleIds: initialCompletedIds, 
  completedProjects: initCompletedProjects = [], 
  projectSubmissions: initSubmissions = [],
  isLoggedIn 
}: RoadmapCanvasProps) {
  const [completedArticleIds, setCompletedArticleIds] = useState<string[]>(initialCompletedIds);
  const [completedProjects, setCompletedProjects] = useState<string[]>(initCompletedProjects);
  const [submissions, setSubmissions] = useState(initSubmissions);
  const [isSubmittingBoss, setIsSubmittingBoss] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBossIndex, setActiveBossIndex] = useState<number | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const { showToast } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpPopup, setXpPopup] = useState<{ x: number, y: number, show: boolean }>({ x: 0, y: 0, show: false });
  
  const t = useTranslations('Roadmap');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  
  // Flat dictionary to check global completion
  const flatRoadmapItems = roadmap.phases?.flatMap(p => p.items) || [];
  const roadmapArticleIdSet = new Set(flatRoadmapItems.map(item => item.articleId));

  useEffect(() => {
    if (!isLoggedIn) {
      try {
        const guestProgress = [...new Set<string>(JSON.parse(localStorage.getItem('guest_progress') || '[]'))];
        const filtered = guestProgress.filter(id => roadmapArticleIdSet.has(id));
        if (filtered.length > 0) setCompletedArticleIds(filtered);
        
        const guestProjects = [...new Set<string>(JSON.parse(localStorage.getItem('guest_projects') || '[]'))];
        if (guestProjects.length > 0) setCompletedProjects(guestProjects);
      } catch(e){}
    }

    const handleUpdate = () => {
      if (!isLoggedIn) {
        try {
          const updatedGuestProgress = [...new Set<string>(JSON.parse(localStorage.getItem('guest_progress') || '[]'))];
          const filtered = updatedGuestProgress.filter(id => roadmapArticleIdSet.has(id));
          setCompletedArticleIds(filtered);
          
          const updatedGuestProjects = [...new Set<string>(JSON.parse(localStorage.getItem('guest_projects') || '[]'))];
          setCompletedProjects(updatedGuestProjects);
        } catch(e){}
      }
    };

    window.addEventListener('progressUpdated', handleUpdate);
    return () => window.removeEventListener('progressUpdated', handleUpdate);
  }, [isLoggedIn]);

  const handleBossClick = (pIndex: number) => {
    const bossId = `${roadmap._id}_phase_${pIndex}`;
    const existingSubmission = submissions.find(s => s.bossId === bossId);
    
    // Nếu đã duyệt hoặc đang chờ, không cần mở modal để nộp lại (trừ khi bị từ chối)
    if (existingSubmission && (existingSubmission.status === 'pending' || existingSubmission.status === 'approved')) {
       return;
    }
    
    if (existingSubmission && existingSubmission.status === 'rejected') {
        setSubmissionContent(existingSubmission.content || '');
    } else {
        setSubmissionContent('');
    }

    setActiveBossIndex(pIndex);
    setIsModalOpen(true);
  };

  const handleProjectSubmit = async () => {
    if (activeBossIndex === null || !submissionContent.trim()) return;
    
    const bossId = `${roadmap._id}_phase_${activeBossIndex}`;

    if (!isLoggedIn) {
       showToast(t('login_required'), 'error');
       return;
    }

    setIsSubmittingBoss(bossId);
    showToast(commonT('loading'), 'loading');
    try {
      const res = await fetch('/api/user/progress/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roadmapId: roadmap._id, 
          bossId,
          content: submissionContent,
          locale
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.projectSubmissions);
        setIsModalOpen(false);
        setSubmissionContent('');
        showToast(data.message || t('submit_success'), data.aiStatus === 'rejected' ? 'error' : 'success');
      } else {
        showToast(commonT('error'), 'error');
      }
    } catch (error) {
      showToast(commonT('error'), 'error');
      console.error('Error submitting project:', error);
    } finally {
      setIsSubmittingBoss(null);
    }
  };

  const totalArticles = flatRoadmapItems.length;
  const totalBosses = roadmap.phases.filter(p => p.project?.title).length;
  const totalTotal = totalArticles + totalBosses;

  const completedBossesCount = roadmap.phases.filter((p, i) => {
    if (!p.project?.title) return false;
    const bossId = `${roadmap._id}_phase_${i}`;
    return submissions.some(s => s.bossId === bossId && s.status === 'approved') || completedProjects.includes(bossId);
  }).length;

  const globalCompletedCount = completedArticleIds.filter(id => roadmapArticleIdSet.has(id)).length;
  const progressPercent = totalTotal > 0 ? Math.round(((globalCompletedCount + completedBossesCount) / totalTotal) * 100) : 0;

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Beginner') return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
    if (diff === 'Advanced') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20';
  };

  const getIcon = (type: string) => {
     if (type === 'Grammar') return <Hash className="h-5 w-5" />;
     if (type === 'Vocabulary') return <BookOpen className="h-5 w-5" />;
     if (type === 'Practice') return <Play className="h-5 w-5 pl-0.5" />;
     return <BookOpen className="h-5 w-5" />;
  };

  let globalItemIndex = 0; // To track article absolute index across phases

  return (
    <>
      <div className="relative">
        {/* Nền Timeline Track (Mờ) */}
        <div className="absolute left-7 md:left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 bg-muted/50 rounded-full z-0" />
        
        {/* Timeline Track Đã Nạp Màu (Hoạt động) */}
        <div 
          className="absolute left-7 md:left-1/2 top-0 w-2 -translate-x-1/2 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-full transition-all duration-[1500ms] ease-out z-0" 
          style={{ height: `${progressPercent}%` }}
        />
        
        <div className="space-y-24 py-12">
          {roadmap.phases?.map((phase, pIndex) => {
           
           const coreItems = phase.items.filter(i => i.is_core !== false);
           const phaseItemIds = new Set(coreItems.map(item => item.articleId));
           const phaseCompletedCount = completedArticleIds.filter(id => phaseItemIds.has(id)).length;
           const isPhaseCompleted = coreItems.length > 0 && phaseCompletedCount === coreItems.length;
           
           // Spiral Lock: Phase N is locked if Phase N-1 is NOT completed (ALL Core Items + Boss Approved)
           let isPhaseLocked = false;
           if (pIndex > 0) {
               const prevPhase = roadmap.phases[pIndex - 1];
               const prevCoreItems = prevPhase.items.filter(i => i.is_core !== false).map(i => i.articleId);
               const prevCompletedCore = completedArticleIds.filter(id => prevCoreItems.includes(id)).length;
               
               if (prevCoreItems.length > 0 && prevCompletedCore < prevCoreItems.length) {
                   isPhaseLocked = true;
               } else if (prevPhase.project?.title) {
                   const bossId = `${roadmap._id}_phase_${pIndex - 1}`;
                   const isBossApproved = submissions.some(s => s.bossId === bossId && s.status === 'approved') || completedProjects.includes(bossId);
                   if (!isBossApproved) {
                       isPhaseLocked = true;
                   }
               }
           }

           return (
             <div key={pIndex} className="relative">
                {/* Phase Milestone Flag */}
                <div className="relative flex justify-center mb-16 z-20">
                   <div className={`p-6 md:p-8 rounded-[32px] border-4 shadow-2xl w-[90%] md:w-[60%] lg:w-[50%] transition-all text-center backdrop-blur-xl ${
                      isPhaseCompleted 
                        ? 'bg-blue-600/90 border-blue-400 text-white' 
                        : isPhaseLocked 
                        ? 'bg-card/90 border-border text-muted-foreground grayscale opacity-60'
                        : 'bg-card/90 border-blue-500 shadow-blue-500/20 ring-4 ring-blue-500/10'
                   }`}>
                      <div className="flex items-center justify-center gap-3 mb-2">
                         <Flag className={`h-6 w-6 ${isPhaseCompleted ? 'text-yellow-400 fill-current' : 'text-current'}`} />
                         <span className="text-sm font-black uppercase tracking-widest opacity-80">{t('phase')} {pIndex + 1}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black mb-2">{getLocalizedField(phase, 'title', locale)}</h3>
                      {phase.description && <p className="text-sm font-medium opacity-80">{getLocalizedField(phase, 'description', locale)}</p>}
                      
                      {/* Phase Progress */}
                      <div className="mt-6">
                         <div className="flex justify-between items-center text-xs font-bold mb-2 opacity-80 uppercase tracking-widest">
                            <span>{t('progress')}</span>
                            <span>{phaseCompletedCount} / {phase.items.length}</span>
                         </div>
                         <div className="w-full h-3 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                               className={`h-full rounded-full transition-all duration-1000 ${isPhaseCompleted ? 'bg-yellow-400' : 'bg-blue-500'}`} 
                               style={{ width: `${phase.items.length > 0 ? (phaseCompletedCount / phase.items.length) * 100 : 0}%` }}
                            />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Phase Articles */}
                <div className="space-y-12">
                  {phase.items.map((item, itemIndex) => {
                    const currentIndex = globalItemIndex++;
                    const isCompleted = completedArticleIds.includes(item.articleId);
                    
                    // Always available if it's not a core item, OR if previous items are completed
                    // Strictly speaking, we just check if phase is locked.
                    const isNext = currentIndex === globalCompletedCount;
                    const isLocked = item.is_core === false ? isPhaseLocked : (isPhaseLocked || currentIndex > globalCompletedCount);
                    const isLeft = currentIndex % 2 === 0;
                    const isSatellite = item.is_core === false;

                    return (
                      <div key={item.articleId} className={`relative flex items-center md:justify-between w-full pl-16 md:pl-0 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                        
                        {/* Nút mốc chính giữa */}
                        <div className="absolute left-7 md:left-1/2 -translate-x-1/2 z-10">
                          <div className={`${isSatellite ? 'h-6 w-6 md:h-8 md:w-8 border-2 ml-2 md:ml-3 bg-muted' : 'h-10 w-10 md:h-14 md:w-14 border-4 bg-card'} rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${
                            isCompleted 
                              ? 'bg-green-500 border-green-200 text-white scale-110 shadow-green-500/40' 
                              : isNext && !isSatellite
                              ? 'bg-blue-600 border-blue-200 text-white scale-125 shadow-blue-500/40 animate-pulse' 
                              : 'border-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? <CheckCircle2 className={`${isSatellite ? 'h-3 w-3' : 'h-5 w-5 md:h-6 md:w-6'}`} /> : isNext && !isSatellite ? <Play className="h-4 w-4 md:h-5 md:w-5 ml-1" /> : !isSatellite && <span className="font-black text-sm md:text-base">{currentIndex + 1}</span>}
                          </div>
                        </div>

                        {/* Thẻ Bài Học (Card) */}
                        <div className={`w-full ${isSatellite ? 'md:w-[35%] opacity-80 scale-90' : 'md:w-[45%]'} transition-all duration-300 ${isLocked ? 'opacity-60 grayscale' : ''}`}>
                          {isLocked ? (
                            <div className={`block relative overflow-hidden ${isSatellite ? 'p-4 rounded-2xl' : 'p-6 md:p-8 rounded-[32px]'} bg-card border-2 border-border shadow-md`}>
                              <div className="flex items-center justify-between mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-muted text-muted-foreground">
                                  <Lock className="h-3.5 w-3.5" />
                                  {t('locked')}
                                </span>
                                {isSatellite && <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('auxiliary')}</span>}
                              </div>
                              <h4 className={`${isSatellite ? 'text-lg' : 'text-xl'} font-black text-foreground mb-2 opacity-50`}>{getLocalizedField(item, 'title', locale)}</h4>
                            </div>
                          ) : (
                            <Link 
                              href={`/articles/${item.slug}?roadmap=${roadmap.slug}`}
                              className={`block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02] hover:opacity-100 ${isSatellite ? 'p-4 rounded-2xl border-dashed border-2' : 'p-6 md:p-8 rounded-[32px] border-2 shadow-xl'} ${
                                isCompleted 
                                  ? 'bg-green-50/80 border-green-500/30 dark:bg-green-950/40 relative overflow-hidden' 
                                  : 'bg-card border-blue-500/30'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {t('completed')}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 animate-pulse">
                                    <Play className="h-3 w-3 fill-current" />
                                    {t('next')}
                                  </span>
                                )}
                                <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest ${getDifficultyColor(item.difficulty)}`}>
                                  {item.difficulty}
                                </span>
                              </div>
                              
                              <h4 className="text-xl md:text-2xl font-black text-foreground mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                                {getLocalizedField(item, 'title', locale)}
                              </h4>
                              
                              <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                   <div className={`p-2 rounded-xl ${isCompleted ? 'bg-green-100 text-green-600 dark:bg-green-500/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'}`}>
                                     {getIcon(item.type)}
                                   </div>
                                   {t('lesson')} {currentIndex + 1}: {item.type}
                                </div>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${isCompleted ? 'bg-green-100 text-green-600 dark:bg-green-500/20' : 'bg-blue-600 text-white shadow-lg'}`}>
                                   <ChevronRight className="h-5 w-5" />
                                </div>
                              </div>
                            </Link>
                          )}
                        </div>

                        {/* Lề đối diện (bỏ trống để đẩy Card sang trái/phải trên desktop) */}
                        <div className={`hidden md:block ${isSatellite ? 'w-[55%]' : 'w-[45%]'}`} />
                      </div>
                    );
                  })}
                </div>

                {/* Boss Project Node */}
                {phase.project?.title && (() => {
                   const bossId = `${roadmap._id}_phase_${pIndex}`;
                   const submission = submissions.find(s => s.bossId === bossId);
                   const isApproved = submission?.status === 'approved' || completedProjects.includes(bossId);
                   const isPending = submission?.status === 'pending';
                   const isRejected = submission?.status === 'rejected';
                   
                   // Logic: Boss is locked if the phase is locked OR not all core articles are completed
                   const isBossLocked = isPhaseLocked || phaseCompletedCount < coreItems.length;

                   return (
                   <div className="relative flex justify-center mt-16 mb-8 z-20">
                      <div className={`absolute top-0 bottom-0 left-1/2 w-4 ${isBossLocked ? 'bg-muted/20' : 'bg-gradient-to-b from-blue-500/0 via-red-500/50 to-red-500/0'} -translate-x-1/2 animate-pulse -z-10`}></div>
                      
                      <div className={`p-1 min-w-[300px] w-[90%] md:w-[60%] lg:w-[50%] bg-gradient-to-br ${isBossLocked ? 'from-muted to-muted/50' : isApproved ? 'from-green-500 to-emerald-500' : isPending ? 'from-orange-500 to-yellow-500' : 'from-red-500 via-orange-500 to-yellow-500'} rounded-[32px] shadow-[0_10px_40px_rgba(239,68,68,0.1)] ${!isBossLocked && 'hover:scale-105'} transition-all group ${isBossLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                          <div className={`bg-card dark:bg-zinc-950 p-6 md:p-8 rounded-[28px] h-full relative overflow-hidden ${isBossLocked && 'grayscale'}`}>
                             <div className={`absolute inset-0 ${isBossLocked ? 'bg-muted/5' : isApproved ? 'bg-green-500/5' : isPending ? 'bg-orange-500/5' : 'bg-red-500/5'} ${!isBossLocked && 'group-hover:bg-red-500/10'} transition-colors`} />
                             
                             <div className="flex flex-col items-center text-center relative z-10">
                                <div className={`h-16 w-16 mb-4 rounded-2xl bg-gradient-to-br ${isBossLocked ? 'from-muted to-muted-foreground' : isApproved ? 'from-green-500 to-emerald-500' : isPending ? 'from-orange-500 to-yellow-500' : 'from-red-500 to-orange-500'} flex items-center justify-center text-white shadow-xl ${!isBossLocked && 'rotate-[10deg] group-hover:rotate-0'} transition-all duration-300`}>
                                   {isBossLocked ? <Lock className="h-8 w-8" /> : isApproved ? <CheckCircle2 className="h-8 w-8" /> : isPending ? <Loader2 className="h-8 w-8 animate-spin" /> : <Trophy className="h-8 w-8" />}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isBossLocked ? 'text-muted-foreground' : isApproved ? 'text-green-500' : isPending ? 'text-orange-500' : 'text-red-500'} mb-2`}>
                                   {isBossLocked ? t('boss.locked') : isApproved ? t('boss.approved') : isPending ? t('boss.pending') : isRejected ? t('boss.rejected') : t('boss.title')}
                                </span>
                                <h3 className={`text-xl md:text-2xl font-black mb-3 ${isBossLocked ? 'text-muted-foreground' : 'text-foreground'}`}>{getLocalizedField(phase.project, 'title', locale)}</h3>
                                <p className="text-sm font-medium text-muted-foreground max-w-sm">{isBossLocked ? t('boss.locked_desc') : getLocalizedField(phase.project, 'requirements', locale)}</p>
                                
                                {isApproved ? (
                                   <div className="mt-6 flex flex-col items-center gap-2">
                                      <div className="py-2.5 px-6 rounded-xl bg-green-500 text-white font-bold text-sm flex items-center gap-2">
                                         <CheckCircle2 className="h-4 w-4" /> {commonT('success')}
                                      </div>
                                      {submission?.feedback && <p className="text-xs text-green-600 font-medium">{t('boss.feedback')} {submission.feedback}</p>}
                                   </div>
                                ) : isPending ? (
                                   <div className="mt-6 py-2.5 px-6 rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 font-bold text-sm border border-orange-500/30">
                                      {t('boss.pending_status')}
                                   </div>
                                ) : isRejected ? (
                                    <div className="mt-6 w-full flex flex-col items-center gap-3">
                                       <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs font-medium text-left">
                                          <strong className="block mb-1 text-red-600 dark:text-red-400">{t('boss.feedback')}</strong>
                                          {submission?.feedback?.replace('[AI Feedback]: ', '')}
                                       </div>
                                       <button
                                          disabled={isSubmittingBoss === bossId}
                                          className={`w-full py-3 rounded-xl ${isSubmittingBoss === bossId ? 'bg-muted text-muted-foreground' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'} font-bold text-sm transition-all flex items-center justify-center gap-2`}
                                          onClick={() => !isBossLocked && handleBossClick(pIndex)}
                                       >
                                          {isSubmittingBoss === bossId ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t('boss.resubmit')} <ChevronRight className="h-4 w-4" /></>}
                                       </button>
                                    </div>
                                ) : (
                                   <button
                                      disabled={isBossLocked || isSubmittingBoss === bossId}
                                      className={`mt-6 w-full py-3 rounded-xl ${isBossLocked ? 'bg-muted text-muted-foreground' : isSubmittingBoss === bossId ? 'bg-muted text-muted-foreground' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'} font-bold text-sm transition-all flex items-center justify-center gap-2`}
                                      onClick={() => !isBossLocked && handleBossClick(pIndex)}
                                   >
                                      {isBossLocked ? <><Lock className="h-4 w-4" /> {t('boss.locked')}</> : isSubmittingBoss === bossId ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t('boss.title')} <ChevronRight className="h-4 w-4" /></>}
                                   </button>
                                )}
                             </div>
                          </div>
                      </div>
                   </div>
                   );
                })()}
             </div>
           );
        })}
      </div>
    </div>

      {progressPercent === 100 && (
         <div className="mt-20 flex flex-col items-center">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.6)] animate-bounce relative z-10 border-4 border-white/20">
               <Trophy className="h-12 w-12 text-yellow-900" fill="currentColor" />
            </div>
            <h3 className="mt-6 text-3xl font-black text-foreground uppercase tracking-widest">{t('congrats.title')}</h3>
            <p className="mt-2 text-lg text-muted-foreground font-medium">{t('congrats.description')}</p>
            <Link 
               href="/roadmaps" 
               className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
               {t('congrats.next_roadmap')} <ChevronRight className="h-5 w-5" />
            </Link>
         </div>
      )}

      {/* Hiệu ứng XP Popup */}
      {xpPopup.show && (
        <div 
          className="fixed z-[100] pointer-events-none animate-bounce font-black text-4xl text-yellow-500 shadow-yellow-500/50 drop-shadow-lg"
          style={{ left: xpPopup.x, top: xpPopup.y }}
        >
          +50 XP Mastery!
        </div>
      )}

      {/* Hiệu ứng Confetti đơn giản bằng CSS */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[99] overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                backgroundColor: ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'][Math.floor(Math.random() * 5)],
                animation: `confetti-fall ${2 + Math.random() * 3}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
          <style jsx>{`
            @keyframes confetti-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* BOSS SUBMISSION MODAL */}
      {isModalOpen && activeBossIndex !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             onClick={() => { setIsSubmittingBoss(null); setIsModalOpen(false); }} 
           />
           <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-[32px] overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg">
                       <Trophy className="h-8 w-8" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black">{t('boss.title')}</h3>
                       <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">{t('phase')} {activeBossIndex + 1}</p>
                    </div>
                 </div>

                 <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl bg-muted/50 border border-border/50">
                    <span className="text-[10px] font-black uppercase text-red-500 mb-2 block tracking-widest">{t('boss.requirements')}</span>
                    <p className="text-sm sm:text-foreground font-bold leading-relaxed">
                       {roadmap.phases[activeBossIndex].project?.requirements}
                    </p>
                 </div>

                 <div className="space-y-3 sm:space-y-4">
                    <label className="block text-[10px] sm:text-sm font-black uppercase tracking-widest text-muted-foreground">
                       {t('boss.submit_label')}
                    </label>
                    <textarea
                       className="w-full h-28 sm:h-32 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-border focus:border-red-500 bg-background transition-all outline-none font-medium text-sm"
                       placeholder={t('boss.placeholder')}
                       value={submissionContent}
                       onChange={(e) => setSubmissionContent(e.target.value)}
                    />
                 </div>

                 <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row gap-3">
                    <button 
                       className="w-full sm:flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-muted hover:bg-muted/80 font-bold transition-all text-sm"
                       onClick={() => setIsModalOpen(false)}
                    >
                       {commonT('cancel')}
                    </button>
                    <button 
                       disabled={isSubmittingBoss !== null || !submissionContent.trim()}
                       className={`w-full sm:flex-[2] py-3 sm:py-4 rounded-xl sm:rounded-2xl ${isSubmittingBoss ? 'bg-muted' : 'bg-red-500 hover:bg-red-600'} text-white font-bold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-sm`}
                       onClick={handleProjectSubmit}
                    >
                       {isSubmittingBoss ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{t('boss.submit_action')} <ChevronRight className="h-5 w-5" /></>}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
}
