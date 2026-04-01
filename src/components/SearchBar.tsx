'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

interface SearchResult {
  _id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations('Common.search');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/articles?search=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.slice(0, 5));
          setIsOpen(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div ref={ref} className="relative w-full max-w-xs group">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('placeholder')}
        className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-10 text-sm text-foreground outline-none ring-blue-500/30 focus:ring-4 transition-all"
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">{t('searching')}</div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-border">
              {results.map((article) => (
                <Link
                  key={article._id}
                  href={`/articles/${article.slug}`}
                  onClick={() => { setIsOpen(false); setQuery(''); }}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{article.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{article.category}</p>
                  </div>
                  {article.difficulty && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      article.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-500' :
                      article.difficulty === 'Advanced' ? 'bg-red-500/10 text-red-500' :
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {article.difficulty}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('no_results', { query })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
