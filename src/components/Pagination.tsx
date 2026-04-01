'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export default function Pagination({ currentPage, totalPages, basePath = '/' }: PaginationProps) {
  const searchParams = useSearchParams();
  const t = useTranslations('Common.pagination');

  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  // Generate page numbers to show
  const getPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <Link
        href={getPageUrl(currentPage - 1)}
        aria-disabled={currentPage === 1}
        className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${
          currentPage === 1 ? 'pointer-events-none opacity-30' : ''
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
        {t('prev')}
      </Link>

      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`dot-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Link
            key={page}
            href={getPageUrl(page as number)}
            className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
              page === currentPage
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {page}
          </Link>
        )
      )}

      <Link
        href={getPageUrl(currentPage + 1)}
        aria-disabled={currentPage === totalPages}
        className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${
          currentPage === totalPages ? 'pointer-events-none opacity-30' : ''
        }`}
      >
        {t('next')}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
