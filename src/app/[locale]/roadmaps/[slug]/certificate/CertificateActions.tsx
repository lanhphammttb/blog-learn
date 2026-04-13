'use client';

import { Download, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function CertificateActions() {
  const t = useTranslations('Certificate');

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {}
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-card border border-border text-sm font-bold hover:bg-muted transition-all shadow-sm"
      >
        <Share2 className="h-4 w-4" /> {t('share')}
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
      >
        <Download className="h-4 w-4" /> {t('download')}
      </button>
    </div>
  );
}
