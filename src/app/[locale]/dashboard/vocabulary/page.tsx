'use client';

import { useState, useEffect } from 'react';
import { Volume2, Loader2, Bookmark, ArrowLeft, Search, GraduationCap, Play, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/navigation';
import Flashcard from '@/components/vocabulary/Flashcard';
import { useTranslations } from 'next-intl';

interface Vocab {
  _id: string;
  word: string;
  phonetic?: string;
  definition: string;
  audioUrl?: string;
  createdAt: string;
}

export default function VocabularyPage() {
  const [vocablist, setVocablist] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const t = useTranslations('Vocabulary');
  
  // Practice Mode state
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/user/vocabulary')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVocablist(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const playAudio = (url?: string, word?: string) => {
    if (url) {
      new Audio(url).play();
    } else if (word) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredVocab = vocablist.filter(v => 
    v.word.toLowerCase().includes(search.toLowerCase()) || 
    v.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-24 px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> {t('back')}
          </Link>
          <div className="flex items-center gap-4 mb-2">
             <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
               <Bookmark className="h-6 w-6" fill="currentColor" />
             </div>
             <h1 className="text-4xl font-black text-foreground sm:text-5xl tracking-tight">
               {t('title')}
             </h1>
          </div>
          <p className="text-muted-foreground mt-4 text-lg">
            {t('description')}
          </p>
        </header>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 shadow-xl mb-8">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isPracticeMode}
              className="w-full bg-muted/50 border border-border rounded-2xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium disabled:opacity-50"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-muted p-1 rounded-2xl shrink-0 w-full md:w-auto">
            <button 
              onClick={() => setIsPracticeMode(false)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!isPracticeMode ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="h-4 w-4" /> {t('modes.grid')}
            </button>
            <button 
              onClick={() => { setIsPracticeMode(true); setCurrentIndex(0); }}
              disabled={filteredVocab.length === 0}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isPracticeMode ? 'bg-blue-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Play className="h-4 w-4" /> {t('modes.practice')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-bold">{t('loading')}</p>
          </div>
        ) : filteredVocab.length > 0 ? (
          
          isPracticeMode ? (
            <div className="flex flex-col items-center justify-center py-8">
               <div className="w-full max-w-md">
                 <div className="flex items-center justify-between mb-8 px-4 text-muted-foreground font-bold">
                    <span>{t('practice.card', { current: currentIndex + 1, total: filteredVocab.length })}</span>
                    <span className="text-xs uppercase tracking-widest bg-muted px-3 py-1 rounded-full">{t('practice.mode_label')}</span>
                 </div>
                 
                 <Flashcard 
                   word={filteredVocab[currentIndex].word}
                   phonetic={filteredVocab[currentIndex].phonetic}
                   definition={filteredVocab[currentIndex].definition}
                   audioUrl={filteredVocab[currentIndex].audioUrl}
                   onPlayAudio={playAudio}
                 />

                 <div className="flex items-center justify-between gap-4 mt-12 w-full max-w-sm mx-auto">
                    <button 
                      onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-muted text-muted-foreground font-bold hover:bg-muted/80 hover:text-foreground disabled:opacity-50 transition-all border border-border"
                    >
                      <ChevronLeft className="h-5 w-5" /> {t('practice.prev')}
                    </button>
                    <button 
                      onClick={() => setCurrentIndex(prev => Math.min(filteredVocab.length - 1, prev + 1))}
                      disabled={currentIndex === filteredVocab.length - 1}
                      className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                    >
                      {t('practice.next')} <ChevronRight className="h-5 w-5" />
                    </button>
                 </div>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVocab.map((item) => (
                <div key={item._id} className="group relative bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                       <h3 className="text-2xl font-black text-foreground capitalize">{item.word}</h3>
                       {item.phonetic && (
                         <p className="text-sm font-mono text-muted-foreground mt-1">{item.phonetic}</p>
                       )}
                     </div>
                     <button 
                       onClick={() => playAudio(item.audioUrl, item.word)}
                       className="h-10 w-10 shrink-0 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                     >
                       <Volume2 className="h-5 w-5" />
                     </button>
                  </div>
                  <div className="w-full h-px bg-border/50 mb-4" />
                  <p className="text-foreground/80 leading-relaxed text-sm group-hover:text-foreground transition-colors">
                    {item.definition}
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                     <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {t('stored')}
                     </div>
                     <span className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          )
          
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl bg-muted/10">
            <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
               <GraduationCap className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              {search 
                ? t('empty.desc_search')
                : t('empty.desc_empty')}
            </p>
            <Link 
              href="/roadmaps"
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform"
            >
               {t('empty.action')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
