'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Headphones, Settings2 } from 'lucide-react';

export default function ArticleAudioPlayer({ content, title }: { content: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const plainTextRef = useRef('');

  useEffect(() => {
    // Strip markdown roughly to get readable plain text
    const cleanContent = content
      .replace(/<[^>]*>?/gm, '') // html tags
      .replace(/#+\s/g, '') // headings
      .replace(/[*_~`]/g, '') // formatting
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/- \[[ xX]\] /g, '') // checkboxes
      .trim();
    
    plainTextRef.current = `${title}. ${cleanContent}`;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
      setVoices(englishVoices);
      if (englishVoices.length > 0 && !selectedVoice) {
         setSelectedVoice(englishVoices.find(v => v.name.includes('Google US English'))?.name || englishVoices[0].name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [content, title]);

  const initUtterance = () => {
    if (utteranceRef.current) {
        window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(plainTextRef.current);
    utterance.rate = rate;
    
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
    };

    utterance.onerror = (e) => {
        setIsPlaying(false);
        setIsPaused(false);
    };

    utterance.onboundary = (event) => {
        if (event.name === 'word') {
            const charIndex = event.charIndex;
            const totalChars = plainTextRef.current.length;
            setProgress(Math.min((charIndex / totalChars) * 100, 100));
        }
    };

    utteranceRef.current = utterance;
    return utterance;
  };

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    } else {
      setProgress(0);
      const utterance = initUtterance();
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  return (
    <div className="bg-muted/30 border border-border rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 w-full relative group transition-all">
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
        <div className="bg-blue-500/10 p-3 rounded-full text-blue-600 dark:text-blue-400">
          <Headphones className="h-5 w-5" />
        </div>
        <div className="md:hidden flex-grow flex items-center justify-between">
            <span className="text-sm font-semibold">Listen to Article</span>
            <div className="flex gap-2">
                <button onClick={togglePlay} className="p-2 rounded-full bg-foreground text-background">
                    {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                </button>
                {(isPlaying || isPaused) && (
                    <button onClick={stopAudio} className="p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground">
                        <Square className="h-4 w-4 fill-current" />
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="hidden md:flex flex-grow items-center gap-4">
        <button 
          onClick={togglePlay} 
          className={`h-10 w-10 flex items-center justify-center rounded-full transition-all shrink-0 ${isPlaying ? 'bg-amber-500/10 text-amber-600' : 'bg-foreground text-background hover:scale-105 shadow-sm'}`}
        >
          {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
        </button>
        
        {(isPlaying || isPaused || progress > 0) && (
          <button onClick={stopAudio} className="p-2 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground shrink-0 transition-colors">
            <Square className="h-4 w-4 fill-current" />
          </button>
        )}

        <div className="flex-grow h-2 bg-muted rounded-full overflow-hidden relative">
           <div 
             className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300 ease-linear rounded-full"
             style={{ width: `${progress}%` }}
           />
        </div>
      </div>

      <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 shrink-0">
        <span className="text-xs font-medium text-muted-foreground md:pl-2">
            Auto-generated Audio
        </span>
        <div className="relative">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            
            {showSettings && (
               <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border shadow-xl rounded-xl p-3 z-10 animate-in fade-in zoom-in-95">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Speed</h4>
                  <div className="flex gap-1 bg-muted/50 p-1 rounded-lg mb-3">
                     {[0.8, 1, 1.2, 1.5].map(r => (
                        <button 
                          key={r}
                          onClick={() => { setRate(r); stopAudio(); }}
                          className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${rate === r ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                        >
                           {r}x
                        </button>
                     ))}
                  </div>
                  {voices.length > 0 && (
                     <>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Voice</h4>
                        <select 
                            value={selectedVoice} 
                            onChange={(e) => { setSelectedVoice(e.target.value); stopAudio(); }}
                            className="w-full text-xs p-1.5 border border-border rounded-md bg-background"
                        >
                           {voices.map(v => (
                              <option key={v.name} value={v.name}>{v.name}</option>
                           ))}
                        </select>
                     </>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-3 text-center leading-tight">Note: Changing settings will stop playback.</p>
               </div>
            )}
        </div>
      </div>
    </div>
  );
}
