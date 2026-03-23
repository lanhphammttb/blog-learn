'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Save, X, Sparkles, ChevronLeft, Loader2, 
  Layers, Plus, GripVertical, Trash2, Search
} from 'lucide-react';
import Link from 'next/link';

interface RoadmapItem {
  articleId: any;
  title: string;
  order: number;
  type: 'Grammar' | 'Vocabulary' | 'Practice';
}

export default function EditRoadmap() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    description: string;
    difficulty: string;
    isPublished: boolean;
    items: RoadmapItem[];
  }>({
    title: '',
    slug: '',
    description: '',
    difficulty: 'Intermediate',
    isPublished: true,
    items: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, roadmapRes] = await Promise.all([
          fetch('/api/articles'),
          fetch(`/api/roadmaps/${id}`)
        ]);
        
        if (articlesRes.ok && roadmapRes.ok) {
          const articlesData = await articlesRes.json();
          const roadmapData = await roadmapRes.json();
          setArticles(articlesData);
          setFormData(roadmapData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const addArticle = (article: any) => {
    if (formData.items.some(item => item.articleId === article._id)) return;
    
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { articleId: article._id, title: article.title, order: formData.items.length, type: 'Grammar' }
      ]
    });
  };

  const removeArticle = (articleId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.articleId !== articleId)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/roadmaps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        alert('Failed to update roadmap');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !formData.items.some(item => (item.articleId === a._id || item.articleId?._id === a._id))
  );

  if (fetching) {
     return (
       <div className="flex h-[60vh] items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
       </div>
     );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground flex items-center gap-3">
            <Layers className="h-8 w-8 text-blue-500" />
            Edit Roadmap
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sequencing Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl">
             <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                Lesson Sequence
             </h2>
             
             {formData.items.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl bg-muted/10">
                   <Plus className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                   <p className="text-muted-foreground">Select articles from the sidebar to build your path.</p>
                </div>
             ) : (
                <div className="space-y-3">
                   {formData.items.map((item, index) => (
                      <div key={item.articleId?._id || item.articleId} className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border group">
                         <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-500/20">
                            {index + 1}
                         </div>
                         <div className="flex-grow">
                            <p className="font-bold text-foreground">{item.title}</p>
                         </div>
                         <button 
                           type="button" 
                           onClick={() => removeArticle(item.articleId?._id || item.articleId)}
                           className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 className="h-4 w-4" />
                         </button>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>

        {/* Sidebar Settings & Selector */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-foreground">Roadmap Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Title</label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Master Daily Grammar"
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">URL Slug</label>
                <input
                  required
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none appearance-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Description</label>
                <textarea
                  required
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none resize-none"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <input
                  type="checkbox"
                  name="isPublished"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="h-5 w-5 rounded-lg border-border bg-muted text-blue-600 focus:ring-blue-500/20"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-foreground">
                  Published
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Add Articles</h2>
                <span className="text-[10px] font-bold text-muted-foreground">Available</span>
             </div>
             
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input 
                   placeholder="Search..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-9 pr-4 text-xs outline-none"
                />
             </div>

             <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {articles.length > 0 ? (
                   filteredArticles.map(article => (
                      <button
                        key={article._id}
                        type="button"
                        onClick={() => addArticle(article)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50 text-left hover:bg-blue-600/5 hover:border-blue-500/30 transition-all text-xs"
                      >
                         <span className="font-medium text-foreground line-clamp-1">{article.title}</span>
                         <Plus className="h-3.5 w-3.5 text-blue-500" />
                      </button>
                   ))
                ) : (
                   <p className="text-center py-4 text-[10px] text-muted-foreground italic">No more articles to add.</p>
                )}
             </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] disabled:opacity-50"
          >
            {loading ? 'Saving...' : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
