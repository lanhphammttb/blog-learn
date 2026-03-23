'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function AchievementToast() {
  const [current, setCurrent] = useState<Achievement | null>(null);

  useEffect(() => {
    const handleAchievement = (e: any) => {
      const achievement = e.detail as Achievement;
      setCurrent(achievement);
      
      // Confetti explosion!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#6366f1', '#fbbf24']
      });

      // Clear after 6 seconds
      setTimeout(() => setCurrent(null), 6000);
    };

    window.addEventListener('achievementUnlocked', handleAchievement);
    return () => window.removeEventListener('achievementUnlocked', handleAchievement);
  }, []);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm"
        >
          <div className="relative overflow-hidden rounded-3xl bg-blue-600 p-6 text-white shadow-2xl ring-4 ring-blue-500/20">
            {/* Animated Glow */}
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-white/20 blur-2xl" 
            />
            
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Trophy className="h-8 w-8 text-yellow-300" />
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Achievement Unlocked!</span>
                   <Sparkles className="h-3 w-3 text-yellow-300" />
                </div>
                <h3 className="text-xl font-black leading-tight">{current.title}</h3>
                <p className="text-xs text-blue-100 mt-1">{current.description}</p>
              </div>

              <button 
                onClick={() => setCurrent(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Progress bar at the bottom */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 6, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-white/30"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Utility to trigger it from anywhere
export const unlockAchievement = (id: string, title: string, description: string) => {
  const event = new CustomEvent('achievementUnlocked', {
    detail: { id, title, description }
  });
  window.dispatchEvent(event);
};
