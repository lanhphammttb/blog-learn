'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Mute the React 19 false positive warning in Dev Mode. 
// Next-Themes requires a script tag to prevent FOUC, which React 19 strictly complains about.
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag while rendering React component')) {
      return; // Ignore this specific warning
    }
    // Also ignore Hydration failed error message caused by the script tag mismatch
    if (typeof args[0] === 'string' && args[0].includes('Hydration failed because the server rendered text didn\'t match the client')) {
       // Only ignore if it specifically relates to the script tag (NextThemes injected it)
       // Actually, we'll let this pass if we already fixed the date hydration, but just in case
    }
    originalError.apply(console, args);
  };
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}
