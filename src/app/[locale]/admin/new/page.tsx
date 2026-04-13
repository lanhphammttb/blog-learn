'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Save, X, Sparkles, ChevronLeft, Eye, Edit3, 
  Bold, Italic, Link as LinkIcon, List, Type, 
  BookOpen, Hash, Layers, Link2, Table, CheckSquare, Loader2
} from 'lucide-react';
import { Link } from '@/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SplitMarkdownEditor from '@/components/SplitMarkdownEditor';

export default function NewArticle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'full-preview'>('split');
  const [editLanguage, setEditLanguage] = useState<'vi' | 'en'>('vi');
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    title_en: '',
    slug: '',
    content: '',
    content_en: '',
    excerpt: '',
    excerpt_en: '',
    category: 'Daily Lesson',
    difficulty: 'Intermediate',
    series: '',
    tags: [] as string[],
    isPublished: true,
    thumbnailUrl: '',
    relatedArticles: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('article_draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...draft }));
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  // Fetch articles for related selector
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch('/api/articles');
        if (res.ok) {
          const data = await res.json();
          setAllArticles(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchArticles();
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('article_draft', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const toggleRelated = (articleId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedArticles: prev.relatedArticles.includes(articleId)
        ? prev.relatedArticles.filter(id => id !== articleId)
        : [...prev.relatedArticles, articleId]
    }));
  };

  const generateAIExcerpt = () => {
    if (!formData.content) return;
    // Simple logic for now: take first 160 chars
    const plainText = formData.content.replace(/[#*`]/g, '').slice(0, 160) + '...';
    setFormData(prev => ({ ...prev, excerpt: plainText }));
  };

  const discardDraft = () => {
    if (confirm("Are you sure you want to discard this draft?")) {
      localStorage.removeItem('article_draft');
      setFormData({
        title: '',
        title_en: '',
        slug: '',
        content: '',
        content_en: '',
        excerpt: '',
        excerpt_en: '',
        category: 'Daily Lesson',
        difficulty: 'Intermediate',
        series: '',
        tags: [],
        isPublished: true,
        thumbnailUrl: '',
        relatedArticles: [],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        localStorage.removeItem('article_draft');
        router.push('/admin');
        router.refresh();
      } else {
        alert('Failed to create article');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      if (name === 'title') {
        const slugValue = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        setFormData((prev) => ({ ...prev, [name]: value, slug: slugValue }));
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            Create English Lesson
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-1 rounded-2xl bg-card p-1 border border-border shadow-sm w-fit">
            <button
              onClick={() => setEditLanguage('vi')}
              className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${editLanguage === 'vi' ? 'bg-indigo-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Tiếng Việt
            </button>
            <button
              onClick={() => setEditLanguage('en')}
              className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${editLanguage === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
            >
              English
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-card p-1 border border-border shadow-sm w-fit">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-xl transition-all ${viewMode === 'split' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Edit3 className="h-4 w-4" />
            Editor
          </button>
          <button
            onClick={() => setViewMode('full-preview')}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-xl transition-all ${viewMode === 'full-preview' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Editor Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {viewMode === 'split' ? (
              <SplitMarkdownEditor 
                value={editLanguage === 'vi' ? formData.content : formData.content_en} 
                onChange={(val) => setFormData({ ...formData, [editLanguage === 'vi' ? 'content' : 'content_en']: val })}
                onGenerateAI={generateAIExcerpt}
              />
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 lg:p-12 shadow-sm min-h-[700px]">
                <h1 className="text-4xl font-bold text-foreground mb-8 tracking-tight">{(editLanguage === 'vi' ? formData.title : formData.title_en) || 'Untitled Lesson'}</h1>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <MarkdownRenderer content={editLanguage === 'vi' ? formData.content : formData.content_en} />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-500" />
                Related Lessons
              </h3>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {formData.relatedArticles.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allArticles.filter(a => a.title !== formData.title).map(article => (
                <button
                  key={article._id}
                  type="button"
                  onClick={() => toggleRelated(article._id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    formData.relatedArticles.includes(article._id)
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                      : 'bg-background border-border text-muted-foreground hover:border-blue-300'
                  }`}
                >
                  {article.title}
                </button>
              ))}
              {allArticles.length === 0 && (
                <div className="w-full py-6 text-center border-2 border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground">No other lessons found yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 self-start animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
               <Hash className="h-5 w-5 text-blue-500" />
               Properties
            </h2>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex justify-between">
                  Title {editLanguage === 'en' && '(English)'}
                  <span className={(editLanguage === 'vi' ? formData.title.length : formData.title_en.length) > 50 ? "text-amber-500" : ""}>{(editLanguage === 'vi' ? formData.title.length : formData.title_en.length)}/60</span>
                </label>
                <input
                  required={editLanguage === 'vi'}
                  name={editLanguage === 'vi' ? "title" : "title_en"}
                  value={editLanguage === 'vi' ? formData.title : formData.title_en}
                  onChange={handleChange}
                  placeholder="Mastering Phrasal Verbs"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    {['Daily Lesson', 'Grammar', 'Vocabulary', 'Idioms', 'Tips'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced'})}
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    {['Beginner', 'Intermediate', 'Advanced'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Learning Series</label>
                <div className="relative group">
                  <Layers className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="series"
                    value={formData.series}
                    onChange={handleChange}
                    placeholder="e.g. Grammar Masters"
                    className="w-full rounded-xl border border-border bg-background p-3 pl-10 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Thumbnail URL</label>
                <div className="space-y-3">
                  <input
                    name="thumbnailUrl"
                    value={formData.thumbnailUrl}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  {formData.thumbnailUrl && (
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-border bg-muted">
                      <img src={formData.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex justify-between">
                  Excerpt {editLanguage === 'en' && '(English)'}
                  <span className={(editLanguage === 'vi' ? formData.excerpt.length : formData.excerpt_en.length) > 150 ? "text-amber-500" : ""}>{(editLanguage === 'vi' ? formData.excerpt.length : formData.excerpt_en.length)}/160</span>
                </label>
                <textarea
                  required={editLanguage === 'vi'}
                  name={editLanguage === 'vi' ? "excerpt" : "excerpt_en"}
                  value={editLanguage === 'vi' ? formData.excerpt : formData.excerpt_en}
                  onChange={handleChange}
                  rows={4}
                  placeholder="The hook that catches the student's eye..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tags</label>
                <div className="w-full rounded-xl border border-border bg-background p-2 min-h-[44px]">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {formData.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={formData.tags.length === 0 ? "Add tags & press enter..." : ""}
                    className="bg-transparent w-full p-2 text-sm font-medium outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground relative z-10 w-fit">Visibility</p>
                  <p className="text-xs text-muted-foreground">Publish immediately</p>
                </div>
                <div
                  onClick={() => setFormData(prev => ({ ...prev, isPublished: !prev.isPublished }))}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ${formData.isPublished ? 'bg-blue-600' : 'bg-muted-foreground/30'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${formData.isPublished ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={discardDraft}
                className="px-4 py-3 rounded-xl border border-border text-foreground hover:bg-muted/50 transition-colors font-medium text-sm"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-grow flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white p-3 text-sm font-semibold transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Lesson</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

    </div>
  );
}

