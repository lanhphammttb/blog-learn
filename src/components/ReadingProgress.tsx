'use client';

import { useState, useEffect } from 'react';
import { Bookmark, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReadingProgress({ articleSlug }: { articleSlug: string }) {
  const [savedPosition, setSavedPosition] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = `reading_progress_${articleSlug}`;

  useEffect(() => {
    // Check for saved progress on mount
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const pos = parseInt(saved, 10);
      // Only show if they actually scrolled down a bit (e.g., > 500px)
      if (pos > 500) { 
        setSavedPosition(pos);
        // Delay showing to not interrupt initial animation
        setTimeout(() => setIsVisible(true), 1500);
      }
    }

    // Save progress on scroll (throttled)
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const y = window.scrollY;
        // Don't save if they scroll back to exactly 0, maybe they are restarting
        if (y > 200) {
            localStorage.setItem(storageKey, y.toString());
        }
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [storageKey]);

  const handleResume = () => {
    if (savedPosition) {
      window.scrollTo({
        top: savedPosition,
        behavior: 'smooth'
      });
      setIsVisible(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-foreground text-background px-5 py-3 rounded-full shadow-2xl border border-border/10"
        >
          <button onClick={handleResume} className="flex items-center gap-2 text-sm font-bold group">
             <div className="bg-blue-500/20 p-1.5 rounded-full text-blue-400">
               <Bookmark className="h-4 w-4" fill="currentColor" />
             </div>
             <span>Resume reading</span>
          </button>
          <div className="w-px h-5 bg-background/20 mx-1" />
          <button 
            onClick={() => setIsVisible(false)} 
            className="p-1.5 hover:bg-background/20 rounded-full transition-colors text-background/70 hover:text-background"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
