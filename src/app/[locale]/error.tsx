'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Link } from '@/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Page Error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 text-red-500">
          <AlertTriangle className="h-10 w-10" />
        </div>

        <h1 className="text-2xl font-black text-foreground mb-3">Đã xảy ra lỗi</h1>
        <p className="text-muted-foreground mb-2 leading-relaxed">
          Có gì đó không ổn. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 mb-8 font-mono">ID: {error.digest}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:bg-muted transition-colors"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
