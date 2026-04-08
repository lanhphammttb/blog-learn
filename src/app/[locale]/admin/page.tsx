'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, BookOpen, Layers, MessageSquare, Plus, Search, 
  Trash2, ExternalLink, Settings, TrendingUp, Filter, CheckCircle, Clock, Loader2, Users, ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function AdminDashboard() {
  const t = useTranslations('Admin');
  const commonT = useTranslations('Common');
  const [articles, setArticles] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'roadmaps'>('articles');
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [totalLearners, setTotalLearners] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/community/leaderboard');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setTotalLearners(data.length);
            setTotalCompletions(data.reduce((acc: number, u: any) => acc + u.totalLessons, 0));
          }
        }
      } catch (e) {}
    };
    fetchStats();
    
    // Fetch pending submissions count
    const fetchPending = async () => {
       try {
          const res = await fetch('/api/admin/submissions');
          if (res.ok) {
             const data = await res.json();
             setPendingCount(data.length);
          }
       } catch (e) {}
    };
    fetchPending();
  }, []);

  const fetchData = async () => {
    try {
      const endpoint = activeTab === 'articles' ? '/api/articles' : '/api/roadmaps';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (activeTab === 'articles') setArticles(data);
        else setRoadmaps(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm(t('actions.delete_confirm', { type: activeTab === 'articles' ? t('tabs.articles').toLowerCase() : t('tabs.roadmaps').toLowerCase() }))) return;

    try {
      const endpoint = activeTab === 'articles' ? `/api/articles/${id}` : `/api/roadmaps/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('stats.total_articles')}</p>
                <p className="text-2xl font-bold">{articles.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('stats.active_roadmaps')}</p>
                <p className="text-2xl font-bold">{roadmaps.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('stats.total_learners')}</p>
                <p className="text-2xl font-bold">{totalLearners}</p>
              </div>
            </div>
          </div>
          <Link href="/admin/submissions" className="rounded-3xl border-2 border-orange-500/20 bg-orange-500/5 p-6 shadow-sm transition-all hover:bg-orange-500/10 hover:shadow-orange-500/10">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-orange-600 uppercase tracking-widest">{t('stats.pending_submissions')}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black">{pendingCount}</p>
                  <p className="text-xs font-medium text-orange-600/70">{t('stats.new_submissions_hint')}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-orange-600" />
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex rounded-2xl bg-card p-1 border border-border shadow-sm w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('articles')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${activeTab === 'articles' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <BookOpen className="h-4 w-4" />
              {t('tabs.articles')}
            </button>
            <button 
              onClick={() => setActiveTab('roadmaps')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${activeTab === 'roadmaps' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Layers className="h-4 w-4" />
              {t('tabs.roadmaps')}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                placeholder={t('actions.search_placeholder', { type: activeTab === 'articles' ? t('tabs.articles').toLowerCase() : t('tabs.roadmaps').toLowerCase() })}
                className="w-full rounded-2xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <Link
              href={activeTab === 'articles' ? "/admin/new" : "/admin/roadmaps/new"}
              className="flex items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-2.5 text-sm font-bold text-background transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              {t('actions.create_new')}
            </Link>
          </div>
        </div>

        {/* Content Area */}
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl ring-1 ring-white/5">
          {loading ? (
            <div className="flex h-64 items-center justify-center bg-muted/20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('table.title')}</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {activeTab === 'articles' ? t('table.category') : t('table.difficulty')}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('table.date')}</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('table.status')}</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(activeTab === 'articles' ? articles : roadmaps).map((item: any) => (
                    <tr key={item._id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-foreground group-hover:text-blue-600 transition-colors">{item.title}</p>
                          {activeTab === 'roadmaps' && (
                            <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">
                              {item.items.length} {t('table.steps')}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">/{item.slug}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${
                          activeTab === 'articles' 
                            ? 'bg-muted text-muted-foreground ring-border' 
                            : item.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-600 ring-green-500/20' : 'bg-yellow-500/10 text-yellow-600 ring-yellow-500/20'
                        }`}>
                          {activeTab === 'articles' ? item.category : commonT(`status.${item.difficulty.toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                           <Clock className="h-3 w-3" />
                           {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.isPublished ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${item.isPublished ? 'bg-green-600' : 'bg-yellow-600 animate-pulse'}`}></span>
                          {item.isPublished ? commonT('status.published') : commonT('status.draft')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={activeTab === 'articles' ? `/admin/edit/${item._id}` : `/admin/roadmaps/edit/${item._id}`}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                            title={t('actions.edit')}
                          >
                             <Settings className="h-4 w-4" />
                          </Link>
                          <a
                            href={activeTab === 'articles' ? `/articles/${item.slug}` : `/roadmaps/${item.slug}`}
                            target="_blank"
                            className="rounded-lg p-2 text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                            title={t('actions.view')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <button 
                            onClick={() => deleteItem(item._id)}
                            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 transition-all"
                            title={t('actions.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {((activeTab === 'articles' ? articles : roadmaps).length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        {t('table.no_data', { type: activeTab === 'articles' ? t('tabs.articles').toLowerCase() : t('tabs.roadmaps').toLowerCase() })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

