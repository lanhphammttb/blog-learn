'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, BookmarkPlus, Loader2, X, RefreshCw, Highlighter, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface DictResult {
  word: string;
  phonetic: string;
  meanings: {
    partOfSpeech: string;
    definitions: { definition: string }[];
  }[];
  phonetics: { audio: string }[];
}

export default function DictionaryTooltip({ articleId }: { articleId?: string }) {
  const { data: session } = useSession();
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [mode, setMode] = useState<'dict' | 'highlight'>('dict');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictResult | null>(null);
  const [error, setError] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [highlightSuccess, setHighlightSuccess] = useState(false);
  const [note, setNote] = useState('');

  const tooltipRef = useRef<HTMLDivElement>(null);

  // Helper to check if string is a single English word
  const isSingleWord = (str: string) => {
    const trimmed = str.trim();
    if (!trimmed) return false;
    if (trimmed.includes(' ')) return false;
    if (trimmed.length > 30 || trimmed.length < 2) return false;
    return /^[a-zA-Z]+$/.test(trimmed);
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (text.length === 0) return;
    
    // We only process if it's within article content (optional but good)
    const anchorNode = selection.anchorNode;
    const isInsideProse = anchorNode?.parentElement?.closest('.prose');
    if (!isInsideProse) return;

    if (text.length > 300) {
        setIsVisible(false);
        return; // too long to highlight
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + window.scrollY;

    setSelectedText(text);
    setPosition({ x, y });
    setIsVisible(true);
    setSaveSuccess(false);
    setHighlightSuccess(false);
    setNote('');

    if (isSingleWord(text)) {
      setMode('dict');
      fetchDefinition(text);
    } else {
      setMode('highlight');
      setResult(null);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setIsVisible(false);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchDefinition = async (word: string) => {
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      if (res.status === 429) throw new Error('Too many requests. Please wait a moment.');
      if (res.status === 404) throw new Error('Word not found.');
      if (!res.ok) throw new Error('Dictionary unavailable.');
      const data = await res.json();
      if (data && data.length > 0) {
        setResult(data[0]);
      } else {
        setError('No definition found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching definition.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (result && result.phonetics) {
      const audioObj = result.phonetics.find(p => p.audio && p.audio.length > 0);
      if (audioObj) {
        const audio = new Audio(audioObj.audio);
        audio.play();
        return;
      }
    }
    const utterance = new SpeechSynthesisUtterance(result ? result.word : selectedText);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const saveToFlashcard = async () => {
    if (!session?.user) return alert("Please log in to save flashcards.");
    if (!result) return;
    
    setIsSaving(true);
    try {
      const firstMeaning = result.meanings[0];
      const definition = firstMeaning?.definitions[0]?.definition || '';
      const audioUrl = result.phonetics?.find(p => p.audio)?.audio || '';

      const res = await fetch('/api/user/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: result.word,
          definition: definition,
          phonetic: result.phonetic || '',
          audioUrl: audioUrl
        })
      });

      if (res.ok) setSaveSuccess(true);
      else {
        const data = await res.json();
        if (data.error === 'Word already saved') setSaveSuccess(true);
        else alert(data.error || "Failed to save word.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveHighlight = async () => {
    if (!session?.user) return alert("Please log in to save highlights.");
    if (!articleId) return alert("Cannot highlight outside of an article.");

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          textSnippet: selectedText,
          note: note,
          colorCode: 'yellow'
        })
      });

      if (res.ok) {
         setHighlightSuccess(true);
         // Dispatch an event to force InteractiveMarkdown to fetch highlights
         window.dispatchEvent(new CustomEvent('article-highlight-added'));
         setTimeout(() => setIsVisible(false), 1500);
      } else {
         alert("Failed to save highlight.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={tooltipRef}
      className="absolute z-50 animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, calc(-100% - 15px))'
      }}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 w-72 text-foreground font-sans relative after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-card">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          <X className="h-3 w-3" />
        </button>

        {mode === 'highlight' ? (
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold border-b border-border pb-2">
                 <Highlighter className="h-4 w-4 text-yellow-500" />
                 Save Highlight
              </div>
              <p className="text-xs text-muted-foreground italic line-clamp-2">"{selectedText}"</p>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a personal note (optional)..."
                className="w-full text-xs p-2 rounded-lg bg-muted/50 border border-border resize-none focus:outline-none focus:border-blue-500"
                rows={2}
              />
              <button
                onClick={saveHighlight}
                disabled={isSaving || highlightSuccess}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  highlightSuccess 
                    ? 'bg-green-500/10 text-green-600' 
                    : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
                }`}
              >
                {isSaving ? (
                 <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                ) : highlightSuccess ? (
                 <>Saved!</>
                ) : (
                 <><MessageSquare className="h-3.5 w-3.5" /> Save Highlight</>
                )}
              </button>
           </div>
        ) : (
          /* Dict Mode */
          loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-medium">Looking up...</span>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-sm font-medium text-muted-foreground">{error}</p>
              <button onClick={() => setMode('highlight')} className="mt-2 text-xs text-blue-500 hover:underline">Or Highlight text instead</button>
            </div>
          ) : result ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between pr-4">
                <div>
                  <h4 className="text-lg font-bold capitalize leading-none">{result.word}</h4>
                  {result.phonetic && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">{result.phonetic}</p>
                  )}
                </div>
                <button 
                  onClick={playAudio}
                  className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-500/20 transition-colors shrink-0"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-2 text-sm pr-1 custom-scrollbar">
                {result.meanings.slice(0, 2).map((meaning, idx) => (
                  <div key={idx}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {meaning.partOfSpeech}
                    </span>
                    <p className="text-sm mt-0.5 leading-snug">
                      {meaning.definitions[0].definition}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-border mt-2">
                <button
                  onClick={saveToFlashcard}
                  disabled={isSaving || saveSuccess}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    saveSuccess ? 'bg-green-500/10 text-green-600' : 'bg-foreground text-background hover:scale-[1.02]'
                  }`}
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><BookmarkPlus className="h-3.5 w-3.5" /> Save</>}
                </button>
                <button
                  onClick={() => setMode('highlight')}
                  className="px-2 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition-colors"
                  title="Highlight instead"
                >
                  <Highlighter className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
