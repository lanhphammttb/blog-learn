'use client';

import { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function FocusToggle() {
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    if (isFocusMode) {
      document.body.classList.add('focus-mode-active');
    } else {
      document.body.classList.remove('focus-mode-active');
    }
  }, [isFocusMode]);

  return (
    <button
      onClick={() => setIsFocusMode(!isFocusMode)}
      className={`fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 ${
        isFocusMode 
          ? 'bg-blue-600 text-white' 
          : 'bg-card border border-border text-muted-foreground hover:text-foreground'
      }`}
      title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
    >
      {isFocusMode ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
    </button>
  );
}
