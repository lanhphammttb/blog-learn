'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { LogIn, Github, Lock, User, Mail, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn('credentials', { password, callbackUrl: '/admin' });
    setLoading(false);
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-6 overflow-hidden bg-background">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600/10 text-blue-600 mb-6 group transition-transform hover:scale-110">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-3">Welcome to EnglishHub</h1>
          <p className="text-muted-foreground">Log in to track your progress and access roadmap.</p>
        </div>

        <div className="space-y-6">
          {/* Social Logins */}
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card py-4 font-bold text-foreground transition-all hover:bg-muted hover:shadow-lg active:scale-95"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <button
               onClick={() => signIn('github', { callbackUrl: '/' })}
              className="flex items-center justify-center gap-3 rounded-2xl bg-zinc-900 border border-zinc-800 py-4 font-bold text-white transition-all hover:bg-zinc-800 hover:shadow-lg active:scale-95"
            >
              <Github className="h-5 w-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="relative flex items-center gap-4 py-2">
            <div className="h-px flex-grow bg-border" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">or admin login</span>
            <div className="h-px flex-grow bg-border" />
          </div>

          {/* Admin Credentials */}
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-4 text-foreground outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-foreground py-4 font-bold text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Enter Admin Panel'}
            </button>
          </form>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
           Learning English has never been this social. <br/>
           <span className="font-bold text-blue-500 flex items-center justify-center gap-1 mt-2">
             <Sparkles className="h-4 w-4" /> Start your journey today
           </span>
        </p>
      </div>
    </div>
  );
}
