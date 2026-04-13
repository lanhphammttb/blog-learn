'use client';

import { useState } from 'react';
import { Volume2, RotateCcw } from 'lucide-react';

interface FlashcardProps {
  word: string;
  phonetic?: string;
  definition: string;
  audioUrl?: string;
  onPlayAudio: (url?: string, word?: string) => void;
}

export default function Flashcard({ word, phonetic, definition, audioUrl, onPlayAudio }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-full max-w-sm mx-auto h-96 cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className="relative w-full h-full rounded-[32px] shadow-2xl"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.7s',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Mặt trước: Tiếng Anh */}
        <div className="absolute inset-0 w-full h-full rounded-[32px] bg-card border-4 border-border/50 flex flex-col items-center justify-center p-8 text-center bg-linear-to-br from-card to-muted/20" style={{ backfaceVisibility: 'hidden' }}>
             
             {/* Nút Audio chặn sự kiện lật thẻ */}
             <button 
                onClick={(e) => { e.stopPropagation(); onPlayAudio(audioUrl, word); }}
                className="absolute top-6 right-6 h-12 w-12 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-md hover:scale-110"
              >
                <Volume2 className="h-6 w-6" />
             </button>

             <h2 className="text-4xl md:text-5xl font-black text-foreground capitalize mb-4 tracking-tight">
               {word}
             </h2>
             
             {phonetic && (
               <p className="text-xl font-mono text-muted-foreground/80 font-medium">
                 {phonetic}
               </p>
             )}

             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                <RotateCcw className="h-3 w-3" /> Chạm để lật
             </div>
        </div>

        {/* Mặt sau: Nghĩa / Ví dụ */}
        <div className="absolute inset-0 w-full h-full rounded-[32px] bg-blue-600 border-4 border-blue-500 shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex flex-col items-center justify-center p-8 text-center text-white" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
             
             <h3 className="text-2xl font-bold mb-6 font-serif opacity-90 leading-tight">
               Định nghĩa
             </h3>
             <p className="text-xl md:text-2xl font-medium leading-relaxed">
               {definition}
             </p>

             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-blue-200/50">
                Click để quay lại
             </div>
        </div>
      </div>
    </div>
  );
}
